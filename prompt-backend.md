Você é um desenvolvedor backend senior especializado em Node.js e está implementando o backend de um SaaS chamado **Our Love Map**, que cria páginas interativas de mapa para casais acessadas através de QR Code.

# Implementação do Backend - Our Love Map

## Business

Usuários criam um **mapa do relacionamento** preenchendo um formulário.

Cada mapa contém **localizações importantes do casal**.

Cada localização possui:

- foto
- descrição
- mensagem
- coordenadas geográficas

Após preencher o formulário o usuário realiza o pagamento.

Quando o pagamento é aprovado:

- uma página personalizada é gerada
- um slug é criado
- um token de acesso é gerado
- um QR Code é gerado
- o QR Code é enviado ao email do usuário

A página é acessada através do QR Code.

---

## Technical

Estrutura do projeto:


./backend


Stack:

- Node.js
- Fastify

Infraestrutura:

- Banco de dados: Supabase (PostgreSQL)
- Storage: Supabase Storage
- Pagamento: Mercado Pago
- Analytics: PostHog
- Monitoramento de erros: Sentry
- Email: Resend
- Geração de QR Code: biblioteca Node

O backend é responsável por:

- salvar dados do formulário
- validar planos e requests
- validar limites do plano
- processar pagamento
- gerar slug
- gerar token
- gerar QR Code
- enviar email
- fornecer dados da página pública

O frontend **NUNCA acessa o banco diretamente**.

---

## Endpoints

### Criar mapa


POST /api/maps


Cria um mapa com status:


pending_payment

Payload inclui:

- nome do casal
- email
- plano
- data do relacionamento
- localizações
- fotos
- vídeo
---

### Webhook de pagamento


POST /api/payments/webhook


Recebe eventos do Mercado Pago.

Se pagamento aprovado:

- atualizar status → `active`
- gerar slug
- gerar token
- gerar QR Code
- enviar email com QR Code

---

### Buscar página pública


GET /api/maps/:slug


Valida:

- token
- status
- expiração

Retorna:

- dados do casal
- data do relacionamento
- localizações
- fotos

---

## Status do mapa

Possíveis valores:


pending_payment
active
expired


---

## Database

### Tabela maps

id
couple_name
slug
email
plan
relationship_start_date
token
status
youtube_video_id
youtube_start_time
expires_at
created_at


### Tabela locations

id
map_id
title
description
message
photo_url
latitude
longitude
order


---

## Segurança

A página pública deve validar:

- pagamento aprovado
- token válido
- página não expirada

Slug público:


/carol-e-andre


Acesso real:


/carol-e-andre?t=<token>


Sem token válido a página não deve ser exibida.

---

## Validação de Endpoints

- testar endpoints com curl
- validar webhook do Mercado Pago
- validar upload de imagens no storage
- validar acesso à página pública

---

## Fora do Escopo

- **NÃO** implementar autenticação
- **NÃO** criar painel administrativo
- **NÃO** permitir edição de mapas após pagamento
- **NÃO** implementar upload de vídeo (apenas links do YouTube)
- **NÃO** implementar sistema de comentários