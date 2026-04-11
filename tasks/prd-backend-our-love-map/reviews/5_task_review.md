# Review: Task 5.0 - Map service (CRUD de mapas e localizacoes)

**Reviewer**: AI Code Reviewer
**Date**: 2026-04-11
**Task file**: 5_task.md
**Status**: APROVADO COM OBSERVACOES

---

## Resumo

A implementacao do `map-service.ts` foi reescrita completamente de Supabase para MongoDB via Mongoose e esta correta e funcional. Todas as funcoes exigidas pela task foram implementadas: `createMap`, `activateMap`, `setPaymentFailed`, `getMapByToken`, `getMapByOrderNsu`, `getPaymentStatus`, `updatePaymentData`, alem de `getMapById` e `getLocationsByMapId` adicionadas para atender os consumidores de rotas existentes. As interfaces TypeScript estao bem definidas sem uso de `any`. O `tsc --noEmit` passa sem erros e todos os 124 testes do projeto passam, incluindo os 22 testes do `map-service.test.ts`.

Ha tres problemas a serem observados: (1) o limite do plano `test` foi definido como 2 no codigo, mas a task especifica 7; (2) a funcao `expireMap` foi internalizada diretamente no corpo de `getMapByToken` em vez de ser extraida como funcao privada separada, como a task solicitava; (3) o `PLAN_LOCATION_LIMITS` esta duplicado entre `map-service.ts` e `map-routes.ts` com valores diferentes para o plano `test`, criando inconsistencia. Nenhum problema critico foi encontrado.

---

## Arquivos Revisados

| Arquivo | Status | Issues |
|---------|--------|--------|
| `backend/src/services/map-service.ts` | Problemas leves | 3 |
| `backend/test/services/map-service.test.ts` | OK | 0 |
| `backend/test/routes/map-routes.test.ts` | OK | 0 |
| `backend/test/plugins/swagger-plugin.test.ts` | OK | 0 |
| `backend/test/plugins/supabase-plugin-integration.test.ts` | OK | 0 |
| `backend/test/plugins/mongodb-plugin-integration.test.ts` | OK | 0 |
| `backend/test/routes/health-routes.test.ts` | OK | 0 |

---

## Problemas Encontrados

### Criticos

Nenhum problema critico encontrado.

---

### Principais

**[M1] Limite do plano `test` diverge da especificacao da task**

- Arquivo: `backend/src/services/map-service.ts`, linha 75
- Contexto: A task especifica explicitamente `test: 7` na constante `PLAN_LOCATION_LIMITS`. A implementacao usa `test: 2`:

```typescript
// task 5_task.md especifica:
const PLAN_LOCATION_LIMITS: Record<Plan, number> = { basic: 3, premium: 7, test: 7 }

// implementacao atual:
const PLAN_LOCATION_LIMITS: Record<Plan, number> = { basic: 3, premium: 7, test: 2 };
```

- Impacto: Qualquer fluxo de teste que use o plano `test` com mais de 2 localizacoes falhara com 422, mesmo que o comportamento esperado pelo produto seja permitir ate 7. O valor 2 nao esta documentado nem justificado.
- Correcao recomendada: ajustar para `test: 7` conforme especificado, ou documentar explicitamente a razao para o valor alternativo se for intencional (ex.: limite menor para facilitar testes de carga).

---

**[M2] `expireMap` nao foi extraida como funcao privada separada**

- Arquivo: `backend/src/services/map-service.ts`, linhas 178-185
- Contexto: A task exige que a logica de expiracao seja encapsulada em uma funcao `expireMap` privada (nao exportada) com a responsabilidade de atualizar o status para `expired`. A implementacao atual inlinou essa logica diretamente dentro de `getMapByToken`:

```typescript
// implementacao atual — logica inline dentro de getMapByToken
if (isExpired) {
  const expiredDoc = await MapModel.findByIdAndUpdate(
    doc._id,
    { status: 'expired' },
    { new: true },
  );
  return expiredDoc ? toMapRecord(expiredDoc) : toMapRecord(doc);
}
```

- A task especifica: _"A funcao `expireMap` (privada) atualiza status para `expired` no banco — nao deve ser exportada."_
- Impacto: violacao do principio de responsabilidade unica (SRP) e do padrao de efeitos colaterais da `code-standards.md` — `getMapByToken` realiza consulta e mutacao ao mesmo tempo. Se a logica de expiracao precisar ser reaproveitada em outro fluxo futuro (ex.: job de expiracao em lote), sera necessario duplicar o codigo.
- Correcao recomendada:

```typescript
async function expireMap(mapId: Types.ObjectId): Promise<MapRecord | null> {
  const expiredDoc = await MapModel.findByIdAndUpdate(
    mapId,
    { status: 'expired' },
    { new: true },
  );
  return expiredDoc ? toMapRecord(expiredDoc) : null;
}

export async function getMapByToken(token: string): Promise<MapRecord | null> {
  const doc = await MapModel.findOne({ token });
  if (!doc) return null;
  const now = new Date();
  const isExpired = doc.expiresAt !== undefined && doc.expiresAt < now && doc.status === 'active';
  if (isExpired) {
    const expired = await expireMap(doc._id);
    return expired ?? toMapRecord(doc);
  }
  return toMapRecord(doc);
}
```

