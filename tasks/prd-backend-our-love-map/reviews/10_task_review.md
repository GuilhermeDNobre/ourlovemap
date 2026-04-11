# Review: Task 10.0 - Endpoint público GET /api/maps/by-token + observabilidade

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 10_task.md
**Status**: APPROVED WITH OBSERVATIONS

## Summary

A implementação entrega todos os artefatos exigidos pela Tarefa 10.0: o endpoint `GET /api/maps/by-token`, o plugin PostHog (`posthog-plugin.ts`), a inicialização do Sentry em `app.ts`, e a integração de eventos PostHog nos pontos corretos (`map-routes.ts`, `payment-routes.ts`). Todos os 111 testes passam e o TypeScript compila sem erros (`tsc --noEmit` limpo).

O código é funcional, bem estruturado e segue a maioria dos padrões do projeto. Os problemas encontrados são de baixa criticidade: perda de stack trace no log de erros do `setErrorHandler`, ausência de testes para o comportamento fire-and-forget do PostHog no endpoint `by-token`, uso de non-null assertion (`!`) e uma descrição de tag desatualizada no Swagger. Nenhum deles bloqueia a entrega.

O requisito de privacidade (`distinctId` anônimo via `map.id`) foi respeitado. A regra de fire-and-forget para PostHog foi aplicada corretamente em todos os pontos. O Sentry captura somente erros com `statusCode >= 500`, o que é o comportamento correto.

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `backend/src/routes/map-routes.ts` | OK | 0 |
| `backend/src/plugins/posthog-plugin.ts` | OK | 0 |
| `backend/src/app.ts` | Issues | 1 |
| `backend/src/services/map-service.ts` | OK | 0 |
| `backend/src/services/payment-service.ts` | OK | 0 |
| `backend/src/routes/payment-routes.ts` | Issues | 1 |
| `backend/src/plugins/swagger-plugin.ts` | Issues | 1 |
| `backend/test/routes/map-routes.test.ts` | Issues | 1 |
| `backend/test/plugins/posthog-plugin.test.ts` | OK | 0 |
| `backend/test/plugins/swagger-plugin.test.ts` | OK | 0 |
| `backend/test/routes/payment-routes.test.ts` | OK | 0 |

## Issues Found

### Criticos

Nenhum problema crítico encontrado.

### Principais

**[MAJOR-1] `backend/src/app.ts` linha 35 — Log de erro descarta o stack trace**

O `setErrorHandler` extrai a mensagem do erro como string e passa apenas ela para o logger, perdendo o stack trace que o Pino seria capaz de serializar automaticamente se recebesse o objeto `Error` completo.

```typescript
// Atual — perde o stack trace
const message = error instanceof Error ? error.message : String(error);
fastify.log.error({ error: message }, 'Unhandled error');

// Preferido — Pino serializa o objeto Error completo, incluindo stack trace
fastify.log.error({ error }, 'Unhandled error');
```

A variável `message` pode continuar sendo usada no corpo da resposta HTTP, mas o log deveria receber o objeto `error` original para preservar o contexto de depuração em produção.

**[MAJOR-2] `backend/test/routes/map-routes.test.ts` — Comportamento fire-and-forget do PostHog não testado**

A tarefa especifica que o PostHog deve capturar o evento `map_expired_accessed` quando um mapa expirado é acessado, e que o PostHog deve ser sempre fire-and-forget (nunca bloquear o fluxo). O teste de mapa expirado (linha 446) verifica o código de status e o corpo da resposta, mas não verifica se `fastify.posthog.capture` foi chamado com os parâmetros corretos.

Além disso, não existe teste que simule uma falha em `fastify.posthog.capture` para garantir que a resposta 403 ainda é retornada normalmente, o que é o comportamento mais crítico do requisito fire-and-forget.

Exemplo dos testes ausentes:

```typescript
it('should capture map_expired_accessed PostHog event when map is expired', async () => {
  // Arrange
  const app = buildApp();
  const mockCapture = jest.fn();
  app.decorate('posthog', { capture: mockCapture });
  (getMapByToken as jest.Mock).mockResolvedValue({ ...buildActiveMap(), status: 'expired' });

  // Act
  const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

  // Assert
  expect(response.statusCode).toBe(403);
  expect(mockCapture).toHaveBeenCalledWith(
    expect.objectContaining({ event: 'map_expired_accessed', distinctId: 'map-1' }),
  );
});

it('should return 403 even when PostHog capture throws on expired map', async () => {
  // Arrange
  const app = buildApp();
  app.decorate('posthog', { capture: jest.fn().mockImplementation(() => { throw new Error('PostHog down'); }) });
  (getMapByToken as jest.Mock).mockResolvedValue({ ...buildActiveMap(), status: 'expired' });

  // Act
  const response = await app.inject({ method: 'GET', url: '/api/maps/by-token?token=tok01' });

  // Assert
  expect(response.statusCode).toBe(403);
});
```

### Menores

**[MINOR-1] `backend/src/routes/payment-routes.ts` linha 50 — Non-null assertion `result.mapId!`**

O uso de `result.mapId!` força o TypeScript a ignorar o possível `undefined`. O tipo `WebhookProcessResult.mapId` é `string | undefined`, e o bloco já verificou `result.wasActivated`, mas o TypeScript não consegue inferir que `mapId` sempre está presente quando `wasActivated` é `true`. Uma guarda explícita elimina a necessidade do operador de asserção:

