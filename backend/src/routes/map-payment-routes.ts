import type { FastifyInstance } from 'fastify';
import { getMapById } from '../services/map-service.js';
import { createCheckoutPayment } from '../services/payment-service.js';

export default async function mapPaymentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/maps/:id/retry-payment', {
    schema: {
      tags: ['maps'],
      summary: 'Retry checkout payment',
      description: 'Generates a new InfinitePay checkout link for a map in `payment_failed` or `pending_payment` status.',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'Map ID (UUID)' } },
      },
      response: {
        200: {
          description: 'New checkout link generated',
          type: 'object',
          properties: {
            checkoutUrl: { type: 'string', description: 'InfinitePay checkout URL' },
          },
        },
        404: { description: 'Map not found', $ref: 'https://ourlovemap.com/schemas/Error#' },
        422: { description: 'Map cannot retry payment or checkout creation failed', $ref: 'https://ourlovemap.com/schemas/Error#' },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const map = await getMapById(id, fastify.supabase);
    if (!map) return reply.code(404).send({ error: 'Map not found' });
    if (map.status === 'active' || map.status === 'expired') {
      return reply.code(422).send({ error: 'Map cannot retry payment' });
    }
    try {
      const result = await createCheckoutPayment(
        { mapId: map.id, plan: map.plan, email: map.email },
        fastify.supabase,
      );
      return reply.send({ checkoutUrl: result.checkoutUrl });
    } catch (error) {
      request.log.error({ mapId: map.id, error: error instanceof Error ? error.message : error }, 'Checkout retry failed');
      const err = new Error('Payment creation failed') as Error & { statusCode: number };
      err.statusCode = 422;
      throw err;
    }
  });

  fastify.get('/maps/:id/payment-status', {
    schema: {
      tags: ['maps'],
      summary: 'Get payment status',
      description: 'Returns the current payment status of a map. Used by the frontend to poll while the user completes the payment.',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'Map ID (UUID)' } },
      },
      response: {
        200: {
          description: 'Payment status data',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending_payment', 'active', 'expired', 'payment_failed'] },
            checkoutUrl: { type: 'string', nullable: true, description: 'InfinitePay checkout URL' },
          },
        },
        404: { description: 'Map not found', $ref: 'https://ourlovemap.com/schemas/Error#' },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const map = await getMapById(id, fastify.supabase);
    if (!map) return reply.code(404).send({ error: 'Map not found' });
    return reply.send({ status: map.status, checkoutUrl: map.checkoutUrl });
  });
}
