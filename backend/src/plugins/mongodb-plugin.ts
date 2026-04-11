import fp from 'fastify-plugin';
import mongoose, { type Mongoose } from 'mongoose';
import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    mongoose: Mongoose;
  }
}

const mongodbPlugin: FastifyPluginAsync = async (fastify) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  await mongoose.connect(uri);
  fastify.decorate('mongoose', mongoose);
  fastify.addHook('onClose', async () => {
    await mongoose.disconnect();
  });
};

export default fp(mongodbPlugin, { name: 'mongodb-plugin' });
