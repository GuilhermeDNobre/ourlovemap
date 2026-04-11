# REST/HTTP

## Framework

Utilize Fastify para mapear os endpoints. Organize as rotas em plugins com `fastify.register()`.

**Exemplo:**
```typescript
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// Plugin de rotas
async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/users', async (request, reply) => {
    // implementação
  });
}

fastify.register(userRoutes, { prefix: '/api' });

await fastify.listen({ port: 3000, host: '0.0.0.0' });
```

## Padrão REST

Utilize o padrão REST para consultas, mantendo o nome dos recursos em inglês e no plural, permitindo a navegabilidade em recursos alinhados.

**Exemplo:**
```typescript
// ✅ Prefira
GET /users
GET /users/:userId
GET /playlists/:playlistId/videos
GET /customers/:customerId/invoices

// ❌ Evite
GET /getUsers
GET /user/:userId (singular)
GET /usuario/:usuarioId (português)
```

## Nomenclatura de Recursos

Recursos e verbos compostos devem usar kebab-case.

**Exemplo:**
```typescript
// ✅ Prefira
GET /scheduled-events
POST /users/:userId/change-password
GET /payment-methods
POST /orders/:orderId/process-payment

// ❌ Evite
GET /scheduledEvents (camelCase)
GET /scheduled_events (snake_case)
```

## Profundidade de Recursos

Evite criar endpoints com mais de 3 recursos.

**Exemplo:**
```typescript
// ❌ Evite - muito profundo
GET /channels/:channelId/playlists/:playlistId/videos/:videoId/comments

// ✅ Prefira - mais direto
GET /videos/:videoId/comments
GET /comments?videoId=:videoId

// ✅ Ou organize de forma mais plana
GET /channels/:channelId/playlists
GET /playlists/:playlistId/videos
GET /videos/:videoId/comments
```

## Mutações e Ações

Para mutações, não siga REST à risca. Utilize uma combinação de REST para navegar nos recursos e verbos para representar ações que estão sendo executadas, sempre com POST.

**Exemplo:**
```typescript
// ✅ Prefira - verbos para ações específicas
POST /users/:userId/change-password
POST /orders/:orderId/cancel
POST /invoices/:invoiceId/send-reminder
POST /accounts/:accountId/activate

// ❌ Evite - PUT genérico para ações específicas
PUT /users/:userId
PUT /orders/:orderId

// ✅ PUT é apropriado para substituição completa do recurso
PUT /users/:userId
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

## Formato de Dados

O formato do payload de requisição e resposta deve ser sempre JSON, salvo que especificado algo diferente. Fastify serializa JSON automaticamente — utilize `reply.send()` para retornar dados.

Defina schemas de validação e serialização diretamente na rota usando JSON Schema ou TypeBox.

**Exemplo:**
```typescript
import { Type } from '@sinclair/typebox';

const CreateUserBody = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
});

fastify.post('/users', {
  schema: {
    body: CreateUserBody,
    response: {
      200: Type.Object({
        id: Type.String(),
        name: Type.String(),
        email: Type.String(),
      }),
    },
  },
}, async (request, reply) => {
  const { name, email } = request.body;
  const user = createUser({ name, email });
  return { id: user.id, name: user.name, email: user.email };
});

// Request
// Content-Type: application/json
// { "name": "John Doe", "email": "john@example.com" }

