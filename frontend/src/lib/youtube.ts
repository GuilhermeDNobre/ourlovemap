const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_URL_PATTERNS = [
  /[?&]v=([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
];

export function extractYoutubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();

  if (YOUTUBE_ID_REGEX.test(trimmed)) return trimmed;

  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeId(url) !== null;
}
