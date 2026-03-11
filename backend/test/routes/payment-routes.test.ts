jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

jest.mock('axios');

jest.mock('../../src/services/map-service.js', () => ({
  getMapByOrderNsu: jest.fn(),
  activateMap: jest.fn(),
  updatePaymentData: jest.fn(),
  getMapById: jest.fn(),
  getPaymentStatus: jest.fn(),
}));

jest.mock('../../src/services/qr-code-service.js', () => ({
  generateQrCode: jest.fn(),
}));

jest.mock('../../src/services/email-service.js', () => ({
  sendDeliveryEmail: jest.fn(),
}));

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
}));

import { buildApp } from '../helpers/build-app';
import {
  getMapByOrderNsu,
  activateMap,
} from '../../src/services/map-service.js';
import { generateQrCode } from '../../src/services/qr-code-service.js';
import { sendDeliveryEmail } from '../../src/services/email-service.js';

const WEBHOOK_SECRET = 'test-webhook-secret';

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
  process.env.INFINITEPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  (generateQrCode as jest.Mock).mockResolvedValue(Buffer.from('jpg'));
  (sendDeliveryEmail as jest.Mock).mockResolvedValue(undefined);
});

afterEach(() => {
  process.env = originalEnv;
});

function buildWebhookBody(orderNsu: string) {
  return {
    invoice_slug: 'inv-abc',
    amount: 1990,
    paid_amount: 1990,
    installments: 1,
    capture_method: 'pix',
    transaction_nsu: 'txn-001',
    order_nsu: orderNsu,
    receipt_url: 'https://receipt.example.com',
    items: [{ quantity: 1, price: 1990, description: 'Our Love Map — plano basic' }],
  };
}

function buildPendingMap() {
  return {
    id: 'map-1',
    status: 'pending_payment',
    plan: 'basic',
    coupleName: 'Carol e André',
    email: 'carol@example.com',
  };
}

function buildActiveMap() {
  return {
    id: 'map-1',
    status: 'active',
    plan: 'basic',
    coupleName: 'Carol e André',
    email: 'carol@example.com',
    token: 'tok01',
  };
}

describe('POST /api/payments/webhook', () => {
  it('should return 200 and call activateMap when secret is valid and map is pending', async () => {
    const app = buildApp();
    (getMapByOrderNsu as jest.Mock).mockResolvedValue(buildPendingMap());
    (activateMap as jest.Mock).mockResolvedValue({ ...buildActiveMap() });

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/webhook?secret=${WEBHOOK_SECRET}`,
      headers: { 'content-type': 'application/json' },
      payload: buildWebhookBody('map-1'),
    });

    expect(response.statusCode).toBe(200);
    expect(activateMap).toHaveBeenCalledWith('map-1', expect.anything());
    expect(generateQrCode).toHaveBeenCalledWith('tok01');
    expect(sendDeliveryEmail).toHaveBeenCalled();
  });

  it('should return 401 when secret is missing', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: { 'content-type': 'application/json' },
      payload: buildWebhookBody('map-1'),
    });

    expect(response.statusCode).toBe(401);
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should return 401 when secret is invalid', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook?secret=wrong-secret',
      headers: { 'content-type': 'application/json' },
      payload: buildWebhookBody('map-1'),
    });

    expect(response.statusCode).toBe(401);
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should return 200 and not call activateMap again when map is already active', async () => {
    const app = buildApp();
    (getMapByOrderNsu as jest.Mock).mockResolvedValue(buildActiveMap());

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/webhook?secret=${WEBHOOK_SECRET}`,
      headers: { 'content-type': 'application/json' },
      payload: buildWebhookBody('map-1'),
    });

    expect(response.statusCode).toBe(200);
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should return 200 without calling activateMap when order_nsu does not match any map', async () => {
    const app = buildApp();
    (getMapByOrderNsu as jest.Mock).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/webhook?secret=${WEBHOOK_SECRET}`,
      headers: { 'content-type': 'application/json' },
      payload: buildWebhookBody('unknown-map'),
    });

    expect(response.statusCode).toBe(200);
    expect(activateMap).not.toHaveBeenCalled();
  });
});
