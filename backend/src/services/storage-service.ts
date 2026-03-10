import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyBaseLogger } from 'fastify';

const ACCEPTED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const STORAGE_BUCKET = 'couple-photos';

export interface UploadableFile {
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
}

interface UploadPhotoParams {
  file: UploadableFile;
  mapId: string;
  supabase: SupabaseClient;
  log: FastifyBaseLogger;
}

export async function uploadPhoto({ file, mapId, supabase, log }: UploadPhotoParams): Promise<string> {
  const ext = ACCEPTED_MIME_TYPES[file.mimetype];
  if (!ext) {
    const error = new Error('File type not allowed') as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }
  const buffer = await file.toBuffer();
  const storagePath = `${mapId}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: file.mimetype });
  if (uploadError) {
    log.error({ error: uploadError.message, mapId }, 'Supabase storage upload failed');
    throw uploadError;
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
