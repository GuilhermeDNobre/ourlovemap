jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

jest.mock('../../src/utils/hmac.js', () => ({
  verifyWebhookSignature: jest.fn(),
}));

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Payment: jest.fn(),
}));

jest.mock('../../src/services/map-service.js', () => ({
  getMapByPaymentId: jest.fn(),
  activateMap: jest.fn(),
  setPaymentFailed: jest.fn(),
  getMapById: jest.fn(),
  getPaymentStatus: jest.fn(),
}));

import { Payment } from 'mercadopago';
import { buildApp } from '../helpers/build-app';
import { verifyWebhookSignature } from '../../src/utils/hmac.js';
import {
  getMapByPaymentId,
  activateMap,
  setPaymentFailed,
} from '../../src/services/map-service.js';

const mockGet = jest.fn();

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
  (Payment as jest.Mock).mockImplementation(() => ({ get: mockGet }));
  (verifyWebhookSignature as jest.Mock).mockReturnValue(true);
});

afterEach(() => {
  process.env = originalEnv;
});

function buildWebhookBody(action: string, paymentId: string) {
  return { action, data: { id: paymentId } };
}

describe('POST /api/payments/webhook', () => {
  it('should return 200 and call activateMap when HMAC is valid and payment is approved', async () => {
    const app = buildApp();
    mockGet.mockResolvedValue({ status: 'approved' });
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', paymentId: 'pay-123' });
    (activateMap as jest.Mock).mockResolvedValue(undefined);

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: {
        'content-type': 'application/json',
        'x-signature': 'ts=123,v1=abc',
        'x-request-id': 'req-1',
      },
      payload: buildWebhookBody('payment.updated', 'pay-123'),
    });

    expect(response.statusCode).toBe(200);
    expect(activateMap).toHaveBeenCalledWith('map-1', expect.anything());
  });

  it('should return 401 when HMAC is invalid', async () => {
    const app = buildApp();
    (verifyWebhookSignature as jest.Mock).mockReturnValue(false);

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: { 'content-type': 'application/json' },
      payload: buildWebhookBody('payment.updated', 'pay-123'),
    });

    expect(response.statusCode).toBe(401);
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should return 200 and call setPaymentFailed when payment is rejected', async () => {
    const app = buildApp();
    mockGet.mockResolvedValue({ status: 'rejected' });
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', paymentId: 'pay-123' });
    (setPaymentFailed as jest.Mock).mockResolvedValue(undefined);

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: {
        'content-type': 'application/json',
        'x-signature': 'ts=123,v1=abc',
        'x-request-id': 'req-1',
      },
      payload: buildWebhookBody('payment.updated', 'pay-123'),
    });

    expect(response.statusCode).toBe(200);
    expect(setPaymentFailed).toHaveBeenCalledWith('map-1', expect.anything());
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should return 200 and call setPaymentFailed when payment is cancelled', async () => {
    const app = buildApp();
    mockGet.mockResolvedValue({ status: 'cancelled' });
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', paymentId: 'pay-123' });
    (setPaymentFailed as jest.Mock).mockResolvedValue(undefined);

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: {
        'content-type': 'application/json',
        'x-signature': 'ts=123,v1=abc',
        'x-request-id': 'req-1',
      },
      payload: buildWebhookBody('payment.updated', 'pay-123'),
    });

    expect(response.statusCode).toBe(200);
    expect(setPaymentFailed).toHaveBeenCalledWith('map-1', expect.anything());
  });

  it('should return 200 without processing when action is unknown topic', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: {
        'content-type': 'application/json',
        'x-signature': 'ts=123,v1=abc',
        'x-request-id': 'req-1',
      },
      payload: { action: 'merchant_order.updated', data: { id: 'order-1' } },
    });

    expect(response.statusCode).toBe(200);
    expect(activateMap).not.toHaveBeenCalled();
    expect(setPaymentFailed).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should return 200 and not call activateMap again when map is already active', async () => {
    const app = buildApp();
    mockGet.mockResolvedValue({ status: 'approved' });
    (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'active', paymentId: 'pay-123' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: {
        'content-type': 'application/json',
        'x-signature': 'ts=123,v1=abc',
        'x-request-id': 'req-1',
      },
      payload: buildWebhookBody('payment.updated', 'pay-123'),
    });

    expect(response.statusCode).toBe(200);
    expect(activateMap).not.toHaveBeenCalled();
  });
});
