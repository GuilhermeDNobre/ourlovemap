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
      mapId: { type: 'string', description: 'MongoDB ObjectId of the created map (24-character hex string)' },
      checkoutUrl: { type: 'string', description: 'InfinitePay checkout URL — redirect the user here to complete payment via PIX or credit card' },
    },
  });

  fastify.addSchema({
    $id: 'https://ourlovemap.com/schemas/InfinitePayWebhookEvent',
    type: 'object',
    title: 'InfinitePayWebhookEvent',
    properties: {
      invoice_slug: { type: 'string', description: 'InfinitePay invoice identifier' },
      amount: { type: 'number', description: 'Total amount in centavos' },
      paid_amount: { type: 'number', description: 'Amount effectively paid in centavos' },
      installments: { type: 'integer', description: 'Number of installments' },
      capture_method: { type: 'string', enum: ['credit_card', 'pix'], description: 'Payment method used' },
      transaction_nsu: { type: 'string', description: 'Unique transaction identifier' },
      order_nsu: { type: 'string', description: 'Our map ID — correlates the webhook to the map in our database' },
      receipt_url: { type: 'string', description: 'URL of the payment receipt' },
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
        { name: 'payments', description: 'Payment webhook from InfinitePay' },
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
