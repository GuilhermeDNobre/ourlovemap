import type { SupabaseClient } from '@supabase/supabase-js';
import type { MultipartFile } from '@fastify/multipart';
import type { FastifyBaseLogger } from 'fastify';
import { uploadPhoto } from '../../src/services/storage-service.js';

const BASE_URL = 'https://example.supabase.co/storage/v1/object/public/couple-photos';

function buildMockFile(mimetype: string): MultipartFile {
  return {
    mimetype,
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
  } as unknown as MultipartFile;
}

function buildMockSupabase(options: { uploadError?: Error; ext?: string } = {}): SupabaseClient {
  const ext = options.ext ?? 'jpg';
  const publicUrl = `${BASE_URL}/map-1/uuid.${ext}`;
  const mockStorageApi = {
    upload: jest.fn().mockResolvedValue({
      data: { path: `map-1/uuid.${ext}` },
      error: options.uploadError ?? null,
    }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl } }),
  };
  return {
    storage: { from: jest.fn().mockReturnValue(mockStorageApi) },
  } as unknown as SupabaseClient;
}

function buildMockLog(): FastifyBaseLogger {
  return { error: jest.fn() } as unknown as FastifyBaseLogger;
}

describe('uploadPhoto', () => {
  it('should return public URL for a valid JPEG file', async () => {
    const file = buildMockFile('image/jpeg');
    const supabase = buildMockSupabase({ ext: 'jpg' });
    const log = buildMockLog();

    const result = await uploadPhoto({ file, mapId: 'map-1', supabase, log });

    expect(result).toBe(`${BASE_URL}/map-1/uuid.jpg`);
  });

  it('should return public URL for a valid JPG file', async () => {
    const file = buildMockFile('image/jpg');
    const supabase = buildMockSupabase({ ext: 'jpg' });
    const log = buildMockLog();

    const result = await uploadPhoto({ file, mapId: 'map-1', supabase, log });

    expect(result).toBe(`${BASE_URL}/map-1/uuid.jpg`);
  });

  it('should return public URL for a valid PNG file', async () => {
    const file = buildMockFile('image/png');
    const supabase = buildMockSupabase({ ext: 'png' });
    const log = buildMockLog();

    const result = await uploadPhoto({ file, mapId: 'map-1', supabase, log });

    expect(result).toBe(`${BASE_URL}/map-1/uuid.png`);
  });

  it('should return public URL for a valid WEBP file', async () => {
    const file = buildMockFile('image/webp');
    const supabase = buildMockSupabase({ ext: 'webp' });
    const log = buildMockLog();

    const result = await uploadPhoto({ file, mapId: 'map-1', supabase, log });

    expect(result).toBe(`${BASE_URL}/map-1/uuid.webp`);
  });

  it('should throw 400 error for GIF mimetype', async () => {
    const file = buildMockFile('image/gif');
    const supabase = buildMockSupabase();
    const log = buildMockLog();

    await expect(uploadPhoto({ file, mapId: 'map-1', supabase, log })).rejects.toMatchObject({
      message: 'File type not allowed',
      statusCode: 400,
    });
  });

  it('should throw 400 error for PDF mimetype', async () => {
    const file = buildMockFile('application/pdf');
    const supabase = buildMockSupabase();
    const log = buildMockLog();

    await expect(uploadPhoto({ file, mapId: 'map-1', supabase, log })).rejects.toMatchObject({
      message: 'File type not allowed',
      statusCode: 400,
    });
  });

  it('should rethrow error when Supabase upload fails', async () => {
    const file = buildMockFile('image/jpeg');
    const uploadError = new Error('Storage unavailable');
    const supabase = buildMockSupabase({ uploadError });
    const log = buildMockLog();

    await expect(uploadPhoto({ file, mapId: 'map-1', supabase, log })).rejects.toThrow('Storage unavailable');
  });

  it('should log error before rethrowing Supabase upload failure', async () => {
    const file = buildMockFile('image/jpeg');
    const uploadError = new Error('Storage unavailable');
    const supabase = buildMockSupabase({ uploadError });
    const log = buildMockLog();

    await expect(uploadPhoto({ file, mapId: 'map-1', supabase, log })).rejects.toThrow();

    expect((log.error as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Storage unavailable', mapId: 'map-1' }),
      'Supabase storage upload failed',
    );
  });

  it('should upload to path prefixed with mapId', async () => {
    const file = buildMockFile('image/png');
    const mockStorageApi = {
      upload: jest.fn().mockResolvedValue({ data: { path: 'map-abc/file.png' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.png' } }),
    };
    const supabase = {
      storage: { from: jest.fn().mockReturnValue(mockStorageApi) },
    } as unknown as SupabaseClient;
    const log = buildMockLog();

    await uploadPhoto({ file, mapId: 'map-abc', supabase, log });

    const uploadCall = mockStorageApi.upload.mock.calls[0];
    expect(uploadCall[0]).toMatch(/^map-abc\/.+\.png$/);
  });
});
