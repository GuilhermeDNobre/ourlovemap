import type { FastifyInstance } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', {
    schema: {
      tags: ['health'],
      summary: 'Health check',
      description: 'Returns the current health status of the API.',
      response: {
        200: {
          description: 'API is healthy',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok'] },
          },
        },
      },
    },
  }, async () => {
    return { status: 'ok' };
  });
}
