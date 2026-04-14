jest.mock('mongoose', () => ({
  connect: jest.fn().mockImplementation(() => Promise.resolve()),
  disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('axios');

jest.mock('../../src/services/map-service.js', () => ({
  getMapById: jest.fn(),
  getMapByPaymentId: jest.fn(),
  activateMap: jest.fn(),
  updatePaymentData: jest.fn(),
  getPaymentStatus: jest.fn(),
}));

jest.mock('../../src/services/payment-service.js', () => ({
  createPixPayment: jest.fn(),
  createCardPayment: jest.fn(),
  processWebhookEvent: jest.fn(),
}));

jest.mock('../../src/services/qr-code-service.js', () => ({
  generateQrCode: jest.fn(),
}));

jest.mock('../../src/services/email-service.js', () => ({
  sendDeliveryEmail: jest.fn(),
}));

import { buildApp } from '../helpers/build-app';
import { getMapById } from '../../src/services/map-service.js';
import { createPixPayment, createCardPayment } from '../../src/services/payment-service.js';

beforeEach(() => {
  jest.clearAllMocks();
});

function buildPendingMap() {
  return {
    id: 'map-1',
    status: 'pending_payment',
    plan: 'basic',
    coupleName: 'Carol e André',
    email: 'carol@example.com',
    buyerName: 'Carol Silva',
    buyerPhone: '(11) 99999-9999',
    checkoutUrl: null,
  };
}

describe('POST /api/maps/:id/pix-payment', () => {
  it('should return 200 with brCode and brCodeBase64 when map is pending_payment', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue(buildPendingMap());
    (createPixPayment as jest.Mock).mockResolvedValue({
      brCode: 'pix-code-abc',
      brCodeBase64: 'data:image/png;base64,abc123',
      expiresAt: '2026-01-01T00:10:00Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps/map-1/pix-payment',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      brCode: 'pix-code-abc',
      brCodeBase64: 'data:image/png;base64,abc123',
      expiresAt: '2026-01-01T00:10:00Z',
    });
    expect(createPixPayment).toHaveBeenCalledWith({ mapId: 'map-1', plan: 'basic' });
  });

  it('should return 200 when map is payment_failed', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue({ ...buildPendingMap(), status: 'payment_failed' });
    (createPixPayment as jest.Mock).mockResolvedValue({ brCode: 'pix', brCodeBase64: 'b64', expiresAt: '2026-01-01T00:10:00Z' });

    const response = await app.inject({ method: 'POST', url: '/api/maps/map-1/pix-payment' });

    expect(response.statusCode).toBe(200);
  });

  it('should return 404 when map does not exist', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue(null);

    const response = await app.inject({ method: 'POST', url: '/api/maps/unknown/pix-payment' });

    expect(response.statusCode).toBe(404);
    expect(createPixPayment).not.toHaveBeenCalled();
  });

  it('should return 422 when map is already active', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue({ ...buildPendingMap(), status: 'active' });

    const response = await app.inject({ method: 'POST', url: '/api/maps/map-1/pix-payment' });

    expect(response.statusCode).toBe(422);
    expect(createPixPayment).not.toHaveBeenCalled();
  });

  it('should return 422 when map is expired', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue({ ...buildPendingMap(), status: 'expired' });

    const response = await app.inject({ method: 'POST', url: '/api/maps/map-1/pix-payment' });

    expect(response.statusCode).toBe(422);
  });
});

describe('POST /api/maps/:id/card-payment', () => {
  it('should return 200 with checkoutUrl when map is pending_payment', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue(buildPendingMap());
    (createCardPayment as jest.Mock).mockResolvedValue({ checkoutUrl: 'https://app.abacatepay.com/pay/bill_abc' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps/map-1/card-payment',
      headers: { 'content-type': 'application/json' },
      payload: { taxId: '529.982.247-25' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ checkoutUrl: 'https://app.abacatepay.com/pay/bill_abc' });
    expect(createCardPayment).toHaveBeenCalledWith(expect.objectContaining({
      mapId: 'map-1',
      taxId: '529.982.247-25',
      buyerName: 'Carol Silva',
    }));
  });

  it('should return 404 when map does not exist', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps/unknown/card-payment',
      headers: { 'content-type': 'application/json' },
      payload: { taxId: '529.982.247-25' },
    });

    expect(response.statusCode).toBe(404);
    expect(createCardPayment).not.toHaveBeenCalled();
  });

  it('should return 422 when map is active', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue({ ...buildPendingMap(), status: 'active' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps/map-1/card-payment',
      headers: { 'content-type': 'application/json' },
      payload: { taxId: '529.982.247-25' },
    });

    expect(response.statusCode).toBe(422);
    expect(createCardPayment).not.toHaveBeenCalled();
  });

  it('should return 422 when createCardPayment throws', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue(buildPendingMap());
    (createCardPayment as jest.Mock).mockRejectedValue(new Error('Invalid taxId'));

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps/map-1/card-payment',
      headers: { 'content-type': 'application/json' },
      payload: { taxId: 'invalid' },
    });

    expect(response.statusCode).toBe(422);
  });
});

describe('GET /api/maps/:id/payment-status', () => {
  it('should return status and checkoutUrl', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue({ ...buildPendingMap(), checkoutUrl: 'https://app.abacatepay.com/pay/bill_abc' });

    const response = await app.inject({ method: 'GET', url: '/api/maps/map-1/payment-status' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'pending_payment', checkoutUrl: 'https://app.abacatepay.com/pay/bill_abc' });
  });

  it('should return checkoutUrl as null for PIX payments', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue(buildPendingMap());

    const response = await app.inject({ method: 'GET', url: '/api/maps/map-1/payment-status' });

    expect(response.statusCode).toBe(200);
    expect(response.json().checkoutUrl).toBeNull();
  });

  it('should return 404 when map does not exist', async () => {
    const app = buildApp();
    (getMapById as jest.Mock).mockResolvedValue(null);

    const response = await app.inject({ method: 'GET', url: '/api/maps/unknown/payment-status' });

    expect(response.statusCode).toBe(404);
  });
});
