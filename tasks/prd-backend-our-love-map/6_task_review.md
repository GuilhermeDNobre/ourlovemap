# Review: Task 6.0 - Payment Service (PIX via Mercado Pago)

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 6_task.md
**Status**: APPROVED

---

## Summary

Esta é uma re-revisão pós-correção. Os quatro problemas identificados na revisão anterior foram corrigidos corretamente. A implementação de `payment-service.ts` está funcionalmente correta, bem tipada e aderente a todos os padrões do projeto. Todos os 7 testes obrigatórios da tarefa passam, a suíte completa de 62 testes continua passando, e o compilador TypeScript não reporta erros.

---

## Verificação das Correções Aplicadas

### Correção 1 — `getMapByPaymentId` extraído antes do condicional (era MAJOR-1)

**Status: Correta.**

A chamada a `getMapByPaymentId` foi movida para a linha 78, após o early return para status desconhecidos (linha 77) e antes do condicional `if (paymentStatus === 'approved')`. O fluxo resultante é correto e elimina a duplicação anterior: a busca do mapa ocorre exatamente uma vez, apenas quando o status é acionável, e o resultado é compartilhado pelos dois branches.

```
status desconhecido → log.warn + return (linha 74–77)
getMapByPaymentId (linha 78) ← executado uma única vez
!map → return silencioso (linha 79)
approved → activateMap (linha 80–81)
rejected | cancelled → setPaymentFailed (linha 82–83)
```

### Correção 2 — Asserção `log.warn` no teste de status desconhecido (era MINOR-1)

**Status: Correta.**

O teste "should not call activateMap or setPaymentFailed and should log warn for unknown status" agora verifica positivamente que `log.warn` foi chamado com o contexto esperado:

```typescript
expect(log.warn as jest.Mock).toHaveBeenCalledWith(
  expect.objectContaining({ paymentStatus: 'in_process', paymentId: 'pay-123' }),
  'Webhook event ignored',
);
```

O teste mantém as verificações de negação (`activateMap` e `setPaymentFailed` não chamados) e adiciona a verificação positiva do comportamento esperado. O `log` é instanciado localmente via `buildMockLog()` dentro do `it`, o que garante isolamento.

### Correção 3 — Asserção do offset de 15 minutos em `createPixPayment` (era MINOR-2)

**Status: Correta.**

O teste agora captura `before = Date.now()` antes da chamada e `after = Date.now()` depois, e verifica que `paymentExpiresAt.getTime()` está dentro do intervalo `[before + 15min, after + 15min]`:

```typescript
const before = Date.now();
const result = await createPixPayment(params, buildMockSupabase());
const after = Date.now();
// ...
const expectedMin = before + 15 * 60 * 1000;
const expectedMax = after + 15 * 60 * 1000;
expect(result.paymentExpiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
expect(result.paymentExpiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
```

Esta abordagem de intervalo é tecnicamente robusta e não depende de mock de `Date` — funciona corretamente porque a execução do teste é suficientemente rápida para que `after - before` seja próximo de zero. O critério de sucesso explícito da tarefa ("date_of_expiration = criação + 15 min") agora está coberto por assert.

Observação: a sugestão secundária da revisão anterior — verificar que `date_of_expiration` passado ao SDK seja igual a `result.paymentExpiresAt.toISOString()` — não foi implementada. Isso é aceitável; tratava-se de uma sugestão opcional ("Também seria adequado..."), e a cobertura do critério principal já está garantida.

### Correção 4 — `supabase` instanciado localmente em cada teste (era MINOR-3)

**Status: Correta.**

A variável `supabase` compartilhada no escopo do `describe('processWebhookEvent')` foi eliminada. Cada `it` dos quatro testes do grupo agora instancia `const supabase = buildMockSupabase()` localmente, alinhando-se ao princípio de independência de testes definido em `tests.md`.

---

## Files Reviewed

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `src/services/payment-service.ts` | ✅ OK | 0 |
| `test/services/payment-service.test.ts` | ✅ OK | 0 |

---

## Issues Found

### Problemas Criticos

Nenhum problema crítico encontrado.

### Problemas Maiores

Nenhum problema maior encontrado.

### Problemas Menores

Nenhum problema menor encontrado.

---

## Positive Highlights

- **Deduplicacao correta em `processWebhookEvent`**: a busca do mapa ocorre uma única vez, após o filtro de status acionáveis, com early return limpo para o caso `!map`.
- **Cobertura comportamental completa**: todos os 7 caminhos exigidos pela tarefa estão cobertos com asserções positivas e negativas.
- **Asserção de offset de 15 minutos com intervalo**: a abordagem `[before + 15min, after + 15min]` é correta e determinista sem necessitar de mock de `Date`.
- **Independencia de testes**: cada `it` instancia seus próprios mocks localmente, eliminando acoplamento de estado entre testes.
- **Tipagem rigorosa**: nenhum uso de `any`; interfaces `CreatePixPaymentParams`, `PixPaymentResult` e `MercadoPagoEvent` bem definidas e exportadas.
- **Constantes nomeadas**: `PLAN_PRICES` e `PIX_EXPIRATION_MINUTES` eliminam magic numbers.
- **Logger injetado como parametro**: `FastifyBaseLogger` é recebido como argumento em `processWebhookEvent`, garantindo testabilidade e evitando acoplamento global.
- **Sem `console.log`**: 100% de aderencia a regra de logging.
- **Funcoes dentro do limite de tamanho**: `createPixPayment` (22 linhas) e `processWebhookEvent` (18 linhas), ambas abaixo do limite de 50 linhas.
- **Sem linhas em branco dentro de funcoes**: aderencia ao padrao de formatacao.
- **Erro relancado corretamente**: `createPixPayment` nao suprime erros do SDK, permitindo que o caller trate com 422.

---

## Standards Compliance

| Padrao | Status |
|--------|--------|
| Code Standards | ✅ |
| TypeScript/Node.js | ✅ |
| REST/HTTP | N/A |
| Logging | ✅ |
| React | N/A |
| Tests | ✅ |

---

## Verdict

A tarefa 6.0 esta **APROVADA**. Todas as quatro correcoes solicitadas na revisao anterior foram aplicadas corretamente. A implementacao esta funcionalmente correta, bem tipada, livre de code smells e com cobertura de testes completa para todos os caminhos definidos pela tarefa. O codigo esta pronto para producao.
