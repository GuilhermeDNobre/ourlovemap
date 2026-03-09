# Tarefa 6.0: Payment service (PIX via Mercado Pago)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o `payment-service.ts` que encapsula toda a integração com o Mercado Pago: criação de pagamento PIX com expiração de 15 minutos e processamento dos eventos do webhook (aprovação, rejeição e cancelamento).

<requirements>
- Criar pagamento PIX via SDK do Mercado Pago com `payment_method_id: "pix"`
- Tempo de expiração do PIX: 15 minutos a partir da criação
- Retornar `pixQrCode` (base64), `pixCode` (copia-e-cola) e `paymentExpiresAt`
- No webhook: status `approved` → acionar ativação do mapa; status `rejected` ou `cancelled` → acionar `payment_failed`
- Valor do pagamento determinado pelo plano: `basic` = R$19,90; `premium` = R$29,90
</requirements>

## Subtarefas

- [ ] 6.1 Implementar `src/services/payment-service.ts`
  - `createPixPayment({ mapId, plan, email }: CreatePixPaymentParams, supabase: SupabaseClient): Promise<PixPaymentResult>`
    - Calcular `amount` baseado no plano via constante `PLAN_PRICES`
    - Chamar MP SDK: `new Payment(client).create({ payment_method_id: 'pix', ... })`
    - Definir `date_of_expiration` = `new Date(Date.now() + 15 * 60 * 1000).toISOString()`
    - Extrair `point_of_interaction.transaction_data.qr_code_base64` e `.qr_code`
    - Persistir dados de pagamento via `map-service.updatePaymentData`
    - Retornar `PixPaymentResult`
  - `processWebhookEvent(event: MercadoPagoEvent, supabase: SupabaseClient): Promise<void>`
    - Buscar mapa por `event.data.id` via `map-service.getMapByPaymentId`
    - Status `approved` → chamar `map-service.activateMap`
    - Status `rejected` | `cancelled` → chamar `map-service.setPaymentFailed`
    - Outros status → logar como `warn` e ignorar
- [ ] 6.2 Definir constantes e tipos:
  ```typescript
  const PLAN_PRICES: Record<Plan, number> = { basic: 19.90, premium: 29.90 }
  const PIX_EXPIRATION_MINUTES = 15
  ```
- [ ] 6.3 Configurar o client do Mercado Pago com `MP_ACCESS_TOKEN` via variável de ambiente
- [ ] 6.4 Escrever testes unitários para `payment-service.ts`

## Detalhes de Implementação

Consultar seções **Interfaces Principais**, **Pontos de Integração** e **Lógicas Críticas** da techspec.md.

Estrutura do payload para a API do Mercado Pago:
```typescript
{
  transaction_amount: amount,
  payment_method_id: 'pix',
  payer: { email },
  date_of_expiration: expiresAt.toISOString(),
  external_reference: mapId,
  description: 'Our Love Map',
}
```

Se a criação do PIX falhar, relançar o erro para ser tratado pelo caller com status 422.

## Critérios de Sucesso

- `createPixPayment` retorna `pixQrCode`, `pixCode` e `paymentExpiresAt` corretos
- Valor para `basic` = 19.90 e `premium` = 29.90
- `date_of_expiration` = criação + 15 min
- `processWebhookEvent` com status `approved` → `activateMap` chamado
- `processWebhookEvent` com status `rejected` → `setPaymentFailed` chamado
- `processWebhookEvent` com status desconhecido → nenhuma ação, apenas log `warn`

## Testes da Tarefa

- [ ] `test/services/payment-service.test.ts` (com mock do MP SDK e map-service):
  - `createPixPayment` plano `basic` → amount 19.90, retorna campos corretos
  - `createPixPayment` plano `premium` → amount 29.90
  - `createPixPayment` falha no MP → relança erro
  - `processWebhookEvent` status `approved` → `activateMap` chamado
  - `processWebhookEvent` status `rejected` → `setPaymentFailed` chamado
  - `processWebhookEvent` status `cancelled` → `setPaymentFailed` chamado
  - `processWebhookEvent` status desconhecido (ex: `in_process`) → nenhuma função chamada

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/services/payment-service.ts`
- `./backend/src/services/map-service.ts` (dependência)
- `./backend/test/services/payment-service.test.ts`
