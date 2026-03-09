# Tech Spec — Backend Our Love Map

## Resumo Executivo

O backend será implementado como uma API Fastify em TypeScript dentro de `./backend`, em um monorepo. A arquitetura é orientada a serviços: cada responsabilidade (mapa, pagamento, storage, email, QR Code) é encapsulada em um serviço dedicado, consumido pelas rotas Fastify. O fluxo central é: criação do mapa com geração de PIX → webhook do Mercado Pago confirma o pagamento → geração do token/slug/QR Code da página → envio de email. O `@supabase/supabase-js` gerencia banco e storage; o HMAC-SHA256 valida todos os webhooks.

---

## Arquitetura do Sistema

### Visão Geral dos Componentes

| Componente | Responsabilidade |
|---|---|
| `map-routes.ts` | Rotas: `POST /api/maps`, `GET /api/maps/by-token`, `GET /api/maps/:id/payment-status`, `POST /api/maps/:id/retry-payment` |
| `payment-routes.ts` | Rota: `POST /api/payments/webhook` |
| `map-service.ts` | CRUD de mapas e localizações no Supabase |
| `payment-service.ts` | Criação de pagamento PIX no Mercado Pago e processamento do webhook |
| `storage-service.ts` | Upload de fotos para o Supabase Storage, validação de tipo e tamanho |
| `email-service.ts` | Envio de email via Resend após aprovação do pagamento |
| `qr-code-service.ts` | Geração do QR Code da página (PNG→JPG via `sharp`) |
| `supabase-plugin.ts` | Plugin Fastify que injeta o client Supabase via decorator |
| `slug.ts` | Utilitário: `couple_name` → slug kebab-case sem acentos |
| `token.ts` | Utilitário: geração de token alfanumérico (a-z, A-Z, 0-9, 5 caracteres) via `crypto.randomBytes` |
| `hmac.ts` | Utilitário: validação HMAC-SHA256 do webhook do Mercado Pago com `crypto.timingSafeEqual` |

**Fluxo de dados principal:**

```
Frontend → POST /api/maps → map-service (salva) + payment-service (cria PIX) → retorna pix_qr_code + payment_expires_at
MP Webhook → POST /api/payments/webhook → hmac.ts (valida) → payment-service → map-service (ativa) → qr-code-service + email-service
Frontend → GET /api/maps/by-token?token=X → map-service (valida token + expiração) → retorna dados públicos
```

---

## Design de Implementação

### Interfaces Principais

```typescript
// map-service.ts
interface MapService {
  createMap(data: CreateMapData): Promise<Map>
  activateMap(mapId: string): Promise<Map>
  setPaymentFailed(mapId: string): Promise<void>
  getMapByPaymentId(paymentId: string): Promise<Map | null>
  getMapByToken(token: string): Promise<Map | null>
  getPaymentStatus(mapId: string): Promise<MapPaymentStatus>
}

// payment-service.ts
interface PaymentService {
  createPixPayment(mapId: string, amount: number, email: string): Promise<PixPaymentResult>
  processWebhookEvent(event: MercadoPagoEvent): Promise<void>
}

// storage-service.ts
interface StorageService {
  uploadPhoto(file: MultipartFile, mapId: string): Promise<string> // retorna photo_url
}
```

### Modelos de Dados

**Tabela `maps` (Supabase):**

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
couple_name         text NOT NULL
slug                text NOT NULL
email               text NOT NULL
plan                text NOT NULL CHECK (plan IN ('basic', 'premium'))
relationship_start_date date NOT NULL
token               text UNIQUE
status              text NOT NULL DEFAULT 'pending_payment'
                    CHECK (status IN ('pending_payment','active','expired','payment_failed'))
youtube_video_id    text
youtube_start_time  integer
youtube_end_time    integer
payment_id          text              -- ID do pagamento no Mercado Pago
pix_qr_code         text              -- base64 do QR code PIX
pix_code            text              -- código copia-e-cola PIX
payment_expires_at  timestamptz       -- criação + 15 min (expiração do PIX)
expires_at          timestamptz       -- NULL = premium; now()+7d = basic
created_at          timestamptz DEFAULT now()
```

**Tabela `locations` (Supabase):**

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
map_id      uuid REFERENCES maps(id) ON DELETE CASCADE
title       text NOT NULL
description text
message     text
photo_url   text
latitude    decimal NOT NULL
longitude   decimal NOT NULL
"order"     integer NOT NULL
```

**Tipos TypeScript principais:**

```typescript
type MapStatus = 'pending_payment' | 'active' | 'expired' | 'payment_failed'
type Plan = 'basic' | 'premium'

interface PixPaymentResult {
  paymentId: string
  pixQrCode: string       // base64
  pixCode: string         // copia-e-cola
  paymentExpiresAt: Date  // now + 15 min
}

interface MapPaymentStatus {
  status: MapStatus
  pixQrCode: string | null
  pixCode: string | null
  paymentExpiresAt: string | null
}
```

