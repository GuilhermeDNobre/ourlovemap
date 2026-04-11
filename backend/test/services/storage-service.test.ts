import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(() => Promise.resolve({})),
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => input),
}));

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { uploadPhoto, type UploadableFile } from '../../src/services/storage-service.js';

const PUBLIC_URL = 'https://test.r2.dev';

function buildMockFile(mimetype: string): UploadableFile {
  return {
    mimetype,
    toBuffer: jest.fn<() => Promise<Buffer>>().mockResolvedValue(Buffer.from('fake-image-data')),
  };
}

function getMockSend(): jest.Mock {
  return ((S3Client as jest.Mock).mock.results.at(-1)?.value as { send: jest.Mock }).send;
}

describe('uploadPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockImplementation(() => Promise.resolve({})),
    }));
  });

  it('should return public URL for a valid JPEG file', async () => {
    const file = buildMockFile('image/jpeg');

    const result = await uploadPhoto({ file, mapId: 'map-1' });

    expect(result).toMatch(new RegExp(`^${PUBLIC_URL}/photos/map-1/.+\\.jpg$`));
  });

  it('should return public URL for a valid PNG file', async () => {
    const file = buildMockFile('image/png');

    const result = await uploadPhoto({ file, mapId: 'map-1' });

    expect(result).toMatch(new RegExp(`^${PUBLIC_URL}/photos/map-1/.+\\.png$`));
  });

  it('should return public URL for a valid WEBP file', async () => {
    const file = buildMockFile('image/webp');

    const result = await uploadPhoto({ file, mapId: 'map-1' });

    expect(result).toMatch(new RegExp(`^${PUBLIC_URL}/photos/map-1/.+\\.webp$`));
  });

  it('should return public URL for image/jpg mimetype', async () => {
    const file = buildMockFile('image/jpg');

    const result = await uploadPhoto({ file, mapId: 'map-1' });

    expect(result).toMatch(new RegExp(`^${PUBLIC_URL}/photos/map-1/.+\\.jpg$`));
  });

  it('should throw 400 error for GIF mimetype', async () => {
    const file = buildMockFile('image/gif');

    await expect(uploadPhoto({ file, mapId: 'map-1' })).rejects.toMatchObject({
      message: 'File type not allowed',
      statusCode: 400,
    });
  });

  it('should throw 400 error for PDF mimetype', async () => {
    const file = buildMockFile('application/pdf');

    await expect(uploadPhoto({ file, mapId: 'map-1' })).rejects.toMatchObject({
      message: 'File type not allowed',
      statusCode: 400,
    });
  });

  it('should rethrow error when R2 upload fails', async () => {
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockImplementation(() => Promise.reject(new Error('R2 unavailable'))),
    }));
    const file = buildMockFile('image/jpeg');

    await expect(uploadPhoto({ file, mapId: 'map-1' })).rejects.toThrow('R2 unavailable');
  });

  it('should upload to path prefixed with photos/<mapId>', async () => {
    const file = buildMockFile('image/png');
    await uploadPhoto({ file, mapId: 'map-abc' });

    const mockSend = getMockSend();
    const command = (PutObjectCommand as unknown as jest.Mock).mock.calls[0][0] as { Key: string };
    expect(command.Key).toMatch(/^photos\/map-abc\/.+\.png$/);
  });

  it('should use CLOUDFLARE_R2_BUCKET as bucket name', async () => {
    const file = buildMockFile('image/jpeg');
    await uploadPhoto({ file, mapId: 'map-1' });

    const command = (PutObjectCommand as unknown as jest.Mock).mock.calls[0][0] as { Bucket: string };
    expect(command.Bucket).toBe('test-bucket');
  });

  it('should call S3Client.send once per upload', async () => {
    const file = buildMockFile('image/jpeg');
    await uploadPhoto({ file, mapId: 'map-1' });

    const mockSend = getMockSend();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
