import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyBaseLogger } from 'fastify';

jest.mock('axios');
jest.mock('../../src/services/map-service.js', () => ({
  getMapByOrderNsu: jest.fn(),
  activateMap: jest.fn(),
  updatePaymentData: jest.fn(),
}));
jest.mock('../../src/services/qr-code-service.js', () => ({
  generateQrCode: jest.fn(),
}));
jest.mock('../../src/services/email-service.js', () => ({
  sendDeliveryEmail: jest.fn(),
}));
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

import axios from 'axios';
import {
  createCheckoutPayment,
  processWebhookEvent,
  type CreateCheckoutPaymentParams,
  type InfinitePayWebhookEvent,
  type WebhookProcessResult,
} from '../../src/services/payment-service.js';
import {
  getMapByOrderNsu,
  activateMap,
  updatePaymentData,
} from '../../src/services/map-service.js';
import { generateQrCode } from '../../src/services/qr-code-service.js';
import { sendDeliveryEmail } from '../../src/services/email-service.js';

const mockedAxiosPost = axios.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INFINITEPAY_HANDLE = 'myhandle';
  process.env.INFINITEPAY_WEBHOOK_SECRET = 'my-secret';
  process.env.OURLOVEMAP_API_URL = 'https://api.ourlovemap.com';
});

function buildMockSupabase(): SupabaseClient {
  return {} as unknown as SupabaseClient;
}

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

function buildWebhookEvent(overrides: Partial<InfinitePayWebhookEvent> = {}): InfinitePayWebhookEvent {
  return {
    invoice_slug: 'inv-abc',
    amount: 1990,
    paid_amount: 1990,
    installments: 1,
    capture_method: 'pix',
    transaction_nsu: 'txn-001',
    order_nsu: 'map-1',
    receipt_url: 'https://receipt.example.com',
    items: [{ quantity: 1, price: 1990, description: 'Our Love Map — plano basic' }],
    ...overrides,
  };
}

describe('createCheckoutPayment', () => {
  it('should call InfinitePay API with correct price in cents for basic plan and return checkoutUrl', async () => {
    mockedAxiosPost.mockResolvedValue({ data: { url: 'https://checkout.infinitepay.com.br/myhandle?lenc=abc' } });
    (updatePaymentData as jest.Mock).mockResolvedValue(undefined);
    const params: CreateCheckoutPaymentParams = { mapId: 'map-1', plan: 'basic', email: 'carol@example.com', buyerName: 'Carol Silva', buyerPhone: '11999999999' };

    const result = await createCheckoutPayment(params, buildMockSupabase());

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'https://api.infinitepay.io/invoices/public/checkout/links',
      expect.objectContaining({
        handle: 'myhandle',
        order_nsu: 'map-1',
        items: [expect.objectContaining({ price: 1990, quantity: 1 })],
      }),
    );
    expect(result.checkoutUrl).toBe('https://checkout.infinitepay.com.br/myhandle?lenc=abc');
  });

  it('should call InfinitePay API with 2990 cents for premium plan', async () => {
    mockedAxiosPost.mockResolvedValue({ data: { url: 'https://checkout.infinitepay.com.br/myhandle?lenc=xyz' } });
    (updatePaymentData as jest.Mock).mockResolvedValue(undefined);
    const params: CreateCheckoutPaymentParams = { mapId: 'map-2', plan: 'premium', email: 'carol@example.com', buyerName: 'Carol Silva', buyerPhone: '11999999999' };

    await createCheckoutPayment(params, buildMockSupabase());

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        items: [expect.objectContaining({ price: 2990 })],
      }),
    );
  });

  it('should embed webhook_url with secret in the request body', async () => {
    mockedAxiosPost.mockResolvedValue({ data: { url: 'https://checkout.infinitepay.com.br/myhandle?lenc=abc' } });
    (updatePaymentData as jest.Mock).mockResolvedValue(undefined);
    const params: CreateCheckoutPaymentParams = { mapId: 'map-1', plan: 'basic', email: 'carol@example.com', buyerName: 'Carol Silva', buyerPhone: '11999999999' };

    await createCheckoutPayment(params, buildMockSupabase());

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        webhook_url: 'https://api.ourlovemap.com/api/payments/webhook?secret=my-secret',
      }),
    );
  });

  it('should rethrow error when InfinitePay API call fails', async () => {
    mockedAxiosPost.mockRejectedValue(new Error('InfinitePay API unavailable'));
    const params: CreateCheckoutPaymentParams = { mapId: 'map-1', plan: 'basic', email: 'carol@example.com', buyerName: 'Carol Silva', buyerPhone: '11999999999' };

    await expect(createCheckoutPayment(params, buildMockSupabase())).rejects.toThrow('InfinitePay API unavailable');
  });
});

