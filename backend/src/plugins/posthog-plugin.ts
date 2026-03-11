import { PostHog } from 'posthog-node';
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    posthog: PostHog | null;
  }
}

const posthogPlugin: FastifyPluginAsync = async (fastify) => {
  const apiKey = process.env.POSTHOG_API_KEY;
  const client = apiKey ? new PostHog(apiKey) : null;
  fastify.decorate('posthog', client);
  if (client) {
    fastify.addHook('onClose', async () => {
      await client.shutdown();
    });
  }
};

export default fp(posthogPlugin, { name: 'posthog-plugin' });
