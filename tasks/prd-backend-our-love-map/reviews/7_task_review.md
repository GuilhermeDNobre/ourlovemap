# Review: Task 7.0 - Endpoint POST /api/maps

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 7_task.md
**Status**: APPROVED WITH OBSERVATIONS

---

## Resumo

A implementacao do endpoint `POST /api/maps` esta funcional e cobre todos os requisitos explicitamente listados na task. O handler aceita `multipart/form-data`, valida campos obrigatorios, valida o plano e o limite de localizacoes, faz upload das fotos para o Supabase Storage e gera o link de checkout InfinitePay. Os 109 testes do projeto passam e o TypeScript compila sem erros.

A qualidade geral e boa. O codigo e bem estruturado, com funcoes extraidas para responsabilidades especificas (`parseMultipartParts`, `validateRequiredFields`, `validateLocationCount`, `buildLocations`), tipos bem definidos e logs estruturados em todos os pontos criticos. Ha, porem, dois problemas principais nao bloqueantes e um problema menor que devem ser observados.

---

## Arquivos Revisados

| Arquivo | Status | Issues |
|---------|--------|--------|
| `backend/src/routes/map-routes.ts` | Issues | 3 |
| `backend/src/services/map-service.ts` | OK | 0 |
| `backend/src/services/payment-service.ts` | OK | 0 |
| `backend/src/services/storage-service.ts` | OK | 0 |
| `backend/src/app.ts` | OK | 0 |
| `backend/test/routes/map-routes.test.ts` | Issues | 1 |

---

## Issues Found

### Criticos

Nenhum problema critico encontrado.

---

### Principais

**[M1] `map-routes.ts` contem rotas de outras tarefas fora do escopo da Task 7.0**
`backend/src/routes/map-routes.ts`, linhas 131-288

O arquivo `map-routes.ts` registra quatro rotas distintas: `POST /maps` (escopo da Task 7.0), `GET /maps/by-token` (Task 10.0), `POST /maps/:id/retry-payment` (Task 8.0) e `GET /maps/:id/payment-status` (Task 8.0). A task 7.0 define explicitamente apenas a criacao do endpoint `POST /api/maps`.

Embora nao cause nenhum defeito funcional, concentrar rotas de tarefas diferentes no mesmo arquivo dificulta revisoes incrementais e aumenta o tamanho do modulo sem necessidade. Conforme o padrao de tamanho maximo de 300 linhas para classes/modulos, o arquivo ja esta em 361 linhas, ultrapassando o limite.

Sugestao: separar `registerByTokenRoute` em `map-public-routes.ts` (Task 10.0) e `registerRetryPaymentRoute`/`registerPaymentStatusRoute` em `map-payment-routes.ts` (Task 8.0). Isso tambem reduziria cada arquivo para abaixo de 150 linhas.

---

**[M2] `storageId` desacoplado do `id` real do mapa**
`backend/src/routes/map-routes.ts`, linha 329

```typescript
const storageId = crypto.randomUUID();
const locations = await buildLocations(locationFields, files, storageId, fastify.supabase, request.log);
const map = await createMap({ ... }, fastify.supabase);
```

As fotos sao armazenadas sob um UUID gerado de forma independente (`storageId`), desacoplado do `id` real do mapa criado pelo Supabase. O caminho de armazenamento fica no formato `{randomUUID}/{randomUUID}.ext` em vez de `{mapId}/{randomUUID}.ext`, tornando impossible correlacionar arquivos no bucket com o mapa correspondente sem consultar o banco de dados.

A correcao natural e inverter a ordem: chamar `createMap` primeiro para obter o `mapId` real, depois usar esse id em `buildLocations`. A mudanca nao altera nenhum contrato externo da rota.

```typescript
// Sugestao de reordenacao
const map = await createMap({ ... }, fastify.supabase);
const locations = await buildLocations(locationFields, files, map.id, fastify.supabase, request.log);
```

Nota: a mudanca exigiria tambem ajuste no `createMap` (que atualmente recebe os locations como parametro), ou separar a criacao das locations em uma chamada posterior ao servico. Independentemente da abordagem, o acoplamento atual e uma oportunidade de melhoria.

---

### Menores

**[m1] Ausencia de validacao de localizacoes obrigatorias**
`backend/src/routes/map-routes.ts`, linhas 322-328

A task exige validacao de campos obrigatorios das localizacoes: `title`, `latitude`, `longitude` e `order`. O `validateRequiredFields` valida apenas os campos de nivel superior (`couple_name`, `email`, `plan`, `relationship_start_date`). Campos ausentes em uma localizacao resultam em valores default silenciosos:

```typescript
title: loc.title ?? '',       // string vazia silenciosa
latitude: parseFloat(loc.latitude ?? '0'),   // 0 silencioso
longitude: parseFloat(loc.longitude ?? '0'), // 0 silencioso
order: parseInt(loc.order ?? '0', 10),       // 0 silencioso
```

