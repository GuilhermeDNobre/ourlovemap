# Review: Tarefa 8.0 - Webhook, retry e polling de pagamento

**Revisor**: AI Code Reviewer
**Data**: 2026-03-10
**Arquivo da tarefa**: 8_task.md
**Status**: APROVADO COM OBSERVAÇÕES

---

## Resumo

A Tarefa 8.0 implementou com sucesso as tres rotas do ciclo de vida do pagamento: `POST /api/payments/webhook`, `POST /api/maps/:id/retry-payment` e `GET /api/maps/:id/payment-status`. Todos os 109 testes passam e o TypeScript compila sem erros. A logica central esta correta, os criterios de sucesso definidos na tarefa foram atendidos e o codigo segue os padroes do projeto de forma geral. Foram identificadas algumas observacoes estruturais e uma vulnerabilidade de seguranca leve que merecem atencao.

---

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `backend/src/routes/payment-routes.ts` | Observacoes | 2 |
| `backend/src/routes/map-routes.ts` | Observacoes | 3 |
| `backend/src/services/payment-service.ts` | Observacoes | 1 |
| `backend/test/routes/payment-routes.test.ts` | OK | 0 |
| `backend/test/routes/map-routes.test.ts` | Observacoes | 1 |

---

## Problemas Encontrados

### Criticos

Nenhum problema critico encontrado.

---

### Principais

#### P1 — `map-routes.ts` ultrapassa o limite de 300 linhas por arquivo

**Arquivo:** `backend/src/routes/map-routes.ts`
**Situacao:** 373 linhas no total

O padrao `code-standards.md` limita arquivos a 300 linhas. O arquivo cresceu ao absorver `registerByTokenRoute`, `registerRetryPaymentRoute` e `registerPaymentStatusRoute` em adicao ao handler `POST /api/maps`. Cada funcao de registro tem entre 20 e 80 linhas, o que torna o arquivo dificil de navegar.

Sugestao: extrair as rotas de gerenciamento de pagamento para um arquivo dedicado.

```typescript
// backend/src/routes/map-payment-routes.ts
export default async function mapPaymentRoutes(fastify: FastifyInstance): Promise<void> {
  registerRetryPaymentRoute(fastify);
  registerPaymentStatusRoute(fastify);
}
```

---

#### P2 — `isValidWebhookSecret` permite autenticacao com segredo vazio quando env nao esta configurada

**Arquivo:** `backend/src/routes/payment-routes.ts`
**Linhas:** 5-12

Quando `INFINITEPAY_WEBHOOK_SECRET` nao esta definida no ambiente, `process.env.INFINITEPAY_WEBHOOK_SECRET ?? ''` resulta em uma string vazia. Nesse cenario, uma requisicao enviando `?secret=` (query string vazia) passaria na validacao via `timingSafeEqual`, pois dois buffers vazios sao identicos.

A spec da tarefa recomendava verificar `receivedSecret.length !== expected.length` antes de chamar `timingSafeEqual`. A implementacao optou por um `try/catch` — que resolve o crash para strings de tamanhos diferentes corretamente — mas nao aborda o caso do segredo vazio.

Verificado via Node.js: `crypto.timingSafeEqual(Buffer.from(''), Buffer.from(''))` retorna `true`.

Sugestao:

```typescript
function isValidWebhookSecret(received: string): boolean {
  const expected = process.env.INFINITEPAY_WEBHOOK_SECRET ?? '';
  if (!expected || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
```

---

### Menores

#### M1 — `GET /api/maps/:id/payment-status` realiza duas consultas ao banco desnecessariamente

**Arquivo:** `backend/src/routes/map-routes.ts`
**Linhas:** 292-296

O handler chama `getMapById` para verificar existencia do mapa e em seguida `getPaymentStatus` para buscar `status` e `checkoutUrl`. Ambas as funcoes consultam a tabela `maps`. O `MapRecord` retornado por `getMapById` ja inclui `status` e `checkoutUrl`, tornando a segunda chamada redundante.

```typescript
// Alternativa que elimina a segunda consulta:
async (request, reply) => {
  const { id } = request.params as { id: string };
  const map = await getMapById(id, fastify.supabase);
  if (!map) return reply.code(404).send({ error: 'Map not found' });
  return reply.send({ status: map.status, checkoutUrl: map.checkoutUrl });
}
```

---

#### M2 — `retry-payment` nao rejeita mapa com status `expired`

**Arquivo:** `backend/src/routes/map-routes.ts`
**Linha:** 250

O handler verifica apenas `map.status === 'active'` para retornar 422. Um mapa com status `expired` passa pela verificacao e uma nova tentativa de checkout e criada para um mapa que nao pode ser reativado via retry. A logica esperada seria rejeitar tambem o status `expired`.

```typescript
// Sugestao:
if (map.status === 'active' || map.status === 'expired') {
  return reply.code(422).send({ error: 'Map cannot be retried in current status' });
}
```

---

#### M3 — Segredo do webhook exposto na URL registrada no InfinitePay

**Arquivo:** `backend/src/services/payment-service.ts`
**Linha:** 48

```typescript
const webhookUrl = `${process.env.OURLOVEMAP_API_URL}/api/payments/webhook?secret=${process.env.INFINITEPAY_WEBHOOK_SECRET}`;
```

O segredo e transmitido como query string e sera armazenado nos registros do InfinitePay e potencialmente nos logs do Axios em caso de erro. Esta abordagem e comum para webhooks simples, mas e importante garantir que o `webhookUrl` nunca apareca em logs proprios da aplicacao.

