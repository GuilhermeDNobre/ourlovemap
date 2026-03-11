# Tarefa 8.0: Webhook, retry e polling de pagamento

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar as três rotas relacionadas ao ciclo de vida do pagamento: o webhook do InfinitePay (que recebe e processa eventos de aprovação de pagamento), o endpoint de retry (que gera um novo checkout para pagamentos pendentes ou falhos) e o endpoint de polling (que o frontend consulta para atualizar a UI com o status atual do pagamento).

<requirements>
- `POST /api/payments/webhook`: validar token secreto na query string antes de processar; retornar 200 após validação
- `POST /api/maps/:id/retry-payment`: gerar novo checkout apenas se status for `payment_failed` ou `pending_payment`; retornar 422 se status for `active`
- `GET /api/maps/:id/payment-status`: retornar status atual e `checkoutUrl`
- Token inválido no webhook → retornar 401 imediatamente, sem processar o evento
</requirements>

## Subtarefas

- [ ] 8.1 Criar `src/routes/payment-routes.ts` registrado em `src/app.ts` com prefixo `/api`
- [ ] 8.2 Implementar `POST /api/payments/webhook`:
  - Extrair `request.query.secret` e comparar com `INFINITEPAY_WEBHOOK_SECRET` via `crypto.timingSafeEqual`
  - Se inválido → retornar 401 imediatamente
  - Parsear body como `InfinitePayWebhookEvent`
  - Chamar `payment-service.processWebhookEvent`
  - Sempre retornar 200 após processamento bem-sucedido
- [ ] 8.3 Implementar `POST /api/maps/:id/retry-payment` em `src/routes/map-routes.ts`:
  - Buscar mapa por `id`; retornar 404 se não encontrado
  - Verificar se status é `payment_failed` ou `pending_payment`; retornar 422 se for `active`
  - Chamar `payment-service.createCheckoutPayment` e retornar novo `checkoutUrl`
- [ ] 8.4 Implementar `GET /api/maps/:id/payment-status` em `src/routes/map-routes.ts`:
  - Buscar mapa por `id`; retornar 404 se não encontrado
  - Chamar `map-service.getPaymentStatus` e retornar os campos
- [ ] 8.5 Escrever testes de integração para as três rotas

## Detalhes de Implementação

Consultar seções **Endpoints de API** e **Lógicas Críticas** (validação do webhook) da techspec.md.

**Validação do token do webhook:**
```typescript
import crypto from 'crypto'

function isValidWebhookSecret(receivedSecret: string): boolean {
  const expected = process.env.INFINITEPAY_WEBHOOK_SECRET ?? ''
  if (receivedSecret.length !== expected.length) return false
  return crypto.timingSafeEqual(
    Buffer.from(receivedSecret),
    Buffer.from(expected),
  )
}
```

O webhook deve processar apenas eventos com `order_nsu` válido. Para outros casos, retornar 200 sem processar (idempotência).

Cuidado com idempotência: se o webhook chegar novamente para um mapa já `active`, não re-executar `activateMap` — a lógica de guarda está em `payment-service.processWebhookEvent`.

Estrutura do body do webhook do InfinitePay:
```json
{
  "invoice_slug": "abc123",
  "amount": 1990,
  "paid_amount": 1990,
  "installments": 1,
  "capture_method": "pix",
  "transaction_nsu": "txn_xyz",
  "order_nsu": "uuid-do-mapa",
  "receipt_url": "https://...",
  "items": [{ "quantity": 1, "price": 1990, "description": "Our Love Map — plano basic" }]
}
```

Resposta do webhook bem-sucedido:
```json
{ "received": true }
```

Resposta do retry:
```json
{ "checkoutUrl": "https://checkout.infinitepay.com.br/..." }
```

## Critérios de Sucesso

- Webhook com token válido e `order_nsu` existente → mapa ativado, status 200
- Webhook com token inválido → status 401, mapa não alterado
- Webhook com mapa já `active` → status 200, `activateMap` não chamado novamente
- Retry com mapa em `payment_failed` → novo `checkoutUrl` retornado, status 200
- Retry com mapa em `pending_payment` → novo `checkoutUrl` retornado, status 200
- Retry com mapa em `active` → status 422
- Retry com mapa inexistente → status 404
- Polling → retorna `status` e `checkoutUrl` corretamente

## Testes da Tarefa

- [ ] `test/routes/payment-routes.test.ts` (usando `buildApp()` + `fastify.inject()`):
  - Webhook token válido + `order_nsu` existente → 200 + `activateMap` chamado
  - Webhook token inválido → 401
  - Webhook mapa já `active` → 200, `activateMap` não chamado novamente
  - Webhook `order_nsu` inexistente → 200, nenhuma ação
- [ ] `test/routes/map-routes.test.ts` (complementar):
  - `POST /api/maps/:id/retry-payment` mapa `payment_failed` → 200 com `checkoutUrl`
  - `POST /api/maps/:id/retry-payment` mapa `pending_payment` → 200 com `checkoutUrl`
  - `POST /api/maps/:id/retry-payment` mapa `active` → 422
  - `POST /api/maps/:id/retry-payment` mapa inexistente → 404
  - `GET /api/maps/:id/payment-status` → 200 com `status` e `checkoutUrl`
  - `GET /api/maps/:id/payment-status` mapa inexistente → 404

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/routes/payment-routes.ts`
- `./backend/src/routes/map-routes.ts` (modificado)
- `./backend/src/services/payment-service.ts` (dependência)
- `./backend/src/services/map-service.ts` (dependência)
- `./backend/test/routes/payment-routes.test.ts`
- `./backend/test/routes/map-routes.test.ts` (modificado)
