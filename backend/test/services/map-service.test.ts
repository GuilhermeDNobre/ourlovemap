import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../src/models/map-model.js', () => ({
  MapModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../../src/models/location-model.js', () => ({
  LocationModel: {
    find: jest.fn(),
    insertMany: jest.fn(),
  },
}));

jest.mock('../../src/utils/slug.js', () => ({
  generateSlug: jest.fn().mockImplementation((name: unknown) => (name as string).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')),
}));

jest.mock('../../src/utils/token.js', () => ({
  generateToken: jest.fn().mockReturnValue('tok01'),
}));

import {
  createMap,
  activateMap,
  setPaymentFailed,
  getMapByToken,
  getMapById,
  getMapByOrderNsu,
  getPaymentStatus,
  updatePaymentData,
  getLocationsByMapId,
  type CreateMapData,
  type Plan,
  type PaymentData,
} from '../../src/services/map-service.js';
import { MapModel } from '../../src/models/map-model.js';
import { LocationModel } from '../../src/models/location-model.js';

function buildMockMapDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'map-1' },
    coupleName: 'Carol e André',
    buyerName: 'Carol Silva',
    buyerPhone: '11999999999',
    slug: '',
    email: 'carol@example.com',
    plan: 'basic',
    relationshipStartDate: new Date('2020-06-15'),
    token: undefined,
    status: 'pending_payment',
    opening: undefined,
    youtubeVideoId: undefined,
    youtubeStartTime: undefined,
    youtubeEndTime: undefined,
    youtubeLoop: undefined,
    paymentId: undefined,
    checkoutUrl: undefined,
    expiresAt: undefined,
    createdAt: new Date('2026-03-10T00:00:00Z'),
    updatedAt: new Date('2026-03-10T00:00:00Z'),
    ...overrides,
  };
}

function buildMockLocationDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'loc-1' },
    mapId: { toString: () => 'map-1' },
    title: 'Nossa primeira vez',
    description: undefined,
    message: undefined,
    address: undefined,
    photoUrl: undefined,
    latitude: -23.5,
    longitude: -46.6,
    order: 1,
    ...overrides,
  };
}

function buildCreateMapData(plan: Plan, locationCount: number): CreateMapData {
  return {
    coupleName: 'Carol e André',
    buyerName: 'Carol Silva',
    buyerPhone: '11999999999',
    email: 'carol@example.com',
    plan,
    relationshipStartDate: '2020-06-15',
    locations: Array.from({ length: locationCount }, (_, i) => ({
      title: `Location ${i + 1}`,
      latitude: -23.5 + i * 0.1,
      longitude: -46.6 + i * 0.1,
      order: i + 1,
    })),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createMap', () => {
  it('should succeed with basic plan and 3 locations', async () => {
    const doc = buildMockMapDoc({ plan: 'basic' });
    (MapModel.create as jest.Mock).mockImplementation(() => Promise.resolve(doc));
    (LocationModel.insertMany as jest.Mock).mockImplementation(() => Promise.resolve([]));

    const result = await createMap(buildCreateMapData('basic', 3));

    expect(result.id).toBe('map-1');
    expect(result.status).toBe('pending_payment');
    expect(result.plan).toBe('basic');
  });

  it('should throw 422 error with basic plan and 4 locations', async () => {
    await expect(createMap(buildCreateMapData('basic', 4))).rejects.toMatchObject({
      message: expect.stringContaining('basic'),
      statusCode: 422,
    });
    expect(MapModel.create).not.toHaveBeenCalled();
  });

  it('should succeed with premium plan and 7 locations', async () => {
    const doc = buildMockMapDoc({ plan: 'premium' });
    (MapModel.create as jest.Mock).mockImplementation(() => Promise.resolve(doc));
    (LocationModel.insertMany as jest.Mock).mockImplementation(() => Promise.resolve([]));

    const result = await createMap(buildCreateMapData('premium', 7));

    expect(result.id).toBe('map-1');
    expect(result.plan).toBe('premium');
  });

  it('should throw 422 error with premium plan and 8 locations', async () => {
    await expect(createMap(buildCreateMapData('premium', 8))).rejects.toMatchObject({
      message: expect.stringContaining('premium'),
      statusCode: 422,
    });
    expect(MapModel.create).not.toHaveBeenCalled();
  });

  it('should call LocationModel.insertMany with correct mapId', async () => {
    const doc = buildMockMapDoc();
    (MapModel.create as jest.Mock).mockImplementation(() => Promise.resolve(doc));
    (LocationModel.insertMany as jest.Mock).mockImplementation(() => Promise.resolve([]));

    await createMap(buildCreateMapData('basic', 1));

    expect(LocationModel.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ mapId: doc._id, title: 'Location 1' }),
      ]),
    );
  });
});

