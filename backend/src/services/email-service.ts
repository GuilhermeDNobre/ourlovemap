import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY ?? '');

export interface SendDeliveryEmailParams {
  coupleName: string;
  slug: string;
  token: string;
  qrCodeBuffer: Buffer;
}

export async function sendDeliveryEmail(
  params: SendDeliveryEmailParams,
  email: string,
): Promise<void> {
  const baseUrl = process.env.OURLOVEMAP_BASE_URL;
  if (!baseUrl) throw new Error('OURLOVEMAP_BASE_URL is not configured');
  const link = `${baseUrl}/${params.slug}?token=${params.token}`;
  await resend.emails.send({
    from: 'Our Love Map <product@ourlovemap.com.br>',
    to: email,
    replyTo: 'support@ourlovemap.com.br',
    subject: `Seu Mapa do Amor está pronto, ${params.coupleName}! 💌`,
    text: `Olá, ${params.coupleName}!\n\nSeu Mapa do Amor está pronto. Acesse pelo link abaixo — ele é único para vocês!\n\n${link}\n\nTambém enviamos um QR Code em anexo para facilitar o acesso.\n\nCom carinho,\nEquipe Our Love Map`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #e05;">${params.coupleName} 💕</h1>
  <p>Seu <strong>Mapa do Amor</strong> está pronto! Agora vocês têm um lugar especial para guardar todos os lugares que marcaram a história de vocês dois.</p>
  <p>Acesse pelo link abaixo — ele é exclusivo para vocês:</p>
  <p><a href="${link}" style="background:#e05;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Acessar meu Mapa do Amor</a></p>
  <p style="color:#666;font-size:13px;">Ou copie o endereço: ${link}</p>
  <p>Também enviamos um QR Code em anexo — é só escanear com a câmera do celular.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="color:#999;font-size:12px;">Com carinho, equipe Our Love Map · <a href="${baseUrl}" style="color:#999;">${baseUrl}</a></p>
</body>
</html>`,
    attachments: [
      {
        filename: 'qrcode.jpg',
        content: params.qrCodeBuffer,
      },
    ],
  });
}
