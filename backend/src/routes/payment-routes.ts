import type { FastifyInstance } from 'fastify';
import { verifyWebhookSignature } from '../utils/hmac.js';
import { processWebhookEvent, type MercadoPagoEvent } from '../services/payment-service.js';

interface WebhookBody {
  action?: string;
  data?: { id?: string };
}

export default async function paymentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/payments/webhook', async (request, reply) => {
    const body = request.body as WebhookBody;
    const signature = request.headers['x-signature'] as string | undefined;
    const requestId = request.headers['x-request-id'] as string | undefined;
    const dataId = body?.data?.id;
    const isValid = verifyWebhookSignature({ signature, requestId, dataId });
    if (!isValid) return reply.code(401).send({ error: 'Invalid webhook signature' });
    if (body?.action !== 'payment.updated' || !dataId) {
      request.log.warn({ action: body?.action }, 'Webhook event skipped: unknown action');
      return reply.send({ received: true });
    }
    const event: MercadoPagoEvent = { data: { id: dataId } };
    await processWebhookEvent(event, fastify.supabase, request.log);
    request.log.info({ paymentId: dataId }, 'Webhook event processed');
    return reply.send({ received: true });
  });
}
