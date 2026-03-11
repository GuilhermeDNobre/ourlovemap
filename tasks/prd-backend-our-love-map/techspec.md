# Tech Spec — Backend Our Love Map

## Resumo Executivo

O backend será implementado como uma API Fastify em TypeScript dentro de `./backend`, em um monorepo. A arquitetura é orientada a serviços: cada responsabilidade (mapa, pagamento, storage, email, QR Code) é encapsulada em um serviço dedicado, consumido pelas rotas Fastify. O fluxo central é: criação do mapa com geração de link de checkout InfinitePay → webhook do InfinitePay confirma o pagamento → geração do token/slug/QR Code da página → envio de email. O `@supabase/supabase-js` gerencia banco e storage; um token secreto na query string valida os webhooks do InfinitePay.

---

## Arquitetura do Sistema

### Visão Geral dos Componentes

| Componente | Responsabilidade |
|---|---|
| `map-routes.ts` | Rotas: `POST /api/maps`, `GET /api/maps/by-token`, `GET /api/maps/:id/payment-status`, `POST /api/maps/:id/retry-payment` |
| `payment-routes.ts` | Rota: `POST /api/payments/webhook` |
| `map-service.ts` | CRUD de mapas e localizações no Supabase |
| `payment-service.ts` | Criação de checkout InfinitePay e processamento do webhook |
| `storage-service.ts` | Upload de fotos para o Supabase Storage, validação de tipo e tamanho |
| `email-service.ts` | Envio de email via Resend após aprovação do pagamento |
| `qr-code-service.ts` | Geração do QR Code da página (PNG→JPG via `sharp`) |
| `supabase-plugin.ts` | Plugin Fastify que injeta o client Supabase via decorator |
| `slug.ts` | Utilitário: `couple_name` → slug kebab-case sem acentos |
| `token.ts` | Utilitário: geração de token alfanumérico (a-z, A-Z, 0-9, 5 caracteres) via `crypto.randomBytes` |
| `hmac.ts` | Utilitário: validação HMAC-SHA256 (implementado, não usado no webhook InfinitePay) |

**Fluxo de dados principal:**

```
Frontend → POST /api/maps → map-service (salva) + payment-service (cria checkout InfinitePay) → retorna checkoutUrl
InfinitePay Webhook → POST /api/payments/webhook?secret=TOKEN → valida token → payment-service → map-service (ativa) → qr-code-service + email-service
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
  getMapByOrderNsu(orderNsu: string): Promise<Map | null>
  getMapByToken(token: string): Promise<Map | null>
  getPaymentStatus(mapId: string): Promise<MapPaymentStatus>
}

// payment-service.ts
interface PaymentService {
  createCheckoutPayment(params: CreateCheckoutPaymentParams, supabase: SupabaseClient): Promise<CheckoutPaymentResult>
  processWebhookEvent(event: InfinitePayWebhookEvent, supabase: SupabaseClient): Promise<void>
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
payment_id          text              -- order_nsu = map id (correlação com InfinitePay)
checkout_url        text              -- URL de checkout gerada pelo InfinitePay
expires_at          timestamptz       -- NULL = premium; now()+7d = basic
created_at          timestamptz DEFAULT now()
```

> **Migração necessária:** adicionar coluna `checkout_url text`, remover colunas `pix_qr_code`, `pix_code` e `payment_expires_at` via nova migration no Supabase.

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

interface CreateCheckoutPaymentParams {
  mapId: string
  plan: Plan
  email: string
}

interface CheckoutPaymentResult {
  checkoutUrl: string
}

interface InfinitePayWebhookEvent {
  invoice_slug: string
  amount: number
  paid_amount: number
  installments: number
  capture_method: 'credit_card' | 'pix'
  transaction_nsu: string
  order_nsu: string   // corresponde ao mapId
  receipt_url: string
  items: Array<{ quantity: number; price: number; description: string }>
}

interface MapPaymentStatus {
  status: MapStatus
  checkoutUrl: string | null
}
```

### Endpoints de API

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/api/maps` | Cria mapa + inicia checkout InfinitePay; retorna URL de pagamento |
| `GET` | `/api/maps/:id/payment-status` | Polling de status de pagamento pelo frontend |
| `POST` | `/api/maps/:id/retry-payment` | Gera novo checkout para mapa com status `payment_failed` ou `pending_payment` |
| `POST` | `/api/payments/webhook` | Recebe eventos do InfinitePay (validação por token secreto na query string) |
| `GET` | `/api/maps/by-token` | Retorna dados públicos do mapa via `?token=<token>` |

**`POST /api/maps` — resposta de sucesso:**
```json
{
  "mapId": "uuid",
  "checkoutUrl": "https://checkout.infinitepay.com.br/tag?lenc=..."
}
```

