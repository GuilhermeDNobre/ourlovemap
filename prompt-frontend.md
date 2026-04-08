Você é um desenvolvedor frontend senior especializado em React e está implementando o frontend de um SaaS chamado **Our Love Map**, que cria páginas interativas de mapa para casais acessadas através de QR Code.

# Implementação do Frontend - Our Love Map

## Business

O usuário cria um **mapa do relacionamento** preenchendo um formulário.

Cada mapa possui **localizações marcantes do casal**, por exemplo:

- primeiro encontro
- pedido de namoro
- viagem importante

Cada localização possui:

- título
- foto
- descrição
- mensagem personalizada
- link de vídeo do YouTube com timestamp específico
- coordenadas no mapa

Após preencher o formulário o usuário realiza o pagamento.

Após confirmação do pagamento:

- uma página personalizada é gerada
- um QR Code é enviado por email
- visitantes acessam a experiência escaneando o QR Code.

Planos disponíveis:

Plano Básico (`basic`)
- até 3 localizações
- página ativa por 7 dias
- preço: R$ 19,90

Plano Premium (`premium`)
- até 7 localizações
- página sem expiração
- preço: R$ 29,90

Ao final da experiência aparece uma seção:

- "Este é o nosso mapa do amor"
- mapa com todos os pins
- contador mostrando há quanto tempo o casal está junto
- botão para compartilhar no Instagram Stories.

O usuário **não possui conta ou autenticação**.

---

## Technical

Estrutura do projeto:


./frontend


Stack:

- React
- Vite
- TailwindCSS
- Framer Motion
- React Hook Form
- Mapbox

Regras importantes:

- O frontend **NUNCA acessa o banco diretamente**
- O frontend **SEMPRE consome a API do backend**

---

## Endpoints do backend

### Criar mapa

```
POST /api/maps
Content-Type: multipart/form-data
```

Campos obrigatórios do formulário:

| Campo | Tipo | Descrição |
|---|---|---|
| `couple_name` | string | Nome do casal |
| `buyer_name` | string | Nome completo do comprador |
| `buyer_phone` | string | Telefone do comprador |
| `email` | string | Email para receber o QR Code |
| `plan` | string | `basic` ou `premium` |
| `relationship_start_date` | string | Data de início do relacionamento (YYYY-MM-DD) |

Campos opcionais do formulário:

| Campo | Tipo | Descrição |
|---|---|---|
| `youtube_url` | string | URL completa do YouTube ou video ID de 11 caracteres |
| `youtube_start_time` | number | Timestamp de início em segundos |
| `youtube_end_time` | number | Timestamp de fim em segundos |

Campos de localização (notação indexada, 0-based):

| Campo | Tipo | Obrigatório |
|---|---|---|
| `locations[N][title]` | string | sim |
| `locations[N][latitude]` | string | sim |
| `locations[N][longitude]` | string | sim |
| `locations[N][order]` | string | sim |
| `locations[N][description]` | string | não |
| `locations[N][message]` | string | não |
| `locations[N][photo]` | file (imagem) | não — máx 5MB |

Resposta de sucesso `200`:

```json
{
  "mapId": "uuid",
  "checkoutUrl": "https://checkout.infinitepay.io/..."
}
```

Erros: `400` campos inválidos / `422` limite de localizações excedido ou falha no checkout.

---

### Consultar status do pagamento

```
GET /api/maps/:id/payment-status
```

Resposta `200`:

```json
{
  "status": "pending_payment" | "active" | "expired" | "payment_failed",
  "checkoutUrl": "https://..." | null
}
```

Erro: `404` mapa não encontrado.

---

### Retentar pagamento

```
POST /api/maps/:id/retry-payment
```

Usado quando `status === "payment_failed"`. Gera um novo link de checkout.

Resposta `200`:

```json
{
  "checkoutUrl": "https://checkout.infinitepay.io/..."
}
```

Erros: `404` mapa não encontrado / `422` mapa já ativo ou expirado.

---

### Consultar página pública

```
GET /api/maps/by-token?token=<token>
```

Resposta `200`:

```json
{
  "coupleName": "string",
  "relationshipStartDate": "2023-06-15",
  "youtubeVideoId": "string | null",
  "youtubeStartTime": "number | null",
  "youtubeEndTime": "number | null",
  "locations": [
    {
      "title": "string",
      "description": "string | null",
      "message": "string | null",
      "photoUrl": "string | null",
      "latitude": number,
      "longitude": number,
      "order": number
    }
  ]
}
```

Erros:
- `401` — token ausente ou inválido
- `403` com `{ "error": "map_expired", "message": "Seu acesso expirou..." }` — mapa expirado (mostrar tela de upgrade)
- `403` com `{ "error": "Map is not active" }` — pagamento ainda pendente

---

## Fluxo da URL pública

O QR Code aponta para:

```
{BASE_URL}/{slug}?token={token}
```

Exemplo:

```
https://ourlovemap.com/carol-e-andre?token=aB3kZ
```

O frontend deve:
1. Extrair o parâmetro `token` da query string
2. Chamar `GET /api/maps/by-token?token={token}`
3. Tratar o `403 map_expired` com uma tela de upgrade ao plano Premium

---

## UI/UX

Fluxo do formulário em **wizard multi-step**.

### Etapa 1
Informações do casal

- nome do casal
- email
- nome completo do comprador
- telefone do comprador
- data de início do relacionamento

### Etapa 2
Escolha do plano

- plano básico (R$ 19,90 — 3 localizações — 7 dias)
- plano premium (R$ 29,90 — 7 localizações — sem expiração)

### Etapa 3
Adicionar localizações

Cada localização possui:

- título
- foto (máx 5MB)
- descrição
- mensagem
- busca de vídeo do YouTube
- escolha do timestamp de início e fim
- seleção de coordenadas no mapa

### Etapa 4
Pagamento

- exibir resumo do mapa criado
- redirecionar para `checkoutUrl` retornado pelo `POST /api/maps`
- após o redirecionamento, polling em `GET /api/maps/:id/payment-status` até `status === "active"`
- se `status === "payment_failed"`: exibir botão "Tentar novamente" que chama `POST /api/maps/:id/retry-payment`

---

## Experiência da Página Pública

Ao abrir a página via QR Code:

1. Extrair `token` da query string e chamar `GET /api/maps/by-token?token={token}`
2. Exibir mapa com **tema dark**
3. Mostrar primeiro pin
4. Ao clicar no pin:
   - exibir foto
   - exibir título
   - exibir descrição
   - exibir mensagem

5. Ao rolar a página:
   - animação conectando o caminho até o próximo ponto

6. Repetir o processo para cada localização

7. Ao final:

- mostrar todos os pins com fotos estilo **polaroid**
- contador mostrando há quanto tempo o casal está junto (baseado em `relationshipStartDate`)
- botão de compartilhar no Instagram

---

## Requisitos de UX

- design **mobile-first**
- carregamento progressivo de imagens
- skeleton loading durante carregamento
- animações suaves com Framer Motion
- mapa com tema escuro
- narrativa baseada em scroll

---

## Fora do Escopo

- **NÃO** implementar autenticação
- **NÃO** criar painel administrativo
- **NÃO** permitir edição da página após pagamento
- **NÃO** implementar customização de cores
- **NÃO** permitir escolha de ícones de pin