### Endpoints de API

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/api/maps` | Cria mapa + inicia PIX; retorna dados do pagamento |
| `GET` | `/api/maps/:id/payment-status` | Polling de status de pagamento pelo frontend |
| `POST` | `/api/maps/:id/retry-payment` | Gera novo PIX para mapa com status `payment_failed` |
| `POST` | `/api/payments/webhook` | Recebe eventos do Mercado Pago (validação HMAC obrigatória) |
| `GET` | `/api/maps/by-token` | Retorna dados públicos do mapa via `?token=<token>` |

**`POST /api/maps` — resposta de sucesso:**
```json
{
  "mapId": "uuid",
  "pixQrCode": "base64...",
  "pixCode": "00020126...",
  "paymentExpiresAt": "2024-01-01T12:15:00Z"
}
```

**`GET /api/maps/by-token?token=X` — resposta de sucesso:**
```json
{
  "coupleName": "Carol e André",
  "relationshipStartDate": "2020-06-15",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "youtubeStartTime": 30,
  "youtubeEndTime": 90,
  "locations": [
    { "title": "...", "description": "...", "message": "...", "photoUrl": "...", "latitude": -23.5, "longitude": -46.6, "order": 1 }
  ]
}
```

### Lógicas Críticas

**Geração de token** (`token.ts`):
- `crypto.randomBytes(4)` → base62 (a-z, A-Z, 0-9) → truncar para 5 caracteres
- Nota: 62⁵ ≈ 916M combinações; suficiente para MVP

**Geração de slug** (`slug.ts`):
- `couple_name` → lowercase → remover acentos via `normalize('NFD')` → substituir espaços por `-` → remover caracteres não alfanuméricos
- Slugs duplicados são permitidos (unicidade garantida pelo token)

**Validação HMAC** (`hmac.ts`):
- Header `x-signature`: extrair `ts` e `v1`
- Header `x-request-id`: usar como parte do template
- Template: `` `id:${dataId};request-id:${xRequestId};ts:${ts};` ``
- Comparar com `crypto.timingSafeEqual()` para prevenir timing attacks

**PIX via Mercado Pago SDK:**
- `payment_method_id: "pix"`, `date_of_expiration: now + 15min`
- Retorna `point_of_interaction.transaction_data.qr_code_base64` e `.qr_code`

**QR Code da página** (após pagamento aprovado):
- `qrcode.toBuffer(url)` → PNG buffer → `sharp(buffer).jpeg().toBuffer()` → JPG
- URL: `https://ourlovemap.com/access?token=<token>`

---

## Pontos de Integração

