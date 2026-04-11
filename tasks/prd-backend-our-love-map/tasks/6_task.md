# Tarefa 6.0: Payment service (Checkout via InfinitePay)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o `payment-service.ts` que encapsula toda a integração com o InfinitePay: criação de link de checkout e processamento dos eventos do webhook (aprovação de pagamento).

<requirements>
- Criar link de checkout via API pública do InfinitePay (`POST /invoices/public/checkout/links`)
- Retornar `checkoutUrl` para o frontend redirecionar o usuário
- Persistir `checkoutUrl` no banco via `map-service.updatePaymentData`
- No webhook: campo `order_nsu` corresponde ao `mapId`; status de pagamento aprovado → acionar ativação do mapa
- Valor do pagamento determinado pelo plano: `basic` = R$19,90 (1990 centavos); `premium` = R$29,90 (2990 centavos)
- A `webhook_url` enviada ao InfinitePay deve incluir o secret: `${OURLOVEMAP_API_URL}/api/payments/webhook?secret=${INFINITEPAY_WEBHOOK_SECRET}`
</requirements>

## Subtarefas

- [ ] 6.1 Implementar `src/services/payment-service.ts`
  - `createCheckoutPayment(params: CreateCheckoutPaymentParams, supabase: SupabaseClient): Promise<CheckoutPaymentResult>`
    - Calcular `amount` em centavos baseado no plano via constante `PLAN_PRICES_CENTS`
    - Montar `webhook_url` com secret: `` `${process.env.OURLOVEMAP_API_URL}/api/payments/webhook?secret=${process.env.INFINITEPAY_WEBHOOK_SECRET}` ``
    - Chamar `axios.post('https://api.infinitepay.io/invoices/public/checkout/links', { handle, order_nsu: mapId, items, webhook_url })`
    - Extrair `response.data.url` como `checkoutUrl`
    - Persistir via `map-service.updatePaymentData`
    - Retornar `CheckoutPaymentResult`
  - `processWebhookEvent(event: InfinitePayWebhookEvent, supabase: SupabaseClient, log: FastifyBaseLogger, posthog?): Promise<void>`
    - Buscar mapa por `event.order_nsu` via `map-service.getMapByOrderNsu`
    - Se mapa não encontrado → logar `warn` e retornar
    - Se mapa já `active` → logar `warn` e retornar (idempotência)
    - Caso contrário → chamar `map-service.activateMap` + gerar QR Code + enviar email
- [ ] 6.2 Definir constantes e tipos:
  ```typescript
  const PLAN_PRICES_CENTS: Record<Plan, number> = { basic: 1990, premium: 2990 }
  ```
- [ ] 6.3 Remover dependência do `mercadopago` SDK do `package.json` (se ainda presente)
- [ ] 6.4 Escrever testes unitários para `payment-service.ts`

## Detalhes de Implementação

Consultar seções **Interfaces Principais**, **Pontos de Integração** e **Lógicas Críticas** da techspec.md.

Estrutura do payload para a API do InfinitePay:
```typescript
{
  handle: process.env.INFINITEPAY_HANDLE,
  order_nsu: params.mapId,
  items: [
    {
      quantity: 1,
      price: PLAN_PRICES_CENTS[params.plan],
      description: `Our Love Map — plano ${params.plan}`,
    }
  ],
  webhook_url: `${process.env.OURLOVEMAP_API_URL}/api/payments/webhook?secret=${process.env.INFINITEPAY_WEBHOOK_SECRET}`,
  customer: { email: params.email },
}
```

Resposta esperada da API InfinitePay:
```json
{ "url": "https://checkout.infinitepay.com.br/tag?lenc=..." }
```

Se a criação do checkout falhar, relançar o erro para ser tratado pelo caller com status 422.

Payload do webhook recebido do InfinitePay:
```typescript
interface InfinitePayWebhookEvent {
  invoice_slug: string
  amount: number
  paid_amount: number
  installments: number
  capture_method: 'credit_card' | 'pix'
  transaction_nsu: string
  order_nsu: string    // = mapId
  receipt_url: string
  items: Array<{ quantity: number; price: number; description: string }>
}
```

## Critérios de Sucesso

- `createCheckoutPayment` retorna `checkoutUrl` válida
- Preço para `basic` = 1990 centavos e `premium` = 2990 centavos
- `processWebhookEvent` com `order_nsu` válido → `activateMap` chamado
- `processWebhookEvent` com mapa já `active` → nenhuma ação (idempotência)
- `processWebhookEvent` com `order_nsu` inexistente → nenhuma ação, apenas log `warn`

## Testes da Tarefa

- [ ] `test/services/payment-service.test.ts` (com mock do axios e map-service):
  - `createCheckoutPayment` plano `basic` → amount 1990 centavos, retorna `checkoutUrl`
  - `createCheckoutPayment` plano `premium` → amount 2990 centavos
  - `createCheckoutPayment` falha na API InfinitePay → relança erro
  - `processWebhookEvent` com mapa `pending_payment` → `activateMap` chamado
  - `processWebhookEvent` com mapa já `active` → `activateMap` não chamado
  - `processWebhookEvent` com `order_nsu` inexistente → nenhuma função chamada

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/services/payment-service.ts`
- `./backend/src/services/map-service.ts` (dependência)
- `./backend/test/services/payment-service.test.ts`