describe('processWebhookEvent', () => {
  it('should call activateMap and return wasActivated true when map is pending_payment', async () => {
    const supabase = buildMockSupabase();
    (getMapByOrderNsu as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', plan: 'basic', coupleName: 'Carol e André', email: 'carol@example.com' });
    (activateMap as jest.Mock).mockResolvedValue({ id: 'map-1', slug: 'carol-e-andre', token: 'tok01', coupleName: 'Carol e André', email: 'carol@example.com' });
    (generateQrCode as jest.Mock).mockResolvedValue(Buffer.from('jpg'));
    (sendDeliveryEmail as jest.Mock).mockResolvedValue(undefined);

    const result: WebhookProcessResult = await processWebhookEvent(buildWebhookEvent(), supabase, buildMockLog());

    expect(activateMap).toHaveBeenCalledWith('map-1', supabase);
    expect(result.wasActivated).toBe(true);
    expect(result.plan).toBe('basic');
    expect(result.mapId).toBe('map-1');
  });

  it('should not call activateMap and return wasActivated false when map is already active (idempotency)', async () => {
    const supabase = buildMockSupabase();
    (getMapByOrderNsu as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'active', plan: 'basic' });
    const log = buildMockLog();

    const result: WebhookProcessResult = await processWebhookEvent(buildWebhookEvent(), supabase, log);

    expect(activateMap).not.toHaveBeenCalled();
    expect(result.wasActivated).toBe(false);
    expect(log.warn as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ mapId: 'map-1' }),
      'Webhook event ignored: map already active',
    );
  });

  it('should log warn and return wasActivated false when map is not found', async () => {
    const supabase = buildMockSupabase();
    (getMapByOrderNsu as jest.Mock).mockResolvedValue(null);
    const log = buildMockLog();

    const result: WebhookProcessResult = await processWebhookEvent(buildWebhookEvent({ order_nsu: 'unknown-map' }), supabase, log);

    expect(activateMap).not.toHaveBeenCalled();
    expect(result.wasActivated).toBe(false);
    expect(log.warn as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ orderNsu: 'unknown-map' }),
      'Map not found for webhook event',
    );
  });

  it('should call sendDeliveryEmail with correct params after activation', async () => {
    const supabase = buildMockSupabase();
    const qrBuffer = Buffer.from('jpg-data');
    (getMapByOrderNsu as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', plan: 'basic' });
    (activateMap as jest.Mock).mockResolvedValue({ id: 'map-1', slug: 'carol-e-andre', token: 'tok01', coupleName: 'Carol e André', email: 'carol@example.com' });
    (generateQrCode as jest.Mock).mockResolvedValue(qrBuffer);
    (sendDeliveryEmail as jest.Mock).mockResolvedValue(undefined);

    await processWebhookEvent(buildWebhookEvent(), supabase, buildMockLog());

    expect(generateQrCode).toHaveBeenCalledWith({ slug: 'carol-e-andre', token: 'tok01' });
    expect(sendDeliveryEmail).toHaveBeenCalledWith(
      { coupleName: 'Carol e André', slug: 'carol-e-andre', token: 'tok01', qrCodeBuffer: qrBuffer },
      'carol@example.com',
    );
  });

  it('should log error but not throw when email delivery fails', async () => {
    const supabase = buildMockSupabase();
    (getMapByOrderNsu as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', plan: 'basic' });
    (activateMap as jest.Mock).mockResolvedValue({ id: 'map-1', slug: 'carol-e-andre', token: 'tok01', coupleName: 'Carol e André', email: 'carol@example.com' });
    (generateQrCode as jest.Mock).mockResolvedValue(Buffer.from('jpg'));
    (sendDeliveryEmail as jest.Mock).mockRejectedValue(new Error('Resend unavailable'));
    const log = buildMockLog();

    await expect(processWebhookEvent(buildWebhookEvent(), supabase, log)).resolves.toMatchObject({ wasActivated: true });

    expect(activateMap).toHaveBeenCalledWith('map-1', supabase);
    expect(log.error as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ mapId: 'map-1' }),
      'Failed to send delivery email',
    );
  });

  it('should log error but not throw when qr code generation fails', async () => {
    const supabase = buildMockSupabase();
    (getMapByOrderNsu as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', plan: 'basic' });
    (activateMap as jest.Mock).mockResolvedValue({ id: 'map-1', slug: 'carol-e-andre', token: 'tok01', coupleName: 'Carol e André', email: 'carol@example.com' });
    (generateQrCode as jest.Mock).mockRejectedValue(new Error('QR generation failed'));
    const log = buildMockLog();

    await expect(processWebhookEvent(buildWebhookEvent(), supabase, log)).resolves.toMatchObject({ wasActivated: true });

    expect(activateMap).toHaveBeenCalledWith('map-1', supabase);
    expect(log.error as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ mapId: 'map-1' }),
      'Failed to send delivery email',
    );
  });
});
