jest.mock('mongoose', () => ({
  connect: jest.fn().mockImplementation(() => Promise.resolve()),
  disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('axios');

jest.mock('../../src/services/map-service.js', () => ({
  getMapByPaymentId: jest.fn(),
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

import { buildApp } from '../helpers/build-app';
import {
  getMapByPaymentId,
  activateMap,
} from '../../src/services/map-service.js';
import { generateQrCode } from '../../src/services/qr-code-service.js';
import { sendDeliveryEmail } from '../../src/services/email-service.js';

const WEBHOOK_SECRET = 'test-webhook-secret';

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  process.env.ABACATEPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  (generateQrCode as jest.Mock).mockResolvedValue(Buffer.from('jpg'));
  (sendDeliveryEmail as jest.Mock).mockResolvedValue(undefined);
});

afterEach(() => {
  process.env = originalEnv;
});

function buildPixWebhookBody(paymentId: string) {
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
    (getMapByPaymentId as jest.Mock).mockResolvedValue(buildPendingMap());
    (activateMap as jest.Mock).mockResolvedValue({ ...buildActiveMap() });

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/webhook?webhookSecret=${WEBHOOK_SECRET}`,
      headers: { 'content-type': 'application/json' },
      payload: buildPixWebhookBody('pix_char_abc123'),
    });

    expect(response.statusCode).toBe(200);
    expect(activateMap).toHaveBeenCalledWith('map-1');
    expect(generateQrCode).toHaveBeenCalledWith({ slug: undefined, token: 'tok01' });
    expect(sendDeliveryEmail).toHaveBeenCalled();
  });

  it('should return 401 when secret is missing', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: { 'content-type': 'application/json' },
      payload: buildPixWebhookBody('pix_char_abc123'),
    });

    expect(response.statusCode).toBe(401);
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should return 401 when secret is invalid', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook?webhookSecret=wrong-secret',
      headers: { 'content-type': 'application/json' },
      payload: buildPixWebhookBody('pix_char_abc123'),
    });

    expect(response.statusCode).toBe(401);
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should return 200 and not call activateMap again when map is already active', async () => {
    const app = buildApp();
    (getMapByPaymentId as jest.Mock).mockResolvedValue(buildActiveMap());

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/webhook?webhookSecret=${WEBHOOK_SECRET}`,
      headers: { 'content-type': 'application/json' },
      payload: buildPixWebhookBody('pix_char_abc123'),
    });

    expect(response.statusCode).toBe(200);
    expect(activateMap).not.toHaveBeenCalled();
  });

  it('should return 200 without calling activateMap when payment id does not match any map', async () => {
    const app = buildApp();
    (getMapByPaymentId as jest.Mock).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/webhook?webhookSecret=${WEBHOOK_SECRET}`,
      headers: { 'content-type': 'application/json' },
      payload: buildPixWebhookBody('pix_char_unknown'),
    });

    expect(response.statusCode).toBe(200);
    expect(activateMap).not.toHaveBeenCalled();
  });
});
