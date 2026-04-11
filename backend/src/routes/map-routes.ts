import { Types } from 'mongoose';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { uploadPhoto, type UploadableFile } from '../services/storage-service.js';
import {
  createMap,
  getMapByToken,
  getLocationsByMapId,
  PLAN_LOCATION_LIMITS,
  type LocationInput,
  type Plan,
} from '../services/map-service.js';
import { createCheckoutPayment } from '../services/payment-service.js';

const VALID_PLANS = new Set<string>(['basic', 'premium']);
const REQUIRED_FIELDS = ['couple_name', 'buyer_name', 'buyer_phone', 'email', 'plan', 'relationship_start_date'] as const;
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const YOUTUBE_URL_PATTERN = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

interface ParsedLocationField {
  title?: string;
  description?: string;
  message?: string;
  latitude?: string;
  longitude?: string;
  order?: string;
}

interface ParsedFile {
  idx: number;
  buffer: Buffer;
  mimetype: string;
}

interface MultipartParseResult {
  fields: Record<string, string>;
  locationFields: Record<number, ParsedLocationField>;
  files: ParsedFile[];
}

async function parseMultipartParts(request: FastifyRequest): Promise<MultipartParseResult> {
  const fields: Record<string, string> = {};
  const locationFields: Record<number, ParsedLocationField> = {};
  const files: ParsedFile[] = [];
  for await (const part of request.parts()) {
    if (part.type === 'field') {
      const locMatch = part.fieldname.match(/^locations\[(\d+)\]\[(.+)\]$/);
      if (locMatch) {
        const idx = parseInt(locMatch[1], 10);
        const key = locMatch[2] as keyof ParsedLocationField;
        if (!locationFields[idx]) locationFields[idx] = {};
        locationFields[idx][key] = part.value as string;
      } else {
        fields[part.fieldname] = part.value as string;
      }
    } else {
      const fileMatch = part.fieldname.match(/^locations\[(\d+)\]\[photo\]$/);
      if (fileMatch) {
        const idx = parseInt(fileMatch[1], 10);
        let buffer: Buffer;
        try {
          buffer = await part.toBuffer();
        } catch {
          const err = new Error('File size exceeds 5MB limit') as Error & { statusCode: number };
          err.statusCode = 400;
          throw err;
        }
        if (buffer.length > MAX_PHOTO_SIZE_BYTES) {
          const err = new Error('File size exceeds 5MB limit') as Error & { statusCode: number };
          err.statusCode = 400;
          throw err;
        }
        files.push({ idx, buffer, mimetype: part.mimetype });
      } else {
        await part.toBuffer();
      }
    }
  }
  return { fields, locationFields, files };
}

function validateRequiredFields(fields: Record<string, string>): string | null {
  for (const field of REQUIRED_FIELDS) {
    if (!fields[field]) return `${field} is required`;
  }
  if (!VALID_PLANS.has(fields.plan)) return 'plan must be basic or premium';
  return null;
}

function extractYoutubeId(urlOrId: string): string | null {
  const match = urlOrId.match(YOUTUBE_URL_PATTERN);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  return null;
}

function validateLocationFields(locationFields: Record<number, ParsedLocationField>): string | null {
  for (const [idx, loc] of Object.entries(locationFields)) {
    if (!loc.title) return `locations[${idx}][title] is required`;
    if (!loc.latitude) return `locations[${idx}][latitude] is required`;
    if (!loc.longitude) return `locations[${idx}][longitude] is required`;
    if (!loc.order) return `locations[${idx}][order] is required`;
  }
  return null;
}

function validateLocationCount(plan: Plan, count: number): boolean {
  const limit = PLAN_LOCATION_LIMITS[plan];
  return count <= limit;
}

async function buildLocations(
  locationFields: Record<number, ParsedLocationField>,
  files: ParsedFile[],
  mapId: string,
): Promise<LocationInput[]> {
  const fileMap: Record<number, ParsedFile> = {};
  for (const file of files) fileMap[file.idx] = file;
  const indices = Object.keys(locationFields).map(Number).sort((a, b) => a - b);
  return Promise.all(
    indices.map(async (idx) => {
      const loc = locationFields[idx];
      let photoUrl: string | undefined;
      if (fileMap[idx]) {
        const captured = fileMap[idx];
        const uploadableFile: UploadableFile = {
          mimetype: captured.mimetype,
          toBuffer: async () => captured.buffer,
        };
        photoUrl = await uploadPhoto({ file: uploadableFile, mapId });
      }
      return {
        title: loc.title ?? '',
        description: loc.description,
        message: loc.message,
        photoUrl,
        latitude: parseFloat(loc.latitude ?? '0'),
        longitude: parseFloat(loc.longitude ?? '0'),
        order: parseInt(loc.order ?? '0', 10),
      };
    }),
  );
}

