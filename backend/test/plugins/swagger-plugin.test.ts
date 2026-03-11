jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { buildApp } from '../helpers/build-app';

describe('swagger-plugin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should expose /docs/json with a valid OpenAPI 3.0 spec', async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(response.statusCode).toBe(200);
    const spec = response.json();
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('Our Love Map API');
  });

  it('should document all 6 expected routes', async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    const spec = response.json();
    const paths = Object.keys(spec.paths);

    expect(paths).toContain('/health');
    expect(paths).toContain('/api/maps');
    expect(paths).toContain('/api/maps/by-token');
    expect(paths).toContain('/api/maps/{id}/payment-status');
    expect(paths).toContain('/api/maps/{id}/retry-payment');
    expect(paths).toContain('/api/payments/webhook');
  });

  it('should expose shared schemas for Error, Location and PixPaymentResult', async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    const spec = response.json();
    const schemaTitles = Object.values(spec.components?.schemas ?? {}).map((s: unknown) => (s as { title?: string }).title);

    expect(schemaTitles).toContain('Error');
    expect(schemaTitles).toContain('Location');
    expect(schemaTitles).toContain('PixPaymentResult');
  });

  it('should tag routes with maps, payments and health tags', async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/docs/json' });
    const spec = response.json();
    const tagNames = spec.tags.map((t: { name: string }) => t.name);

    expect(tagNames).toContain('maps');
    expect(tagNames).toContain('payments');
    expect(tagNames).toContain('health');
  });

  it('should expose Swagger UI at /docs', async () => {
    const app = buildApp();
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/docs' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
});
