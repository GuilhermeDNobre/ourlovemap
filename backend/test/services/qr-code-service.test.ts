const mockPngBuffer = Buffer.from('png-buffer');
const mockJpgBuffer = Buffer.from('jpg-buffer');

const mockToBuffer = jest.fn();
const mockJpeg = jest.fn();
const mockSharp = jest.fn();

const mockQrcodeToBuffer = jest.fn();

jest.mock('sharp', () => {
  return mockSharp;
});

jest.mock('qrcode', () => ({
  toBuffer: mockQrcodeToBuffer,
}));

import { generateQrCode } from '../../src/services/qr-code-service.js';

beforeEach(() => {
  jest.clearAllMocks();
  mockQrcodeToBuffer.mockResolvedValue(mockPngBuffer);
  mockToBuffer.mockResolvedValue(mockJpgBuffer);
  mockJpeg.mockReturnValue({ toBuffer: mockToBuffer });
  mockSharp.mockReturnValue({ jpeg: mockJpeg });
  process.env.OURLOVEMAP_BASE_URL = 'https://ourlovemap.com.br';
});

describe('generateQrCode', () => {
  it('should return a Buffer', async () => {
    const result = await generateQrCode({ slug: 'carol-e-andre', token: 'abc12' });

    expect(result).toBeInstanceOf(Buffer);
    expect(result).toBe(mockJpgBuffer);
  });

  it('should pass URL with slug and token to qrcode.toBuffer', async () => {
    await generateQrCode({ slug: 'carol-e-andre', token: 'abc12' });

    expect(mockQrcodeToBuffer).toHaveBeenCalledWith(
      'https://ourlovemap.com.br/carol-e-andre?token=abc12',
    );
  });

  it('should call sharp with the PNG buffer for JPEG conversion', async () => {
    await generateQrCode({ slug: 'carol-e-andre', token: 'abc12' });

    expect(mockSharp).toHaveBeenCalledWith(mockPngBuffer);
    expect(mockJpeg).toHaveBeenCalledWith({ quality: 90 });
    expect(mockToBuffer).toHaveBeenCalled();
  });
});
