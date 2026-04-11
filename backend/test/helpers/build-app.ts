import { buildApp as createApp } from '../../src/app';
import type { FastifyInstance } from 'fastify';

export function buildApp(): FastifyInstance {
  return createApp({ logger: false });
}
