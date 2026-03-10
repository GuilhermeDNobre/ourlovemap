# Tarefa 4.0: Storage service (upload de fotos)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o `storage-service.ts` responsável por validar e fazer upload de fotos para o Supabase Storage. O serviço deve rejeitar arquivos acima de 5MB ou com tipo inválido antes de qualquer tentativa de upload, e retornar a URL pública da foto após o armazenamento.

<requirements>
- Validar tamanho máximo: 5MB por arquivo
- Validar tipo de arquivo: aceitar apenas `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Armazenar no Supabase Storage no bucket `photos`
- Retornar a URL pública da foto (usada como `photo_url` na tabela `locations`)
- Rejeitar com erro descritivo (mensagem clara para o frontend exibir ao usuário)
- Usar `@fastify/multipart` para leitura dos arquivos na rota (configurado no plugin de multipart)
</requirements>

## Subtarefas

- [ ] 4.1 Criar bucket `couple-photos` no Supabase Storage com acesso público de leitura
- [ ] 4.2 Criar `src/plugins/multipart-plugin.ts` que registra `@fastify/multipart` com `limits: { fileSize: 5 * 1024 * 1024 }` e `throwFileSizeLimit: true`
- [ ] 4.3 Registrar o multipart plugin em `src/app.ts`
- [ ] 4.4 Implementar `src/services/storage-service.ts`
  - Exportar função `uploadPhoto({ file, mapId }: UploadPhotoParams): Promise<string>`
  - Validar `file.mimetype` contra lista de tipos aceitos; lançar erro 400 se inválido
  - Fazer upload para Supabase Storage em `photos/<mapId>/<uuid>.<ext>`
  - Retornar URL pública via `supabase.storage.from('photos').getPublicUrl(path)`
- [ ] 4.5 Escrever testes unitários para `storage-service.ts`

## Detalhes de Implementação

Consultar seção **Pontos de Integração** e **Interfaces Principais** da techspec.md.

O path do arquivo no Storage deve ser único por localização. Usar `crypto.randomUUID()` para o nome do arquivo, mantendo a extensão original extraída do mimetype.

Tipos MIME aceitos e extensões correspondentes:
```typescript
const ACCEPTED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
```

Em caso de erro no upload para o Supabase, re-lançar com log `error` para ser capturado pelo `setErrorHandler`.

## Critérios de Sucesso

- Arquivo válido (< 5MB, tipo aceito) → URL pública retornada corretamente
- Arquivo > 5MB → erro 400 com mensagem `"File size exceeds 5MB limit"`
- Tipo inválido (ex: PDF, GIF) → erro 400 com mensagem `"File type not allowed"`
- `npm test` passa com todos os cenários cobertos

## Testes da Tarefa

- [ ] `test/services/storage-service.test.ts` (com mock do Supabase client):
  - Arquivo JPEG válido → retorna URL pública
  - Arquivo PNG válido → retorna URL pública
  - Arquivo WEBP válido → retorna URL pública
  - Mimetype `image/gif` → lança erro 400
  - Mimetype `application/pdf` → lança erro 400
  - Falha no upload Supabase → relança o erro

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/plugins/multipart-plugin.ts`
- `./backend/src/services/storage-service.ts`
- `./backend/src/app.ts` (modificado para registrar multipart plugin)
- `./backend/test/services/storage-service.test.ts`