function registerByTokenRoute(fastify: FastifyInstance): void {
  fastify.get('/maps/by-token', {
    schema: {
      tags: ['maps'],
      summary: 'Get public map data by access token',
      description: 'Returns the public data of an active map identified by its unique access token. Used by the frontend to render the couple\'s page.',
      querystring: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'Unique access token included in the couple\'s QR Code link (required — returns 401 if absent)',
            example: 'aB3kZ',
          },
        },
      },
      response: {
        200: {
          description: 'Map data returned successfully',
          type: 'object',
          properties: {
            coupleName: { type: 'string' },
            relationshipStartDate: { type: 'string', format: 'date' },
            youtubeVideoId: { type: 'string', nullable: true },
            youtubeStartTime: { type: 'integer', nullable: true },
            youtubeEndTime: { type: 'integer', nullable: true },
            locations: {
              type: 'array',
              items: { $ref: 'https://ourlovemap.com/schemas/Location#' },
            },
          },
        },
        401: { description: 'Token is absent or invalid', $ref: 'https://ourlovemap.com/schemas/Error#' },
        403: {
          description: 'Map is expired or not active',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { token } = request.query as { token?: string };
    if (!token) return reply.code(401).send({ error: 'Token is required' });
    const map = await getMapByToken(token);
    if (!map) return reply.code(401).send({ error: 'Invalid token' });
    if (map.status === 'expired') {
      try {
        fastify.posthog?.capture({ distinctId: map.id, event: 'map_expired_accessed' });
      } catch (error) {
        request.log.warn({ error: error instanceof Error ? error.message : error }, 'PostHog capture failed');
      }
      return reply.code(403).send({
        error: 'map_expired',
        message: 'Seu acesso expirou. Faça upgrade para o plano Premium e mantenha seu mapa para sempre.',
      });
    }
    if (map.status !== 'active') {
      return reply.code(403).send({ error: 'Map is not active' });
    }
    const locations = await getLocationsByMapId(map.id);
    return reply.send({
      coupleName: map.coupleName,
      relationshipStartDate: map.relationshipStartDate,
      youtubeVideoId: map.youtubeVideoId,
      youtubeStartTime: map.youtubeStartTime,
      youtubeEndTime: map.youtubeEndTime,
      locations: locations.map(loc => ({
        title: loc.title,
        description: loc.description,
        message: loc.message,
        photoUrl: loc.photoUrl,
        latitude: loc.latitude,
        longitude: loc.longitude,
        order: loc.order,
      })),
    });
  });
}

export default async function mapRoutes(fastify: FastifyInstance): Promise<void> {
  registerByTokenRoute(fastify);
  fastify.post('/maps', {
    schema: {
      tags: ['maps'],
      summary: 'Create a new love map',
      description: [
        'Creates a map with the couple\'s data and locations, then generates an InfinitePay checkout link.',
        'Returns the checkout URL. The map is only accessible after payment approval.',
        '',
        '**Content-Type:** `multipart/form-data`',
        '',
        '**Required fields:** `couple_name`, `email`, `phone number`, `full name`, `plan` (`basic` or `premium`), `relationship_start_date`',
        '**Location fields** — indexed bracket notation: `locations[N][title]`, `locations[N][latitude]`, `locations[N][longitude]`, `locations[N][order]`',
      ].join('\n'),
      response: {
        200: {
          description: 'Map created and checkout link generated',
          $ref: 'https://ourlovemap.com/schemas/CheckoutResult#',
        },
        400: { description: 'Missing required field or invalid plan', $ref: 'https://ourlovemap.com/schemas/Error#' },
        422: { description: 'Location limit exceeded or checkout creation failed', $ref: 'https://ourlovemap.com/schemas/Error#' },
      },
    },
  }, async (request, reply) => {
    const { fields, locationFields, files } = await parseMultipartParts(request);
    const validationError = validateRequiredFields(fields);
    if (validationError) return reply.code(400).send({ error: validationError });
    const locationValidationError = validateLocationFields(locationFields);
    if (locationValidationError) return reply.code(400).send({ error: locationValidationError });
    const locationCount = Object.keys(locationFields).length;
    const plan = fields.plan as Plan;
    if (!validateLocationCount(plan, locationCount)) {
      const limit = PLAN_LOCATION_LIMITS[plan];
      return reply.code(422).send({ error: `Plan ${plan} allows at most ${limit} locations` });
    }
    const extractedId = fields.youtube_url ? extractYoutubeId(fields.youtube_url) : undefined;
    if (fields.youtube_url && !extractedId) {
      return reply.code(400).send({ error: 'youtube_url is not a valid YouTube URL' });
    }
    const youtubeVideoId = extractedId ?? undefined;
    const mapId = new Types.ObjectId().toString();
    const locations = await buildLocations(locationFields, files, mapId);
    const map = await createMap({
      id: mapId,
      coupleName: fields.couple_name,
      buyerName: fields.buyer_name,
      buyerPhone: fields.buyer_phone,
      email: fields.email,
      plan,
      relationshipStartDate: fields.relationship_start_date,
      locations,
      youtubeVideoId,
      youtubeStartTime: fields.youtube_start_time ? parseInt(fields.youtube_start_time, 10) : undefined,
      youtubeEndTime: fields.youtube_end_time ? parseInt(fields.youtube_end_time, 10) : undefined,
    });
    request.log.info({ mapId: map.id, plan: fields.plan }, 'Map created');
    try {
      fastify.posthog?.capture({ distinctId: map.id, event: 'map_created', properties: { plan: fields.plan } });
    } catch (error) {
      request.log.warn({ error: error instanceof Error ? error.message : error }, 'PostHog capture failed');
    }
    try {
      const result = await createCheckoutPayment(
        { mapId: map.id, plan, email: fields.email, buyerName: fields.buyer_name, buyerPhone: fields.buyer_phone },
      );
      return reply.send({ mapId: map.id, checkoutUrl: result.checkoutUrl });
    } catch (error) {
      request.log.error({ mapId: map.id, error: error instanceof Error ? error.message : error }, 'Checkout payment creation failed');
      const err = new Error('Payment creation failed') as Error & { statusCode: number };
      err.statusCode = 422;
      throw err;
    }
  });
}
