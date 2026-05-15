import Fastify from 'fastify';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import mongodbPlugin from './plugins/mongodb-plugin.js';
import multipartPlugin from './plugins/multipart-plugin.js';
import posthogPlugin from './plugins/posthog-plugin.js';
import swaggerPlugin from './plugins/swagger-plugin.js';
import healthRoutes from './routes/health-routes.js';
import mapRoutes from './routes/map-routes.js';
import mapPaymentRoutes from './routes/map-payment-routes.js';
import paymentRoutes from './routes/payment-routes.js';

export function buildApp(options: FastifyServerOptions = { logger: true }): FastifyInstance {
  const fastify = Fastify({
    ...options,
    pluginTimeout: 30000,
    ajv: {
      customOptions: {
        strictSchema: false,
      },
    },
  });

  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as Error & { statusCode?: number }).statusCode ?? 500;
    const message = error instanceof Error ? error.message : String(error);
    if (statusCode >= 500) {
      fastify.log.error({ err: error }, 'Unhandled error');
    }
    reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Internal server error' : message,
      message: statusCode >= 500 ? 'An unexpected error occurred' : message,
    });
  });

  fastify.register(cors, { origin: ['https://ourlovemap.com.br', 'http://localhost:5173'] });
  fastify.register(swaggerPlugin);
  fastify.register(mongodbPlugin);
  fastify.register(multipartPlugin);
  fastify.register(posthogPlugin);
  fastify.register(healthRoutes);
  fastify.register(mapRoutes, { prefix: '/api' });
  fastify.register(mapPaymentRoutes, { prefix: '/api' });
  fastify.register(paymentRoutes, { prefix: '/api' });

  return fastify;
}
