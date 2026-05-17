import QRCode from 'qrcode';
import sharp from 'sharp';

const QR_JPEG_QUALITY = 90;

export interface GenerateQrCodeParams {
  slug: string;
  token: string;
}

export async function generateQrCode(params: GenerateQrCodeParams): Promise<Buffer> {
  const baseUrl = process.env.OURLOVEMAP_BASE_URL;
  if (!baseUrl) throw new Error('OURLOVEMAP_BASE_URL is not configured');
  const url = `${baseUrl}/acesso?token=${params.token}`;
  const pngBuffer = await QRCode.toBuffer(url);
  return sharp(pngBuffer).jpeg({ quality: QR_JPEG_QUALITY }).toBuffer();
}
