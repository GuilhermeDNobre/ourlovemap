import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

jest.mock('mongoose', () => {
  const ObjectId = jest.fn().mockImplementation(() => ({ toString: () => 'mock-id' }));
  const SchemaConstructor = jest.fn().mockImplementation(() => ({ index: jest.fn() }));
  const SchemaWithTypes = Object.assign(SchemaConstructor, { Types: { ObjectId } });
  const model = jest.fn().mockReturnValue({});
  return {
    Schema: SchemaWithTypes,
    model,
    connect: jest.fn().mockImplementation(() => Promise.resolve()),
    disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
    Types: { ObjectId },
  };
});

import { buildApp } from '../helpers/build-app';

describe('buildApp initialization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should initialize without throwing exceptions', async () => {
    const app = buildApp();

    await expect(app.ready()).resolves.toBeDefined();
  });

  it('should expose fastify.mongoose decorator after initialization', async () => {
    const app = buildApp();
    await app.ready();

    expect(app.mongoose).toBeDefined();
  });
});
