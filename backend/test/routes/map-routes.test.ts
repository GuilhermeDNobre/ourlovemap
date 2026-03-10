jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

jest.mock('../../src/services/storage-service.js', () => ({
  uploadPhoto: jest.fn(),
}));

jest.mock('../../src/services/map-service.js', () => ({
  createMap: jest.fn(),
}));

jest.mock('../../src/services/payment-service.js', () => ({
  createPixPayment: jest.fn(),
}));

import { buildApp } from '../helpers/build-app';
import { uploadPhoto } from '../../src/services/storage-service.js';
import { createMap } from '../../src/services/map-service.js';
import { createPixPayment } from '../../src/services/payment-service.js';

const BOUNDARY = 'test-boundary-abc123';

function buildMultipartBody(
  fields: Record<string, string>,
  files: Array<{ name: string; filename: string; contentType: string; data: string }> = [],
): Buffer {
  const parts: string[] = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`);
  }
  for (const file of files) {
    parts.push(
      `--${BOUNDARY}\r\n` +
      `Content-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\n` +
      `Content-Type: ${file.contentType}\r\n` +
      `\r\n${file.data}`,
    );
  }
  return Buffer.from(`${parts.join('\r\n')}\r\n--${BOUNDARY}--\r\n`);
}

function buildBaseFields(): Record<string, string> {
  return {
    couple_name: 'Carol e André',
    email: 'carol@example.com',
    plan: 'basic',
    relationship_start_date: '2020-06-15',
  };
}

function buildLocationFields(count: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    result[`locations[${i}][title]`] = `Location ${i + 1}`;
    result[`locations[${i}][latitude]`] = '-23.5';
    result[`locations[${i}][longitude]`] = '-46.6';
    result[`locations[${i}][order]`] = String(i + 1);
  }
  return result;
}

function buildValidFields(): Record<string, string> {
  return { ...buildBaseFields(), ...buildLocationFields(1) };
}

function buildValidFile() {
  return [{
    name: 'locations[0][photo]',
    filename: 'photo.jpg',
    contentType: 'image/jpeg',
    data: 'fake-image-data',
  }];
}

function buildDefaultPixResult() {
  return {
    paymentId: 'pay-1',
    pixQrCode: 'base64-qr',
    pixCode: 'pix-code',
    paymentExpiresAt: new Date('2026-03-10T01:00:00Z'),
  };
}

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
});

afterEach(() => {
  process.env = originalEnv;
});

describe('POST /api/maps', () => {
  it('should return 200 with mapId, pixQrCode, pixCode, paymentExpiresAt for valid request', async () => {
    const app = buildApp();
    (uploadPhoto as jest.Mock).mockResolvedValue('https://storage.example.com/photo.jpg');
    (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });
    (createPixPayment as jest.Mock).mockResolvedValue(buildDefaultPixResult());

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(buildValidFields(), buildValidFile()),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.mapId).toBe('map-1');
    expect(body.pixQrCode).toBe('base64-qr');
    expect(body.pixCode).toBe('pix-code');
    expect(body.paymentExpiresAt).toBeDefined();
    expect(uploadPhoto).toHaveBeenCalledWith(expect.objectContaining({ mapId: expect.any(String) }));
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ coupleName: 'Carol e André', email: 'carol@example.com', plan: 'basic' }),
      expect.anything(),
    );
    expect(createPixPayment).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'basic', email: 'carol@example.com' }),
      expect.anything(),
    );
  });

  it('should return 400 when couple_name is missing', async () => {
    const app = buildApp();
    const fields = buildValidFields();
    delete fields.couple_name;

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('couple_name');
  });

  it('should return 400 when email is missing', async () => {
    const app = buildApp();
    const fields = buildValidFields();
    delete fields.email;

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('email');
  });

  it('should return 400 when relationship_start_date is missing', async () => {
    const app = buildApp();
    const fields = buildValidFields();
    delete fields.relationship_start_date;

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('relationship_start_date');
  });

  it('should return 400 when plan is invalid', async () => {
    const app = buildApp();
    const fields = { ...buildValidFields(), plan: 'enterprise' };

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('plan');
  });

  it('should return 422 and not upload files when 4 locations sent with basic plan', async () => {
    const app = buildApp();
    const fields = { ...buildBaseFields(), ...buildLocationFields(4) };

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(422);
    expect(uploadPhoto).not.toHaveBeenCalled();
    expect(createMap).not.toHaveBeenCalled();
  });

  it('should return 400 when photo exceeds 5MB size limit', async () => {
    const app = buildApp();
    const oversizedData = 'x'.repeat(5 * 1024 * 1024 + 1);

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(buildValidFields(), [{
        name: 'locations[0][photo]',
        filename: 'big.jpg',
        contentType: 'image/jpeg',
        data: oversizedData,
      }]),
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 when photo has invalid type', async () => {
    const app = buildApp();
    (uploadPhoto as jest.Mock).mockRejectedValue(
      Object.assign(new Error('File type not allowed'), { statusCode: 400 }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(buildValidFields(), [{
        name: 'locations[0][photo]',
        filename: 'photo.gif',
        contentType: 'image/gif',
        data: 'fake-gif-data',
      }]),
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 422 when Mercado Pago payment creation fails', async () => {
    const app = buildApp();
    (uploadPhoto as jest.Mock).mockResolvedValue('https://storage.example.com/photo.jpg');
    (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });
    (createPixPayment as jest.Mock).mockRejectedValue(new Error('MP API unavailable'));

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(buildValidFields(), buildValidFile()),
    });

    expect(response.statusCode).toBe(422);
  });
});
