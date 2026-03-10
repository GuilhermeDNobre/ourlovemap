import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';
import type { FastifyPluginAsync } from 'fastify';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const multipartPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(multipart, {
    limits: { fileSize: MAX_FILE_SIZE },
    throwFileSizeLimit: true,
  });
};

export default fp(multipartPlugin, { name: 'multipart-plugin' });