**`GET /api/maps/:id/payment-status` — resposta de sucesso:**
```json
{
  "status": "pending_payment",
  "checkoutUrl": "https://checkout.infinitepay.com.br/tag?lenc=..."
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

**Validação do webhook InfinitePay:**
- O InfinitePay **não usa HMAC**; a autenticação é feita por token secreto na query string da `webhook_url`
- A `webhook_url` enviada ao InfinitePay é: `${OURLOVEMAP_API_URL}/api/payments/webhook?secret=${INFINITEPAY_WEBHOOK_SECRET}`
- Ao receber o webhook, extrair `request.query.secret` e comparar com `INFINITEPAY_WEBHOOK_SECRET` via `crypto.timingSafeEqual`
- Se inválido → retornar 401 imediatamente

**Checkout via InfinitePay:**
- `POST https://api.infinitepay.io/invoices/public/checkout/links` (sem autenticação por header; público)
- Campos obrigatórios: `handle` (InfiniteTag sem `$`), `order_nsu` (mapId), `items[]`
- Preço em **centavos**: `basic` = 1990, `premium` = 2990
- Campo `webhook_url` com o secret embutido na URL
- Resposta: `{ "url": "https://checkout.infinitepay.com.br/..." }`
- Usar `axios.post` para a chamada

**QR Code da página** (após pagamento aprovado):
- `qrcode.toBuffer(url)` → PNG buffer → `sharp(buffer).jpeg().toBuffer()` → JPG
- URL: `https://ourlovemap.com/access?token=<token>`

---

## Pontos de Integração

| Serviço | Lib | Auth | Erro crítico |
|---|---|---|---|
| Supabase DB | `@supabase/supabase-js` | `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | Retry com log de erro; não silenciar |
| Supabase Storage | `@supabase/supabase-js` | idem | Rejeitar upload com 500 se falhar |
| InfinitePay | `axios` | `INFINITEPAY_HANDLE` (no header; público) | Retornar 422 se criação do checkout falhar |
| Resend | `resend` SDK | `RESEND_API_KEY` | Log de erro; não bloquear ativação do mapa |
| Sentry | `@sentry/node` | `SENTRY_DSN` | Capturar todas as exceções não tratadas |
| PostHog | `posthog-node` | `POSTHOG_API_KEY` | Fire-and-forget; nunca bloquear fluxo principal |

---

## Abordagem de Testes

### Testes de Unidade

Componentes a testar com Jest:
- `slug.ts`: casos com acentos, espaços múltiplos, caracteres especiais
- `token.ts`: unicidade estatística, charset correto, comprimento = 5
- `map-service.ts`: lógica de expiração (`expired` para plano `basic` após 7 dias)
- `storage-service.ts`: rejeição de arquivo > 5MB e tipo inválido (mocks de Supabase)

Mocks necessários: `@supabase/supabase-js`, `axios`, `resend`, `qrcode`, `sharp`

### Testes de Integração

Usar `fastify.inject()` com instância configurada via `buildApp()`:
- `POST /api/maps`: criação completa com mocks de Supabase e InfinitePay (axios)
- `POST /api/payments/webhook`: aprovação → ativação; token inválido → 401
- `GET /api/maps/by-token`: token válido → 200, inválido → 401, expirado → 403
- `POST /api/maps/:id/retry-payment`: status `payment_failed` ou `pending_payment` → novo checkout; status `active` → 422

### Testes de E2E

Escopo pós-frontend com Playwright:
- Fluxo completo: formulário → checkout link → webhook → acesso via token

---

## Sequenciamento de Desenvolvimento

1. **Setup do projeto** — `./backend` com `package.json`, `tsconfig.json`, estrutura de pastas, variáveis de ambiente
2. **Supabase plugin + migrations** — tabelas `maps` e `locations`, `supabase-plugin.ts`
3. **Utilitários** — `slug.ts`, `token.ts`, `hmac.ts` com testes unitários
4. **Storage service** — upload de fotos com validação (depende do Supabase)
5. **Map service** — CRUD de mapas e localizações
6. **Payment service** — integração com InfinitePay checkout (depende do map-service)
7. **`POST /api/maps`** — rota principal de criação (depende de todos os serviços acima)
8. **Webhook + retry** — `POST /api/payments/webhook`, `POST /api/maps/:id/retry-payment`
9. **QR Code + Email service** — gerado no webhook de aprovação
10. **`GET /api/maps/by-token`** — endpoint público com validação de token e expiração
11. **`GET /api/maps/:id/payment-status`** — polling do frontend
12. **Observabilidade** — Sentry e PostHog em todos os fluxos

### Dependências Técnicas

- Projeto Supabase criado com URL e service key disponíveis
- Conta InfinitePay com InfiniteTag (handle) configurado
- API key do Resend com domínio verificado
- Variável `OURLOVEMAP_BASE_URL` apontando para o domínio de produção (usada no QR Code)
- Variável `OURLOVEMAP_API_URL` apontando para a URL da API (usada na webhook_url)

---

## Monitoramento e Observabilidade

- **Sentry**: capturar exceções em `setErrorHandler` e em falhas de integrações externas
- **PostHog**: eventos `map_created`, `payment_approved`, `payment_failed`, `map_expired_accessed`; fire-and-forget via `posthog.capture()` sem aguardar resposta
- **Logs Pino** (via Fastify logger):
  - `info`: mapa criado, pagamento aprovado, email enviado
  - `warn`: evento de webhook ignorado (tipo desconhecido)
  - `error`: falha em integração externa, token de webhook inválido
- Nunca logar `email`, `couple_name` completo ou dados de pagamento em produção

---

## Considerações Técnicas

### Decisões Principais

| Decisão | Escolha | Justificativa |
|---|---|---|
| Gateway de pagamento | InfinitePay Checkout | Mercado Pago PIX apresentou bloqueios de conta (PolicyAgent); InfinitePay tem API pública sem autenticação complexa |
| Checkout link | URL de redirect | InfinitePay não gera QR Code; o usuário abre o link e escolhe PIX ou cartão na página deles |
| Segurança do webhook | Token secreto na query string | InfinitePay não suporta HMAC; `crypto.timingSafeEqual` previne timing attacks na comparação |
| QR Code JPG | `qrcode` (PNG) + `sharp` (→ JPG) | `qrcode` é a lib mais madura; `sharp` é padrão para conversão de imagem em Node |
| Slug com duplicatas | Permitir | Token garante unicidade; evita lógica de colisão desnecessária |
| Email não bloqueia ativação | Fire-and-forget com log de erro | Falha de email não deve impedir acesso do usuário |
| Retry de pagamento | Endpoint dedicado `POST /api/maps/:id/retry-payment` | Evita re-upload de fotos; reutiliza dados já armazenados; gera novo checkout link |
| PostHog | Fire-and-forget | Analytics nunca deve impactar latência da API |

### Riscos Conhecidos

- **Token de 5 caracteres**: 62⁵ ≈ 916M combinações. Risco de colisão baixo para MVP, mas deve ser monitorado. Mitigação: checar unicidade no banco antes de persistir; aumentar para 8 caracteres se necessário.
- **Webhook sem confirmação de falha**: InfinitePay só documenta webhook de aprovação; não há evento de rejeição. O status `payment_failed` pode ser definido manualmente via admin ou via timeout futuro.
- **Webhook ordering**: InfinitePay pode enviar o evento mais de uma vez em retry. Mitigação: ignorar eventos para mapa já `active`.

### Conformidade com Padrões

- **`node.md`**: TypeScript, `async/await`, `const`, `import/export`, sem `any`, sem `require`
- **`http.md`**: Fastify com `fastify.register()` por plugin, JSON Schema (TypeBox) para validação, status HTTP corretos (400, 401, 403, 404, 422, 500), `setErrorHandler` global
- **`logging.md`**: Pino via `request.log` nas rotas, `fastify.log` fora delas, sem `console.log`, sem dados sensíveis nos logs
- **`tests.md`**: Jest, `buildApp()` factory, estrutura AAA, um comportamento por teste, mocks de serviços externos
- **`code-standards.md`**: kebab-case para arquivos, camelCase para funções/variáveis, early returns, métodos ≤ 50 linhas, sem magic numbers

### Variáveis de Ambiente

```env
# Supabase
SUPABASE_URL=https://<projeto>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>

