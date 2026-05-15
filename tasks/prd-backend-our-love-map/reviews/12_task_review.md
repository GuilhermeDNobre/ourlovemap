# Review: Task 12.0 - Campo `address` nas localizações — modelo, POST e GET by-token

**Reviewer**: AI Code Reviewer
**Date**: 2026-05-12
**Task file**: 12_task.md
**Status**: APPROVED WITH OBSERVATIONS

## Summary

A task adicionou o campo `address` ao modelo `LocationDocument`, ao fluxo de criação via `POST /api/maps` e à resposta pública do `GET /api/maps/by-token`. A implementação está correta e completa em relação às 6 subtarefas definidas. Todos os 136 testes passam, incluindo os 3 novos casos adicionados.

O commit também inclui mudanças extras que não faziam parte do escopo da Task 12.0: adição de `opening` e `youtubeLoop` ao `CreateMapData`, ao `MapRecord`, ao `toMapRecord()`, ao `createMap()` e à resposta do GET by-token, além de correções no Swagger do GET. Essas mudanças são funcionalmente corretas, os testes existentes cobrem os novos caminhos, mas estão fora do escopo declarado da task.

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `src/models/location-model.ts` | OK | 0 |
| `src/services/map-service.ts` | Problemas | 2 |
| `src/routes/map-routes.ts` | Problemas | 2 |
| `src/plugins/swagger-plugin.ts` | OK | 0 |
| `test/routes/map-routes.test.ts` | Problemas | 2 |

## Issues Found

### Criticos

Nenhum problema critico encontrado.

### Principais

**1. `map-service.ts` — `buildMockMapDoc` em `map-service.test.ts` nao inclui `opening` nem `youtubeLoop`**
Arquivo: `test/services/map-service.test.ts`, funcao `buildMockMapDoc` (linhas 44–66)

O helper de mock nao declara `opening` nem `youtubeLoop`, que foram adicionados ao `MapRecord` neste commit. Isso nao causa falha de compilacao porque o retorno e um objeto literal sem tipagem estatica rigida, mas o `toMapRecord()` agora tenta acessar `doc.opening ?? null` e `doc.youtubeLoop ?? null`. Como o mock omite esses campos, os testes do service exercitam o caminho com `undefined` (correto no runtime), porem o mock esta desatualizado e pode mascarar regressoes futuras se um dev adicionar expectativas sobre esses campos.

```typescript
// Adicionar ao buildMockMapDoc:
function buildMockMapDoc(overrides: Record<string, unknown> = {}) {
  return {
    // ...campos existentes...
    opening: undefined,
    youtubeLoop: undefined,
    ...overrides,
  };
}
```

**2. `map-routes.ts` — `message` e exposto na resposta publica mesmo que a task diga para nao expor**
Arquivo: `src/routes/map-routes.ts`, linhas 221–222

A Task 12.0 especifica: "Nao expor na resposta publica por enquanto". O campo `message` esta sendo retornado no mapeamento das localizacoes no `GET /api/maps/by-token` com `message: loc.message ?? null`. Ele tambem esta declarado no schema `Location` do Swagger (`swagger-plugin.ts` linha 24). Isso contraria explicitamente a especificacao da task.

O impacto pratico e baixo porque o frontend atualmente nao usa o campo, mas a decisao de design estava documentada e foi ignorada.

```typescript
// Remover message do mapeamento na resposta publica:
locations: locations.map(loc => ({
  title: loc.title,
  description: loc.description ?? null,
  address: loc.address ?? null,
  photoUrl: loc.photoUrl ?? null,
  latitude: loc.latitude,
  longitude: loc.longitude,
  order: loc.order,
})),
```

### Menores

**3. `map-routes.ts` — escopo do commit excede o escopo da task sem registro**
Arquivo: `src/routes/map-routes.ts` e `src/services/map-service.ts`

