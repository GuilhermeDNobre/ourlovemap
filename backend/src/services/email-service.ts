import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY ?? '');

export interface SendDeliveryEmailParams {
  coupleName: string;
  token: string;
  qrCodeBuffer: Buffer;
}

export async function sendDeliveryEmail(
  params: SendDeliveryEmailParams,
  email: string,
): Promise<void> {
  const baseUrl = process.env.OURLOVEMAP_BASE_URL;
  if (!baseUrl) throw new Error('OURLOVEMAP_BASE_URL is not configured');
  const link = `${baseUrl}/access?token=${params.token}`;
  await resend.emails.send({
    from: 'Our Love Map <noreply@ourlovemap.com>',
    to: email,
    subject: `Seu Mapa do Amor está pronto, ${params.coupleName}! 💌`,
    html: `
      <h1>Olá, ${params.coupleName}!</h1>
      <p>Aqui está seu acesso para o seu Mapa do Amor. Guarde este link com carinho — ele é único para vocês!</p>
      <p><a href="${link}">Acessar Mapa do Amor</a></p>
      <p>Ou escaneie o QR Code em anexo:</p>
    `,
    attachments: [
      {
        filename: 'qrcode.jpg',
        content: params.qrCodeBuffer,
      },
    ],
  });
}
