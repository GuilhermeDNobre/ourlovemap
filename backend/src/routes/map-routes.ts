import crypto from 'crypto';
import type { FastifyInstance, FastifyRequest, FastifyBaseLogger } from 'fastify';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadPhoto, type UploadableFile } from '../services/storage-service.js';
import { createMap, type LocationInput, type Plan } from '../services/map-service.js';
import { createPixPayment } from '../services/payment-service.js';

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

export default async function mapRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/maps', async (request, reply) => {
    const { fields, locationFields, files } = await parseMultipartParts(request);
    const validationError = validateRequiredFields(fields);
    if (validationError) return reply.code(400).send({ error: validationError });
    const locationCount = Object.keys(locationFields).length;
    if (!validateLocationCount(fields.plan, locationCount)) {
      const limit = PLAN_LOCATION_LIMITS[fields.plan];
      return reply.code(422).send({ error: `Plan ${fields.plan} allows at most ${limit} locations` });
    }
    const storageId = crypto.randomUUID();
    const locations = await buildLocations(locationFields, files, storageId, fastify.supabase, request.log);
    const map = await createMap({
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
      const pix = await createPixPayment(
        { mapId: map.id, plan: fields.plan as Plan, email: fields.email },
        fastify.supabase,
      );
      return reply.send({
        mapId: map.id,
        pixQrCode: pix.pixQrCode,
        pixCode: pix.pixCode,
        paymentExpiresAt: pix.paymentExpiresAt,
      });
    } catch (error) {
      request.log.error({ mapId: map.id, error: error instanceof Error ? error.message : error }, 'PIX payment creation failed');
      const err = new Error('Payment creation failed') as Error & { statusCode: number };
      err.statusCode = 422;
      throw err;
    }
  });
}
