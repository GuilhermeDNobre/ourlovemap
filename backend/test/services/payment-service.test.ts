import type { FastifyBaseLogger } from 'fastify';

jest.mock('axios');
jest.mock('../../src/services/map-service.js', () => ({
  getMapByPaymentId: jest.fn(),
  activateMap: jest.fn(),
  updatePaymentData: jest.fn(),
}));
jest.mock('../../src/services/qr-code-service.js', () => ({
  generateQrCode: jest.fn(),
}));
jest.mock('../../src/services/email-service.js', () => ({
  sendDeliveryEmail: jest.fn(),
}));
import axios from 'axios';
import {
  createPixPayment,
  createCardPayment,
  processWebhookEvent,
  type CreatePixPaymentParams,
  type CreateCardPaymentParams,
  type AbacatePayWebhookEvent,
  type WebhookProcessResult,
} from '../../src/services/payment-service.js';
import {
  getMapByPaymentId,
  activateMap,
  updatePaymentData,
} from '../../src/services/map-service.js';
import { generateQrCode } from '../../src/services/qr-code-service.js';
import { sendDeliveryEmail } from '../../src/services/email-service.js';

const mockedAxiosPost = axios.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ABACATEPAY_API_KEY = 'abc_dev_test-key';
  process.env.OURLOVEMAP_BASE_URL = 'https://ourlovemap.com.br';
});

function buildMockLog(): FastifyBaseLogger {
  return {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  } as unknown as FastifyBaseLogger;
}

function buildWebhookEvent(paymentId = 'pix_char_abc123'): AbacatePayWebhookEvent {
  return {
    event: 'pix.paid',
    data: {
      id: paymentId,
      amount: 1990,
      status: 'PAID',
      devMode: false,
    },
  };
}

describe('createPixPayment', () => {
  it('should call AbacatePay pixQrCode API with correct amount and expiry for basic plan', async () => {
    mockedAxiosPost.mockResolvedValue({ data: { data: { id: 'pix_char_abc', brCode: 'pix-code', brCodeBase64: 'base64img', expiresAt: '2026-01-01T00:10:00Z' }, error: null } });
    (updatePaymentData as jest.Mock).mockResolvedValue(undefined);
    const params: CreatePixPaymentParams = { mapId: 'map-1', plan: 'basic' };

    const result = await createPixPayment(params);

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'https://api.abacatepay.com/v1/pixQrCode/create',
      expect.objectContaining({ amount: 1990, expiresIn: 600 }),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer abc_dev_test-key' }) }),
    );
    expect(updatePaymentData).toHaveBeenCalledWith('map-1', { paymentId: 'pix_char_abc', checkoutUrl: null });
    expect(result).toMatchObject({ brCode: 'pix-code', brCodeBase64: 'base64img', expiresAt: '2026-01-01T00:10:00Z' });
  });

  it('should call AbacatePay pixQrCode API with 2990 cents for premium plan', async () => {
    mockedAxiosPost.mockResolvedValue({ data: { data: { id: 'pix_char_xyz', brCode: 'pix-code', brCodeBase64: 'base64img', expiresAt: '2026-01-01T00:10:00Z' }, error: null } });
    (updatePaymentData as jest.Mock).mockResolvedValue(undefined);
    const params: CreatePixPaymentParams = { mapId: 'map-2', plan: 'premium' };

    await createPixPayment(params);

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ amount: 2990 }),
      expect.any(Object),
    );
  });

  it('should rethrow error when AbacatePay PIX API fails', async () => {
    mockedAxiosPost.mockRejectedValue(new Error('AbacatePay unavailable'));
    const params: CreatePixPaymentParams = { mapId: 'map-1', plan: 'basic' };

    await expect(createPixPayment(params)).rejects.toThrow('AbacatePay unavailable');
  });
});

