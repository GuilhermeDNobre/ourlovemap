import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyPluginAsync } from 'fastify';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addSchema({
    $id: 'https://ourlovemap.com/schemas/Error',
    type: 'object',
    title: 'Error',
    properties: {
      error: { type: 'string', description: 'Error code or message' },
      message: { type: 'string', description: 'Human-readable description' },
    },
  });

  fastify.addSchema({
    $id: 'https://ourlovemap.com/schemas/Location',
    type: 'object',
    title: 'Location',
    properties: {
      title: { type: 'string', description: 'Location name' },
      description: { type: 'string', nullable: true, description: 'Short description of the location' },
      message: { type: 'string', nullable: true, description: 'Affectionate message for this location' },
      photoUrl: { type: 'string', nullable: true, description: 'Public URL of the uploaded photo' },
      latitude: { type: 'number', description: 'Latitude coordinate' },
      longitude: { type: 'number', description: 'Longitude coordinate' },
      order: { type: 'integer', description: 'Display order (1-based)' },
    },
  });

  fastify.addSchema({
    $id: 'https://ourlovemap.com/schemas/CheckoutResult',
    type: 'object',
    title: 'CheckoutResult',
    properties: {
      mapId: { type: 'string', description: 'MongoDB ObjectId of the created map (24-character hex string). Use this to call /api/maps/:id/pix-payment or /api/maps/:id/card-payment.' },
    },
  });

  fastify.addSchema({
    $id: 'https://ourlovemap.com/schemas/AbacatePayWebhookEvent',
    type: 'object',
    title: 'AbacatePayWebhookEvent',
    description: 'Webhook event from AbacatePay. Covers billing.paid (card) and pix.paid events.',
    properties: {
      event: { type: 'string', description: 'Event type: billing.paid or pix.paid' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'AbacatePay payment ID (bill_xxx or pix_char_xxx) — correlates the webhook to the map via paymentId field' },
          amount: { type: 'number', description: 'Total amount in centavos' },
          status: { type: 'string', description: 'Payment status (PAID, PENDING, EXPIRED)' },
          devMode: { type: 'boolean', description: 'Whether the transaction was in dev mode' },
        },
      },
    },
  });

  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Our Love Map API',
        description: 'Backend API for Our Love Map — a SaaS that allows couples to create interactive map pages with their relationship locations, accessed via QR Code after payment.',
        version: '1.0.0',
      },
      tags: [
        { name: 'maps', description: 'Map creation, public access and payment status' },
        { name: 'payments', description: 'Payment webhook from AbacatePay' },
        { name: 'health', description: 'Health check' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
};

export default fp(swaggerPlugin, { name: 'swagger-plugin' });
