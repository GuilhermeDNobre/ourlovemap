import 'dotenv/config';
import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function start(): Promise<void> {
  const fastify = buildApp();
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    fastify.log.error({ error: message }, 'Server failed to start');
    process.exit(1);
  }
}

start();
