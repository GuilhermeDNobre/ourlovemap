import Fastify from 'fastify';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import supabasePlugin from './plugins/supabase-plugin.js';
import multipartPlugin from './plugins/multipart-plugin.js';
import healthRoutes from './routes/health-routes.js';
import mapRoutes from './routes/map-routes.js';

export function buildApp(options: FastifyServerOptions = { logger: true }): FastifyInstance {
  const fastify = Fastify(options);

  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as Error & { statusCode?: number }).statusCode ?? 500;
    const message = error instanceof Error ? error.message : String(error);
    if (statusCode >= 500) {
      fastify.log.error({ error: message }, 'Unhandled error');
    }
    reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Internal server error' : message,
      message: statusCode >= 500 ? 'An unexpected error occurred' : message,
    });
  });

  fastify.register(supabasePlugin);
  fastify.register(multipartPlugin);
  fastify.register(healthRoutes);
  fastify.register(mapRoutes, { prefix: '/api' });

  return fastify;
}
