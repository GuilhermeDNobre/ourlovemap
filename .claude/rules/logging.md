# Logging

## Logger

Fastify inclui o [Pino](https://getpino.io) como logger nativo — **não utilize `console.log` ou `console.error`**. Habilite o logger na inicialização do servidor e use-o por todo o código.

```typescript
const fastify = Fastify({ logger: true });
```

## Níveis de Log

Utilize os níveis adequados: `info` para fluxo normal, `debug` para desenvolvimento, `warn` para situações inesperadas não fatais, `error` para falhas que precisam de atenção.

Dentro de handlers de rota, use `request.log` (contextualizado com `requestId`). Fora de rotas, use `fastify.log`.

**Exemplo:**
```typescript
// Dentro de um handler de rota
fastify.get('/users/:userId', async (request, reply) => {
  request.log.info({ userId: request.params.userId }, 'Fetching user');
  // ...
  request.log.debug({ query, duration }, 'Database query executed');
});

// Fora de rotas (inicialização, plugins)
fastify.log.info({ port: 3000 }, 'Server starting');
fastify.log.error({ error }, 'Database connection failed');
```

## Armazenamento

Nunca armazene logs em arquivos. Sempre redirecione pelo próprio processo (stdout/stderr).

**Exemplo:**
```typescript
// ✅ Prefira - os logs vão para stdout/stderr
console.log('User created successfully');
console.error('Failed to create user');

// Configure seu ambiente para capturar os logs:
// - Docker: docker logs
// - Kubernetes: kubectl logs
// - Serviços de log: CloudWatch, Datadog, etc.
```

## Dados Sensíveis

Nunca registre dados sensíveis como nome, endereço e cartão de crédito de pessoas.

**Exemplo:**
```typescript
// ❌ Evite
console.log('User created', { 
  name: 'John Doe',
  email: 'john@example.com',
  creditCard: '4111-1111-1111-1111',
  ssn: '123-45-6789'
});

// ✅ Prefira
console.log('User created', { 
  userId: 'user_123',
  timestamp: new Date().toISOString()
});

// Se necessário para debug, mascare dados sensíveis
function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name.substring(0, 2)}***@${domain}`;
}

console.log('User created', { 
  userId: 'user_123',
  email: maskEmail('john@example.com') // jo***@example.com
});
```

## Mensagens Claras

Seja sempre claro nas mensagens de log, sem exagerar ou utilizar textos longos.

**Exemplo:**
```typescript
// ❌ Evite - muito verboso
console.log('The user with the ID 123 has successfully completed the registration process and is now able to access the system with full privileges');

// ❌ Evite - muito vago
console.log('Done');
console.log('Error');

// ✅ Prefira - claro e conciso
console.log('User registered successfully', { userId: '123' });
console.error('Payment processing failed', { 
  orderId: 'order_456', 
  reason: 'insufficient_funds' 
});
```

## API do Logger

Use sempre a forma estruturada `log.level({ context }, 'message')` — o primeiro argumento é o objeto de contexto (mergeado no JSON de saída), o segundo é a mensagem.

**Exemplo:**
```typescript
// ✅ Prefira — structured logging
request.log.info({ userId, action: 'login' }, 'User logged in');
fastify.log.error({ error: error.message, orderId }, 'Payment gateway timeout');

// ❌ Evite — console e strings não estruturadas
console.log('User logged in');
console.error('Payment gateway timeout');
```

## Tratamento de Exceções

Nunca silencie exceptions. Sempre registre os logs. Em handlers de rota, erros lançados são automaticamente capturados pelo `setErrorHandler` do Fastify.

**Exemplo:**
```typescript
// ❌ Evite
try {
  await processPayment(orderId);
} catch (error) {
  // silenciosamente ignorado
}

// ✅ Prefira — em handlers de rota, re-throw para o error handler global
try {
  await processPayment(orderId);
} catch (error) {
  request.log.error(
    { orderId, error: error instanceof Error ? error.message : error },
    'Payment processing failed',
  );
  throw error; // capturado pelo setErrorHandler
}

// ✅ Ou trate localmente quando a falha é esperada e recuperável
try {
  await processPayment(orderId);
} catch (error) {
  request.log.warn({ orderId, error }, 'Payment processing failed');
  return reply.code(422).send({ error: 'payment_failed' });
}
```

## Contexto nos Logs

Sempre inclua contexto relevante nos logs para facilitar debugging.

**Exemplo:**
```typescript
// ❌ Evite - sem contexto
console.log('Operation completed');
console.error('Failed');

// ✅ Prefira - com contexto
console.log('Payment processed', {
  orderId: 'order_123',
  amount: 99.99,
  currency: 'USD',
  timestamp: new Date().toISOString()
});

console.error('Payment failed', {
  orderId: 'order_123',
  userId: 'user_456',
  errorCode: 'insufficient_funds',
  attemptNumber: 3
});
```

## Estrutura de Logs

Use objetos estruturados para facilitar parsing e análise.

**Exemplo:**
```typescript
// ❌ Evite - string não estruturada
console.log(`User ${userId} created order ${orderId} with total ${total}`);

// ✅ Prefira - objeto estruturado
console.log('Order created', {
  userId,
  orderId,
  total,
  timestamp: new Date().toISOString(),
  source: 'web'
});

// Isso facilita queries em sistemas de log:
// - Filtrar por userId específico
// - Buscar orders acima de um valor
// - Agrupar por source
```