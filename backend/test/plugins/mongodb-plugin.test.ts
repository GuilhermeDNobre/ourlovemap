import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import Fastify from 'fastify';

jest.mock('mongoose', () => ({
  connect: jest.fn().mockImplementation(() => Promise.resolve()),
  disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
}));

import mongoose from 'mongoose';
import mongodbPlugin from '../../src/plugins/mongodb-plugin';

const mockConnect = mongoose.connect as jest.MockedFunction<typeof mongoose.connect>;
const mockDisconnect = mongoose.disconnect as jest.MockedFunction<typeof mongoose.disconnect>;

describe('mongodb-plugin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockConnect.mockClear();
    mockDisconnect.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should decorate fastify instance with mongoose', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    const fastify = Fastify({ logger: false });
    await fastify.register(mongodbPlugin);
    await fastify.ready();

    expect(fastify.mongoose).toBeDefined();
  });

  it('should call mongoose.connect with MONGODB_URI', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    const fastify = Fastify({ logger: false });
    await fastify.register(mongodbPlugin);
    await fastify.ready();

    expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
  });

  it('should call mongoose.disconnect when server closes', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    const fastify = Fastify({ logger: false });
    await fastify.register(mongodbPlugin);
    await fastify.ready();
    await fastify.close();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('should throw when MONGODB_URI is missing', async () => {
    delete process.env.MONGODB_URI;

    const fastify = Fastify({ logger: false });
    fastify.register(mongodbPlugin);

    await expect(fastify.ready()).rejects.toThrow(
      'MONGODB_URI environment variable is required',
    );
  });
});
