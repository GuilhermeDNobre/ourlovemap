import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import Fastify from 'fastify';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ mockClient: true })),
}));

import { createClient } from '@supabase/supabase-js';
import supabasePlugin from '../../src/plugins/supabase-plugin';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('supabase-plugin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockCreateClient.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should decorate fastify instance with supabase client', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

    const fastify = Fastify({ logger: false });
    await fastify.register(supabasePlugin);
    await fastify.ready();

    expect(fastify.supabase).toBeDefined();
    expect(fastify.supabase).toEqual({ mockClient: true });
  });

  it('should call createClient with env variables', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

    const fastify = Fastify({ logger: false });
    await fastify.register(supabasePlugin);
    await fastify.ready();

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-key',
    );
  });

  it('should throw when SUPABASE_URL is missing', async () => {
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

    const fastify = Fastify({ logger: false });
    fastify.register(supabasePlugin);

    await expect(fastify.ready()).rejects.toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required',
    );
  });

  it('should throw when SUPABASE_SERVICE_KEY is missing', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_KEY;

    const fastify = Fastify({ logger: false });
    fastify.register(supabasePlugin);

    await expect(fastify.ready()).rejects.toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required',
    );
  });

  it('should throw when both SUPABASE_URL and SUPABASE_SERVICE_KEY are missing', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;

    const fastify = Fastify({ logger: false });
    fastify.register(supabasePlugin);

    await expect(fastify.ready()).rejects.toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required',
    );
  });
});
