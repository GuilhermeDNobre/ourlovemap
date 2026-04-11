# PRD — Backend Our Love Map

## Visão Geral

O **Our Love Map** é um SaaS que permite casais criarem uma página interativa com um mapa de localizações importantes do relacionamento, acessada via QR Code. O backend é a camada central que gerencia todo o ciclo de vida do mapa: recebimento dos dados do formulário, processamento do pagamento, geração do QR Code, envio de email e fornecimento seguro dos dados para a página pública. O frontend nunca acessa o banco de dados diretamente — toda comunicação passa pela API.

---

## Objetivos

- Processar a criação de mapas e pagamentos de forma confiável, sem perda de dados entre etapas
- Garantir que apenas mapas com pagamento aprovado sejam acessíveis publicamente
- Aplicar os limites de cada plano (básico e premium) de forma consistente
- Entregar o QR Code ao usuário via email em até 1 minuto após a aprovação do pagamento
- Validar uploads de foto no backend, rejeitando arquivos fora do formato ou acima do limite

---

## Histórias de Usuário

- Como **casal comprador**, quero preencher um formulário com nossas localizações e fotos e receber um QR Code por email após o pagamento, para que possamos compartilhar nossa história de forma interativa.
- Como **casal comprador do plano básico**, quero acessar minha página durante 1 semana, e ao expirar, receber uma mensagem clara sugerindo o upgrade para o plano premium.
- Como **casal comprador do plano premium**, quero que minha página fique ativa para sempre, sem prazo de expiração.
- Como **visitante com QR Code**, quero acessar a página do casal através do link com token, para que minha experiência seja segura e exclusiva.
- Como **sistema**, quero receber notificações do Mercado Pago e atualizar o status do mapa de acordo, garantindo que tentativas malsucedidas possam ser refeitas.

---

## Funcionalidades Principais

### 1. Criação de Mapa (`POST /api/maps`)

Recebe os dados do formulário e cria um mapa com status `pending_payment`.

**Requisitos funcionais:**

- RF-01: Aceitar os campos: `couple_name`, `email`, `plan`, `relationship_start_date`, localizações e fotos.
- RF-02: Validar o plano informado (`basic` ou `premium`).
- RF-03: Limitar a quantidade de localizações por plano: básico = 3, premium = 7.
- RF-04: Aceitar exatamente 1 foto por localização.
- RF-05: Rejeitar fotos com tamanho superior a 5MB com erro 400.
- RF-06: Rejeitar arquivos que não sejam imagens (`jpg`, `jpeg`, `png`, `webp`) com erro 400.
- RF-07: Armazenar as fotos no Supabase Storage.
- RF-08: Aceitar os campos de música: `youtube_video_id`, `youtube_start_time`, `youtube_end_time`.
- RF-09: Salvar o mapa com status `pending_payment`.
- RF-10: Retornar o `map_id` e as informações necessárias para iniciar o pagamento.

---

### 2. Webhook de Pagamento (`POST /api/payments/webhook`)

Recebe eventos do Mercado Pago e atualiza o status do mapa.

**Requisitos funcionais:**

- RF-11: Validar a assinatura HMAC do webhook antes de processar qualquer evento.
- RF-12: Rejeitar requisições com assinatura inválida com erro 401.
- RF-13: Tratar o evento `payment.updated` com status `approved`: atualizar o mapa para `active`, gerar `slug`, gerar `token`, calcular `expires_at` conforme o plano (básico: +7 dias; premium: `null`), gerar o QR Code e enviar email.
- RF-14: Tratar o evento `payment.updated` com status `rejected` ou `cancelled`: atualizar o mapa para `payment_failed`, permitindo nova tentativa de pagamento.
- RF-15: Retornar `200` ao Mercado Pago em todos os casos processados (incluindo eventos ignorados), para evitar reenvios desnecessários.
- RF-16: O QR Code deve apontar para `https://ourlovemap.com/access?token=<token>`.
- RF-17: O QR Code deve ser gerado como imagem JPG.

---

### 3. Email de Entrega

Enviado via Resend após aprovação do pagamento.

**Requisitos funcionais:**

- RF-18: O email deve conter: nome do casal, mensagem de boas-vindas, link de acesso (`https://ourlovemap.com/access?token=<token>`) e o QR Code como imagem JPG anexada.
- RF-19: A mensagem de boas-vindas deve ser clara e afetiva (ex: "Aqui está seu acesso para o seu Mapa do Amor").

---

### 4. Página Pública (`GET /api/maps/:slug`)

Fornece os dados do mapa para o frontend renderizar a página pública.

**Requisitos funcionais:**

- RF-20: Exigir o parâmetro `token` na query string.
- RF-21: Retornar 401 se o token estiver ausente ou não corresponder ao slug.
- RF-22: Verificar o status do mapa: apenas mapas com status `active` devem ser acessíveis.
- RF-23: Para mapas com status `expired`: retornar 403 com mensagem informando a expiração e sugerindo o upgrade para o plano premium.
- RF-24: Verificar `expires_at`: se a data atual for posterior ao `expires_at` e o plano for `basic`, atualizar o status para `expired` e aplicar RF-23.
- RF-25: Retornar os dados públicos: `couple_name`, `relationship_start_date`, `youtube_video_id`, `youtube_start_time`, `youtube_end_time`, e lista de localizações com `title`, `description`, `message`, `photo_url`, `latitude`, `longitude`, `order`.

---

### 5. Status do Mapa

| Status | Descrição |
|---|---|
| `pending_payment` | Mapa criado, aguardando pagamento |
| `active` | Pagamento aprovado, página acessível |
| `expired` | Prazo do plano básico encerrado |
| `payment_failed` | Pagamento rejeitado ou cancelado — nova tentativa permitida |

---

## Experiência do Usuário

O backend é consumido exclusivamente pelo frontend e pelo Mercado Pago. Do ponto de vista do usuário final:

- O fluxo é linear: formulário → pagamento → email com QR Code → acesso à página.
- O acesso sem token válido deve retornar resposta clara (401 ou 403), nunca uma página vazia ou erro genérico.
- O acesso expirado deve sempre sugerir o upgrade, nunca apenas bloquear silenciosamente.
- Erros de upload (tamanho, formato) devem retornar mensagens descritivas para que o frontend possa exibir feedback adequado ao usuário.

---

## Restrições Técnicas de Alto Nível

- **Runtime**: Node.js com Fastify
- **Banco de dados**: Supabase (PostgreSQL) — frontend nunca acessa diretamente
- **Storage**: Supabase Storage — fotos das localizações
- **Pagamento**: Mercado Pago — webhook com validação HMAC obrigatória
- **Email**: Resend — entrega transacional
- **QR Code**: biblioteca Node.js, formato JPG
- **Analytics**: PostHog
- **Monitoramento de erros**: Sentry
- **Tamanho máximo de foto**: 5MB por arquivo
- **Formatos de imagem aceitos**: `jpg`, `jpeg`, `png`, `webp`
- **Plano básico**: `expires_at` = data de ativação + 7 dias
- **Plano premium**: `expires_at` = `null` (sem expiração)
- **Assinatura do webhook**: validação obrigatória via HMAC antes de qualquer processamento

---

## Fora de Escopo

- Autenticação e painel administrativo
- Edição de mapas após o pagamento
- Upload de vídeo (apenas links do YouTube são armazenados)
- Sistema de comentários
- Reembolso ou cancelamento de planos via API
- Renovação automática de assinatura (plano básico não renova automaticamente)
- Notificações push ou SMS
