import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createMap,
  activateMap,
  setPaymentFailed,
  getMapByToken,
  getMapByPaymentId,
  getPaymentStatus,
  updatePaymentData,
  type CreateMapData,
  type Plan,
  type PaymentData,
} from '../../src/services/map-service.js';

type BuilderResult = { data: unknown; error: unknown };

function makeBuilder(result: Partial<BuilderResult> = {}) {
  const resolved: BuilderResult = { data: result.data ?? null, error: result.error ?? null };
  const builder = {
    insert: jest.fn(),
    update: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn().mockResolvedValue(resolved),
    then: (
      onFulfilled: (value: BuilderResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolved).then(onFulfilled, onRejected),
  };
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

function buildBaseMapRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'map-1',
    couple_name: 'Carol e André',
    slug: '',
    email: 'carol@example.com',
    plan: 'basic',
    relationship_start_date: '2020-06-15',
    token: null,
    status: 'pending_payment',
    youtube_video_id: null,
    youtube_start_time: null,
    youtube_end_time: null,
    payment_id: null,
    pix_qr_code: null,
    pix_code: null,
    payment_expires_at: null,
    expires_at: null,
    created_at: '2026-03-10T00:00:00Z',
    ...overrides,
  };
}

function buildLocations(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Location ${i + 1}`,
    latitude: -23.5 + i * 0.1,
    longitude: -46.6 + i * 0.1,
    order: i + 1,
  }));
}

function buildCreateMapData(plan: Plan, locationCount: number): CreateMapData {
  return {
    coupleName: 'Carol e André',
    email: 'carol@example.com',
    plan,
    relationshipStartDate: '2020-06-15',
    locations: buildLocations(locationCount),
  };
}

describe('createMap', () => {
  it('should succeed with basic plan and 3 locations', async () => {
    const mapRow = buildBaseMapRow();
    const mapsBuilder = makeBuilder({ data: mapRow, error: null });
    const locationsBuilder = makeBuilder({ data: [], error: null });
    const supabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'maps') return mapsBuilder;
        return locationsBuilder;
      }),
    } as unknown as SupabaseClient;

    const result = await createMap(buildCreateMapData('basic', 3), supabase);

    expect(result.id).toBe('map-1');
    expect(result.status).toBe('pending_payment');
    expect(result.plan).toBe('basic');
  });

  it('should throw 422 error with basic plan and 4 locations', async () => {
    const supabase = { from: jest.fn() } as unknown as SupabaseClient;

    await expect(createMap(buildCreateMapData('basic', 4), supabase)).rejects.toMatchObject({
      message: expect.stringContaining('basic'),
      statusCode: 422,
    });
  });

  it('should succeed with premium plan and 7 locations', async () => {
    const mapRow = buildBaseMapRow({ plan: 'premium' });
    const mapsBuilder = makeBuilder({ data: mapRow, error: null });
    const locationsBuilder = makeBuilder({ data: [], error: null });
    const supabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'maps') return mapsBuilder;
        return locationsBuilder;
      }),
    } as unknown as SupabaseClient;

    const result = await createMap(buildCreateMapData('premium', 7), supabase);

    expect(result.id).toBe('map-1');
    expect(result.plan).toBe('premium');
  });

  it('should throw 422 error with premium plan and 8 locations', async () => {
    const supabase = { from: jest.fn() } as unknown as SupabaseClient;

    await expect(createMap(buildCreateMapData('premium', 8), supabase)).rejects.toMatchObject({
      message: expect.stringContaining('premium'),
      statusCode: 422,
    });
  });
});

describe('activateMap', () => {
  it('should generate correct slug, token with 5 chars, expires_at = now+7d for basic', async () => {
    const existingMap = buildBaseMapRow({ plan: 'basic' });
    const capturedUpdate = { args: null as Record<string, unknown> | null };
    const firstBuilder = makeBuilder({ data: existingMap, error: null });
    const secondBuilder = makeBuilder({ data: null, error: null });
    secondBuilder.update.mockImplementation((args: Record<string, unknown>) => {
      capturedUpdate.args = args;
      secondBuilder.single.mockResolvedValue({
        data: { ...existingMap, ...args, status: 'active' },
        error: null,
      });
      return secondBuilder;
    });
    let callCount = 0;
    const supabase = {
      from: jest.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? firstBuilder : secondBuilder;
      }),
    } as unknown as SupabaseClient;

    const beforeActivation = new Date();
    const result = await activateMap('map-1', supabase);
    const afterActivation = new Date();

    expect(capturedUpdate.args?.slug).toBe('carol-e-andre');
    expect(String(capturedUpdate.args?.token)).toHaveLength(5);
    expect(capturedUpdate.args?.status).toBe('active');
    const expectedMin = new Date(beforeActivation.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expectedMax = new Date(afterActivation.getTime() + 7 * 24 * 60 * 60 * 1000);
    const actualExpiresAt = new Date(capturedUpdate.args?.expires_at as string);
    expect(actualExpiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    expect(actualExpiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    expect(result.status).toBe('active');
  });

  it('should set expires_at to null for premium plan', async () => {
    const existingMap = buildBaseMapRow({ plan: 'premium' });
    const capturedUpdate = { args: null as Record<string, unknown> | null };
    const firstBuilder = makeBuilder({ data: existingMap, error: null });
    const secondBuilder = makeBuilder({ data: null, error: null });
    secondBuilder.update.mockImplementation((args: Record<string, unknown>) => {
      capturedUpdate.args = args;
      secondBuilder.single.mockResolvedValue({
        data: { ...existingMap, ...args, status: 'active' },
        error: null,
      });
      return secondBuilder;
    });
    let callCount = 0;
    const supabase = {
      from: jest.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? firstBuilder : secondBuilder;
      }),
    } as unknown as SupabaseClient;

    await activateMap('map-1', supabase);

    expect(capturedUpdate.args?.expires_at).toBeNull();
  });
});

describe('getMapByToken', () => {
  it('should return map for valid token and active map', async () => {
    const mapRow = buildBaseMapRow({
      status: 'active',
      token: 'abc12',
      slug: 'carol-e-andre',
      expires_at: null,
    });
    const supabase = {
      from: jest.fn().mockImplementation(() => makeBuilder({ data: mapRow, error: null })),
    } as unknown as SupabaseClient;

    const result = await getMapByToken('abc12', supabase);

    expect(result).not.toBeNull();
    expect(result?.status).toBe('active');
    expect(result?.token).toBe('abc12');
  });

  it('should update status to expired and return expired map when map has expired', async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    const mapRow = buildBaseMapRow({
      status: 'active',
      token: 'abc12',
      slug: 'carol-e-andre',
      expires_at: pastDate,
    });
    const capturedExpireUpdate = { args: null as Record<string, unknown> | null };
    const selectBuilder = makeBuilder({ data: mapRow, error: null });
    const expireBuilder = makeBuilder({ data: null, error: null });
    expireBuilder.update.mockImplementation((args: Record<string, unknown>) => {
      capturedExpireUpdate.args = args;
      return expireBuilder;
    });
    let callCount = 0;
    const supabase = {
      from: jest.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? selectBuilder : expireBuilder;
      }),
    } as unknown as SupabaseClient;

    const result = await getMapByToken('abc12', supabase);

    expect(capturedExpireUpdate.args?.status).toBe('expired');
    expect(result?.status).toBe('expired');
  });

  it('should return null for nonexistent token', async () => {
    const supabase = {
      from: jest.fn().mockImplementation(() =>
        makeBuilder({ data: null, error: { message: 'No rows found' } }),
      ),
    } as unknown as SupabaseClient;

    const result = await getMapByToken('nonexistent', supabase);

    expect(result).toBeNull();
  });
});

describe('setPaymentFailed', () => {
  it('should update status to payment_failed', async () => {
    const capturedUpdate = { args: null as Record<string, unknown> | null };
    const builder = makeBuilder({ data: null, error: null });
    builder.update.mockImplementation((args: Record<string, unknown>) => {
      capturedUpdate.args = args;
      return builder;
    });
    const supabase = {
      from: jest.fn().mockImplementation(() => builder),
    } as unknown as SupabaseClient;

    await setPaymentFailed('map-1', supabase);

    expect(capturedUpdate.args?.status).toBe('payment_failed');
  });
});

describe('getMapByPaymentId', () => {
  it('should return map when paymentId exists', async () => {
    const mapRow = buildBaseMapRow({ payment_id: 'pay-123', status: 'pending_payment' });
    const supabase = {
      from: jest.fn().mockImplementation(() => makeBuilder({ data: mapRow, error: null })),
    } as unknown as SupabaseClient;

    const result = await getMapByPaymentId('pay-123', supabase);

    expect(result).not.toBeNull();
    expect(result?.paymentId).toBe('pay-123');
    expect(result?.status).toBe('pending_payment');
  });

  it('should return null when paymentId does not exist', async () => {
    const supabase = {
      from: jest.fn().mockImplementation(() =>
        makeBuilder({ data: null, error: { message: 'No rows found' } }),
      ),
    } as unknown as SupabaseClient;

    const result = await getMapByPaymentId('nonexistent', supabase);

    expect(result).toBeNull();
  });
});

describe('getPaymentStatus', () => {
  it('should return payment status for valid mapId', async () => {
    const paymentStatusRow = {
      status: 'pending_payment',
      pix_qr_code: 'qr-code-data',
      pix_code: 'pix-code-data',
      payment_expires_at: '2026-03-11T00:00:00Z',
    };
    const supabase = {
      from: jest.fn().mockImplementation(() => makeBuilder({ data: paymentStatusRow, error: null })),
    } as unknown as SupabaseClient;

    const result = await getPaymentStatus('map-1', supabase);

    expect(result.status).toBe('pending_payment');
    expect(result.pixQrCode).toBe('qr-code-data');
    expect(result.pixCode).toBe('pix-code-data');
    expect(result.paymentExpiresAt).toBe('2026-03-11T00:00:00Z');
  });

  it('should throw when supabase returns an error', async () => {
    const supabase = {
      from: jest.fn().mockImplementation(() =>
        makeBuilder({ data: null, error: { message: 'Map not found' } }),
      ),
    } as unknown as SupabaseClient;

    await expect(getPaymentStatus('nonexistent', supabase)).rejects.toThrow('Map not found');
  });
});

describe('updatePaymentData', () => {
  it('should update payment fields with correct values', async () => {
    const capturedUpdate = { args: null as Record<string, unknown> | null };
    const builder = makeBuilder({ data: null, error: null });
    builder.update.mockImplementation((args: Record<string, unknown>) => {
      capturedUpdate.args = args;
      return builder;
    });
    const supabase = {
      from: jest.fn().mockImplementation(() => builder),
    } as unknown as SupabaseClient;
    const expiresAt = new Date('2026-03-11T00:00:00Z');
    const paymentData: PaymentData = {
      paymentId: 'pay-456',
      pixQrCode: 'qr-code-data',
      pixCode: 'pix-code-data',
      paymentExpiresAt: expiresAt,
    };

    await updatePaymentData('map-1', paymentData, supabase);

    expect(capturedUpdate.args?.payment_id).toBe('pay-456');
    expect(capturedUpdate.args?.pix_qr_code).toBe('qr-code-data');
    expect(capturedUpdate.args?.pix_code).toBe('pix-code-data');
    expect(capturedUpdate.args?.payment_expires_at).toBe(expiresAt.toISOString());
  });

  it('should throw when supabase returns an error', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Update failed' } });
    builder.update.mockReturnValue(builder);
    const supabase = {
      from: jest.fn().mockImplementation(() => builder),
    } as unknown as SupabaseClient;
    const paymentData: PaymentData = {
      paymentId: 'pay-456',
      pixQrCode: 'qr-code-data',
      pixCode: 'pix-code-data',
      paymentExpiresAt: new Date(),
    };

    await expect(updatePaymentData('map-1', paymentData, supabase)).rejects.toThrow('Update failed');
  });
});
