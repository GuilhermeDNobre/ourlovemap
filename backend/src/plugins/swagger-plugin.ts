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
    $id: 'https://ourlovemap.com/schemas/PixPaymentResult',
    type: 'object',
    title: 'PixPaymentResult',
    properties: {
      pixQrCode: { type: 'string', description: 'Base64-encoded PIX QR code image' },
      pixCode: { type: 'string', description: 'PIX copy-and-paste code' },
      paymentExpiresAt: { type: 'string', format: 'date-time', description: 'PIX expiration timestamp (now + 15 min)' },
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
        { name: 'payments', description: 'Payment webhook from Mercado Pago' },
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