describe('createCardPayment', () => {
  it('should create customer then billing and return checkoutUrl', async () => {
    mockedAxiosPost
      .mockResolvedValueOnce({ data: { data: { id: 'cust_abc' }, error: null } })
      .mockResolvedValueOnce({ data: { data: { id: 'bill_abc', url: 'https://app.abacatepay.com/pay/bill_abc' }, error: null } });
    (updatePaymentData as jest.Mock).mockResolvedValue(undefined);
    const params: CreateCardPaymentParams = { mapId: 'map-1', plan: 'basic', email: 'carol@example.com', buyerName: 'Carol Silva', buyerPhone: '(11) 99999-9999', taxId: '529.982.247-25' };

    const result = await createCardPayment(params);

    expect(mockedAxiosPost).toHaveBeenNthCalledWith(
      1,
      'https://api.abacatepay.com/v1/customer/create',
      expect.objectContaining({ name: 'Carol Silva', email: 'carol@example.com', taxId: '529.982.247-25' }),
      expect.any(Object),
    );
    expect(mockedAxiosPost).toHaveBeenNthCalledWith(
      2,
      'https://api.abacatepay.com/v1/billing/create',
      expect.objectContaining({ methods: ['CARD'], customerId: 'cust_abc', products: [expect.objectContaining({ price: 1990 })] }),
      expect.any(Object),
    );
    expect(updatePaymentData).toHaveBeenCalledWith('map-1', { paymentId: 'bill_abc', checkoutUrl: 'https://app.abacatepay.com/pay/bill_abc' });
    expect(result.checkoutUrl).toBe('https://app.abacatepay.com/pay/bill_abc');
  });

  it('should rethrow error when customer creation fails', async () => {
    mockedAxiosPost.mockRejectedValue(new Error('Invalid taxId'));
    const params: CreateCardPaymentParams = { mapId: 'map-1', plan: 'basic', email: 'carol@example.com', buyerName: 'Carol Silva', buyerPhone: '(11) 99999-9999', taxId: 'invalid' };

    await expect(createCardPayment(params)).rejects.toThrow('Invalid taxId');
  });

  it('should rethrow error when billing creation fails', async () => {
    mockedAxiosPost
      .mockResolvedValueOnce({ data: { data: { id: 'cust_abc' }, error: null } })
      .mockRejectedValueOnce(new Error('Billing failed'));
    const params: CreateCardPaymentParams = { mapId: 'map-1', plan: 'basic', email: 'carol@example.com', buyerName: 'Carol Silva', buyerPhone: '(11) 99999-9999', taxId: '529.982.247-25' };

    await expect(createCardPayment(params)).rejects.toThrow('Billing failed');
  });
});

