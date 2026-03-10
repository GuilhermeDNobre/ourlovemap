# Review: Tarefa 8.0 - Webhook, retry e polling de pagamento

**Revisor**: AI Code Reviewer
**Data**: 2026-03-10
**Arquivo da tarefa**: 8_task.md
**Status**: APROVADO COM OBSERVAÇÕES

---

## Resumo

A implementação entrega todos os requisitos funcionais da tarefa: o webhook do Mercado Pago com validação HMAC, o retry de pagamento e o polling de status. A lógica de idempotência está correta, o fluxo de status codes HTTP está adequado e os 85 testes passam sem erros, incluindo os 11 cenários especificados na tarefa. O TypeScript compila sem erros (`tsc --noEmit`).

Foram identificadas questões estruturais importantes: as funções auxiliares `handleRetryPayment` e `handlePaymentStatus` violam o contrato de efeito colateral definido nos padrões (fazem mutação — registram rotas — em vez de retornar valores), o arquivo `payment-routes.ts` carece de logging nos fluxos processados, e o teste de idempotência do webhook está no arquivo de serviços mas ausente como cenário de rota no `payment-routes.test.ts` (embora o cenário de rota exista e passe). Nenhuma dessas questões quebra funcionalidade, mas impactam legibilidade e manutenibilidade.

---

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `src/routes/payment-routes.ts` | ⚠️ Issues | 3 |
| `src/routes/map-routes.ts` | ⚠️ Issues | 3 |
| `src/services/map-service.ts` | ✅ OK | 0 |
| `src/services/payment-service.ts` | ✅ OK | 0 |
| `src/app.ts` | ✅ OK | 0 |
| `test/routes/payment-routes.test.ts` | ⚠️ Issues | 1 |
| `test/routes/map-routes.test.ts` | ✅ OK | 0 |
| `test/services/map-service.test.ts` | ✅ OK | 0 |
| `test/services/payment-service.test.ts` | ✅ OK | 0 |

---

## Problemas Encontrados

### Criticos

Nenhum problema crítico encontrado.

---

### Principais

**[PRINCIPAL-1] `payment-routes.ts` linhas 11-24 — Ausência de logging nos fluxos processados**

O handler do webhook não registra nenhum evento de sucesso ao processar um pagamento aprovado ou rejeitado. A regra `logging.md` exige `request.log` em handlers de rota para eventos relevantes. O único log existente está dentro de `processWebhookEvent` (nível `warn` para status ignorados), mas a rota em si não registra nem a entrada do webhook validado nem o resultado do processamento.

```typescript
// payment-routes.ts — situação atual
await processWebhookEvent(event, fastify.supabase, request.log);
return reply.send({ received: true });

// Sugestão
request.log.info({ paymentId: dataId, action: body.action }, 'Webhook event processed');
await processWebhookEvent(event, fastify.supabase, request.log);
return reply.send({ received: true });
```

---

**[PRINCIPAL-2] `map-routes.ts` linhas 123-148 e 150-158 — Funções auxiliares com efeitos colaterais misturados**

As funções `handleRetryPayment` e `handlePaymentStatus` recebem `fastify` como parâmetro e chamam `fastify.post()` / `fastify.get()` internamente, ou seja, sua única responsabilidade é o efeito colateral de registrar rotas — não retornam dados nem são consultas. Isso viola o padrão "mutation OR query, never both" quando lidas junto à função exportada `mapRoutes`, que as chama com `await`. A assinatura sugere que retornam algo (`Promise<void>`), mas a real intenção é apenas mutação de estado do servidor.

A solução mais limpa seria registrar as rotas diretamente dentro de `mapRoutes`, sem extrair em funções intermediárias que apenas delegam para a instância Fastify:

```typescript
// Sugestão: inlining direto em mapRoutes para clareza
export default async function mapRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/maps/:id/retry-payment', async (request, reply) => { /* ... */ });
  fastify.get('/maps/:id/payment-status', async (request, reply) => { /* ... */ });
  fastify.post('/maps', async (request, reply) => { /* ... */ });
}
```

Se a extração for mantida por razões de organização, os nomes `handleRetryPayment` e `handlePaymentStatus` deveriam refletir que são funções de registro, por exemplo: `registerRetryPaymentRoute`.

---

**[PRINCIPAL-3] `map-routes.ts` linhas 131-147 — Tratamento de erro no retry cria exceção com `statusCode` 422 onde o padrão existente usa 422 apenas para negócio**

O bloco `catch` em `handleRetryPayment` captura falhas de `createPixPayment` e relança com `statusCode: 422`. O mesmo padrão existe em `POST /api/maps` e é consistente — no entanto, a `http.md` define 422 como "erro de negócio" e uma falha de API externa (Mercado Pago indisponível) seria mais adequadamente um 500 ou 503. Isso é uma inconsistência de semântica HTTP que já existia na tarefa 7 e foi replicada aqui.

```typescript
// Situação atual — ambas as rotas tratam falha de API externa como 422
const err = new Error('Payment creation failed') as Error & { statusCode: number };
err.statusCode = 422;
throw err;

// Alternativa mais semanticamente correta
err.statusCode = 503; // Service Unavailable — MP está fora
throw err;
```

Este problema foi herdado da tarefa anterior e não é responsabilidade exclusiva desta tarefa, mas foi replicado sem questionamento.

---

### Menores

**[MENOR-1] `payment-routes.ts` linha 18 — Verificação de tópico desconhecido não loga**

Quando o webhook recebe uma ação diferente de `payment.updated`, a rota retorna 200 silenciosamente sem nenhum log. A `logging.md` recomenda `warn` para situações inesperadas não fatais. A tarefa especifica que eventos de tópicos desconhecidos devem ser ignorados, mas o logging seria valioso em produção:

