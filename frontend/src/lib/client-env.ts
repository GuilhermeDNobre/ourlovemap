// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env ?? {};
export const MAPTILER_API_KEY: string = env.VITE_MAPTILER_API_KEY ?? '';
export const YOUTUBE_API_KEY: string = env.VITE_YOUTUBE_API_KEY ?? '';