describe('processWebhookEvent', () => {
  it('should call activateMap and return wasActivated true when map is pending_payment', async () => {
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', plan: 'basic', coupleName: 'Carol e André', email: 'carol@example.com' });
    (activateMap as jest.Mock).mockResolvedValue({ id: 'map-1', slug: 'carol-e-andre', token: 'tok01', coupleName: 'Carol e André', email: 'carol@example.com' });
    (generateQrCode as jest.Mock).mockResolvedValue(Buffer.from('jpg'));
    (sendDeliveryEmail as jest.Mock).mockResolvedValue(undefined);

    const result: WebhookProcessResult = await processWebhookEvent(buildWebhookEvent(), buildMockLog());

    expect(getMapByPaymentId).toHaveBeenCalledWith('pix_char_abc123');
    expect(activateMap).toHaveBeenCalledWith('map-1');
    expect(result.wasActivated).toBe(true);
    expect(result.plan).toBe('basic');
    expect(result.mapId).toBe('map-1');
  });

  it('should work for billing.paid (card payment) events', async () => {
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', plan: 'premium' });
    (activateMap as jest.Mock).mockResolvedValue({ id: 'map-1', slug: 'carol-e-andre', token: 'tok01', coupleName: 'Carol', email: 'carol@example.com' });
    (generateQrCode as jest.Mock).mockResolvedValue(Buffer.from('jpg'));
    (sendDeliveryEmail as jest.Mock).mockResolvedValue(undefined);

    const cardEvent: AbacatePayWebhookEvent = { event: 'billing.paid', data: { id: 'bill_abc', amount: 2990, status: 'PAID', devMode: false } };
    const result = await processWebhookEvent(cardEvent, buildMockLog());

    expect(getMapByPaymentId).toHaveBeenCalledWith('bill_abc');
    expect(result.wasActivated).toBe(true);
  });

  it('should not call activateMap and return wasActivated false when map is already active (idempotency)', async () => {
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'active', plan: 'basic' });
    const log = buildMockLog();

    const result: WebhookProcessResult = await processWebhookEvent(buildWebhookEvent(), log);

    expect(activateMap).not.toHaveBeenCalled();
    expect(result.wasActivated).toBe(false);
    expect(log.warn as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ mapId: 'map-1' }),
      'Webhook event ignored: map already active',
    );
  });

  it('should log warn and return wasActivated false when map is not found', async () => {
    (getMapByPaymentId as jest.Mock).mockResolvedValue(null);
    const log = buildMockLog();

    const result: WebhookProcessResult = await processWebhookEvent(buildWebhookEvent('pix_char_unknown'), log);

    expect(activateMap).not.toHaveBeenCalled();
    expect(result.wasActivated).toBe(false);
    expect(log.warn as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: 'pix_char_unknown' }),
      'Map not found for webhook event',
    );
  });

  it('should call sendDeliveryEmail with correct params after activation', async () => {
    const qrBuffer = Buffer.from('jpg-data');
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', plan: 'basic' });
    (activateMap as jest.Mock).mockResolvedValue({ id: 'map-1', slug: 'carol-e-andre', token: 'tok01', coupleName: 'Carol e André', email: 'carol@example.com' });
    (generateQrCode as jest.Mock).mockResolvedValue(qrBuffer);
    (sendDeliveryEmail as jest.Mock).mockResolvedValue(undefined);

    await processWebhookEvent(buildWebhookEvent(), buildMockLog());

    expect(generateQrCode).toHaveBeenCalledWith({ slug: 'carol-e-andre', token: 'tok01' });
    expect(sendDeliveryEmail).toHaveBeenCalledWith(
      { coupleName: 'Carol e André', slug: 'carol-e-andre', token: 'tok01', qrCodeBuffer: qrBuffer },
      'carol@example.com',
    );
  });

  it('should log error but not throw when email delivery fails', async () => {
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', plan: 'basic' });
    (activateMap as jest.Mock).mockResolvedValue({ id: 'map-1', slug: 'carol-e-andre', token: 'tok01', coupleName: 'Carol e André', email: 'carol@example.com' });
    (generateQrCode as jest.Mock).mockResolvedValue(Buffer.from('jpg'));
    (sendDeliveryEmail as jest.Mock).mockRejectedValue(new Error('Resend unavailable'));
    const log = buildMockLog();

    await expect(processWebhookEvent(buildWebhookEvent(), log)).resolves.toMatchObject({ wasActivated: true });

    expect(log.error as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ mapId: 'map-1' }),
      'Failed to send delivery email',
    );
  });

  it('should ignore and return wasActivated false for non-paid event types', async () => {
    const log = buildMockLog();
    const event: AbacatePayWebhookEvent = { event: 'pix.expired', data: { id: 'pix_char_abc123', amount: 1990, status: 'EXPIRED', devMode: false } };

    const result: WebhookProcessResult = await processWebhookEvent(event, log);

    expect(activateMap).not.toHaveBeenCalled();
    expect(getMapByPaymentId).not.toHaveBeenCalled();
    expect(result.wasActivated).toBe(false);
  });

  it('should log warn and return wasActivated false when event has no payment id', async () => {
    const log = buildMockLog();
    const event = { event: 'pix.paid', data: null } as unknown as AbacatePayWebhookEvent;

    const result: WebhookProcessResult = await processWebhookEvent(event, log);

    expect(activateMap).not.toHaveBeenCalled();
    expect(result.wasActivated).toBe(false);
    expect(log.warn as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'pix.paid' }),
      'Webhook event has no payment id',
    );
  });
});