Verificado: o `webhookUrl` nao e logado diretamente no codigo atual. Porem, em caso de erro do Axios, o objeto `error.config.url` pode expor a URL completa se for logado sem tratamento.

Sugestao — mascarar a URL antes de logar erros do Axios:

```typescript
const maskedUrl = webhookUrl.replace(/secret=[^&]+/, 'secret=***');
log.error({ webhookUrl: maskedUrl }, 'Checkout request failed');
```

---

#### M4 — Teste do `retry-payment` nao cobre o cenario de mapa `expired`

**Arquivo:** `backend/test/routes/map-routes.test.ts`

O bloco `describe('POST /api/maps/:id/retry-payment')` cobre `payment_failed`, `pending_payment`, `active` e `inexistente`, mas nao cobre `expired`. Se a correcao do M2 for implementada, o teste abaixo deve ser adicionado.

```typescript
it('should return 422 when map status is expired', async () => {
  const app = buildApp();
  (getMapById as jest.Mock).mockResolvedValue({
    id: 'map-1', status: 'expired', plan: 'basic', email: 'carol@example.com',
  });

  const response = await app.inject({ method: 'POST', url: '/api/maps/map-1/retry-payment' });

  expect(response.statusCode).toBe(422);
  expect(createCheckoutPayment).not.toHaveBeenCalled();
});
```

---

## Destaques Positivos

- **Idempotencia do webhook implementada corretamente:** o `processWebhookEvent` verifica `map.status === 'active'` antes de chamar `activateMap`, garantindo que reprocessamentos nao causem efeitos colaterais.
- **`timingSafeEqual` com `try/catch`:** a protecao contra timing attacks foi implementada com tratamento defensivo correto para strings de tamanhos diferentes, evitando excecao de runtime.
- **Separacao de responsabilidades nas rotas:** o uso de `registerRetryPaymentRoute`, `registerPaymentStatusRoute` e `registerByTokenRoute` como funcoes distintas melhora a legibilidade e a localizacao do codigo.
- **Uso correto do Pino:** todo o logging usa `request.log` ou `fastify.log` com contexto estruturado. Nenhum `console.log` foi encontrado nos arquivos revisados.
- **Tratamento de erro do PostHog isolado:** o bloco `try/catch` em torno de `fastify.posthog?.capture` garante que falhas de observabilidade nao impactem o fluxo principal do webhook.
- **Testes abrangentes do webhook:** os quatro cenarios criticos da spec (token valido, token invalido, mapa ja ativo, `order_nsu` inexistente) foram implementados e passam.
- **Sem uso de `any`:** toda a tipagem esta explicita, incluindo as interfaces `InfinitePayWebhookEvent`, `WebhookProcessResult` e `CheckoutPaymentResult`.
- **Estrutura de testes AAA:** todos os testes seguem o padrao Arrange-Act-Assert com nomes descritivos iniciando com `should`.
- **Schema OpenAPI nas rotas novas:** `registerRetryPaymentRoute` e `registerPaymentStatusRoute` incluem schemas completos com `tags`, `summary`, `description`, `params` e `response`, mantendo a documentacao automatica consistente.

---

## Conformidade com os Padroes

| Padrao | Status |
|--------|--------|
| Code Standards | Arquivo map-routes.ts acima de 300 linhas |
| TypeScript/Node.js | Sem `any`, `const` preferido, `async/await` usado |
| REST/HTTP | Verbos, recursos em plural, status HTTP corretos |
| Logging | Pino via `request.log`, sem `console`, sem dados sensiveis diretos |
| React | N/A |
| Testes | Cenario `expired` no retry-payment nao coberto |

---

## Recomendacoes

1. **(P2 — Seguranca)** Adicionar a guarda `if (!expected)` em `isValidWebhookSecret` para impedir autenticacao com segredo vazio quando a variavel de ambiente nao estiver configurada. Prioridade alta antes de qualquer deploy sem a env var definida.
2. **(P1 — Manutencao)** Extrair as rotas de gerenciamento de pagamento de `map-routes.ts` para um arquivo separado `map-payment-routes.ts`, trazendo o arquivo para dentro do limite de 300 linhas.
3. **(M2 — Comportamento)** Tratar o status `expired` como invalido para retry no handler `POST /api/maps/:id/retry-payment`, retornando 422.
4. **(M4 — Cobertura)** Adicionar o teste correspondente ao cenario `expired` no `map-routes.test.ts` apos a correcao do M2.
5. **(M1 — Performance)** Eliminar a segunda consulta ao banco em `GET /api/maps/:id/payment-status` reutilizando os campos do `MapRecord` ja carregado por `getMapById`.
6. **(M3 — Seguranca defensiva)** Mascarar o segredo ao logar erros do Axios em `createCheckoutPayment` para prevenir exposicao acidental do `INFINITEPAY_WEBHOOK_SECRET` em logs de erro.

---

## Veredicto

O nucleo da implementacao esta correto e todos os criterios de sucesso da tarefa foram atendidos. Os testes cobrem os cenarios principais especificados e o TypeScript compila sem erros. O codigo pode seguir para producao com as observacoes registradas, sendo prioritaria a correcao de P2 (segredo vazio) antes de um deploy onde `INFINITEPAY_WEBHOOK_SECRET` possa nao estar configurada, e P1 (tamanho do arquivo) para preservar a manutenibilidade do codebase a longo prazo.