| Serviço | Lib | Auth | Erro crítico |
|---|---|---|---|
| Supabase DB | `@supabase/supabase-js` | `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | Retry com log de erro; não silenciar |
| Supabase Storage | `@supabase/supabase-js` | idem | Rejeitar upload com 500 se falhar |
| Mercado Pago | `mercadopago` SDK | `MP_ACCESS_TOKEN` | Retornar 422 se criação de PIX falhar |
| Resend | `resend` SDK | `RESEND_API_KEY` | Log de erro; não bloquear ativação do mapa |
| Sentry | `@sentry/node` | `SENTRY_DSN` | Capturar todas as exceções não tratadas |
| PostHog | `posthog-node` | `POSTHOG_API_KEY` | Fire-and-forget; nunca bloquear fluxo principal |

---

## Abordagem de Testes

### Testes de Unidade

Componentes a testar com Jest:
- `slug.ts`: casos com acentos, espaços múltiplos, caracteres especiais
- `token.ts`: unicidade estatística, charset correto, comprimento = 5
- `hmac.ts`: assinatura válida, inválida, campos ausentes
- `map-service.ts`: lógica de expiração (`expired` para plano `basic` após 7 dias)
- `storage-service.ts`: rejeição de arquivo > 5MB e tipo inválido (mocks de Supabase)

Mocks necessários: `@supabase/supabase-js`, `mercadopago`, `resend`, `qrcode`, `sharp`

### Testes de Integração

Usar `fastify.inject()` com instância configurada via `buildApp()`:
- `POST /api/maps`: criação completa com mocks de Supabase e MP
- `POST /api/payments/webhook`: aprovação → ativação, rejeição → `payment_failed`, HMAC inválido → 401
- `GET /api/maps/by-token`: token válido → 200, inválido → 401, expirado → 403
- `POST /api/maps/:id/retry-payment`: status `payment_failed` → novo PIX; status `active` → 422

### Testes de E2E

Escopo pós-frontend com Playwright:
- Fluxo completo: formulário → PIX → polling de status → acesso via QR Code

---

## Sequenciamento de Desenvolvimento

1. **Setup do projeto** — `./backend` com `package.json`, `tsconfig.json`, estrutura de pastas, variáveis de ambiente
2. **Supabase plugin + migrations** — tabelas `maps` e `locations`, `supabase-plugin.ts`
3. **Utilitários** — `slug.ts`, `token.ts`, `hmac.ts` com testes unitários
4. **Storage service** — upload de fotos com validação (depende do Supabase)
5. **Map service** — CRUD de mapas e localizações
6. **Payment service** — integração com Mercado Pago PIX (depende do map-service)
7. **`POST /api/maps`** — rota principal de criação (depende de todos os serviços acima)
8. **Webhook + retry** — `POST /api/payments/webhook`, `POST /api/maps/:id/retry-payment`
9. **QR Code + Email service** — gerado no webhook de aprovação
10. **`GET /api/maps/by-token`** — endpoint público com validação de token e expiração
11. **`GET /api/maps/:id/payment-status`** — polling do frontend
12. **Observabilidade** — Sentry e PostHog em todos os fluxos

### Dependências Técnicas

- Projeto Supabase criado com URL e service key disponíveis
- Aplicação no Mercado Pago com `access_token` e webhook secret configurados
- API key do Resend com domínio verificado
- Variável `OURLOVEMAP_BASE_URL` apontando para o domínio de produção (usada no QR Code)

---

## Monitoramento e Observabilidade

- **Sentry**: capturar exceções em `setErrorHandler` e em falhas de integrações externas
- **PostHog**: eventos `map_created`, `payment_approved`, `payment_failed`, `map_expired_accessed`; fire-and-forget via `posthog.capture()` sem aguardar resposta
- **Logs Pino** (via Fastify logger):
  - `info`: mapa criado, pagamento aprovado, email enviado
  - `warn`: evento de webhook ignorado (tipo desconhecido)
  - `error`: falha em integração externa, HMAC inválido
- Nunca logar `email`, `couple_name` completo ou dados PIX em produção

---

## Considerações Técnicas

### Decisões Principais

| Decisão | Escolha | Justificativa |
|---|---|---|
| QR Code JPG | `qrcode` (PNG) + `sharp` (→ JPG) | `qrcode` é a lib mais madura; `sharp` é padrão para conversão de imagem em Node |
| Slug com duplicatas | Permitir | Token garante unicidade; evita lógica de colisão desnecessária |
| Email não bloqueia ativação | Fire-and-forget com log de erro | Falha de email não deve impedir acesso do usuário |
| Retry de pagamento | Endpoint dedicado `POST /api/maps/:id/retry-payment` | Evita re-upload de fotos; reutiliza dados já armazenados |
| PostHog | Fire-and-forget | Analytics nunca deve impactar latência da API |

### Riscos Conhecidos

- **Token de 5 caracteres**: 62⁵ ≈ 916M combinações. Risco de colisão baixo para MVP, mas deve ser monitorado. Mitigação: checar unicidade no banco antes de persistir; aumentar para 8 caracteres se necessário.
- **Expiração do PIX (15 min)**: Se o usuário demorar, o PIX expira. O endpoint `retry-payment` resolve, mas o frontend precisa tratar esse caso com UX clara.
- **Webhook ordering**: MP pode enviar eventos fora de ordem. Mitigação: ignorar eventos que não avançam o estado do mapa (ex: `approved` em mapa já `active`).

### Conformidade com Padrões

- **`node.md`**: TypeScript, `async/await`, `const`, `import/export`, sem `any`, sem `require`
- **`http.md`**: Fastify com `fastify.register()` por plugin, JSON Schema (TypeBox) para validação, status HTTP corretos (400, 401, 403, 404, 422, 500), `setErrorHandler` global
- **`logging.md`**: Pino via `request.log` nas rotas, `fastify.log` fora delas, sem `console.log`, sem dados sensíveis nos logs
- **`tests.md`**: Jest, `buildApp()` factory, estrutura AAA, um comportamento por teste, mocks de serviços externos
- **`code-standards.md`**: kebab-case para arquivos, camelCase para funções/variáveis, early returns, métodos ≤ 50 linhas, sem magic numbers

### Arquivos Relevantes e Dependentes

```
./backend/
  src/
    routes/
      map-routes.ts       ← novo
      payment-routes.ts   ← novo
    services/
      map-service.ts      ← novo
      payment-service.ts  ← novo
      storage-service.ts  ← novo
      email-service.ts    ← novo
      qr-code-service.ts  ← novo
    plugins/
      supabase-plugin.ts  ← novo
    utils/
      slug.ts             ← novo
      token.ts            ← novo
      hmac.ts             ← novo
    app.ts                ← novo
    server.ts             ← novo
  test/
    helpers/
      build-app.ts        ← novo
    routes/
      map-routes.test.ts         ← novo
      payment-routes.test.ts     ← novo
    services/
      map-service.test.ts        ← novo
      storage-service.test.ts    ← novo
    utils/
      slug.test.ts        ← novo
      token.test.ts       ← novo
      hmac.test.ts        ← novo
  package.json            ← novo
  tsconfig.json           ← novo
  .env.example            ← novo
```

**Dependências npm:**
```
fastify @fastify/multipart @supabase/supabase-js mercadopago resend
qrcode sharp @sentry/node posthog-node axios
@sinclair/typebox
```
**Dev:**
```
typescript @types/node @types/qrcode jest @types/jest ts-jest
```
