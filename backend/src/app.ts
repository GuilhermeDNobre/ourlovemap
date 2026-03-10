import Fastify from 'fastify';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import supabasePlugin from './plugins/supabase-plugin.js';
import healthRoutes from './routes/health-routes.js';

export function buildApp(options: FastifyServerOptions = { logger: true }): FastifyInstance {
  const fastify = Fastify(options);

  fastify.setErrorHandler((error, _request, reply) => {
    const message = error instanceof Error ? error.message : String(error);
    fastify.log.error({ error: message }, 'Unhandled error');
    reply.code(500).send({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
    });
  });

  fastify.register(supabasePlugin);
  fastify.register(healthRoutes);

  return fastify;
}