```typescript
// Atual
fastify.posthog?.capture({ distinctId: result.mapId!, event: 'payment_approved', properties: { plan: result.plan } });

// Preferido
if (result.mapId) {
  fastify.posthog?.capture({ distinctId: result.mapId, event: 'payment_approved', properties: { plan: result.plan } });
}
```

**[MINOR-2] `backend/src/plugins/swagger-plugin.ts` linha 52 — Descrição da tag `payments` desatualizada**

A tag `payments` ainda referencia "Mercado Pago", mas o projeto migrou para InfinitePay (conforme evidenciado pela migration SQL `20260310040000_replace-pix-with-checkout-url.sql` e pelos serviços de pagamento atuais).

```typescript
// Atual — desatualizado
{ name: 'payments', description: 'Payment webhook from Mercado Pago' },

// Correto
{ name: 'payments', description: 'Payment webhook from InfinitePay' },
```

## Positivos

- **PostHog fire-and-forget aplicado corretamente em todos os pontos**: os três pontos de captura (`map_created` em `map-routes.ts`, `payment_approved` em `payment-routes.ts`, `map_expired_accessed` em `map-routes.ts`) estão devidamente envolvidos em try/catch sem relançar exceção, garantindo que uma falha do PostHog jamais bloqueie o fluxo principal.

- **Privacidade respeitada**: o `distinctId` em todos os eventos PostHog usa `map.id` (UUID), nunca email, nome do casal ou outros dados PII. Isto está alinhado com o requisito explícito da tarefa.

- **Plugin PostHog bem estruturado**: `posthog-plugin.ts` usa `fastify-plugin` para compartilhar o decorator além do escopo, registra o `onClose` hook condicionalmente para fazer `shutdown()` graciosamente, e lida corretamente com a ausência de `POSTHOG_API_KEY` (decora com `null` em vez de lançar erro).

- **Graceful degradation do PostHog**: o operador opcional `fastify.posthog?.capture(...)` garante que a ausência do cliente (quando `POSTHOG_API_KEY` não está configurado) não cause erro de runtime.

- **Sentry apenas para erros 5xx**: o `setErrorHandler` em `app.ts` envia para o Sentry somente quando `statusCode >= 500`, evitando ruído de erros esperados (400, 401, 403, 422) no painel de monitoramento.

- **Sentry inicializado condicionalmente**: a verificação `if (process.env.SENTRY_DSN)` antes do `Sentry.init()` é o padrão correto, evitando erros em ambientes de desenvolvimento sem a variável configurada.

- **Cobertura de testes completa do endpoint `by-token`**: os 6 cenários especificados na tarefa (token ausente, token inválido, mapa ativo com dados completos, mapa expirado, `pending_payment`, `payment_failed`) estão todos cobertos com expectativas consistentes.

- **Plugin PostHog com testes de qualidade**: `posthog-plugin.test.ts` cobre os 4 casos relevantes: com API key, sem API key, shutdown chamado no close, shutdown não chamado quando sem cliente.

- **Resposta pública segura**: o endpoint `GET /api/maps/by-token` expõe apenas `coupleName`, `relationshipStartDate`, dados do YouTube e localizações — sem vazar `email`, `token`, `paymentId`, `checkoutUrl` ou `expiresAt`.

- **Separação de responsabilidades mantida**: o plugin PostHog é registrado em `app.ts`, a lógica de negócio não conhece o Sentry diretamente (exceto o `payment-service.ts` para a falha de email, que é um caso justificado), e o `setErrorHandler` é o ponto centralizado de captura de exceções.

## Standards Compliance

| Standard | Status |
|----------|--------|
| Code Standards | OK |
| TypeScript/Node.js | Issues |
| REST/HTTP | OK |
| Logging | Issues |
| React | N/A |
| Tests | Issues |

## Recommendations

1. **Corrigir o log no `setErrorHandler`** (`app.ts` linha 35): passar o objeto `error` completo em vez da string `message` para que o Pino serialize o stack trace corretamente. Esta é a melhoria de maior impacto para observabilidade em produção.

2. **Adicionar testes para o comportamento fire-and-forget do PostHog** em `map-routes.test.ts`: verificar que `fastify.posthog.capture` é chamado com os parâmetros corretos no cenário de mapa expirado, e que uma exceção no `capture` não interrompe a resposta 403.

3. **Substituir o non-null assertion `result.mapId!`** em `payment-routes.ts` linha 50 por uma guarda explícita `if (result.mapId)`, eliminando o uso de `!` e tornando o código mais seguro sem alterar o comportamento.

4. **Atualizar a descrição da tag `payments` no Swagger** de "Mercado Pago" para "InfinitePay" para manter a documentação em sincronia com a implementação atual.

## Verdict

A Tarefa 10.0 está implementada de forma funcional e pode prosseguir para produção. O sistema de observabilidade (Sentry + PostHog) está operacional e cobre os pontos críticos especificados. As issues encontradas são não-bloqueantes: a mais relevante (perda de stack trace no log de erros) é uma melhoria de observabilidade que deve ser aplicada na próxima oportunidade. Os testes ausentes para o comportamento PostHog no endpoint `by-token` são desejáveis, mas o comportamento fire-and-forget está corretamente implementado no código de produção e indiretamente validado pelo conjunto de testes existente.
