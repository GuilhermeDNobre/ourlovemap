# Review: Task 7.0 - Endpoint POST /api/maps

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 7_task.md
**Status**: APPROVED WITH OBSERVATIONS

---

## Resumo

Esta e a terceira e final iteracao de revisao do endpoint `POST /api/maps`. Todos os problemas criticos e principais das revisoes anteriores foram corrigidos. O unico requisito que permanecia pendente — validacao de tamanho de foto (≤ 5MB) com retorno 400 — foi implementado com dupla camada de defesa (`try-catch` no `toBuffer()` para o caso em que o `@fastify/multipart` lanca 413 antes do retorno, mais verificacao explicita de `buffer.length`) e coberto por um teste dedicado. O codigo esta funcional, tipado de forma correta, com 71 testes passando e TypeScript compilando sem erros.

Permanece um ponto menor de design nao bloqueante: o `storageId` usado como prefixo das fotos e um UUID gerado no momento do upload, desacoplado do `id` real do mapa gerado pelo Supabase. Isso nao afeta o comportamento externo nem viola qualquer regra de negocio da task.

---

## Arquivos Revisados

| Arquivo | Status | Issues |
|---------|--------|--------|
| `src/routes/map-routes.ts` | OK | 0 |
| `src/services/storage-service.ts` | OK | 0 |
| `test/routes/map-routes.test.ts` | OK | 0 |

---

## Issues Found

### Criticos

Nenhum problema critico encontrado.

---

### Principais

Nenhum problema principal encontrado.

---

### Menores

**[m2] `storageId` UUID desacoplado do `id` real do mapa**
`src/routes/map-routes.ts`, linha 133

O `storageId` gerado com `crypto.randomUUID()` e usado como prefixo do caminho de armazenamento das fotos, mas nao corresponde ao `id` real do mapa no banco (gerado pelo Supabase). As fotos ficam em `{storageId}/{uuid}.ext`, enquanto o mapa tem um `id` diferente, o que dificulta rastreabilidade e auditoria operacional.

A correcao natural seria reordenar o handler para chamar `createMap` antes de `buildLocations`, usando o `id` real como prefixo — sem alterar o comportamento externo da rota. Este ponto nao e bloqueante pois nenhuma regra de negocio da task exige essa correspondencia.

---

## Verificacao dos Fixes Desta Iteracao

| Fix | Descricao | Status |
|-----|-----------|--------|
| M3 | Constante `MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024` declarada no modulo | Confirmado |
| M3 | `toBuffer()` encapsulado em `try-catch` que converte qualquer erro em `statusCode: 400` | Confirmado |
| M3 | Verificacao explicita de `buffer.length > MAX_PHOTO_SIZE_BYTES` como segunda camada | Confirmado |
| M3 | Teste `should return 400 when photo exceeds 5MB size limit` adicionado e passando | Confirmado |

---

## Verificacao Acumulada de Todos os Fixes

| Fix | Descricao | Status |
|-----|-----------|--------|
| C1 | `validateLocationCount` antes de `buildLocations`/`uploadPhoto` | Confirmado |
| C2 | `UploadableFile` exportada; cast `as unknown` removido | Confirmado |
| C3 | `request.log.error` no `catch` de `createPixPayment` | Confirmado |
| M2 | `request.log.info` apos `createMap` | Confirmado |
| M3 | Validacao de tamanho de foto (≤ 5MB) implementada e testada | Confirmado |
| M4 | Teste de 4 localizacoes envia dados reais e verifica que mocks nao foram chamados | Confirmado |
| M5 | Teste de sucesso verifica chamadas com parametros corretos | Confirmado |
| m1 | Radix 10 em todos os `parseInt` | Confirmado |
| m3 | Teste de `relationship_start_date` ausente adicionado | Confirmado |

---

## Destaques Positivos

- A dupla camada de validacao de tamanho e tecnicamente correta: o `try-catch` no `toBuffer()` cobre o comportamento real do `@fastify/multipart` (lancamento de erro com `statusCode: 413` ao ultrapassar o limite interno antes de retornar), enquanto a verificacao de `buffer.length` garante a semantica de negocio mesmo que o limite interno do plugin seja configurado com valor maior.
- A constante `MAX_PHOTO_SIZE_BYTES` esta declarada no nivel de modulo com um nome descritivo, eliminando o magic number em conformidade com os padroes de codificacao.
- O teste de tamanho envia dados reais de 5MB+1 byte via `buildMultipartBody`, exercitando o caminho de parse completo sem depender de mocks do modulo de parse.
- Todos os 71 testes do projeto passam. TypeScript compila sem erros (`tsc --noEmit` limpo).
- O design de `UploadableFile` como interface estreita (`mimetype` + `toBuffer`) mantém o desacoplamento de `storage-service` do tipo interno do Fastify multipart.
- O escopo do bloco `try` cobre apenas `createPixPayment`, preservando a propagacao natural de erros de `createMap` e `buildLocations` para o `setErrorHandler` global.
- Os helpers de teste `buildBaseFields`, `buildLocationFields`, `buildValidFields`, `buildValidFile` e `buildDefaultPixResult` garantem DRY e legibilidade sem comprometer a independencia entre os testes.

---

## Conformidade com Padroes

| Padrao | Status |
|--------|--------|
| Code Standards | OK |
| TypeScript/Node.js | OK (tipagem forte, sem `any`, sem `var`, `const` onde aplicavel) |
| REST/HTTP | OK |
| Logging | OK (logs estruturados com Pino em todos os pontos criticos) |
| React | N/A |
| Testes | OK (9 cenarios cobrindo sucesso, todos os campos obrigatorios, plano invalido, limite de localizacoes, tamanho de foto, tipo de foto e falha de pagamento) |

---

## Recomendacoes

1. **(Menor — m2)** Em uma iteracao futura, considerar refatorar o handler para chamar `createMap` antes de `buildLocations`, usando o `id` real do mapa como prefixo de armazenamento das fotos. Isso melhora a rastreabilidade operacional sem alterar o contrato externo da rota.

---

## Veredicto

**APPROVED WITH OBSERVATIONS.** Todos os requisitos explicitamente listados na task estao implementados e testados, incluindo a validacao de tamanho de foto (≤ 5MB → 400) exigida pelo criterio de sucesso. Nenhum problema critico ou principal foi identificado. O unico ponto pendente e menor e de design (m2, desacoplamento do `storageId`), sem impacto funcional imediato. O codigo esta pronto para integracao.
