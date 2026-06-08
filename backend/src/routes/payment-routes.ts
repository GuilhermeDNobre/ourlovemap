import crypto from 'crypto';
import type { FastifyInstance } from 'fastify';
import { processWebhookEvent, type AbacatePayWebhookEvent } from '../services/payment-service.js';

function isValidWebhookSecret(received: string): boolean {
  const expected = process.env.ABACATEPAY_WEBHOOK_SECRET ?? '';
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
      summary: 'AbacatePay payment webhook',
      description: 'Receives payment approval events from AbacatePay. Validates the secret token in the query string before processing. On approval, activates the map and sends the QR Code email to the couple.',
      querystring: {
        type: 'object',
        properties: {
          webhookSecret: { type: 'string', description: 'Shared webhook secret appended automatically by AbacatePay' },
        },
      },
      body: { $ref: 'https://ourlovemap.com/schemas/AbacatePayWebhookEvent#' },
      response: {
        200: {
          description: 'Event received and processed',
          type: 'object',
          properties: {
            received: { type: 'boolean' },
          },
        },
        401: {
          description: 'Invalid or missing webhook secret',
          $ref: 'https://ourlovemap.com/schemas/Error#',
        },
      },
    },
  }, async (request, reply) => {
    const { webhookSecret } = request.query as { webhookSecret?: string };
    if (!webhookSecret || !isValidWebhookSecret(webhookSecret)) {
      return reply.code(401).send({ error: 'Invalid webhook secret' });
    }
    const event = request.body as AbacatePayWebhookEvent;
    const result = await processWebhookEvent(event, request.log);
    if (result.wasActivated && result.mapId) {
      try {
        fastify.posthog?.capture({ distinctId: result.mapId, event: 'payment_approved', properties: { plan: result.plan } });
      } catch (error) {
        request.log.warn({ error: error instanceof Error ? error.message : error }, 'PostHog capture failed');
      }
    }
    request.log.info({ paymentId: event.data?.id, event: event.event }, 'Webhook event processed');
    return reply.send({ received: true });
  });
}
