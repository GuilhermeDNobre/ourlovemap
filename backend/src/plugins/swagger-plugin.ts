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
      address: { type: 'string', nullable: true, description: 'Formatted address from Maptiler autocomplete' },
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
    description: 'Webhook event from AbacatePay v2. Covers checkout.completed (card) and transparent.completed (PIX) events.',
    properties: {
      id: { type: 'string', description: 'Webhook log ID' },
      event: { type: 'string', description: 'Event type: checkout.completed or transparent.completed' },
      apiVersion: { type: 'number', description: 'AbacatePay API version' },
      devMode: { type: 'boolean', description: 'Whether the transaction was in dev mode' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'AbacatePay payment ID — correlates the webhook to the map via paymentId field' },
          externalId: { type: 'string', description: 'Map ID set at payment creation' },
          amount: { type: 'number', description: 'Total amount in centavos' },
          status: { type: 'string', description: 'Payment status (PAID, PENDING, EXPIRED)' },
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

  fastify.register(async (scoped) => {
    scoped.addHook('onRequest', async (_request, reply) => {
      const docsPass = process.env.DOCS_PASS;
      if (!docsPass) {
        return reply.code(404).send();
      }
      const auth = _request.headers.authorization;
      if (!auth?.startsWith('Basic ')) {
        reply.header('WWW-Authenticate', 'Basic realm="OLM Docs"');
        return reply.code(401).send('Unauthorized');
      }
      const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
      const colonIdx = decoded.indexOf(':');
      const pass = decoded.slice(colonIdx + 1);
      if (pass !== docsPass) {
        reply.header('WWW-Authenticate', 'Basic realm="OLM Docs"');
        return reply.code(401).send('Unauthorized');
      }
    });

    await scoped.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
  });
};

export default fp(swaggerPlugin, { name: 'swagger-plugin' });
