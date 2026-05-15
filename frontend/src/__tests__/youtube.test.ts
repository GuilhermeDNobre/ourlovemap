import { extractYoutubeId, isValidYoutubeUrl } from '../lib/youtube';

describe('extractYoutubeId', () => {
  it('should extract ID from watch?v= URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from youtu.be URL', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from shorts URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should return the ID directly when given an 11-char ID', () => {
    expect(extractYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should return null for random text', () => {
    expect(extractYoutubeId('texto aleatório')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(extractYoutubeId('')).toBeNull();
  });

  it('should return null for invalid URL', () => {
    expect(extractYoutubeId('https://example.com/video')).toBeNull();
  });

  it('should handle URL with extra query params', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
  });
});

describe('isValidYoutubeUrl', () => {
  it('should return true for valid watch URL', () => {
    expect(isValidYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('should return true for valid youtu.be URL', () => {
    expect(isValidYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('should return true for direct ID', () => {
    expect(isValidYoutubeUrl('dQw4w9WgXcQ')).toBe(true);
  });

  it('should return false for invalid string', () => {
    expect(isValidYoutubeUrl('not a youtube url')).toBe(false);
  });
});