# InfinitePay
INFINITEPAY_HANDLE=<sua-infinitetag-sem-$>
INFINITEPAY_WEBHOOK_SECRET=<secret-para-validar-webhooks>

# Resend
RESEND_API_KEY=re_<chave>

# URLs
OURLOVEMAP_BASE_URL=https://ourlovemap.com
OURLOVEMAP_API_URL=https://api.ourlovemap.com

# Observabilidade (opcionais em dev)
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...
NODE_ENV=production
```

### Arquivos Relevantes e Dependentes

```
./backend/
  src/
    routes/
      map-routes.ts
      payment-routes.ts
    services/
      map-service.ts
      payment-service.ts
      storage-service.ts
      email-service.ts
      qr-code-service.ts
    plugins/
      supabase-plugin.ts
    utils/
      slug.ts
      token.ts
      hmac.ts
    app.ts
    server.ts
  test/
    helpers/
      build-app.ts
    routes/
      map-routes.test.ts
      payment-routes.test.ts
    services/
      map-service.test.ts
      storage-service.test.ts
    utils/
      slug.test.ts
      token.test.ts
      hmac.test.ts
  package.json
  tsconfig.json
  .env.example
```

**Dependências npm:**
```
fastify @fastify/multipart @supabase/supabase-js resend axios
qrcode sharp @sentry/node posthog-node
@sinclair/typebox
```
**Dev:**
```
typescript @types/node @types/qrcode jest @types/jest ts-jest
```
