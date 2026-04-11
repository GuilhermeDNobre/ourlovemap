import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

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

describe('GET /health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 200 with status ok', async () => {
    // Arrange
    const app = buildApp();

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