---

### Menores

**[m1] Constante `PLAN_LOCATION_LIMITS` duplicada com valores inconsistentes**

- Arquivos: `backend/src/services/map-service.ts` linha 75 e `backend/src/routes/map-routes.ts` linha 15
- Contexto: A constante existe em dois lugares com valores divergentes para o plano `test` (2 no servico, ausente na rota) e formatos de tipo distintos (`Record<Plan, number>` no servico, `Record<string, number>` na rota). A rota tambem omite o plano `test` de sua copia da constante:

```typescript
// map-service.ts
const PLAN_LOCATION_LIMITS: Record<Plan, number> = { basic: 3, premium: 7, test: 2 };

// map-routes.ts
const PLAN_LOCATION_LIMITS: Record<string, number> = { basic: 3, premium: 7 };
```

- Impacto: As verificacoes de limite na rota e no servico podem produzir resultados diferentes para o plano `test`. O principio DRY e violado — qualquer alteracao futura nos limites precisara ser feita em dois lugares.
- Correcao recomendada: exportar a constante de `map-service.ts` e importa-la em `map-routes.ts`, eliminando a duplicacao.

**[m2] Inconsistencia de contrato: retorno `MapRecord` vs `MapDocument` definido na techspec**

- Arquivo: `backend/src/services/map-service.ts`
- Contexto: A techspec define a interface `MapService` com retorno `Promise<MapDocument>` para `createMap`, `activateMap`, `getMapByOrderNsu` e `getMapByToken`. A implementacao retorna `MapRecord` (uma projecao plana e serializada do documento). O `MapRecord` e uma decisao de design melhor (isola os consumidores da API do Mongoose `Document`), mas diverge formalmente do contrato definido na techspec.
- Impacto: baixo para o MVP — os consumidores (`payment-service.ts`, `map-routes.ts`) funcionam corretamente com `MapRecord`. Porem, se a techspec for usada como referencia para futuros desenvolvedores, a divergencia pode causar confusao.
- Correcao recomendada: atualizar a `techspec.md` para refletir o tipo real retornado (`MapRecord`) ou renomear `MapRecord` para `MapDto` para deixar a intencao mais clara.

**[m3] Ausencia de atomicidade em `createMap` (criacao de mapa + localizacoes)**

- Arquivo: `backend/src/services/map-service.ts`, linhas 124-148
- Contexto: O `MapModel.create` e o `LocationModel.insertMany` sao duas operacoes MongoDB separadas sem uso de sessao/transacao. Se o `insertMany` falhar apos o `create` ter persistido, o banco ficara com um documento `Map` orfao sem localizacoes.
- Impacto: medio em producao — pode gerar mapas inutilizaveis no banco sem localizacoes, exigindo limpeza manual. O risco e baixo se `insertMany` raramente falhar, mas e uma fragilidade conhecida.
- Correcao recomendada (longo prazo): envolver as duas operacoes em uma sessao MongoDB com `session.withTransaction()`. Para o MVP, ao menos adicionar um log de erro claro se o `insertMany` falhar apos o `create` ter sucesso, para facilitar a limpeza manual.

---

## Destaques Positivos

- **Sem `any` em nenhuma parte do codigo.** Todas as tipagens usam tipos reais — `MapDocument`, `LocationDocument`, `MapRecord`, `Plan`, `MapStatus`, `MapPaymentStatus`, `PaymentData`. O `tsc --noEmit` passa sem erros.
- **Mappings `toMapRecord` e `toLocation` bem encapsulados.** As funcoes de conversao isolam os consumidores do documento Mongoose, entregando POJOs serializaveis com tipos corretos. O tratamento de `undefined` via `?? null` e consistente em todos os campos opcionais.
- **Constantes nomeadas, sem magic numbers.** `PLAN_LOCATION_LIMITS`, `BASIC_PLAN_EXPIRY_DAYS` e `ONE_DAY_IN_MS` eliminam todos os literais numericos do codigo de logica de negocio.
- **`activateMap` usa `findByIdAndUpdate` com `{ new: true }` corretamente**, evitando um terceiro round-trip ao banco e garantindo que o documento retornado reflita o estado apos a atualizacao.
- **Cobertura de testes excelente.** Os 22 testes cobrem todas as funcoes exportadas — incluindo `getMapById`, `getLocationsByMapId`, `getPaymentStatus` e `updatePaymentData` que nao eram obrigatorias pela task mas foram testadas igualmente. Os helpers `buildMockMapDoc` e `buildMockLocationDoc` evitam repeticao de setup.
- **Estrutura AAA/GWT respeitada.** Todos os testes seguem a estrutura Arrange-Act-Assert sem mistura de responsabilidades dentro de cada caso.
- **Migracao dos testes existentes feita corretamente.** Os arquivos de teste que dependiam de mocks do Supabase foram atualizados para mocks do Mongoose com a estrutura correta (`Schema`, `Types`, `model`, `connect`, `disconnect`), restaurando os 124 testes para verde.
- **`getMapByOrderNsu` delega para `getMapById`** de forma clara e sem duplicacao, refletindo a semantica correta de que `order_nsu` == `mapId` no contexto InfinitePay.
- **Arquivo dentro dos limites de tamanho.** 215 linhas, abaixo do limite de 300 da `code-standards.md`. Nenhuma funcao individual passa de 35 linhas.
- **Sem `console.log`.** O servico nao faz logging proprio, o que e correto para uma camada de servico puro — o logging e responsabilidade das camadas de rota.