describe('activateMap', () => {
  it('should generate slug, token with 5 chars, and set status to active', async () => {
    const existing = buildMockMapDoc({ plan: 'basic' });
    const updated = buildMockMapDoc({ plan: 'basic', slug: 'carol-e-andre', token: 'tok01', status: 'active', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(existing));
    (MapModel.findByIdAndUpdate as jest.Mock).mockImplementation(() => Promise.resolve(updated));

    const result = await activateMap('map-1');

    expect(MapModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'map-1',
      expect.objectContaining({ slug: expect.any(String), token: 'tok01', status: 'active' }),
      { new: true },
    );
    expect(result.status).toBe('active');
    expect(result.token).toBe('tok01');
  });

  it('should set expiresAt ~7 days from now for basic plan', async () => {
    const existing = buildMockMapDoc({ plan: 'basic' });
    const capturedUpdate = { args: null as Record<string, unknown> | null };
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(existing));
    (MapModel.findByIdAndUpdate as jest.Mock).mockImplementation((_id: unknown, args: unknown) => {
      capturedUpdate.args = args as Record<string, unknown>;
      return Promise.resolve(buildMockMapDoc({ ...capturedUpdate.args, status: 'active' }));
    });

    const before = new Date();
    await activateMap('map-1');
    const after = new Date();

    const expectedMin = new Date(before.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expectedMax = new Date(after.getTime() + 7 * 24 * 60 * 60 * 1000);
    const actualExpiresAt = capturedUpdate.args?.expiresAt as Date;
    expect(actualExpiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    expect(actualExpiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
  });

  it('should not set expiresAt for premium plan', async () => {
    const existing = buildMockMapDoc({ plan: 'premium' });
    const capturedUpdate = { args: null as Record<string, unknown> | null };
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(existing));
    (MapModel.findByIdAndUpdate as jest.Mock).mockImplementation((_id: unknown, args: unknown) => {
      capturedUpdate.args = args as Record<string, unknown>;
      return Promise.resolve(buildMockMapDoc({ ...capturedUpdate.args, status: 'active' }));
    });

    await activateMap('map-1');

    expect(capturedUpdate.args?.expiresAt).toBeUndefined();
  });

  it('should throw when map is not found', async () => {
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

    await expect(activateMap('nonexistent')).rejects.toThrow('Map not found');
  });
});

describe('getMapByToken', () => {
  it('should return map for valid token and active map without expiry', async () => {
    const doc = buildMockMapDoc({ status: 'active', token: 'abc12', slug: 'carol-e-andre', expiresAt: undefined });
    (MapModel.findOne as jest.Mock).mockImplementation(() => Promise.resolve(doc));

    const result = await getMapByToken('abc12');

    expect(result).not.toBeNull();
    expect(result?.status).toBe('active');
    expect(result?.token).toBe('abc12');
  });

  it('should update status to expired and return expired map when map has expired', async () => {
    const pastDate = new Date(Date.now() - 1000);
    const doc = buildMockMapDoc({ status: 'active', token: 'abc12', expiresAt: pastDate });
    const expiredDoc = buildMockMapDoc({ status: 'expired', token: 'abc12', expiresAt: pastDate });
    (MapModel.findOne as jest.Mock).mockImplementation(() => Promise.resolve(doc));
    (MapModel.findByIdAndUpdate as jest.Mock).mockImplementation(() => Promise.resolve(expiredDoc));

    const result = await getMapByToken('abc12');

    expect(MapModel.findByIdAndUpdate).toHaveBeenCalledWith(
      doc._id,
      { status: 'expired' },
      { new: true },
    );
    expect(result?.status).toBe('expired');
  });

  it('should return null for nonexistent token', async () => {
    (MapModel.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

    const result = await getMapByToken('nonexistent');

    expect(result).toBeNull();
  });
});

describe('setPaymentFailed', () => {
  it('should update status to payment_failed', async () => {
    (MapModel.findByIdAndUpdate as jest.Mock).mockImplementation(() => Promise.resolve(null));

    await setPaymentFailed('map-1');

    expect(MapModel.findByIdAndUpdate).toHaveBeenCalledWith('map-1', { status: 'payment_failed' });
  });
});

describe('getMapByOrderNsu', () => {
  it('should return map when order nsu (mapId) exists', async () => {
    const doc = buildMockMapDoc({ status: 'pending_payment' });
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(doc));

    const result = await getMapByOrderNsu('map-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('map-1');
    expect(result?.status).toBe('pending_payment');
  });

  it('should return null when paymentId does not exist', async () => {
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

    const result = await getMapByOrderNsu('nonexistent');

    expect(result).toBeNull();
  });
});

describe('getPaymentStatus', () => {
  it('should return payment status and checkoutUrl for valid mapId', async () => {
    const doc = buildMockMapDoc({ status: 'pending_payment', checkoutUrl: 'https://checkout.infinitepay.com.br/myhandle?lenc=abc' });
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(doc));

    const result = await getPaymentStatus('map-1');

    expect(result.status).toBe('pending_payment');
    expect(result.checkoutUrl).toBe('https://checkout.infinitepay.com.br/myhandle?lenc=abc');
  });

  it('should throw when map is not found', async () => {
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

    await expect(getPaymentStatus('nonexistent')).rejects.toThrow('Map not found');
  });
});

describe('updatePaymentData', () => {
  it('should update paymentId and checkoutUrl with correct values', async () => {
    (MapModel.findByIdAndUpdate as jest.Mock).mockImplementation(() => Promise.resolve(null));
    const data: PaymentData = { paymentId: 'bill_abc123', checkoutUrl: 'https://app.abacatepay.com/pay/bill_abc123' };

    await updatePaymentData('map-1', data);

    expect(MapModel.findByIdAndUpdate).toHaveBeenCalledWith('map-1', { checkoutUrl: data.checkoutUrl, paymentId: data.paymentId });
  });
});

describe('getMapById', () => {
  it('should return map when id exists', async () => {
    const doc = buildMockMapDoc();
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(doc));

    const result = await getMapById('map-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('map-1');
    expect(result?.status).toBe('pending_payment');
  });

  it('should return null when map does not exist', async () => {
    (MapModel.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

    const result = await getMapById('nonexistent');

    expect(result).toBeNull();
  });
});

describe('getLocationsByMapId', () => {
  it('should return locations sorted by order', async () => {
    const docs = [buildMockLocationDoc({ order: 1 }), buildMockLocationDoc({ _id: { toString: () => 'loc-2' }, order: 2 })];
    const mockSort = jest.fn().mockImplementation(() => Promise.resolve(docs));
    (LocationModel.find as jest.Mock).mockReturnValue({ sort: mockSort });

    const result = await getLocationsByMapId('map-1');

    expect(LocationModel.find).toHaveBeenCalledWith({ mapId: 'map-1' });
    expect(mockSort).toHaveBeenCalledWith({ order: 1 });
    expect(result).toHaveLength(2);
    expect(result[0].order).toBe(1);
    expect(result[1].order).toBe(2);
  });

  it('should return empty array when no locations exist', async () => {
    const mockSort = jest.fn().mockImplementation(() => Promise.resolve([]));
    (LocationModel.find as jest.Mock).mockReturnValue({ sort: mockSort });

    const result = await getLocationsByMapId('map-1');

    expect(result).toHaveLength(0);
  });
});
