# Tarefa 4.0: Storage service (upload de fotos)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o `storage-service.ts` responsável por validar e fazer upload de fotos para o Cloudflare R2. O serviço deve rejeitar arquivos acima de 5MB ou com tipo inválido antes de qualquer tentativa de upload, e retornar a URL pública da foto após o armazenamento.

<requirements>
- Validar tamanho máximo: 5MB por arquivo
- Validar tipo de arquivo: aceitar apenas `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Armazenar no bucket R2 configurado em `CLOUDFLARE_R2_BUCKET`
- Retornar a URL pública da foto usando `CLOUDFLARE_R2_PUBLIC_URL` como base (usada como `photoUrl` no model `Location`)
- Rejeitar com erro descritivo (mensagem clara para o frontend exibir ao usuário)
- Usar `@fastify/multipart` para leitura dos arquivos na rota (configurado no plugin de multipart)
</requirements>

## Subtarefas

- [ ] 4.1 Criar `src/plugins/multipart-plugin.ts` que registra `@fastify/multipart` com `limits: { fileSize: 5 * 1024 * 1024 }` e `throwFileSizeLimit: true`
- [ ] 4.2 Registrar o multipart plugin em `src/app.ts`
- [ ] 4.3 Implementar `src/services/storage-service.ts`
  - Inicializar `S3Client` com endpoint R2: `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, `region: 'auto'`, credenciais R2
  - Exportar função `uploadPhoto({ file, mapId }: UploadPhotoParams): Promise<string>`
  - Validar `file.mimetype` contra lista de tipos aceitos; lançar erro 400 se inválido
  - Fazer upload via `PutObjectCommand` para o path `photos/<mapId>/<uuid>.<ext>`
  - Retornar URL pública: `${CLOUDFLARE_R2_PUBLIC_URL}/photos/<mapId>/<uuid>.<ext>`
- [ ] 4.4 Escrever testes unitários para `storage-service.ts`

## Detalhes de Implementação

Consultar seção **Pontos de Integração** e **Interfaces Principais** da techspec.md.

O path do arquivo no bucket deve ser único por localização. Usar `crypto.randomUUID()` para o nome do arquivo, mantendo a extensão original extraída do mimetype.

Tipos MIME aceitos e extensões correspondentes:
```typescript
const ACCEPTED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
```

Configuração do client R2:
```typescript
import { S3Client } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});
```

Em caso de erro no upload, re-lançar com log `error` para ser capturado pelo `setErrorHandler`.

## Critérios de Sucesso

- Arquivo válido (< 5MB, tipo aceito) → URL pública retornada corretamente
- Arquivo > 5MB → erro 400 com mensagem `"File size exceeds 5MB limit"`
- Tipo inválido (ex: PDF, GIF) → erro 400 com mensagem `"File type not allowed"`
- `npm test` passa com todos os cenários cobertos

## Testes da Tarefa

- [ ] `test/services/storage-service.test.ts` (com mock do `S3Client`):
  - Arquivo JPEG válido → retorna URL pública
  - Arquivo PNG válido → retorna URL pública
  - Arquivo WEBP válido → retorna URL pública
  - Mimetype `image/gif` → lança erro 400
  - Mimetype `application/pdf` → lança erro 400
  - Falha no upload R2 → relança o erro

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/plugins/multipart-plugin.ts`
- `./backend/src/services/storage-service.ts`
- `./backend/src/app.ts` (modificado para registrar multipart plugin)
- `./backend/test/services/storage-service.test.ts`