// Response
// Content-Type: application/json
// { "id": "123", "name": "John Doe", "email": "john@example.com" }
```

## Códigos de Status HTTP

### 200 - OK
Retorne quando a requisição for bem-sucedida. Em Fastify, retornar o valor diretamente do handler envia 200 automaticamente.

**Exemplo:**
```typescript
fastify.get('/users/:userId', async (request, reply) => {
  const user = await getUser(request.params.userId);
  return user; // 200 implícito
});
```

### 404 - Not Found
Retorne se um recurso não for encontrado.

**Exemplo:**
```typescript
fastify.get('/users/:userId', async (request, reply) => {
  const user = await getUser(request.params.userId);
  if (!user) {
    return reply.code(404).send({
      error: 'User not found',
      userId: request.params.userId,
    });
  }
  return user;
});
```

### 500 - Internal Server Error
Erros não tratados são capturados automaticamente pelo Fastify e retornam 500. Para erros esperados, use o error handler global.

**Exemplo:**
```typescript
// Error handler global (registrar uma vez na inicialização)
fastify.setErrorHandler((error, request, reply) => {
  request.log.error({ error }, 'Unexpected error');
  reply.code(500).send({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
  });
});
```

### 422 - Unprocessable Entity
Retorne se for um erro de negócio.

**Exemplo:**
```typescript
fastify.post('/orders/:orderId/cancel', async (request, reply) => {
  const order = await getOrder(request.params.orderId);

  if (order.status === 'shipped') {
    return reply.code(422).send({
      error: 'Cannot cancel shipped order',
      orderId: order.id,
      currentStatus: order.status,
    });
  }

  await cancelOrder(order.id);
  return { message: 'Order cancelled successfully' };
});
```

### 400 - Bad Request
Validações de schema (TypeBox/JSON Schema) retornam 400 automaticamente. Para validações manuais adicionais:

**Exemplo:**
```typescript
fastify.post('/users', async (request, reply) => {
  // Schema já garante campos obrigatórios e formato do email.
  // Para validações de negócio extras:
  if (!isValidDomain(request.body.email)) {
    return reply.code(400).send({
      error: 'Email domain not allowed',
      field: 'email',
    });
  }

  const user = await createUser(request.body);
  return user;
});
```

### 401 - Unauthorized
Retorne se o usuário não estiver autenticado. Prefira um hook `onRequest` via plugin de autenticação.

**Exemplo:**
```typescript
// Hook de autenticação (plugin)
fastify.addHook('onRequest', async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.code(401).send({ error: 'Authentication required' });
  }
  const user = verifyToken(token);
  if (!user) {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
  request.user = user; // disponível via decorator
});
```

### 403 - Forbidden
Retorne se o usuário não estiver autorizado.

**Exemplo:**
```typescript
fastify.delete('/users/:userId', async (request, reply) => {
  const { user } = request; // definido pelo hook de autenticação
  const targetUserId = request.params.userId;

  if (user.role !== 'admin' && user.id !== targetUserId) {
    return reply.code(403).send({
      error: 'Insufficient permissions',
      message: 'You are not allowed to delete this user',
    });
  }

  await deleteUser(targetUserId);
  return { message: 'User deleted successfully' };
});
```

## Cliente HTTP

Utilize Axios para fazer chamadas para API externa.

**Exemplo:**
```typescript
import axios from 'axios';

// GET request
async function getUser(userId: string) {
  try {
    const response = await axios.get(`https://api.example.com/users/${userId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API request failed', { 
        status: error.response?.status,
        message: error.message 
      });
    }
    throw error;
  }
}

// POST request
async function createUser(userData: CreateUserData) {
  const response = await axios.post('https://api.example.com/users', userData, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
}

// Configurar instância com defaults
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Hooks e Plugins

Em Fastify não existem middlewares no sentido do Express. Utilize **hooks** para funcionalidades transversais e **plugins** para encapsular rotas e lógica com escopo próprio.

**Hooks disponíveis:** `onRequest`, `preValidation`, `preHandler`, `onSend`, `onResponse`, `onError`.

**Exemplo:**
```typescript
// plugin-auth.ts — hook de autenticação com escopo
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    const user = verifyToken(token);
    if (!user) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
    request.user = user;
  });
};

// Use fastify-plugin para compartilhar decorators além do escopo do plugin
export default fp(authPlugin);

// Registrar apenas nas rotas protegidas
fastify.register(async (instance) => {
  instance.register(authPlugin);

  instance.get('/profile', async (request) => {
    return request.user;
  });
});
```
