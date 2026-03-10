import QRCode from 'qrcode';
import sharp from 'sharp';

const QR_JPEG_QUALITY = 90;

export async function generateQrCode(token: string): Promise<Buffer> {
  const url = `${process.env.OURLOVEMAP_BASE_URL}/access?token=${token}`;
  const pngBuffer = await QRCode.toBuffer(url);
  return sharp(pngBuffer).jpeg({ quality: QR_JPEG_QUALITY }).toBuffer();
}
