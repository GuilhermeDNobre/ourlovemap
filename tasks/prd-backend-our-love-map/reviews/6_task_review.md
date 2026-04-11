# Review: Task 6.0 - Payment service (Checkout via InfinitePay)

**Revisor**: AI Code Reviewer
**Data**: 2026-03-10
**Arquivo da tarefa**: 6_task.md
**Status**: APROVADO COM OBSERVACOES

## Resumo

A tarefa migrou o payment service de Mercado Pago para InfinitePay com sucesso. A implementacao cobre todos os criterios de sucesso definidos na tarefa: criacao de checkout link via axios, persistencia de `checkoutUrl` no banco, logica de idempotencia no processamento do webhook e remocao do SDK `mercadopago`. TypeScript compila sem erros e todos os 109 testes passam. Ha dois problemas maiores e alguns desvios menores de padroes que devem ser enderecados em refinamentos futuros, mas nenhum deles bloqueia a entrega.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `backend/src/services/payment-service.ts` | Problemas | 3 |
| `backend/src/services/map-service.ts` | Problemas | 1 |
| `backend/src/routes/payment-routes.ts` | OK | 0 |
| `backend/src/routes/map-routes.ts` | OK | 0 |
| `backend/test/services/payment-service.test.ts` | OK | 0 |
| `backend/test/services/map-service.test.ts` | OK | 0 |
| `backend/test/routes/payment-routes.test.ts` | OK | 0 |
| `backend/test/routes/map-routes.test.ts` | OK | 0 |
| `backend/supabase/migrations/20260310040000_replace-pix-with-checkout-url.sql` | OK | 0 |
| `backend/package.json` | OK | 0 |

## Problemas Encontrados

### Criticos

Nenhum problema critico encontrado.

### Maiores

**1. `payment-service.ts` linhas 84-88 — PostHog acoplado ao service de dominio (violacao de "query vs mutation")**

O padrao do projeto estabelece que funcoes devem fazer mutacao OU consulta, sem efeitos colaterais misturados. `processWebhookEvent` mistura logica de dominio com captura de evento de observabilidade (PostHog) dentro do mesmo fluxo. A injecao de `posthog` como parametro opcional torna o service dependente de infraestrutura de observabilidade, o que e responsabilidade da camada de rota.

```typescript
// Situacao atual em payment-service.ts
const activatedMap = await activateMap(map.id, supabase);
try {
  posthog?.capture({ distinctId: map.id, event: 'payment_approved', properties: { plan: map.plan } });
} catch (error) { ... }
```

A captura PostHog ja e feita na rota `POST /api/maps` e deveria ser responsabilidade exclusiva de `payment-routes.ts` tambem para o webhook, mantendo `processWebhookEvent` focado apenas em logica de dominio e eliminando o parametro `posthog?` da assinatura.

**2. `map-service.ts` linhas 186-195 — `updatePaymentData` persiste `payment_id` como o proprio `mapId`, criando campo redundante**

A funcao `updatePaymentData` salva `payment_id: mapId` — o mesmo valor que ja esta na coluna `id`. A migration `20260310040000_replace-pix-with-checkout-url.sql` nao remove a coluna `payment_id`, e a funcao `getMapByOrderNsu` ja usa `getMapById(orderNsu)` diretamente, o que significa que `payment_id` nunca e consultado para localizar o mapa no webhook. O campo existe mas nao tem funcao diferenciada.

```typescript
// map-service.ts linha 190
payment_id: mapId, // sempre igual a id, semanticamente redundante
checkout_url: data.checkoutUrl,
```

O campo deveria ser removido via migration adicional, ou receber um valor semanticamente diferente (como o `invoice_slug` do evento de webhook) para ter utilidade real como rastreador da transacao no gateway.

### Menores

**3. `payment-service.ts` linha 90 — Non-null assertion em campo nullavel**

```typescript
const qrBuffer = await generateQrCode(activatedMap.token!);
await sendDeliveryEmail(
  { coupleName: activatedMap.coupleName, token: activatedMap.token!, qrCodeBuffer: qrBuffer },
  activatedMap.email,
);
```

`activatedMap.token` e do tipo `string | null` em `MapRecord`. O operador `!` suprime o erro de tipo mas pode produzir um `TypeError` em runtime se `activateMap` retornar `token: null`. A verificacao explicita e mais segura:

```typescript
if (!activatedMap.token) {
  log.error({ mapId: map.id }, 'Activated map has no token');
  return;
}
const qrBuffer = await generateQrCode(activatedMap.token);
```

**4. `map-service.ts` linha 122-123 — Magic number inline para calculo de milissegundos**