---

## Conformidade com Padroes

| Padrao | Status |
|--------|--------|
| Code Standards | Problema leve — `expireMap` nao extraida como funcao privada (M2); constante duplicada (m1) |
| TypeScript/Node.js | OK — sem `any`, sem `var`, `const` em todo lugar, imports ESM, `tsc` limpo |
| REST/HTTP | N/A — nenhuma rota implementada nesta tarefa |
| Logging | OK — servico puro sem logging proprio (correto para este nivel) |
| React | N/A |
| Testes | OK — 22 testes, cobertura completa de todas as funcoes exportadas |

---

## Recomendacoes

1. **(Principal — corrigir antes de usar o plano `test` em qualquer fluxo real)** Ajustar `test: 2` para `test: 7` em `PLAN_LOCATION_LIMITS` no `map-service.ts` para alinhar com a especificacao da task. Se o valor 2 for intencional, documentar o motivo com um comentario.

2. **(Principal — boas praticas de design)** Extrair a logica de expiracao como funcao `expireMap` privada conforme exigido pela task, separando a consulta da mutacao dentro de `getMapByToken` e alinhando com o principio de efeito colateral unico do `code-standards.md`.

3. **(Menor — DRY)** Exportar `PLAN_LOCATION_LIMITS` de `map-service.ts` e importar em `map-routes.ts` para eliminar a duplicacao e a inconsistencia de valores.

4. **(Menor — clareza de contrato)** Atualizar a `techspec.md` para refletir que as funcoes do `map-service.ts` retornam `MapRecord` (nao `MapDocument`), ou adicionar um comentario explicativo no arquivo de servico.

5. **(Informacional — longo prazo)** Envolver `MapModel.create` + `LocationModel.insertMany` em uma sessao MongoDB com `session.withTransaction()` para garantir atomicidade e evitar documentos orfaos em caso de falha parcial.

---

## Situacao de Conclusao da Task

### O que foi completado

- [x] 5.1 `map-service.ts` com todas as funcoes requeridas: `createMap`, `activateMap`, `setPaymentFailed`, `getMapByToken`, `getMapByOrderNsu`, `getPaymentStatus`, `updatePaymentData`
- [x] 5.2 Interfaces TypeScript: `CreateMapData`, `MapRecord`, `LocationInput`, `Location`, `MapPaymentStatus`, `PaymentData` (+ re-exports de `MapStatus`, `Plan`)
- [x] 5.3 Testes unitarios — todos os 10 casos obrigatorios da task estao presentes e passando; cobertura completa de todas as funcoes exportadas

### O que esta faltando ou incompleto

- [ ] Limite do plano `test` incorreto (`2` em vez de `7` conforme a task)
- [ ] `expireMap` nao extraida como funcao privada separada (logica inlinet em `getMapByToken`)

### Proximos passos para finalizar a task

1. Corrigir `test: 2` para `test: 7` em `PLAN_LOCATION_LIMITS`
2. Extrair `expireMap` como funcao privada separada dentro de `map-service.ts`
3. Exportar `PLAN_LOCATION_LIMITS` e importar em `map-routes.ts` (melhoria opcional)
4. Executar `npm test` para confirmar que todos os 124 testes continuam passando
5. Executar `npx tsc --noEmit` para confirmar tipagem limpa

---

## Veredicto

A implementacao da task 5.0 esta substancialmente correta. A migracao de Supabase para MongoDB foi executada com qualidade: sem uso de `any`, tipagem forte, zero erros de compilacao, e 22 testes com cobertura completa de todas as funcoes. Os criterios de sucesso da task foram todos atendidos em termos de comportamento. Os dois problemas principais — o limite incorreto do plano `test` e a ausencia da funcao privada `expireMap` — sao correcoes rapidas que podem ser feitas sem risco de regressao. O status `APROVADO COM OBSERVACOES` reflete que o codigo e seguro para prosseguir com as tasks subsequentes, mas as correcoes acima devem ser aplicadas antes de marcar a task como concluida definitivamente.
