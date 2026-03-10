import { buildApp } from '../helpers/build-app';

describe('GET /health', () => {
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
