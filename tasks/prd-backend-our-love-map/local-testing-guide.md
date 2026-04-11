# Guia de Testes Locais — Our Love Map API

Documento de referência para testar a API localmente usando o [Bruno](https://www.usebruno.com/), um cliente REST open-source que armazena coleções como arquivos `.bru` no repositório.

---

## 1. Pré-requisitos

### 1.1 Instalação do Bruno

Baixe e instale o Bruno em [usebruno.com/downloads](https://www.usebruno.com/downloads) ou via CLI:

```bash
# macOS
brew install bruno

# Windows (winget)
winget install Bruno.Bruno

# Linux (snap)
snap install bruno
```

### 1.2 Subir o servidor local

```bash
cd backend
cp .env.example .env   # preencher as variáveis abaixo
npm run dev
```

O servidor sobe em `http://localhost:3000` por padrão.

### 1.3 Variáveis de ambiente obrigatórias

Edite o arquivo `backend/.env` com os valores reais:

```env
# Supabase
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>

# Mercado Pago
MP_ACCESS_TOKEN=TEST-<seu-token-de-teste>
MP_WEBHOOK_SECRET=<secret-do-webhook-mp>

# Resend
RESEND_API_KEY=re_<sua-chave>

# URL base do frontend (usada no QR Code)
OURLOVEMAP_BASE_URL=http://localhost:5173

# PostHog e Sentry (opcionais para dev local)
# POSTHOG_API_KEY=phc_...
# SENTRY_DSN=https://...
# NODE_ENV=development
```

> **Dica:** Para testar o fluxo completo sem pagar, use credenciais de **sandbox** do Mercado Pago (`TEST-...`). Pagamentos sandbox podem ser aprovados manualmente via dashboard do MP ou via API de testes.

---

## 2. Configurar a coleção no Bruno

### 2.1 Criar a coleção

1. Abra o Bruno → **Create Collection** → nome: `Our Love Map API`
2. No campo **Location**, aponte para `backend/` (ou qualquer pasta do repositório)
3. Crie um **Environment** chamado `Local` com a variável:

```
baseUrl  =  http://localhost:3000
```

As requests abaixo usam `{{baseUrl}}` para referenciar essa variável.

### 2.2 Estrutura sugerida da coleção

```
Our Love Map API/
├── 00 - Health/
│   └── Health Check.bru
├── 01 - Maps/
│   ├── 1. Criar Mapa (POST maps).bru
│   ├── 2. Polling Payment Status.bru
│   ├── 3. Acesso Público por Token.bru
│   └── 4. Retry Payment.bru
└── 02 - Payments/
    └── Webhook - Aprovação.bru
```

---

## 3. Fluxo completo de teste

O fluxo principal representa o caminho feliz do produto:

```
[1] Health Check
      ↓
[2] POST /api/maps  →  recebe mapId + PIX QR Code
      ↓
[3] GET /api/maps/:id/payment-status  (polling)
      ↓ (aprovação do pagamento via webhook)
[4] POST /api/payments/webhook  →  ativa o mapa + envia email
      ↓
[5] GET /api/maps/by-token?token=<token>  →  página pública
```

Cenários alternativos:

```
[2] POST /api/maps
      ↓ (pagamento rejeitado via webhook)
[4b] POST /api/payments/webhook (rejected)
      ↓
[6] POST /api/maps/:id/retry-payment  →  novo PIX
```

---

## 4. Requests detalhadas

---

### Request 1 — Health Check

**Objetivo:** Confirmar que o servidor está no ar e respondendo.

**Arquivo Bruno (.bru):**

```bru
meta {
  name: Health Check
  type: http
  seq: 1
}

get {
  url: {{baseUrl}}/health
}
```

**Resposta esperada — 200 OK:**

```json
{
  "status": "ok"
}
```

**Quando usar:** Sempre como primeiro passo. Se retornar 500 ou não responder, verifique se `npm run dev` está rodando e se `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` estão corretos no `.env`.

---

### Request 2 — Criar Mapa (`POST /api/maps`)

**Objetivo:** Criar um mapa com dados do casal, localizações e foto, e receber o QR Code PIX para pagamento.

> **Atenção:** Esta rota usa `multipart/form-data`, não JSON. No Bruno, selecione o tipo de body como **Multipart Form**.

**Arquivo Bruno (.bru):**

```bru
meta {
  name: 1. Criar Mapa (POST maps)
  type: http
  seq: 2
}

post {
  url: {{baseUrl}}/api/maps
  body: multipart
}

body:multipart {
  couple_name: Carol e André
  email: carol@example.com
  plan: basic
  relationship_start_date: 2020-06-15
  youtube_video_id: dQw4w9WgXcQ
  youtube_start_time: 30
  youtube_end_time: 90
  locations[0][title]: Onde nos conhecemos
  locations[0][description]: Foi numa tarde de junho
  locations[0][message]: Aqui tudo começou 💙
  locations[0][latitude]: -23.5505
  locations[0][longitude]: -46.6333
  locations[0][order]: 1
  locations[1][title]: Nosso primeiro jantar
  locations[1][latitude]: -23.5629
  locations[1][longitude]: -46.6544
  locations[1][order]: 2
}
```

> **Adicionar foto:** No Bruno, ao editar a request, selecione o campo `locations[0][photo]` como tipo **File** e escolha um JPG/PNG/WebP de no máximo 5 MB.

**Resposta esperada — 200 OK:**

```json
{
  "mapId": "a3f1e2d4-...",
  "pixQrCode": "iVBORw0KGgoAAAANSUhEUgAA...",
  "pixCode": "00020126580014br.gov.bcb.pix...",
  "paymentExpiresAt": "2026-03-10T12:15:00.000Z"
}
```

**Salve o `mapId`** — você vai precisar dele nas próximas requests. No Bruno, crie uma variável de ambiente `mapId` e use um script de pós-resposta:

```javascript
// Script "Post Response" no Bruno
const body = res.getBody();
bru.setVar("mapId", body.mapId);
```

**Erros esperados:**

| Status | Causa | Solução |
|--------|-------|---------|
| 400 | Campo obrigatório ausente (`couple_name`, `email`, `plan`, `relationship_start_date`) | Verificar todos os campos do form |
| 400 | Foto maior que 5 MB | Usar imagem menor |
| 400 | Formato de imagem inválido (ex: `.gif`) | Usar JPG, PNG ou WebP |
| 422 | Plano `basic` com mais de 3 localizações | Reduzir o número de localizações |
| 422 | Falha na criação do PIX no Mercado Pago | Verificar `MP_ACCESS_TOKEN` no `.env` |

---

### Request 3 — Polling de Status de Pagamento

**Objetivo:** Verificar se o pagamento foi processado. O frontend usa essa rota para saber quando exibir a confirmação.

**Arquivo Bruno (.bru):**

```bru
meta {
  name: 2. Polling Payment Status
  type: http
  seq: 3
}

get {
  url: {{baseUrl}}/api/maps/{{mapId}}/payment-status
}
```

**Resposta quando aguardando pagamento — 200 OK:**

```json
{
  "status": "pending_payment",
  "pixQrCode": "iVBORw0KGgoAAAANSUhEUgAA...",
  "pixCode": "00020126580014br.gov.bcb.pix...",
  "paymentExpiresAt": "2026-03-10T12:15:00.000Z"
}
```

**Resposta após aprovação — 200 OK:**

```json
{
  "status": "active",
  "pixQrCode": null,
  "pixCode": null,
  "paymentExpiresAt": null
}
```

**Ciclo de status possíveis:**

```
pending_payment  →  active          (pagamento aprovado)
pending_payment  →  payment_failed  (pagamento rejeitado/cancelado)
active           →  expired         (plano basic após 7 dias)
```

**Quando usar:** Execute esta request antes e depois de enviar o webhook (Request 4) para observar a transição de `pending_payment` → `active`.

**Erros esperados:**

| Status | Causa |
|--------|-------|
| 404 | `mapId` inválido ou não existe no banco |

---

### Request 4a — Webhook: Pagamento Aprovado

**Objetivo:** Simular o evento de aprovação de pagamento que o Mercado Pago enviaria ao backend. Esta chamada:
1. Valida a assinatura HMAC
2. Consulta o status do pagamento no MP
3. Ativa o mapa (gera `slug` e `token`)
4. Gera o QR Code da página pública
5. Envia o email de entrega para o casal

> **Atenção:** Esta rota exige um header `x-signature` com HMAC-SHA256 válido. Veja a seção **5. Como gerar o HMAC** abaixo.

**Arquivo Bruno (.bru):**

```bru
meta {
  name: Webhook - Aprovação
  type: http
  seq: 4
}

post {
  url: {{baseUrl}}/api/payments/webhook
  body: json
}

headers {
  Content-Type: application/json
  x-signature: ts={{webhookTs}},v1={{webhookV1}}
  x-request-id: {{webhookRequestId}}
}

body:json {
  {
    "action": "payment.updated",
    "data": {
      "id": "{{mpPaymentId}}"
    }
  }
}
```

**Variáveis necessárias:**

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `mpPaymentId` | ID do pagamento no Mercado Pago (retornado no Step 2 como `paymentId` — salvo internamente no banco) | `123456789` |
| `webhookTs` | Timestamp Unix atual (segundos) | `1741600000` |
| `webhookRequestId` | UUID único para a request | `req-abc-123` |
| `webhookV1` | HMAC-SHA256 calculado (ver seção 5) | `a3f1e2d4...` |

**Resposta esperada — 200 OK:**

```json
{
  "received": true
}
```

**Efeito colateral esperado:** O `status` do mapa muda para `active` e um email é enviado para `carol@example.com` com o QR Code. Verifique consultando a Request 3 novamente.

**Erros esperados:**

| Status | Causa |
|--------|-------|
| 401 | Assinatura HMAC inválida ou ausente |

---

### Request 4b — Webhook: Pagamento Rejeitado

**Objetivo:** Simular rejeição de pagamento. O mapa vai para `payment_failed`, liberando uma nova tentativa.

```bru
meta {
  name: Webhook - Rejeição
  type: http
  seq: 5
}

post {
  url: {{baseUrl}}/api/payments/webhook
  body: json
}

headers {
  Content-Type: application/json
  x-signature: ts={{webhookTs}},v1={{webhookV1}}
  x-request-id: {{webhookRequestId}}
}

body:json {
  {
    "action": "payment.updated",
    "data": {
      "id": "{{mpPaymentId}}"
    }
  }
}
```

> O mesmo payload do 4a, mas o Mercado Pago retornará `rejected` ao consultar o `mpPaymentId`. Para forçar isso em sandbox, rejeite o pagamento no dashboard do MP antes de enviar o webhook.

**Após este webhook:** O status muda para `payment_failed`. Use a Request 6 para gerar um novo PIX.

---

### Request 5 — Acesso Público por Token

**Objetivo:** Acessar os dados públicos do mapa após o pagamento ser aprovado. É o endpoint que o frontend consome para renderizar a página do casal.

> **Onde obter o token?** Após a aprovação via webhook, o mapa recebe um token único de 5 caracteres (ex: `aB3kZ`). Você pode buscá-lo diretamente no Supabase na tabela `maps` na coluna `token`.

**Arquivo Bruno (.bru):**

```bru
meta {
  name: 3. Acesso Público por Token
  type: http
  seq: 6
}

get {
  url: {{baseUrl}}/api/maps/by-token
  query {
    token: {{mapToken}}
  }
}
```

**Resposta esperada — 200 OK:**

```json
{
  "coupleName": "Carol e André",
  "relationshipStartDate": "2020-06-15",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "youtubeStartTime": 30,
  "youtubeEndTime": 90,
  "locations": [
    {
      "title": "Onde nos conhecemos",
      "description": "Foi numa tarde de junho",
      "message": "Aqui tudo começou 💙",
      "photoUrl": "https://<supabase-url>/storage/v1/object/public/photos/...",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "order": 1
    },
    {
      "title": "Nosso primeiro jantar",
      "description": null,
      "message": null,
      "photoUrl": null,
      "latitude": -23.5629,
      "longitude": -46.6544,
      "order": 2
    }
  ]
}
```

**Erros esperados:**

| Status | Causa |
|--------|-------|
| 401 | Token ausente na query string |
| 401 | Token não corresponde a nenhum mapa |
| 403 (`map_expired`) | Plano `basic` expirou após 7 dias. Body: `{ "error": "map_expired", "message": "Seu acesso expirou..." }` |
| 403 | Mapa em `pending_payment` ou `payment_failed` — pagamento não foi aprovado |

---

### Request 6 — Retry de Pagamento

**Objetivo:** Gerar um novo QR Code PIX para um mapa cujo pagamento anterior falhou. Não faz re-upload de dados — reutiliza o mapa existente.

**Pré-condição:** O mapa deve estar com `status: "payment_failed"` (após um webhook de rejeição).

**Arquivo Bruno (.bru):**

```bru
meta {
  name: 4. Retry Payment
  type: http
  seq: 7
}

post {
  url: {{baseUrl}}/api/maps/{{mapId}}/retry-payment
}
```

**Resposta esperada — 200 OK:**

```json
{
  "pixQrCode": "iVBORw0KGgoAAAANSUhEUg...",
  "pixCode": "00020126580014br.gov.bcb.pix...",
  "paymentExpiresAt": "2026-03-10T13:00:00.000Z"
}
```

**Erros esperados:**

| Status | Causa |
|--------|-------|
| 404 | `mapId` não existe |
| 422 | Mapa não está em `payment_failed` (ex: já está `active`) |
| 422 | Falha na criação do PIX no Mercado Pago |

---

## 5. Como gerar o HMAC para o Webhook

O header `x-signature` segue o formato do Mercado Pago:

```
x-signature: ts=<timestamp>,v1=<hmac-sha256>
```

O template da mensagem assinada é:

```
id:<payment_id>;request-id:<x-request-id>;ts:<timestamp>;
```

### 5.1 Via script Node.js (rápido para dev)

Crie o arquivo `backend/scripts/generate-webhook-hmac.ts` ou rode inline:

```typescript
import crypto from 'crypto';

const secret = process.env.MP_WEBHOOK_SECRET ?? 'seu-secret-aqui';
const paymentId = '123456789';          // ID do pagamento no MP
const requestId = 'req-local-test-001'; // qualquer string única
const ts = Math.floor(Date.now() / 1000).toString(); // timestamp atual

const message = `id:${paymentId};request-id:${requestId};ts:${ts};`;
const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');

console.log(`x-signature: ts=${ts},v1=${hmac}`);
console.log(`x-request-id: ${requestId}`);
```

Execute:

```bash
cd backend
npx tsx scripts/generate-webhook-hmac.ts
```

Use os valores impressos no terminal para preencher os headers da Request 4.

### 5.2 Via Pre Request Script no Bruno

No Bruno, você pode calcular o HMAC automaticamente antes de enviar:

```javascript
// Pre Request Script na Request "Webhook - Aprovação"
const crypto = require('crypto');

const secret = bru.getEnvVar('webhookSecret'); // variável no Environment
const paymentId = bru.getVar('mpPaymentId');
const requestId = 'req-' + Date.now();
const ts = Math.floor(Date.now() / 1000).toString();

const message = `id:${paymentId};request-id:${requestId};ts:${ts};`;
const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');

bru.setVar('webhookTs', ts);
bru.setVar('webhookV1', hmac);
bru.setVar('webhookRequestId', requestId);
```

Adicione `webhookSecret` ao Environment `Local` com o valor de `MP_WEBHOOK_SECRET` do `.env`.

---

## 6. Checklist do Fluxo Completo

Use como roteiro de smoke test antes de fazer deploy:

```
[ ] 1. Servidor sobe sem erros: GET /health → 200 { status: "ok" }

[ ] 2. Criação de mapa:
       POST /api/maps com dados válidos → 200 com mapId + pixQrCode

[ ] 3. Validações de criação:
       POST /api/maps sem couple_name → 400
       POST /api/maps com plan=enterprise → 400
       POST /api/maps (basic) com 4 localizações → 422

[ ] 4. Polling:
       GET /api/maps/:id/payment-status → 200 com status: "pending_payment"

[ ] 5. Aprovação via webhook:
       POST /api/payments/webhook (approved, HMAC válido) → 200
       GET /api/maps/:id/payment-status → 200 com status: "active"
       Email de entrega recebido com QR Code em anexo

[ ] 6. Acesso público:
       GET /api/maps/by-token?token=<token> → 200 com dados completos
       GET /api/maps/by-token (sem token) → 401
       GET /api/maps/by-token?token=invalido → 401

[ ] 7. Webhook com HMAC inválido:
       POST /api/payments/webhook (x-signature incorreto) → 401

[ ] 8. Rejeição + retry:
       POST /api/payments/webhook (rejected) → 200
       GET /api/maps/:id/payment-status → 200 com status: "payment_failed"
       POST /api/maps/:id/retry-payment → 200 com novo pixQrCode

[ ] 9. Documentação interativa:
       GET /docs → Swagger UI carrega sem erros
       GET /docs/json → spec OpenAPI 3.0 válida
```

---

## 7. Variáveis de Environment no Bruno

Resumo de todas as variáveis a configurar no Environment `Local`:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `baseUrl` | `http://localhost:3000` | URL base da API |
| `webhookSecret` | valor de `MP_WEBHOOK_SECRET` do `.env` | Secret para assinar o HMAC |
| `mapId` | *(preenchido via script pós-resposta)* | ID do mapa criado |
| `mapToken` | *(preenchido manualmente após webhook)* | Token de acesso gerado no step 4 |
| `mpPaymentId` | *(preenchido manualmente)* | ID do pagamento no Mercado Pago |

---

## 8. Dicas de Debug

### Ver logs estruturados em tempo real

O servidor usa Pino (via Fastify). Para logs legíveis no terminal, use `pino-pretty`:

```bash
cd backend
npm run dev | npx pino-pretty
```

### Inspecionar o banco de dados

Acesse o Supabase Studio: `https://<seu-projeto>.supabase.co` → Table Editor → tabela `maps`.

Campos importantes para verificar durante os testes:

| Campo | O que indica |
|-------|-------------|
| `status` | Estado atual do mapa |
| `token` | Token de acesso (só existe após aprovação) |
| `slug` | Slug gerado após aprovação |
| `payment_id` | ID do pagamento no MP |
| `expires_at` | Data de expiração (null = premium) |

### Forçar expiração de um mapa basic (para testar o 403)

Execute diretamente no Supabase SQL Editor:

```sql
UPDATE maps
SET expires_at = NOW() - INTERVAL '1 day'
WHERE id = '<seu-map-id>';
```

Na próxima chamada ao `GET /api/maps/by-token`, o backend detectará a expiração e retornará 403 com a mensagem de upgrade.

### Testar sem Mercado Pago real

Para não depender do MP em desenvolvimento, você pode criar um mock no banco diretamente após o `POST /api/maps`, atualizando os campos manualmente e depois disparando o webhook simulado (Request 4a).

```sql
-- Simular que o MP criou um pagamento com id "fake-payment-123"
UPDATE maps
SET payment_id = 'fake-payment-123'
WHERE id = '<seu-map-id>';
```

Depois, ao disparar o webhook com `"id": "fake-payment-123"`, o backend consultará o MP para obter o status real desse ID — portanto ainda precisa de um `mpPaymentId` válido no sandbox do MP.
