const mockEmailsSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockEmailsSend,
    },
  })),
}));

import { sendDeliveryEmail, type SendDeliveryEmailParams } from '../../src/services/email-service.js';

beforeEach(() => {
  jest.clearAllMocks();
  mockEmailsSend.mockResolvedValue({ id: 'email-id-123' });
  process.env.OURLOVEMAP_BASE_URL = 'https://ourlovemap.com.br';
  process.env.RESEND_API_KEY = 'test-api-key';
});

describe('sendDeliveryEmail', () => {
  it('should call resend.emails.send with correct subject containing couple name', async () => {
    const params: SendDeliveryEmailParams = {
      coupleName: 'Carol e André',
      slug: 'carol-e-andre',
      token: 'abc12',
      qrCodeBuffer: Buffer.from('jpg-data'),
    };

    await sendDeliveryEmail(params, 'carol@example.com');

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Seu Mapa do Amor está pronto, Carol e André! 💌',
      }),
    );
  });

  it('should call resend.emails.send with HTML containing couple name and access link', async () => {
    const params: SendDeliveryEmailParams = {
      coupleName: 'Carol e André',
      slug: 'carol-e-andre',
      token: 'abc12',
      qrCodeBuffer: Buffer.from('jpg-data'),
    };

    await sendDeliveryEmail(params, 'carol@example.com');

    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.html).toContain('Carol e André');
    expect(call.html).toContain('https://ourlovemap.com.br/carol-e-andre?token=abc12');
  });

  it('should include a plain text version of the email', async () => {
    const params: SendDeliveryEmailParams = {
      coupleName: 'Carol e André',
      slug: 'carol-e-andre',
      token: 'abc12',
      qrCodeBuffer: Buffer.from('jpg-data'),
    };

    await sendDeliveryEmail(params, 'carol@example.com');

    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.text).toContain('Carol e André');
    expect(call.text).toContain('https://ourlovemap.com.br/carol-e-andre?token=abc12');
  });

  it('should send email to the provided address', async () => {
    const params: SendDeliveryEmailParams = {
      coupleName: 'Maria e João',
      slug: 'maria-e-joao',
      token: 'xyz99',
      qrCodeBuffer: Buffer.from('jpg-data'),
    };

    await sendDeliveryEmail(params, 'maria@example.com');

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maria@example.com',
      }),
    );
  });

  it('should send from oi@ address with a replyTo set', async () => {
    const params: SendDeliveryEmailParams = {
      coupleName: 'Carol e André',
      slug: 'carol-e-andre',
      token: 'abc12',
      qrCodeBuffer: Buffer.from('jpg-data'),
    };

    await sendDeliveryEmail(params, 'carol@example.com');

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Our Love Map <product@ourlovemap.com.br>',
        replyTo: 'support@ourlovemap.com.br',
      }),
    );
  });

  it('should attach the QR code buffer as a JPG attachment', async () => {
    const qrBuffer = Buffer.from('jpg-data');
    const params: SendDeliveryEmailParams = {
      coupleName: 'Carol e André',
      slug: 'carol-e-andre',
      token: 'abc12',
      qrCodeBuffer: qrBuffer,
    };

    await sendDeliveryEmail(params, 'carol@example.com');

    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ filename: 'qrcode.jpg', content: qrBuffer }),
      ]),
    );
  });
});
