# Tarefa 8.0: Webhook, retry e polling de pagamento

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar as três rotas relacionadas ao ciclo de vida do pagamento: o webhook do Mercado Pago (que recebe e processa eventos de pagamento), o endpoint de retry (que gera um novo PIX para pagamentos falhos) e o endpoint de polling (que o frontend consulta para atualizar a UI com o status atual do pagamento).

<requirements>
- `POST /api/payments/webhook`: validar HMAC antes de processar; retornar 200 sempre após validação
- `POST /api/maps/:id/retry-payment`: gerar novo PIX apenas se status for `payment_failed`; retornar 422 se status não permitir retry
- `GET /api/maps/:id/payment-status`: retornar status atual, `pixQrCode`, `pixCode` e `paymentExpiresAt`
- Webhook deve tratar `approved`, `rejected` e `cancelled`; ignorar outros status com log `warn`
- HMAC inválido → retornar 401 imediatamente, sem processar o evento
</requirements>

## Subtarefas

- [ ] 8.1 Criar `src/routes/payment-routes.ts` registrado em `src/app.ts` com prefixo `/api`
- [ ] 8.2 Implementar `POST /api/payments/webhook`:
  - Extrair `x-signature` e `x-request-id` dos headers e `data.id` do body
  - Chamar `hmac.verifyWebhookSignature`; retornar 401 se inválido
  - Chamar `payment-service.processWebhookEvent`
  - Sempre retornar 200 após processamento (inclusive para eventos ignorados)
- [ ] 8.3 Implementar `POST /api/maps/:id/retry-payment` em `src/routes/map-routes.ts`:
  - Buscar mapa por `id`; retornar 404 se não encontrado
  - Verificar se status é `payment_failed`; retornar 422 se não for
  - Chamar `payment-service.createPixPayment` e retornar novos dados do PIX
- [ ] 8.4 Implementar `GET /api/maps/:id/payment-status` em `src/routes/map-routes.ts`:
  - Buscar mapa por `id`; retornar 404 se não encontrado
  - Chamar `map-service.getPaymentStatus` e retornar os campos
- [ ] 8.5 Escrever testes de integração para as três rotas

## Detalhes de Implementação

Consultar seções **Endpoints de API**, **Lógicas Críticas** (HMAC) e **Considerações Técnicas** (webhook ordering) da techspec.md.

O webhook deve processar apenas o tópico `payment` com ação `payment.updated`. Para outros tópicos, retornar 200 sem processar.

Cuidado com idempotência: se o webhook chegar novamente para um mapa já `active`, não re-executar `activateMap` — verificar o status atual antes de processar.

Estrutura do body do webhook do Mercado Pago:
```json
{
  "action": "payment.updated",
  "data": { "id": "payment_id_here" }
}
```

## Critérios de Sucesso

- Webhook com HMAC válido e status `approved` → mapa ativado, status 200
- Webhook com HMAC inválido → status 401, mapa não alterado
- Webhook com status `rejected` → mapa em `payment_failed`, status 200
- Retry com mapa em `payment_failed` → novo PIX retornado, status 200
- Retry com mapa em `active` → status 422
- Retry com mapa inexistente → status 404
- Polling → retorna status e dados do PIX corretamente

## Testes da Tarefa

- [ ] `test/routes/payment-routes.test.ts` (usando `buildApp()` + `fastify.inject()`):
  - Webhook HMAC válido + `approved` → 200 + `activateMap` chamado
  - Webhook HMAC inválido → 401
  - Webhook `rejected` → 200 + `setPaymentFailed` chamado
  - Webhook `cancelled` → 200 + `setPaymentFailed` chamado
  - Webhook tópico desconhecido → 200, nenhuma ação
  - Webhook mapa já `active` com `approved` → 200, `activateMap` não chamado novamente
- [ ] `test/routes/map-routes.test.ts` (complementar):
  - `POST /api/maps/:id/retry-payment` mapa `payment_failed` → 200 com novo PIX
  - `POST /api/maps/:id/retry-payment` mapa `active` → 422
  - `POST /api/maps/:id/retry-payment` mapa inexistente → 404
  - `GET /api/maps/:id/payment-status` → 200 com todos os campos
  - `GET /api/maps/:id/payment-status` mapa inexistente → 404

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/routes/payment-routes.ts`
- `./backend/src/routes/map-routes.ts` (modificado)
- `./backend/src/utils/hmac.ts` (dependência)
- `./backend/src/services/payment-service.ts` (dependência)
- `./backend/src/services/map-service.ts` (dependência)
- `./backend/test/routes/payment-routes.test.ts`
- `./backend/test/routes/map-routes.test.ts` (modificado)
