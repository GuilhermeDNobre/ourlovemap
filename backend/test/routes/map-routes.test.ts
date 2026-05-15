jest.mock('mongoose', () => {
  const Schema = jest.fn().mockImplementation(() => ({ index: jest.fn() }));
  const model = jest.fn().mockReturnValue({});
  return {
    Schema,
    model,
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    Types: {
      ObjectId: jest.fn().mockImplementation(() => ({ toString: () => 'generated-map-id' })),
    },
  };
});

jest.mock('../../src/services/storage-service.js', () => ({
  uploadPhoto: jest.fn(),
}));

jest.mock('../../src/services/map-service.js', () => ({
  createMap: jest.fn(),
  getMapById: jest.fn(),
  getMapByToken: jest.fn(),
  getLocationsByMapId: jest.fn(),
  PLAN_LOCATION_LIMITS: { basic: 3, premium: 7, test: 7 },
}));

jest.mock('../../src/services/payment-service.js', () => ({
  createPixPayment: jest.fn(),
  createCardPayment: jest.fn(),
}));

import { buildApp } from '../helpers/build-app';
import { uploadPhoto } from '../../src/services/storage-service.js';
import {
  createMap,
  getMapByToken,
  getLocationsByMapId,
} from '../../src/services/map-service.js';

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
    buyer_name: 'Carol Silva',
    buyer_phone: '11999999999',
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/maps', () => {
  it('should return 200 with mapId for valid request', async () => {
    const app = buildApp();
    (uploadPhoto as jest.Mock).mockResolvedValue('https://storage.example.com/photo.jpg');
    (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(buildValidFields(), buildValidFile()),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.mapId).toBe('map-1');
    expect(uploadPhoto).toHaveBeenCalledWith(expect.objectContaining({ mapId: expect.any(String) }));
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ coupleName: 'Carol e André', email: 'carol@example.com', plan: 'basic' }),
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

  it('should pass opening to createMap when provided', async () => {
    const app = buildApp();
    (uploadPhoto as jest.Mock).mockResolvedValue('https://storage.example.com/photo.jpg');
    (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });

    const fields = { ...buildValidFields(), opening: 'Você é meu lar' };
    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(200);
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ opening: 'Você é meu lar' }),
    );
  });

  it('should not pass opening to createMap when opening is empty string', async () => {
    const app = buildApp();
    (uploadPhoto as jest.Mock).mockResolvedValue('https://storage.example.com/photo.jpg');
    (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });

    const fields = { ...buildValidFields(), opening: '' };
    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(200);
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ opening: undefined }),
    );
  });

  it('should pass youtubeLoop true to createMap when youtube_loop is "true"', async () => {
    const app = buildApp();
    (uploadPhoto as jest.Mock).mockResolvedValue('https://storage.example.com/photo.jpg');
    (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });

    const fields = {
      ...buildValidFields(),
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtube_start_time: '10',
      youtube_end_time: '60',
      youtube_loop: 'true',
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(200);
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ youtubeLoop: true }),
    );
  });

  it('should pass youtubeLoop false to createMap when youtube_loop is "false"', async () => {
    const app = buildApp();
    (uploadPhoto as jest.Mock).mockResolvedValue('https://storage.example.com/photo.jpg');
    (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });

    const fields = {
      ...buildValidFields(),
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtube_start_time: '10',
      youtube_end_time: '60',
      youtube_loop: 'false',
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(200);
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({ youtubeLoop: false }),
    );
  });

  it('should pass address to createMap when provided in location', async () => {
    const app = buildApp();
    (uploadPhoto as jest.Mock).mockResolvedValue('https://storage.example.com/photo.jpg');
    (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });

    const fields = {
      ...buildValidFields(),
      'locations[0][address]': 'Rua Augusta, 1000, São Paulo',
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/maps',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload: buildMultipartBody(fields),
    });

    expect(response.statusCode).toBe(200);
    expect(createMap).toHaveBeenCalledWith(
      expect.objectContaining({
        locations: expect.arrayContaining([
          expect.objectContaining({ address: 'Rua Augusta, 1000, São Paulo' }),
        ]),
      }),
    );
  });
});

