import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyBaseLogger } from 'fastify';

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Payment: jest.fn(),
}));

jest.mock('../../src/services/map-service.js', () => ({
  getMapByPaymentId: jest.fn(),
  activateMap: jest.fn(),
  setPaymentFailed: jest.fn(),
  updatePaymentData: jest.fn(),
}));

import { Payment } from 'mercadopago';
import {
  createPixPayment,
  processWebhookEvent,
  type CreatePixPaymentParams,
  type MercadoPagoEvent,
} from '../../src/services/payment-service.js';
import {
  getMapByPaymentId,
  activateMap,
  setPaymentFailed,
  updatePaymentData,
} from '../../src/services/map-service.js';

const mockCreate = jest.fn();
const mockGet = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (Payment as jest.Mock).mockImplementation(() => ({
    create: mockCreate,
    get: mockGet,
  }));
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

function buildPixResponse() {
  return {
    id: 12345,
    point_of_interaction: {
      transaction_data: {
        qr_code_base64: 'base64-qr-code',
        qr_code: 'pix-copy-paste-code',
      },
    },
  };
}

describe('createPixPayment', () => {
  it('should create PIX with amount 19.90 for basic plan and return correct fields', async () => {
    mockCreate.mockResolvedValue(buildPixResponse());
    (updatePaymentData as jest.Mock).mockResolvedValue(undefined);
    const params: CreatePixPaymentParams = { mapId: 'map-1', plan: 'basic', email: 'carol@example.com' };
    const before = Date.now();

    const result = await createPixPayment(params, buildMockSupabase());

    const after = Date.now();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          transaction_amount: 19.90,
          payment_method_id: 'pix',
          payer: { email: 'carol@example.com' },
          external_reference: 'map-1',
          description: 'Our Love Map',
        }),
      }),
    );
    expect(result.paymentId).toBe('12345');
    expect(result.pixQrCode).toBe('base64-qr-code');
    expect(result.pixCode).toBe('pix-copy-paste-code');
    expect(result.paymentExpiresAt).toBeInstanceOf(Date);
    const expectedMin = before + 15 * 60 * 1000;
    const expectedMax = after + 15 * 60 * 1000;
    expect(result.paymentExpiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
    expect(result.paymentExpiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
  });

  it('should create PIX with amount 29.90 for premium plan', async () => {
    mockCreate.mockResolvedValue(buildPixResponse());
    (updatePaymentData as jest.Mock).mockResolvedValue(undefined);
    const params: CreatePixPaymentParams = { mapId: 'map-2', plan: 'premium', email: 'carol@example.com' };

    await createPixPayment(params, buildMockSupabase());

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ transaction_amount: 29.90 }),
      }),
    );
  });

  it('should rethrow error when MP payment creation fails', async () => {
    mockCreate.mockRejectedValue(new Error('MP API unavailable'));
    const params: CreatePixPaymentParams = { mapId: 'map-1', plan: 'basic', email: 'carol@example.com' };

    await expect(createPixPayment(params, buildMockSupabase())).rejects.toThrow('MP API unavailable');
  });
});

describe('processWebhookEvent', () => {
  it('should call activateMap when payment status is approved', async () => {
    const supabase = buildMockSupabase();
    mockGet.mockResolvedValue({ status: 'approved' });
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', paymentId: 'pay-123' });
    (activateMap as jest.Mock).mockResolvedValue(undefined);
    const event: MercadoPagoEvent = { data: { id: 'pay-123' } };

    await processWebhookEvent(event, supabase, buildMockLog());

    expect(activateMap).toHaveBeenCalledWith('map-1', supabase);
    expect(setPaymentFailed).not.toHaveBeenCalled();
  });

  it('should call setPaymentFailed when payment status is rejected', async () => {
    const supabase = buildMockSupabase();
    mockGet.mockResolvedValue({ status: 'rejected' });
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', paymentId: 'pay-123' });
    (setPaymentFailed as jest.Mock).mockResolvedValue(undefined);
    const event: MercadoPagoEvent = { data: { id: 'pay-123' } };

    await processWebhookEvent(event, supabase, buildMockLog());

    expect(setPaymentFailed).toHaveBeenCalledWith('map-1', supabase);
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should call setPaymentFailed when payment status is cancelled', async () => {
    const supabase = buildMockSupabase();
    mockGet.mockResolvedValue({ status: 'cancelled' });
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', paymentId: 'pay-123' });
    (setPaymentFailed as jest.Mock).mockResolvedValue(undefined);
    const event: MercadoPagoEvent = { data: { id: 'pay-123' } };

    await processWebhookEvent(event, supabase, buildMockLog());

    expect(setPaymentFailed).toHaveBeenCalledWith('map-1', supabase);
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should not call activateMap or setPaymentFailed and should log warn for unknown status', async () => {
    const supabase = buildMockSupabase();
    mockGet.mockResolvedValue({ status: 'in_process' });
    const log = buildMockLog();
    const event: MercadoPagoEvent = { data: { id: 'pay-123' } };

    await processWebhookEvent(event, supabase, log);

    expect(activateMap).not.toHaveBeenCalled();
    expect(setPaymentFailed).not.toHaveBeenCalled();
    expect(log.warn as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ paymentStatus: 'in_process', paymentId: 'pay-123' }),
      'Webhook event ignored',
    );
  });
});
