import crypto from 'crypto';
import type { FastifyInstance, FastifyRequest, FastifyBaseLogger } from 'fastify';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadPhoto, type UploadableFile } from '../services/storage-service.js';
import {
  createMap,
  getMapByToken,
  getLocationsByMapId,
  type LocationInput,
  type Plan,
} from '../services/map-service.js';
import { createCheckoutPayment } from '../services/payment-service.js';

const VALID_PLANS = new Set<string>(['basic', 'premium']);
const REQUIRED_FIELDS = ['couple_name', 'email', 'plan', 'relationship_start_date'] as const;
const PLAN_LOCATION_LIMITS: Record<string, number> = { basic: 3, premium: 7 };
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

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

function validateLocationFields(locationFields: Record<number, ParsedLocationField>): string | null {
  for (const [idx, loc] of Object.entries(locationFields)) {
    if (!loc.title) return `locations[${idx}][title] is required`;
    if (!loc.latitude) return `locations[${idx}][latitude] is required`;
    if (!loc.longitude) return `locations[${idx}][longitude] is required`;
    if (!loc.order) return `locations[${idx}][order] is required`;
  }
  return null;
}

function validateLocationCount(plan: string, count: number): boolean {
  const limit = PLAN_LOCATION_LIMITS[plan];
  return limit === undefined || count <= limit;
}

async function buildLocations(
  locationFields: Record<number, ParsedLocationField>,
  files: ParsedFile[],
  mapId: string,
  supabase: SupabaseClient,
  log: FastifyBaseLogger,
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
        photoUrl = await uploadPhoto({ file: uploadableFile, mapId, supabase, log });
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
    const map = await getMapByToken(token, fastify.supabase);
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
    const locations = await getLocationsByMapId(map.id, fastify.supabase);
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
        '**Required fields:** `couple_name`, `email`, `plan` (`basic` or `premium`), `relationship_start_date`',
        '**Location fields** — indexed bracket notation: `locations[N][title]`, `locations[N][latitude]`, `locations[N][longitude]`, `locations[N][order]`',
      ].join('\n'),
      response: {
        200: {
          description: 'Map created and checkout link generated',
          type: 'object',
          properties: {
            mapId: { type: 'string', format: 'uuid' },
            checkoutUrl: { type: 'string', description: 'InfinitePay checkout URL' },
          },
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
    if (!validateLocationCount(fields.plan, locationCount)) {
      const limit = PLAN_LOCATION_LIMITS[fields.plan];
      return reply.code(422).send({ error: `Plan ${fields.plan} allows at most ${limit} locations` });
    }
    const mapId = crypto.randomUUID();
    const locations = await buildLocations(locationFields, files, mapId, fastify.supabase, request.log);
    const map = await createMap({
      id: mapId,
      coupleName: fields.couple_name,
      email: fields.email,
      plan: fields.plan as Plan,
      relationshipStartDate: fields.relationship_start_date,
      locations,
      youtubeVideoId: fields.youtube_video_id,
      youtubeStartTime: fields.youtube_start_time ? parseInt(fields.youtube_start_time, 10) : undefined,
      youtubeEndTime: fields.youtube_end_time ? parseInt(fields.youtube_end_time, 10) : undefined,
    }, fastify.supabase);
    request.log.info({ mapId: map.id, plan: fields.plan }, 'Map created');
    try {
      fastify.posthog?.capture({ distinctId: map.id, event: 'map_created', properties: { plan: fields.plan } });
    } catch (error) {
      request.log.warn({ error: error instanceof Error ? error.message : error }, 'PostHog capture failed');
    }
    try {
      const result = await createCheckoutPayment(
        { mapId: map.id, plan: fields.plan as Plan, email: fields.email },
        fastify.supabase,
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