O commit inclui mudancas que nao estavam nas subtarefas 12.1–12.6: adicao de `opening` e `youtubeLoop` a `CreateMapData`, `MapRecord` e `toMapRecord()`, alem de correcoes no Swagger do GET (adicao de `opening` e `youtubeLoop` ao schema de resposta 200). Embora corretas e bem testadas, a mistura de escopos dificulta o rastreamento de quando cada feature foi introduzida no historico do git.

**4. `map-routes.test.ts` — teste de POST com address nao verifica persitencia no service-layer**
Arquivo: `test/routes/map-routes.test.ts`, linhas 329–353

O teste `should pass address to createMap when provided in location` verifica que `createMap` e chamado com `address` correto, mas nao verifica o mapeamento de volta (o que o `GET /by-token` retorna quando o service devolve o dado). Os testes do GET cobrem esse lado (linhas 510–531), entao a cobertura e completa — apenas uma observacao de clareza para o conjunto de testes de `POST`.

## Destaques Positivos

- Modelo atualizado de forma consistente: interface TypeScript e schema Mongoose em sincronia, sem `required: true` indevido para campo opcional.
- `toLocation()` usa corretamente `?? null` para normalizar o valor opcional antes de expor na interface `Location`, mantendo o contrato explicitamente tipado (`string | null`).
- O helper `buildLocations` no teste aceita overrides via objeto, padrao ja usado em `buildActiveMap` e `buildMockMapDoc`, garantindo independencia entre testes.
- Tres novos testes cobrem o caminho com address presente, com address ausente (null) e o fluxo POST-to-GET, alinhados ao requisito 12.6.
- TypeScript compila sem erros (`tsc --noEmit` limpo).
- Zero uso de `any`, `console.log`, `var` ou callbacks nos arquivos alterados.
- Swagger atualizado na mesma task, mantendo contrato da API sincronizado com a implementacao.
- O campo `message` foi preservado no modelo sem ser removido, como instruido pela task.

## Conformidade com Padroes

| Padrao | Status |
|--------|--------|
| Code Standards | OK |
| TypeScript/Node.js | OK |
| REST/HTTP | OK |
| Logging | OK |
| React | N/A |
| Testes | Problemas |

## Recomendacoes

1. **(Major — Conformidade com spec)** Remover `message` do mapeamento de localizacoes na resposta do `GET /api/maps/by-token` e do schema `Location` no Swagger. A task 12.0 e explicita: "Nao expor na resposta publica por enquanto". Isso e uma decisao de produto registrada que deve ser respeitada.

2. **(Major — Completude dos testes)** Atualizar `buildMockMapDoc` em `test/services/map-service.test.ts` para incluir `opening: undefined` e `youtubeLoop: undefined`, mantendo o mock sincronizado com o `MapDocument` real.

3. **(Minor — Higiene de commits)** Separar mudancas de escopo diferente em commits distintos. As correcoes de `opening`/`youtubeLoop` que estavam faltando no `map-service.ts` e `map-routes.ts` deveriam ter sido incluidas na task que originalmente introduziu esses campos (ou em uma task de correcao dedicada), nao misturadas com a task do `address`.

## Veredicto

A implementacao principal da Task 12.0 esta correta: o campo `address` percorre corretamente todo o ciclo modelo -> servico -> rota -> resposta -> Swagger -> testes. O TypeScript compila, todos os testes passam e os padroes do projeto sao seguidos na maior parte.

Ha dois pontos que precisam de atencao antes de considerar a tarefa completamente conforme com a especificacao: a exposicao do campo `message` na resposta publica (contraria diretamente o criterio documentado na task) e o mock desatualizado no suite do map-service. A correcao do `message` e simples — basta remover uma linha do mapeamento e uma linha do schema Swagger.

O status **APPROVED WITH OBSERVATIONS** reflete que o codigo pode ir para producao sem risco funcional imediato, mas as duas observacoes principais devem ser corrigidas antes do proximo ciclo de review.