```typescript
if (body?.action !== 'payment.updated' || !dataId) {
  request.log.warn({ action: body?.action }, 'Webhook action ignored');
  return reply.send({ received: true });
}
```

---

**[MENOR-2] `payment-routes.ts` linha 12 — Cast com `as` em vez de validação de schema**

O body é tipado como `WebhookBody` via `as`, ignorando o schema de validação do Fastify (TypeBox/JSON Schema). Isso funciona mas deixa a validação implícita. Para consistência com `http.md` que recomenda schemas de validação nas rotas:

```typescript
// Sugestão: adicionar schema básico na rota
fastify.post('/payments/webhook', {
  schema: {
    body: {
      type: 'object',
      properties: {
        action: { type: 'string' },
        data: { type: 'object', properties: { id: { type: 'string' } } },
      },
    },
  },
}, async (request, reply) => {
  const body = request.body as WebhookBody;
  // ...
});
```

---

**[MENOR-3] `test/routes/payment-routes.test.ts` — Teste de idempotência não verifica ausência de `setPaymentFailed`**

O teste "should return 200 and not call activateMap again when map is already active" (linha 152) verifica que `activateMap` não é chamado, mas não verifica que `setPaymentFailed` também não é chamado. A lógica em `processWebhookEvent` para `approved` + mapa `active` pula o bloco `else if`, então `setPaymentFailed` também não seria chamado — verificar isso tornaria o teste mais completo e resistente a regressões:

```typescript
expect(response.statusCode).toBe(200);
expect(activateMap).not.toHaveBeenCalled();
expect(setPaymentFailed).not.toHaveBeenCalled(); // ausente
```

---

**[MENOR-4] `map-routes.ts` linhas 162-163 — `await` desnecessário em funções que apenas registram rotas**

`handleRetryPayment` e `handlePaymentStatus` retornam `Promise<void>` mas não contêm nenhuma operação assíncrona — apenas chamam métodos síncronos de `fastify`. O `await` em `mapRoutes` é desnecessário:

```typescript
// Situação atual
await handleRetryPayment(fastify);
await handlePaymentStatus(fastify);

// Fastify registra rotas de forma síncrona; não há await necessário
handleRetryPayment(fastify);
handlePaymentStatus(fastify);
```

---

## Destaques Positivos

- **Idempotência implementada corretamente**: A verificação `map.status !== 'active'` em `processWebhookEvent` garante que `activateMap` não seja chamado duas vezes para o mesmo pagamento, conforme exigido pela tarefa.

- **Validação HMAC robusta**: O uso de `timingSafeEqual` em `hmac.ts` previne timing attacks; o retorno imediato 401 antes de qualquer processamento está correto e seguro.

- **Cobertura de testes completa**: Todos os 11 cenários especificados na tarefa estão presentes e passam. O padrão AAA está bem aplicado, os testes são independentes e usam `buildApp()` corretamente com `fastify.inject()`.

- **Logging de warn no processamento de eventos**: `processWebhookEvent` usa `log.warn` com objeto estruturado para eventos ignorados, conforme `logging.md`.

- **Tipagem forte**: Nenhum uso de `any`. `WebhookBody` com campos opcionais e `MercadoPagoEvent` com tipagem explícita. O `processWebhookEvent` recebe `FastifyBaseLogger` diretamente, desacoplando o serviço da instância Fastify.

- **Separação de responsabilidades**: O webhook delega todo o processamento para `payment-service.processWebhookEvent`, mantendo a rota enxuta. A lógica de negócio fica no serviço.

- **Nomenclatura de funções**: `getMapById`, `getPaymentStatus`, `processWebhookEvent` iniciam com verbo e são autoexplicativas.

- **Registro de `paymentRoutes` em `app.ts`**: O plugin foi registrado com o prefixo `/api` correto, consistente com os demais.

---

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Code Standards | ⚠️ |
| TypeScript/Node.js | ✅ |
| REST/HTTP | ⚠️ |
| Logging | ⚠️ |
| React | N/A |
| Testes | ✅ |

**Code Standards**: Violação no padrão de efeitos colaterais (`handleRetryPayment` / `handlePaymentStatus`), `await` desnecessário.

**REST/HTTP**: Ausência de schema de validação no body do webhook; semântica do 422 para falha de API externa.

**Logging**: Ausência de `request.log` para eventos processados com sucesso no webhook; evento de tópico desconhecido não logado.

---

## Recomendações

1. **Adicionar `request.log.info` no handler do webhook** para rastrear webhooks processados em produção — essencial para debugging de problemas de pagamento.

2. **Adicionar `request.log.warn` para ações ignoradas** (`body?.action !== 'payment.updated'`) — sem isso, webhooks de outros tópicos chegam silenciosamente.

3. **Refatorar `handleRetryPayment` e `handlePaymentStatus`** para registrar as rotas diretamente dentro de `mapRoutes`, eliminando funções auxiliares com efeitos colaterais opacos, ou renomear para `registerRetryPaymentRoute` para deixar a intenção explícita.

4. **Remover o `await` desnecessário** nas chamadas para as funções de registro de rota.

5. **Complementar o teste de idempotência** com `expect(setPaymentFailed).not.toHaveBeenCalled()`.

6. **Avaliar se o status 422 é apropriado** para falhas de API externa no retry (herdado de tarefa anterior) — 503 seria semanticamente mais correto para "Mercado Pago indisponível".

---

## Veredicto

A implementação está funcional, segura e cobre todos os requisitos da tarefa com testes abrangentes. Os problemas encontrados são estruturais e de padrões de código, sem impacto em funcionalidade ou segurança. O código pode avançar para a próxima tarefa com as melhorias de logging e refatoração das funções auxiliares sendo endereçadas em oportunidade futura ou na próxima revisão.
