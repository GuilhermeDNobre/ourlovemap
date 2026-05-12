# Review: Task 11.0 - Campos `opening` e `youtubeLoop` — modelo, POST e GET by-token

**Reviewer**: AI Code Reviewer  
**Date**: 2026-05-12  
**Task file**: 11_task.md  
**Status**: APPROVED WITH OBSERVATIONS

---

## Summary

A implementação adicionou corretamente os campos `opening` (string opcional) e `youtubeLoop` (boolean opcional) ao modelo Mongoose, ao serviço de mapa e às rotas POST `/api/maps` e GET `/api/maps/by-token`. A mudança é cirúrgica, coerente e não quebrou nenhum dos 131 testes existentes. Todos os 4 novos testes passam. A compilação TypeScript (`tsc --noEmit`) é limpa.

Os problemas encontrados são de baixa severidade: uma inconsistência de estilo no `reply.send()` do GET by-token, a ausência de testes para `youtube_loop=false` e para `opening` vazia/branca, e dois detalhes menores de padrões de projeto.

---

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `src/models/map-model.ts` | OK | 0 |
| `src/services/map-service.ts` | OK | 0 |
| `src/routes/map-routes.ts` | Issues | 2 |
| `test/routes/map-routes.test.ts` | Issues | 2 |

---

## Issues Found

### Criticos

Nenhum problema crítico encontrado.

### Maiores

Nenhum problema maior encontrado.

### Menores

**1. Inconsistência de `?? null` no `reply.send()` do GET by-token**  
Arquivo: `src/routes/map-routes.ts`, linhas 213–215

Os campos `youtubeVideoId`, `youtubeStartTime` e `youtubeEndTime` são enviados sem o operador `?? null`, enquanto `opening` (linha 211) e `youtubeLoop` (linha 216) usam `?? null` corretamente. Na prática não é um bug — `MapRecord` já tipifica esses campos como `string | null` / `number | null` e `toMapRecord()` normaliza tudo para `null`. Mas a inconsistência de estilo pode causar confusão futura e foi introduzida indiretamente por esta task ao adicionar os dois novos campos com o operador e manter os pré-existentes sem.

```typescript
// Atual (inconsistente)
youtubeVideoId: map.youtubeVideoId,
youtubeStartTime: map.youtubeStartTime,
youtubeEndTime: map.youtubeEndTime,

// Sugerido (consistente com opening e youtubeLoop)
youtubeVideoId: map.youtubeVideoId ?? null,
youtubeStartTime: map.youtubeStartTime ?? null,
youtubeEndTime: map.youtubeEndTime ?? null,
```

---

**2. Cobertura de testes incompleta para `youtubeLoop` e `opening`**  
Arquivo: `test/routes/map-routes.test.ts`

Dois comportamentos de negócio não estão cobertos:

- `youtube_loop=false` deve resultar em `youtubeLoop: false` passado para `createMap()`. Apenas `'true'` é testado; o branch `false` da conversão ternária fica descoberto.
- `opening` com string vazia (`''`) — a rota usa `fields.opening || undefined`, que converte string vazia para `undefined`. Este comportamento silencioso não é explicitamente testado.

```typescript
// Sugestão de teste para youtube_loop=false
it('should pass youtubeLoop false to createMap when youtube_loop is "false"', async () => {
  const app = buildApp();
  (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });

  const fields = { ...buildValidFields(), youtube_loop: 'false' };
  await app.inject({
    method: 'POST',
    url: '/api/maps',
    headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
    payload: buildMultipartBody(fields),
  });

  expect(createMap).toHaveBeenCalledWith(
    expect.objectContaining({ youtubeLoop: false }),
  );
});

// Sugestão de teste para opening vazia
it('should not pass opening to createMap when opening is empty string', async () => {
  const app = buildApp();
  (createMap as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment' });

  const fields = { ...buildValidFields(), opening: '' };
  await app.inject({
    method: 'POST',
    url: '/api/maps',
    headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
    payload: buildMultipartBody(fields),
  });

  expect(createMap).toHaveBeenCalledWith(
    expect.objectContaining({ opening: undefined }),
  );
});
```

---

**3. `opening: fields.opening || undefined` pode suprimir strings com espaços em branco de forma implícita**  
Arquivo: `src/routes/map-routes.ts`, linha 283

O operador `||` converte string vazia para `undefined`, o que é uma intenção razoável, mas também converte `'   '` (só espaços) para uma string com conteúdo no MongoDB se o frontend enviar algo assim. Se a intenção for descartar valores sem texto visível, o ideal seria `fields.opening?.trim() || undefined`. Este item é cosmético, pois o frontend não tem esse caso de uso documentado.

---

**4. Teste de POST com `opening` não verifica o status code da resposta**  
Arquivo: `test/routes/map-routes.test.ts`, linha 247

O teste `should pass opening to createMap when provided` foca apenas na asserção do mock `createMap`, sem verificar que a resposta HTTP foi `200`. Embora não seja crítico (o comportamento HTTP já é coberto pelo teste geral), falta consistência com o padrão AAA completo adotado nos outros testes do arquivo.

```typescript
// Adicionar após o inject:
expect(response.statusCode).toBe(200);
```

---

## Destaques Positivos

- Os dois campos foram adicionados em todas as camadas relevantes de forma consistente: `MapDocument`, `mapSchema`, `CreateMapData`, `MapRecord`, `toMapRecord()`, `createMap()`, handler POST, handler GET e schema Swagger.
- A conversão `youtube_loop` string → boolean segue exatamente a especificação da task (`=== 'true'`/`=== 'false'`), sem truques com `JSON.parse` que poderiam lançar exceção.
- A posição de `opening` no schema Mongoose (`after status`, `before youtubeVideoId`) e na interface `MapDocument` espelha a ordem lógica dos campos da resposta pública, facilitando leitura.
- Os testes do GET by-token para os dois cenários (`fields presentes` e `fields ausentes retornam null`) são precisos e verificam os valores corretos, não apenas o status code.
- TypeScript compila sem erros (`tsc --noEmit` limpo) e nenhum `any` foi introduzido.
- Pino (`request.log`) é utilizado corretamente em vez de `console.log`.
- Nenhuma dependência circular foi introduzida.

---

## Conformidade com Padroes

| Padrao | Status |
|--------|--------|
| Code Standards | OK |
| TypeScript/Node.js | OK |
| REST/HTTP | OK |
| Logging | OK |
| React | N/A |
| Testes | Issues |

---

## Recomendacoes

1. **(Menor — cobertura)** Adicionar teste para `youtube_loop=false` → `youtubeLoop: false` para cobrir o branch negativo da conversão ternária.
2. **(Menor — cobertura)** Adicionar teste para `opening=''` (string vazia) para documentar e garantir o comportamento de coerção `|| undefined`.
3. **(Menor — estilo)** Aplicar `?? null` nos campos `youtubeVideoId`, `youtubeStartTime` e `youtubeEndTime` no `reply.send()` do GET by-token para uniformizar o código com os novos campos.
4. **(Menor — completude de teste)** Incluir `expect(response.statusCode).toBe(200)` no teste `should pass opening to createMap when provided`.

---

## Veredicto

Implementacao aprovada com observacoes. Todos os requisitos da task 11.0 foram atendidos: os campos sao persistidos, lidos e devolvidos corretamente, os criterios de sucesso sao satisfeitos e os 131 testes passam. As observacoes sao melhorias de qualidade nao bloqueantes que podem ser endereçadas nesta ou em futura task.