describe('GET /api/maps/by-token', () => {
  function buildActiveMap() {
    return {
      id: 'map-1',
      coupleName: 'Carol e André',
      slug: 'carol-e-andre',
      email: 'carol@example.com',
      plan: 'basic',
      relationshipStartDate: '2020-06-15',
      opening: null,
      token: 'tok01',
      status: 'active',
      youtubeVideoId: 'dQw4w9WgXcQ',
      youtubeStartTime: 30,
      youtubeEndTime: 90,
      youtubeLoop: null,
      paymentId: null,
      checkoutUrl: null,
      expiresAt: null,
      createdAt: '2026-03-10T00:00:00Z',
    };
  }

  function buildLocations(overrides: Record<string, unknown> = {}) {
    return [
      {
        id: 'loc-1',
        mapId: 'map-1',
        title: 'Nossa primeira vez',
        description: 'Um lugar especial',
        message: 'Te amo',
        address: null,
        photoUrl: 'https://storage.example.com/photo.jpg',
        latitude: -23.5,
        longitude: -46.6,
        order: 1,
        ...overrides,
      },
    ];
  }

  it('should return 200 with full map data for a valid active token', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue(buildActiveMap());
    (getLocationsByMapId as jest.Mock).mockResolvedValue(buildLocations());

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.coupleName).toBe('Carol e André');
    expect(body.relationshipStartDate).toBe('2020-06-15');
    expect(body.youtubeVideoId).toBe('dQw4w9WgXcQ');
    expect(body.youtubeStartTime).toBe(30);
    expect(body.youtubeEndTime).toBe(90);
    expect(body.locations).toHaveLength(1);
    expect(body.locations[0].title).toBe('Nossa primeira vez');
    expect(body.locations[0].latitude).toBe(-23.5);
    expect(body.locations[0].longitude).toBe(-46.6);
    expect(body.locations[0].photoUrl).toBe('https://storage.example.com/photo.jpg');
    expect(getMapByToken).toHaveBeenCalledWith('tok01');
    expect(getLocationsByMapId).toHaveBeenCalledWith('map-1');
  });

  it('should return opening and youtubeLoop in response when set', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue({
      ...buildActiveMap(),
      opening: 'Você é meu lar',
      youtubeLoop: true,
    });
    (getLocationsByMapId as jest.Mock).mockResolvedValue(buildLocations());

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.opening).toBe('Você é meu lar');
    expect(body.youtubeLoop).toBe(true);
  });

  it('should return opening: null and youtubeLoop: null when fields are not set', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue(buildActiveMap());
    (getLocationsByMapId as jest.Mock).mockResolvedValue(buildLocations());

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.opening).toBeNull();
    expect(body.youtubeLoop).toBeNull();
  });

  it('should return 401 when token query param is absent', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token' });

    expect(response.statusCode).toBe(401);
    expect(getMapByToken).not.toHaveBeenCalled();
  });

  it('should return 401 when token does not match any map', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue(null);

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=unknown' });

    expect(response.statusCode).toBe(401);
  });

  it('should return 403 with upgrade message when map is expired', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue({ ...buildActiveMap(), status: 'expired' });

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

    expect(response.statusCode).toBe(403);
    const body = response.json();
    expect(body.error).toBe('map_expired');
    expect(body.message).toContain('Premium');
  });

  it('should return 403 even when PostHog capture throws for expired map', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue({ ...buildActiveMap(), status: 'expired' });

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('map_expired');
  });

  it('should return 403 when map is in pending_payment status', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue({ ...buildActiveMap(), status: 'pending_payment' });

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

    expect(response.statusCode).toBe(403);
    expect(getLocationsByMapId).not.toHaveBeenCalled();
  });

  it('should return 403 when map is in payment_failed status', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue({ ...buildActiveMap(), status: 'payment_failed' });

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

    expect(response.statusCode).toBe(403);
    expect(getLocationsByMapId).not.toHaveBeenCalled();
  });

  it('should return address in location when it is set', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue(buildActiveMap());
    (getLocationsByMapId as jest.Mock).mockResolvedValue(
      buildLocations({ address: 'Rua Augusta, 1000, São Paulo' }),
    );

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

    expect(response.statusCode).toBe(200);
    expect(response.json().locations[0].address).toBe('Rua Augusta, 1000, São Paulo');
  });

  it('should return address: null in location when address is not set', async () => {
    const app = buildApp();
    (getMapByToken as jest.Mock).mockResolvedValue(buildActiveMap());
    (getLocationsByMapId as jest.Mock).mockResolvedValue(buildLocations());

    const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

    expect(response.statusCode).toBe(200);
    expect(response.json().locations[0].address).toBeNull();
  });
});
