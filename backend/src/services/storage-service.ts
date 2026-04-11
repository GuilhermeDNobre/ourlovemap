import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ACCEPTED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface UploadableFile {
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
}

interface UploadPhotoParams {
  file: UploadableFile;
  mapId: string;
}

function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadPhoto({ file, mapId }: UploadPhotoParams): Promise<string> {
  const ext = ACCEPTED_MIME_TYPES[file.mimetype];
  if (!ext) {
    const error = new Error('File type not allowed') as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }
  const buffer = await file.toBuffer();
  const storagePath = `photos/${mapId}/${randomUUID()}.${ext}`;
  const client = createR2Client();
  await client.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
    Key: storagePath,
    Body: buffer,
    ContentType: file.mimetype,
  }));
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL!}/${storagePath}`;
}
