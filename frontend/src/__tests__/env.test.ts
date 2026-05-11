import { validateEnv } from '../lib/env';

describe('validateEnv', () => {
  const validEnv = {
    VITE_API_BASE_URL: 'http://localhost:3000',
    VITE_MAPTILER_API_KEY: 'maptiler-key',
    VITE_YOUTUBE_API_KEY: 'youtube-key',
  };

  it('should throw when all variables are missing', () => {
    expect(() => validateEnv({})).toThrow('Missing required environment variables');
  });

  it('should throw when VITE_API_BASE_URL is missing', () => {
    const { VITE_API_BASE_URL: _, ...rest } = validEnv;
    expect(() => validateEnv(rest)).toThrow();
  });

  it('should throw when VITE_MAPTILER_API_KEY is missing', () => {
    const { VITE_MAPTILER_API_KEY: _, ...rest } = validEnv;
    expect(() => validateEnv(rest)).toThrow();
  });

  it('should throw when VITE_YOUTUBE_API_KEY is missing', () => {
    const { VITE_YOUTUBE_API_KEY: _, ...rest } = validEnv;
    expect(() => validateEnv(rest)).toThrow();
  });

  it('should not throw when all variables are present', () => {
    expect(() => validateEnv(validEnv)).not.toThrow();
  });

  it('should return the parsed env when all variables are present', () => {
    const result = validateEnv(validEnv);
    expect(result.VITE_API_BASE_URL).toBe('http://localhost:3000');
    expect(result.VITE_MAPTILER_API_KEY).toBe('maptiler-key');
    expect(result.VITE_YOUTUBE_API_KEY).toBe('youtube-key');
  });
});
