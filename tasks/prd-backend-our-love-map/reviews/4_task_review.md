# Review: Task 4.0 - Storage service (upload de fotos)

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 4_task.md
**Status**: APPROVED WITH OBSERVATIONS

---

## Summary

Re-review apos correcoes aplicadas sobre os problemas identificados na primeira rodada. Os tres problemas criticos foram resolvidos: o `setErrorHandler` em `app.ts` agora propaga corretamente o `statusCode` do erro (C2), `uploadPhoto` recebe `log: FastifyBaseLogger` e registra o erro antes de relancar (C3), e os mocks de teste agora retornam URLs com a extensao correta por tipo (M2). O teste para `image/jpg` foi adicionado (M3). O nome do bucket `couple-photos` foi mantido intencionalmente como decisao do usuario — corresponde ao bucket real no Supabase. Todos os 39 testes passam e `tsc --noEmit` esta limpo. Restam apenas dois problemas menores que nao impedem o avanco da tarefa.

---

## Files Reviewed

| Arquivo | Status | Issues |
|---------|--------|--------|
| `backend/src/services/storage-service.ts` | Problemas leves | 1 |
| `backend/src/plugins/multipart-plugin.ts` | OK | 0 |
| `backend/src/app.ts` | OK | 0 |
| `backend/test/services/storage-service.test.ts` | Problemas leves | 2 |

---

## Issues Found

### Criticos

Nenhum problema critico encontrado.

### Principais

Nenhum problema principal encontrado.

### Menores

**[m1] Variavel `path` sombrea o modulo nativo `path` do Node.js**
- Arquivo: `backend/src/services/storage-service.ts`, linha 30
- `const path = \`${mapId}/${randomUUID()}.${ext}\`` usa um identificador que sombrea o modulo nativo `path` do Node.js. O arquivo nao importa esse modulo, entao nao ha bug hoje, mas qualquer futuro `import path from 'path'` ou `import { join } from 'path'` neste arquivo causaria conflito de nome silencioso ou erro de compilacao dependendo do escopo.
- Correcao recomendada: renomear para `storagePath` ou `filePath`.
```typescript
const storagePath = `${mapId}/${randomUUID()}.${ext}`;
const { error: uploadError } = await supabase.storage
  .from(STORAGE_BUCKET)
  .upload(storagePath, buffer, { contentType: file.mimetype });
// ...
const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
```

**[m2] `buildMockLog` mocka apenas o metodo `error`**
- Arquivo: `backend/test/services/storage-service.test.ts`, linha 31
- `buildMockLog` retorna `{ error: jest.fn() }` com cast para `FastifyBaseLogger`. Se o servico passar a chamar `log.info`, `log.warn` ou `log.debug`, a chamada lancara `TypeError: log.info is not a function` em tempo de execucao dos testes. Nao e um bug agora, mas e um mock fragil.
- Correcao recomendada: mockar todos os metodos de log usados ou usar `jest.createMockFromModule` / `jest.spyOn` sobre um objeto de logger real.
```typescript
function buildMockLog(): FastifyBaseLogger {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(),
    level: 'error',
    silent: jest.fn(),
  } as unknown as FastifyBaseLogger;
}
```

---

## Positivos

- **C2 corrigido corretamente:** `setErrorHandler` em `app.ts` agora extrai `error.statusCode` com fallback para 500, e diferencia a mensagem retornada: para erros 5xx retorna mensagem generica; para erros 4xx retorna a mensagem original do erro, permitindo que o frontend exiba o feedback descritivo ao usuario conforme exigido pelo PRD.
- **C3 corrigido com boa decisao de design:** a funcao `uploadPhoto` recebe `log: FastifyBaseLogger` como parametro — inversao de dependencia correta, testavel e alinhada com `code-standards.md` (injecao via objeto de parametros com no maximo 3 props, agora com 4 campos no objeto `UploadPhotoParams`). O log inclui `error.message` e `mapId` como contexto estruturado, conforme exigido por `logging.md`.
- **M2 e M3 corrigidos:** os quatro tipos aceitos (jpeg, jpg, png, webp) agora possuem testes dedicados com URLs assertadas com a extensao correta correspondente ao tipo de arquivo testado.
- **Novo teste `should log error before rethrowing Supabase upload failure`** (linha 106): verifica explicitamente que `log.error` foi chamado com o contexto correto (`error` e `mapId`) e a mensagem esperada antes do relanco. Boa pratica de teste comportamental.
- **`multipart-plugin.ts`** permanece correto: `MAX_FILE_SIZE` sem magic number, `throwFileSizeLimit: true`, `fp()` do `fastify-plugin` para escopo correto, export default.
- **Sem `any`** em todo o codigo revisado. Tipagem 100% com tipos reais do SDK do Fastify e do Supabase.
- **`tsc --noEmit` sem erros** e todos os 39 testes passam.

---

## Standards Compliance

| Padrao | Status |
|--------|--------|
| Code Standards | Problemas leves — variavel `path` sombrea modulo nativo (m1) |
| TypeScript/Node.js | OK — sem `any`, sem `var`, `const` em todo lugar, imports ESM, `tsc` limpo |
| REST/HTTP | N/A — nenhuma rota implementada nesta tarefa |
| Logging | OK — `log.error` com contexto estruturado antes do relanco, Pino via `FastifyBaseLogger` |
| React | N/A |
| Testes | Problemas leves — mock de logger incompleto (m2); cobertura de `contentType` ausente |

---

## Recommendations

1. **(Menor — recomendado)** Renomear `const path` para `const storagePath` em `storage-service.ts` para evitar sombramento do modulo nativo e facilitar manutencao futura.
2. **(Menor — recomendado)** Expandir `buildMockLog` nos testes para incluir todos os metodos do `FastifyBaseLogger`, tornando o mock mais robusto contra evolucoes futuras do servico.
3. **(Informacional)** O bucket `couple-photos` e uma decisao intencional que diverge da nomenclatura `photos` do PRD e da techspec. E recomendavel registrar essa decisao como comentario na constante `STORAGE_BUCKET` ou em um ADR para que futuros colaboradores entendam a razao e nao revertam o nome.

---

## Verdict

Os tres problemas criticos da primeira revisao foram corrigidos de forma adequada e os testes associados validam o comportamento esperado. O codigo esta pronto para avanco — os dois problemas menores remanescentes (sombramento de variavel e mock de logger incompleto) podem ser resolvidos de forma oportunista sem bloquear o progresso para a proxima tarefa.
