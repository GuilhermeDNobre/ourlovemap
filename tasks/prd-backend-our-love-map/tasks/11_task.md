# Tarefa 11.0: Campos `opening` e `youtubeLoop` — modelo, POST e GET by-token

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

O frontend envia e espera dois campos que o backend atualmente ignora por completo:

1. **`opening`** — frase de abertura do mapa, enviada pelo wizard via `formData.append('opening', ...)` e exibida no `CoverScreen` da página pública via `data.opening`.
2. **`youtubeLoop`** — flag de loop da música, esperada pelo `PublicMap.tsx` via `data?.youtubeLoop` e usada no hook `useMusicPlayer`. **O frontend nunca envia esse campo** (bug no `buildMapFormData.ts` — coberto na task 9.0 do frontend). O backend precisa estar pronto para recebê-lo quando o frontend for corrigido.

Atualmente o backend:
- Nunca lê `fields.opening` em `POST /api/maps`
- Não tem `opening` no schema do `MapModel`
- Não retorna `opening` em `GET /api/maps/by-token`
- Não tem `youtubeLoop` no schema do `MapModel`
- Nunca lê `fields.youtube_loop` em `POST /api/maps`
- Não retorna `youtubeLoop` em `GET /api/maps/by-token`

## Subtarefas

- [ ] 11.1 Atualizar `src/models/map-model.ts`:
  - Adicionar `opening?: string` ao `MapDocument` interface e ao `mapSchema`
  - Adicionar `youtubeLoop?: boolean` ao `MapDocument` interface e ao `mapSchema`

- [ ] 11.2 Atualizar `src/services/map-service.ts`:
  - Adicionar `opening?: string` e `youtubeLoop?: boolean` ao type `CreateMapInput` (ou equivalente)
  - Passar os novos campos ao criar o documento no MongoDB

- [ ] 11.3 Atualizar `src/routes/map-routes.ts` — POST `/api/maps`:
  - Ler `fields.opening` (opcional) e passá-lo para `createMap()`
  - Ler `fields.youtube_loop` (opcional, converter string `'true'`/`'false'` para boolean) e passá-lo para `createMap()`

- [ ] 11.4 Atualizar `src/routes/map-routes.ts` — GET `/api/maps/by-token`:
  - Incluir `opening: map.opening ?? null` na resposta
  - Incluir `youtubeLoop: map.youtubeLoop ?? null` na resposta
  - Atualizar o schema Swagger da rota com os dois campos novos

- [ ] 11.5 Atualizar testes de integração em `test/routes/map-routes.test.ts`:
  - Testar que `POST /api/maps` com `opening` salva o campo corretamente
  - Testar que `POST /api/maps` com `youtube_loop=true` salva `youtubeLoop: true`
  - Testar que `GET /api/maps/by-token` retorna `opening` e `youtubeLoop` nos dados públicos
  - Testar que campos ausentes retornam `null` (não `undefined`)

## Detalhes de Implementação

**Conversão de `youtube_loop`:** o valor chega como string no multipart form. Converter com:
```ts
const youtubeLoop = fields.youtube_loop === 'true' ? true : fields.youtube_loop === 'false' ? false : undefined;
```

**Schema Mongoose para `youtubeLoop`:**
```ts
youtubeLoop: { type: Boolean },
```

**Resposta GET /by-token — campos novos:**
```ts
return reply.send({
  coupleName: map.coupleName,
  opening: map.opening ?? null,
  relationshipStartDate: map.relationshipStartDate,
  youtubeVideoId: map.youtubeVideoId ?? null,
  youtubeStartTime: map.youtubeStartTime ?? null,
  youtubeEndTime: map.youtubeEndTime ?? null,
  youtubeLoop: map.youtubeLoop ?? null,
  locations: ...,
});
```

**Schema Swagger da resposta 200 do GET /by-token** — adicionar:
```json
"opening": { "type": "string", "nullable": true },
"youtubeLoop": { "type": "boolean", "nullable": true }
```

## Critérios de Sucesso

- `POST /api/maps` com `opening="Você é meu lar"` → campo salvo no MongoDB
- `POST /api/maps` com `youtube_loop=true` → `youtubeLoop: true` salvo no MongoDB
- `GET /api/maps/by-token?token=<valid>` → resposta contém `opening` e `youtubeLoop` nos dados
- Sem `opening` no POST → resposta retorna `opening: null`
- Sem `youtube_loop` no POST → resposta retorna `youtubeLoop: null`
- Todos os testes existentes continuam passando

## Testes da Tarefa

- [ ] `test/routes/map-routes.test.ts`:
  - `POST /api/maps` com `opening` → `GET /by-token` retorna `opening` preenchido
  - `POST /api/maps` com `youtube_loop=true` → `GET /by-token` retorna `youtubeLoop: true`
  - `POST /api/maps` sem `opening` → `GET /by-token` retorna `opening: null`
  - `POST /api/maps` sem `youtube_loop` → `GET /by-token` retorna `youtubeLoop: null`

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `backend/src/models/map-model.ts` — adicionar campos ao schema
- `backend/src/services/map-service.ts` — aceitar novos campos em `createMap()`
- `backend/src/routes/map-routes.ts` — ler campos no POST e incluir no GET by-token
- `backend/test/routes/map-routes.test.ts` — testes de integração
