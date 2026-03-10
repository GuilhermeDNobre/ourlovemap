import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

import { buildApp } from '../helpers/build-app';

describe('buildApp with supabase plugin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should initialize without throwing exceptions', async () => {
    const app = buildApp();

    await expect(app.ready()).resolves.toBeDefined();
  });

  it('should expose fastify.supabase decorator after initialization', async () => {
    const app = buildApp();
    await app.ready();

    expect(app.supabase).toBeDefined();
  });
});
