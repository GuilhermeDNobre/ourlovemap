import crypto from 'crypto';
import type { FastifyInstance } from 'fastify';
import { processWebhookEvent, type InfinitePayWebhookEvent } from '../services/payment-service.js';

function isValidWebhookSecret(received: string): boolean {
  const expected = process.env.INFINITEPAY_WEBHOOK_SECRET ?? '';
  if (!expected) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default async function paymentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/payments/webhook', {
    schema: {
      tags: ['payments'],
      summary: 'InfinitePay payment webhook',
      description: 'Receives payment approval events from InfinitePay. Validates the secret token in the query string before processing. On approval, activates the map and sends the QR Code email to the couple.',
      querystring: {
        type: 'object',
        properties: {
          secret: { type: 'string', description: 'Shared webhook secret configured in INFINITEPAY_WEBHOOK_SECRET' },
        },
      },
      response: {
        200: {
          description: 'Event received and processed',
          type: 'object',
          properties: {
            received: { type: 'boolean', example: true },
          },
        },
        401: {
          description: 'Invalid or missing webhook secret',
          $ref: 'https://ourlovemap.com/schemas/Error#',
        },
      },
    },
  }, async (request, reply) => {
    const { secret } = request.query as { secret?: string };
    if (!secret || !isValidWebhookSecret(secret)) {
      return reply.code(401).send({ error: 'Invalid webhook secret' });
    }
    const event = request.body as InfinitePayWebhookEvent;
    const result = await processWebhookEvent(event, fastify.supabase, request.log);
    if (result.wasActivated && result.mapId) {
      try {
        fastify.posthog?.capture({ distinctId: result.mapId, event: 'payment_approved', properties: { plan: result.plan } });
      } catch (error) {
        request.log.warn({ error: error instanceof Error ? error.message : error }, 'PostHog capture failed');
      }
    }
    request.log.info({ orderNsu: event.order_nsu }, 'Webhook event processed');
    return reply.send({ received: true });
  });
}
