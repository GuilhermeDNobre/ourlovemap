const mockShutdown = jest.fn();
const mockCapture = jest.fn();
const mockPostHogConstructor = jest.fn().mockImplementation(() => ({
  capture: mockCapture,
  shutdown: mockShutdown,
}));

jest.mock('posthog-node', () => ({
  PostHog: mockPostHogConstructor,
}));

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Fastify from 'fastify';
import posthogPlugin from '../../src/plugins/posthog-plugin';

describe('posthog-plugin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should decorate fastify with posthog client when POSTHOG_API_KEY is set', async () => {
    process.env.POSTHOG_API_KEY = 'phc_test-key';

    const fastify = Fastify({ logger: false });
    await fastify.register(posthogPlugin);
    await fastify.ready();

    expect(fastify.posthog).toBeDefined();
    expect(fastify.posthog).not.toBeNull();
    expect(mockPostHogConstructor).toHaveBeenCalledWith('phc_test-key');
  });

  it('should set posthog to null when POSTHOG_API_KEY is not set', async () => {
    delete process.env.POSTHOG_API_KEY;

    const fastify = Fastify({ logger: false });
    await fastify.register(posthogPlugin);
    await fastify.ready();

    expect(fastify.posthog).toBeNull();
    expect(mockPostHogConstructor).not.toHaveBeenCalled();
  });

  it('should call shutdown on close when client is initialized', async () => {
    process.env.POSTHOG_API_KEY = 'phc_test-key';

    const fastify = Fastify({ logger: false });
    await fastify.register(posthogPlugin);
    await fastify.ready();
    await fastify.close();

    expect(mockShutdown).toHaveBeenCalled();
  });

  it('should not register onClose hook when POSTHOG_API_KEY is not set', async () => {
    delete process.env.POSTHOG_API_KEY;

    const fastify = Fastify({ logger: false });
    await fastify.register(posthogPlugin);
    await fastify.ready();
    await fastify.close();

    expect(mockShutdown).not.toHaveBeenCalled();
  });
});
