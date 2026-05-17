// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env ?? {};
export const MAPTILER_API_KEY: string = env.VITE_MAPTILER_API_KEY ?? '';
export const YOUTUBE_API_KEY: string = env.VITE_YOUTUBE_API_KEY ?? '';
export const API_BASE_URL: string = env.VITE_API_BASE_URL ?? '';
export const GOOGLE_MAPS_API_KEY: string = env.VITE_GOOGLE_MAPS_API_KEY ?? '';
