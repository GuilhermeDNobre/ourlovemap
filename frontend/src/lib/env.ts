import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1, 'VITE_API_BASE_URL is required'),
  VITE_MAPTILER_API_KEY: z.string().min(1, 'VITE_MAPTILER_API_KEY is required'),
  VITE_YOUTUBE_API_KEY: z.string().min(1, 'VITE_YOUTUBE_API_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Missing required environment variables: ${missing}`);
  }
  return result.data;
}