O valor `24 * 60 * 60 * 1000` aparece inline sem nome. O projeto ja usa `BASIC_PLAN_EXPIRY_DAYS` como constante nomeada para o numero de dias, mas o fator de conversao para milissegundos fica como numero magico:

```typescript
// Situacao atual
new Date(Date.now() + BASIC_PLAN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

// Sugestao
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
new Date(Date.now() + BASIC_PLAN_EXPIRY_DAYS * ONE_DAY_IN_MS)
```

**5. `payment-routes.ts` linhas 6-8 — Comparacao de tamanho de string antes do `timingSafeEqual` vaza comprimento do secret**

```typescript
if (received.length !== expected.length) return false;
return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
```

A verificacao de comprimento e tecnicamente necessaria para que o `timingSafeEqual` nao lance (buffers devem ter mesmo tamanho), mas ela retorna imediatamente, revelando se o tamanho do segredo coincide. Uma alternativa que elimina esse vazamento e usar hash antes da comparacao:

```typescript
const receivedHash = crypto.createHmac('sha256', 'cmp').update(received).digest();
const expectedHash = crypto.createHmac('sha256', 'cmp').update(expected).digest();
return crypto.timingSafeEqual(receivedHash, expectedHash);
```

O risco atual e baixo (exige acesso a timing de respostas HTTP), mas a correcao e simples.

## Destaques Positivos

- Migracao do Mercado Pago para InfinitePay concluida de forma limpa: `mercadopago` removido do `package.json` e sem nenhuma referencia residual.
- `processWebhookEvent` implementa idempotencia corretamente: mapas ja `active` sao ignorados com log `warn` sem acao adicional.
- A `webhook_url` com secret embutido via query string esta exatamente conforme especificado na tarefa, incluindo interpolacao das variaveis de ambiente corretas.
- `isValidWebhookSecret` usa `crypto.timingSafeEqual` para prevenir timing attacks na comparacao de segredos.
- Testes do `payment-service` cobrem os 6 cenarios exigidos pela tarefa, incluindo idempotencia, mapa nao encontrado e falha na API do InfinitePay.
- O helper `buildWebhookEvent` com `overrides` evita repeticao e torna os testes expressivos.
- A migration `20260310040000_replace-pix-with-checkout-url.sql` usa `IF NOT EXISTS` e `IF EXISTS`, garantindo idempotencia.
- Logging 100% via Pino (`request.log` / `fastify.log`), sem `console.log` ou `console.error` — aderente as regras de logging.
- Sem uso de `any`, sem `require`, sem `var`. TypeScript compila sem erros.
- Todas as funcoes ficam abaixo do limite de 50 linhas; nenhum arquivo ultrapassa 300 linhas.
- Constantes `PLAN_PRICES_CENTS` e `INFINITEPAY_CHECKOUT_URL` eliminam magic numbers na funcao principal.

## Conformidade com Padroes

| Padrao | Status |
|--------|--------|
| Padroes de Codigo | Problemas |
| TypeScript/Node.js | OK |
| REST/HTTP | OK |
| Logging | OK |
| React | N/A |
| Testes | OK |

## Recomendacoes

1. **(Maior — map-service.ts)** Esclarecer o papel do campo `payment_id` na tabela `maps`. Se o campo nao for consultado de forma independente, adicionar migration para remove-lo. Se o objetivo e rastrear o identificador do gateway, usar o `invoice_slug` do evento de webhook em vez do `mapId`.

2. **(Maior — payment-service.ts)** Remover o parametro `posthog?` de `processWebhookEvent` e mover a captura do evento `payment_approved` para `payment-routes.ts`, mantendo o service de dominio livre de dependencias de observabilidade — seguindo o mesmo padrao ja aplicado em `map-routes.ts` para `map_created`.

3. **(Menor — payment-service.ts linha 90)** Substituir os non-null assertions `activatedMap.token!` por verificacao explicita com log de erro, tornando a falha observavel em vez de potencial `TypeError` silencioso.

4. **(Menor — map-service.ts linha 122)** Extrair `24 * 60 * 60 * 1000` para uma constante `ONE_DAY_IN_MS`, seguindo o padrao de constantes nomeadas ja estabelecido no arquivo.

5. **(Menor — payment-routes.ts)** Substituir a comparacao `received.length !== expected.length` + `timingSafeEqual` por comparacao de hashes HMAC, eliminando o vazamento do comprimento do secret.

## Veredicto

A implementacao esta funcional, tipada corretamente e com cobertura de testes adequada para todos os cenarios criticos definidos na tarefa. Os dois problemas maiores nao causam bug observavel no fluxo atual: o campo `payment_id` redundante nao afeta o comportamento, e o acoplamento do PostHog ao service nao gera inconsistencia de dados. O codigo pode ser entregue; as observacoes devem ser endere adas em tarefas de refinamento subsequentes.
