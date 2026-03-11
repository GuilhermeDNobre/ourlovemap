# Review: Tarefa 10.0 — Endpoint público GET /api/maps/by-token + observabilidade

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 10_task.md
**Status**: APPROVED

---

## Resumo

Esta é a re-revisão após a correção dos 6 problemas encontrados na primeira análise. Todos os itens foram endereçados corretamente: o hook `onClose` foi adicionado ao plugin PostHog, os testes do plugin foram criados, o mock do `activateMap` no teste de rotas de pagamento foi corrigido, os blocos `catch` silenciosos foram substituídos por logs em nível `warn`, a extração do `error.message` foi padronizada e o caso de teste para `payment_failed` no endpoint `by-token` foi incluído.

Os 105 testes passam e a verificação de tipos `tsc --noEmit` não reporta erros.

---

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `backend/src/routes/map-routes.ts` | ✅ OK | 0 |
| `backend/src/plugins/posthog-plugin.ts` | ✅ OK | 0 |
| `backend/src/app.ts` | ✅ OK | 0 |
| `backend/src/services/map-service.ts` | ✅ OK | 0 |
| `backend/src/services/payment-service.ts` | ✅ OK | 0 |
| `backend/src/routes/payment-routes.ts` | ✅ OK | 0 |
| `backend/test/plugins/posthog-plugin.test.ts` | ✅ OK | 0 |
| `backend/test/routes/map-routes.test.ts` | ✅ OK | 0 |
| `backend/test/routes/payment-routes.test.ts` | ✅ OK | 0 |

---

## Problemas Encontrados

### 🔴 Problemas Críticos

Nenhum problema crítico encontrado.

---

### 🟡 Problemas Maiores

Nenhum problema maior encontrado.

---

### 🟢 Problemas Menores

Nenhum problema menor encontrado.

---

## Verificação dos Itens da Primeira Revisão

### Item 1 — PostHog sem `onClose` (era Major) — CORRIGIDO

`posthog-plugin.ts` agora registra o hook `onClose` condicionalmente, somente quando o cliente é criado (linhas 15–19). A condicionalidade evita registrar o hook quando a variável de ambiente não está definida, o que é exatamente o comportamento esperado.

```typescript
if (client) {
  fastify.addHook('onClose', async () => {
    await client.shutdown();
  });
}
```

### Item 2 — Ausência de testes para `posthog-plugin.ts` (era Major) — CORRIGIDO

O arquivo `backend/test/plugins/posthog-plugin.test.ts` foi criado com 4 cenários:
- Decorator recebe instância de `PostHog` quando `POSTHOG_API_KEY` está definido.
- Decorator recebe `null` quando `POSTHOG_API_KEY` não está definido.
- `shutdown` é chamado no `onClose` quando o cliente está inicializado.
- `shutdown` não é chamado no `onClose` quando o cliente é `null`.

Os testes seguem o padrão AAA e usam mocks corretos para o módulo `posthog-node`.

### Item 3 — Mock de `activateMap` incompleto em `payment-routes.test.ts` (era Major) — CORRIGIDO

O mock de `activateMap` no teste `should return 200 and call activateMap when HMAC is valid and payment is approved` agora retorna um `MapRecord` completo com `id`, `token`, `coupleName`, `email`, `plan` e `status`. As asserções `expect(generateQrCode).toHaveBeenCalledWith('tok01')` e `expect(sendDeliveryEmail).toHaveBeenCalled()` foram adicionadas, validando o fluxo completo de entrega.

### Item 4 — Blocos `catch` silenciosos nos eventos PostHog (era Minor) — CORRIGIDO

Os 4 blocos `catch` que antes eram silenciosos agora loggam em nível `warn`:
- `map-routes.ts` linha 141: `request.log.warn({ error: error instanceof Error ? error.message : error }, 'PostHog capture failed')`
- `map-routes.ts` linha 237: mesma abordagem no handler de `POST /api/maps`
- `payment-service.ts` linha 90: `log.warn({ error: error instanceof Error ? error.message : error }, 'PostHog capture failed')`
- `payment-service.ts` linha 107: mesma abordagem no bloco `payment_failed`

### Item 5 — Objeto `error` bruto logado em `payment-service.ts` (era Minor) — CORRIGIDO

A linha 100 de `payment-service.ts` agora usa `error instanceof Error ? error.message : error` no campo de log, consistente com o padrão adotado em todo o projeto.

### Item 6 — Teste `payment_failed` ausente em `map-routes.test.ts` (era Minor) — CORRIGIDO

O caso de teste `should return 403 when map is in payment_failed status` foi adicionado ao `describe('GET /api/maps/by-token')` (linhas 456–464), incluindo a asserção de que `getLocationsByMapId` não é chamado para mapas neste status.

---

## Pontos Positivos

- **Cobertura de testes ampliada:** Com a adição de `posthog-plugin.test.ts` e os novos cenários em `map-routes.test.ts`, a suite passou de 100 para 105 testes, todos passando.
- **Logging consistente:** O padrão `error instanceof Error ? error.message : error` está agora aplicado uniformemente em todos os blocos `catch` do projeto.
- **Hook `onClose` condicional bem implementado:** O guard `if (client)` antes do `addHook` é a solução idiomática correta — evita registrar um hook que chama `client.shutdown()` quando `client` seria `null`.
- **Testes do plugin PostHog completos:** Os 4 cenários cobrem tanto os caminhos felizes quanto os de borda (sem API key), e o teste do `onClose` valida o comportamento de desligamento gracioso que era o objetivo do item 1.
- **Mock do `activateMap` corretamente tipado:** O retorno do mock agora reflete a assinatura real de `MapRecord`, eliminando o risco de `TypeError` em tempo de execução nos testes de integração.
- **Integração Sentry continua bem delimitada:** A inicialização condicional e o `captureException` restrito a erros `>= 500` estão inalterados e corretos.
- **Estrutura da resposta pública segura:** O endpoint `GET /api/maps/by-token` continua expondo apenas os campos necessários, sem vazar `email`, `token`, `pixCode` ou `paymentId`.

---

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Code Standards | ✅ |
| TypeScript/Node.js | ✅ |
| REST/HTTP | ✅ |
| Logging | ✅ |
| React | N/A |
| Tests | ✅ |

---

## Recomendações

Não há recomendações pendentes. Todos os pontos identificados na primeira revisão foram corretamente endereçados.

---

## Veredicto

A implementação está completa, correta e conforme todos os padrões do projeto. Todos os requisitos funcionais da tarefa estão implementados, todos os problemas da primeira revisão foram resolvidos, os 105 testes passam e a verificação de tipos não reporta erros. O código está aprovado para produção.