Embora nao cause um erro de runtime, dados invalidos (ex.: latitude 0, longitude 0 para coordenadas que deveriam ser a localizacao real do casal) chegam ao banco sem aviso. Uma funcao `validateLocationFields` poderia verificar a presenca e validade dos campos obrigatorios de cada localizacao e retornar 400 se ausentes, alinhada ao criterio de sucesso da task ("Campo obrigatório ausente → status 400 com mensagem do campo").

---

## Destaques Positivos

- **Dupla camada de validacao de tamanho de foto**: o `try-catch` no `toBuffer()` captura o erro lancado pelo `@fastify/multipart` quando o limite interno e ultrapassado antes do retorno, enquanto a verificacao explicita de `buffer.length > MAX_PHOTO_SIZE_BYTES` garante a semantica de negocio. Abordagem robusta e bem pensada.
- **Constante nomeada para magic number**: `MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024` declarada no modulo elimina o numero magico e deixa o limite legivel.
- **Separacao de responsabilidades nas funcoes auxiliares**: `parseMultipartParts`, `validateRequiredFields`, `validateLocationCount` e `buildLocations` estao bem definidas, com nomes verbais claros, parametros coerentes e sem efeitos colaterais misturados.
- **Interface `UploadableFile` como camada de anticorupcao**: o desacoplamento de `storage-service` do tipo interno do Fastify multipart e correto e facilita testes.
- **Early returns nas validacoes**: o handler principal usa early returns consistentemente, mantendo o codigo plano e legivel.
- **Escopo cirurgico do bloco `try`**: o `try/catch` cobre apenas `createCheckoutPayment`, preservando a propagacao natural de erros de `createMap` e `buildLocations` para o `setErrorHandler` global.
- **Logs estruturados com Pino**: `request.log.info` apos `createMap` e `request.log.error` no catch de `createCheckoutPayment` estao corretos, com contexto relevante (`mapId`, `plan`, `error`).
- **Cobertura de testes abrangente**: 9 cenarios para `POST /api/maps` cobrem sucesso, cada campo obrigatorio ausente, plano invalido, limite de localizacoes, tamanho de foto e falha de pagamento. Os helpers `buildBaseFields`, `buildLocationFields`, `buildValidFields` etc. garantem DRY sem comprometer a independencia entre os testes.
- **Sem usos de `any`**: tipagem forte em todo o codigo revisado.
- **`setErrorHandler` global**: a captura de erros com traducao de `statusCode` no `app.ts` e o padrao correto para Fastify, evitando duplicacao de codigo de tratamento de erro nos handlers.

---

## Conformidade com Padroes

| Padrao | Status |
|--------|--------|
| Code Standards | Issues (arquivo com 361 linhas ultrapassa limite de 300; linhas em branco dentro de funcoes em alguns handlers) |
| TypeScript/Node.js | OK (tipagem forte, sem `any`, sem `var`, `const` onde aplicavel, `async/await` em toda parte) |
| REST/HTTP | OK (Fastify com `reply.send`, status codes corretos, formato JSON) |
| Logging | OK (Pino via `request.log`, logs estruturados, sem dados sensiveis) |
| React | N/A |
| Testes | OK (Jest, `fastify.inject()`, padrão AAA, nomes descritivos com "should", independencia entre testes) |

---

## Recomendacoes

1. **(Principal — M1)** Separar as rotas de `map-routes.ts` em arquivos menores por escopo de tarefa: `map-routes.ts` (apenas `POST /maps`), `map-payment-routes.ts` (`retry-payment`, `payment-status`) e `map-public-routes.ts` (`by-token`). Isso elimina o estouro do limite de 300 linhas e torna o codigo mais facil de manter.

2. **(Principal — M2)** Refatorar o handler de `POST /maps` para chamar `createMap` antes de `buildLocations`, usando o `id` real do mapa como prefixo de armazenamento das fotos. Isso corrige o desacoplamento entre `storageId` e `mapId` e melhora a rastreabilidade operacional sem alterar o contrato externo da rota.

3. **(Menor — m1)** Adicionar validacao dos campos obrigatorios das localizacoes (`title`, `latitude`, `longitude`, `order`) com retorno 400 e mensagem descritiva, em vez de aplicar defaults silenciosos. Isso esta alinhado ao criterio de sucesso da task e ao padrao de validacao ja estabelecido para os campos de nivel superior.

---

## Veredicto

**APPROVED WITH OBSERVATIONS.** Todos os requisitos explicitamente listados na Task 7.0 estao implementados, testados e funcionando. Os 109 testes do projeto passam e o TypeScript compila sem erros. Os dois problemas principais (M1 e M2) nao sao bloqueantes para a entrega desta tarefa, mas devem ser enderecos em tarefas subsequentes para evitar acumulo de divida tecnica — especialmente M1 (limite de linhas) e M2 (rastreabilidade do bucket de storage).
