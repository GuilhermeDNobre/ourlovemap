import type { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { getMapById } from '../services/map-service.js';
import { createPixPayment, createCardPayment } from '../services/payment-service.js';

const CARD_PAYMENT_BODY = Type.Object({
  taxId: Type.String({ description: 'CPF do comprador (ex: 123.456.789-09)' }),
});

function isPayableStatus(status: string): boolean {
  return status === 'pending_payment' || status === 'payment_failed';
}

export default async function mapPaymentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/maps/:id/pix-payment', {
    schema: {
      tags: ['maps'],
      summary: 'Create PIX payment',
      description: 'Generates a PIX QR Code for the map. Expires in 10 minutes. Can be called again to generate a new QR Code.',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'Map ID' } },
      },
      response: {
        200: {
          description: 'PIX QR Code generated',
          type: 'object',
          properties: {
            brCode: { type: 'string', description: 'PIX copia e cola code' },
            brCodeBase64: { type: 'string', description: 'QR Code image in base64 (data:image/png;base64,...)' },
            expiresAt: { type: 'string', description: 'ISO 8601 expiration datetime' },
          },
        },
        404: { description: 'Map not found', $ref: 'https://ourlovemap.com/schemas/Error#' },
        422: { description: 'Map is not in a payable status', $ref: 'https://ourlovemap.com/schemas/Error#' },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const map = await getMapById(id);
    if (!map) return reply.code(404).send({ error: 'Map not found' });
    if (!isPayableStatus(map.status)) {
      return reply.code(422).send({ error: 'Map is not in a payable status' });
    }
    try {
      const result = await createPixPayment({ mapId: map.id, plan: map.plan });
      return reply.send(result);
    } catch (error) {
      request.log.error({ mapId: map.id, error: error instanceof Error ? error.message : error }, 'PIX payment creation failed');
      throw error;
    }
  });

  fastify.post('/maps/:id/card-payment', {
    schema: {
      tags: ['maps'],
      summary: 'Create card payment',
      description: 'Creates an AbacatePay billing link for credit card payment. Requires the buyer CPF to create the customer record.',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'Map ID' } },
      },
      body: CARD_PAYMENT_BODY,
      response: {
        200: {
          description: 'Card payment link generated',
          type: 'object',
          properties: {
            checkoutUrl: { type: 'string', description: 'AbacatePay checkout URL for card payment' },
          },
        },
        404: { description: 'Map not found', $ref: 'https://ourlovemap.com/schemas/Error#' },
        422: { description: 'Map is not in a payable status or payment creation failed', $ref: 'https://ourlovemap.com/schemas/Error#' },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { taxId } = request.body as { taxId: string };
    const map = await getMapById(id);
    if (!map) return reply.code(404).send({ error: 'Map not found' });
    if (!isPayableStatus(map.status)) {
      return reply.code(422).send({ error: 'Map is not in a payable status' });
    }
    try {
      const result = await createCardPayment({
        mapId: map.id,
        plan: map.plan,
        email: map.email,
        buyerName: map.buyerName,
        buyerPhone: map.buyerPhone,
        taxId,
      });
      return reply.send(result);
    } catch (error) {
      request.log.error({ mapId: map.id, error: error instanceof Error ? error.message : error }, 'Card payment creation failed');
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
        properties: { id: { type: 'string', description: 'Map ID' } },
      },
      response: {
        200: {
          description: 'Payment status data',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending_payment', 'active', 'expired', 'payment_failed'] },
            checkoutUrl: { type: 'string', nullable: true, description: 'AbacatePay card checkout URL (null for PIX payments)' },
          },
        },
        404: { description: 'Map not found', $ref: 'https://ourlovemap.com/schemas/Error#' },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const map = await getMapById(id);
    if (!map) return reply.code(404).send({ error: 'Map not found' });
    return reply.send({ status: map.status, checkoutUrl: map.checkoutUrl });
  });
}
