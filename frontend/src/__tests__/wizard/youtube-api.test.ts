import { searchYouTube } from '../../lib/youtube-api';

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('searchYouTube', () => {
  it('should return array of results in correct format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: { videoId: 'abc123' },
            snippet: {
              title: 'Test Song',
              thumbnails: { default: { url: 'https://example.com/thumb.jpg' } },
            },
          },
        ],
      }),
    } as Response);

    const results = await searchYouTube('test song');

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      videoId: 'abc123',
      title: 'Test Song',
      thumbnailUrl: 'https://example.com/thumb.jpg',
    });
  });

  it('should return empty array when no items', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as Response);

    const results = await searchYouTube('test');

    expect(results).toEqual([]);
  });

  it('should throw QUOTA_EXCEEDED on 403 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    } as Response);

    await expect(searchYouTube('test')).rejects.toThrow('QUOTA_EXCEEDED');
  });

  it('should throw FETCH_ERROR on non-403 error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    await expect(searchYouTube('test')).rejects.toThrow('FETCH_ERROR');
  });

  it('should call YouTube Data API v3 search endpoint with query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as Response);

    await searchYouTube('love song');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('googleapis.com/youtube/v3/search'),
    );
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('q=love+song'));
  });

  it('should include maxResults=5 in the request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as Response);

    await searchYouTube('test');

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('maxResults=5'));
  });
});
