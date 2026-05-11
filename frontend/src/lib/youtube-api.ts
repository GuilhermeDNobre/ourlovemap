import { YOUTUBE_API_KEY } from './client-env';

export interface YouTubeResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

interface YouTubeApiItem {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { default: { url: string } };
  };
}

const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

export async function searchYouTube(query: string): Promise<YouTubeResult[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '5',
    q: query,
    key: YOUTUBE_API_KEY,
  });
  const response = await fetch(`${SEARCH_URL}?${params}`);
  if (response.status === 403) {
    throw new Error('QUOTA_EXCEEDED');
  }
  if (!response.ok) {
    throw new Error('FETCH_ERROR');
  }
  const data = await response.json();
  return (data.items as YouTubeApiItem[]).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnailUrl: item.snippet.thumbnails.default.url,
  }));
}
