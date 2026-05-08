# PRD — Frontend Our Love Map

## Visão Geral

O frontend do **Our Love Map** é a interface completa do produto: uma aplicação React + Vite que cobre desde a página de marketing até a experiência do destinatário via QR Code. Existem dois universos visuais distintos — o surface **light/cream** da landing e do wizard (convencer e guiar o comprador) e o surface **dark/cinematográfico** da página pública (emocionar o destinatário). Toda comunicação com dados passa pela API do backend; o frontend nunca acessa o banco diretamente.

---

## Objetivos

- Converter visitantes em compradores através de uma landing page que comunica clareza e emoção
- Guiar o casal pelo processo de criação do mapa com um wizard de 4 passos intuitivo, responsivo e com preview ao vivo
- Concluir o pagamento (PIX ou cartão) sem sair do fluxo principal, com feedback claro de status
- Entregar ao destinatário uma experiência de scroll storytelling cinematográfica e mobile-first que justifica o produto
- Funcionar bem no celular tanto para quem cria (wizard) quanto para quem recebe (página pública)

---

## Histórias de Usuário

- Como **comprador**, quero entender o produto rapidamente na landing e clicar em "Criar nosso mapa" sem dúvidas sobre o que vou receber.
- Como **comprador**, quero selecionar meu plano (Basic ou Premium) antes ou durante o wizard, e entender claramente o que cada um oferece.
- Como **comprador**, quero preencher os dados do casal, adicionar lugares com autocomplete de endereço e foto, escolher uma música e informar meu email — tudo em uma sequência clara e com preview ao vivo.
- Como **comprador**, quero pagar via PIX (QR Code + copia e cola) ou cartão de crédito sem sair da experiência principal.
- Como **comprador**, quero receber confirmação visual clara de que o pagamento foi aprovado e o QR Code está a caminho.
- Como **destinatário**, quero abrir o link do QR Code no celular e viver uma experiência de scroll storytelling com os lugares do casal, música de fundo e o mapa final interativo.

---

## Funcionalidades Principais

### 1. Landing Page (`/`)

Página de marketing no surface light cream (`#FBF5F0`).

**Requisitos funcionais:**

- RF-01: Renderizar Navbar sticky com logo, links âncora (Como funciona, Funcionalidades, Preços, FAQ) e CTA "Criar nosso mapa".
- RF-02: Renderizar seção Hero com headline, subtítulo, CTA primário, prova social ("Mais de 3.200 casais") e mockup do produto à direita.
- RF-03: Renderizar seção "Como funciona" com 3 passos ilustrados.
- RF-04: Renderizar seção "Preview da experiência" com mockup dark do produto.
- RF-05: Renderizar seção "Casos de uso" com 4 cards (pedido de casamento, aniversário, viagem, primeiro encontro).
- RF-06: Renderizar seção "Funcionalidades" em grid bento (mapa interativo, polaroides, YouTube, contador, Instagram share, QR Code).
- RF-07: Renderizar seção "Preços" com cards dos planos Basic (R$19,90) e Premium (R$29,90) — cada card tem um CTA que inicia o wizard já com o plano pré-selecionado.
- RF-08: Renderizar seção FAQ com accordion.
- RF-09: Renderizar seção Final CTA com gradiente dark e botão de ação.
- RF-10: Renderizar Footer com logo, links legais e crédito.
- RF-11: A Navbar deve aplicar `backdrop-filter: blur(14px)` e borda inferior ao fazer scroll além de 12px.

---

### 2. Wizard de Criação (`/criar`)

Formulário de 4 passos com layout dois-colunas (form à esquerda, preview sticky à direita). Em mobile (< 720px), o preview desce abaixo do form.

#### Step 0 — Seleção de Plano (modal ou tela inicial)

- RF-12: Exibir cards de plano (Basic e Premium) com funcionalidades e preços antes de iniciar o Step 1, ou permitir que a landing já pré-selecione o plano via query param (`?plano=premium`).
- RF-13: O plano selecionado deve persistir no estado do wizard e ser visível ao longo de todos os steps.

#### Step 1 — Vocês

- RF-14: Campo "Nomes do casal" (obrigatório) — formato livre ("Ana e Lucas"), usado para derivar o slug e renderizar o "e" em coral no preview.
- RF-15: Campo "Nome completo do comprador" (obrigatório) — enviado ao backend como `buyer_name`.
- RF-16: Campo "Telefone do comprador" (obrigatório) — enviado como `buyer_phone`.
- RF-17: Campo "Data de início do relacionamento" (obrigatório, `<input type="date">`) — ativa o contador ao vivo no preview.
- RF-18: Campo "Frase de abertura do mapa" (opcional, até 200 caracteres).
- RF-19: O painel direito deve exibir o slug derivado (`ourlovemap.com.br/<slug>`) e o phone preview atualizado ao vivo com nomes, frase e contador.

#### Step 2 — Localizações

- RF-20: Cada card de lugar deve conter: campo de busca de endereço com autocomplete (Maptiler Geocoding API), campo "Nome do lugar", campo "Descrição/lembrança" e upload de foto (1 por lugar, JPEG/PNG/WebP, máx. 5MB).
- RF-21: O campo de endereço deve sugerir resultados enquanto o usuário digita (mínimo 3 caracteres) e ao selecionar uma sugestão capturar `latitude`, `longitude` e endereço formatado.
- RF-22: Drag-to-reorder nos cards via handle de 6 pontos (usar `@dnd-kit/core`).
- RF-23: Botão "+ Adicionar lugar" no rodapé da lista.
- RF-24: Ao adicionar o 4º lugar enquanto o plano é Basic, exibir um banner/modal informando que o plano será atualizado para Premium automaticamente, com confirmação do usuário.
- RF-25: Footer do step deve exibir `{n} de {limite} lugares ({plano})`.
- RF-26: Máximo de 3 lugares no plano Basic; máximo de 7 no Premium — o backend também valida.

#### Step 3 — Música

- RF-27: Campo de busca de música com ícone de lupa — aceita query de texto ou URL direta do YouTube.
- RF-28: Ao submeter a busca por texto, chamar YouTube Data API (`search.list`) e exibir os primeiros resultados com thumbnail, título e duração.
- RF-29: Ao submeter uma URL direta do YouTube, validar o formato (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`) e exibir o card da faixa.
- RF-30: Exibir card da faixa selecionada com thumbnail e título.
- RF-31: Dois sliders: "Início" (0–270s, coral) e "Fim" (start+5 a 272s, lavender) — exibir tempo no formato `M:SS`.
- RF-32: Toggle de loop com animação de switch.
- RF-33: Step opcional — o usuário pode avançar sem selecionar música.

#### Step 4 — Envio

- RF-34: Banner de aviso: "QR Code e link de edição vão APENAS para esse email".
- RF-35: Campo de email (obrigatório).
- RF-36: Campo de confirmação de email — validação ao vivo: borda vermelha + mensagem de erro se não coincidir.
- RF-37: Card de resumo: casal, número de lugares, plano selecionado, música (✓ ou —).
- RF-38: Seletor final de plano — o usuário pode confirmar ou alterar o plano antes de finalizar (Basic ou Premium).
- RF-39: Botão "Finalizar compra" — ao clicar, submete `POST /api/maps` (multipart/form-data) e abre o modal de pagamento.

#### Modal de Pagamento PIX

- RF-40: Ao criar o mapa com sucesso (retorna `mapId`), chamar `POST /api/maps/:id/pix-payment` e exibir modal com:
  - QR Code do PIX como imagem (`brCodeBase64`)
  - Código copia e cola (`brCode`) com botão "Copiar código"
  - Timer de expiração do QR Code (`expiresAt`)
  - Botão "Pagar com cartão de crédito"
- RF-41: Ao clicar em "Pagar com cartão de crédito", exibir campo de CPF (`taxId`), chamar `POST /api/maps/:id/card-payment` e redirecionar para `checkoutUrl` da AbacatePay.
- RF-42: O frontend deve fazer polling em `GET /api/maps/:id/payment-status` a cada 3 segundos enquanto o modal PIX estiver aberto.
- RF-43: Ao detectar status `active`, fechar o modal e exibir tela de confirmação de pagamento com mensagem de sucesso e instrução de verificar o email.
- RF-44: Ao detectar status `payment_failed`, exibir mensagem de erro com opção de gerar novo QR Code.

#### Painel de Preview (direita, sticky)

- RF-45: Card de slug (`ourlovemap.com.br/<slug>`) gerado a partir dos nomes.
- RF-46: Phone preview em 9:16 com fundo dark mostrando: nomes do casal (com "e" em coral), frase de abertura em itálico, contador ao vivo do relacionamento, polaroide do primeiro lugar (step 2+) e chip de música (step 3+).
- RF-47: Em mobile, o preview é exibido abaixo do form (não sticky).

#### Progress Dots

- RF-48: Barra de progresso com 4 dots numerados — dot preenchido (coral) para steps completos, dot ativo (título) para step atual, dot neutro para steps futuros.

#### Persistência

- RF-49: O estado do wizard deve ser persistido em `localStorage` para que o refresh da página não perca o progresso.

---

### 3. Página Pública (`/acesso?token=<token>`)

Surface dark (`#25212A`). Mobile-first. Scroll storytelling vertical.

- RF-50: Ao carregar, chamar `GET /api/maps/by-token?token=<token>`. Se 401, exibir tela de "acesso inválido". Se 403 com `map_expired`, exibir tela de expiração com CTA de upgrade.
- RF-51: **Cover Screen** — viewport completo com: logo (cream), eyebrow "Um mapa pra você", headline com nomes (e em coral/itálico), frase de abertura em itálico, contador do relacionamento ao vivo (anos · meses · dias · HH:MM:SS), pin central pulsante com "toque pra começar", seta "role pra baixo".
- RF-52: A Cover deve iniciar a reprodução da música (YouTube IFrame API) ao primeiro toque/scroll do usuário. Se autoplay bloqueado, exibir prompt de interação.
- RF-53: **PlaceSection** (uma por localização, na ordem do campo `order`) — mapa de fundo (MapLibre) com todos os pins onde apenas o pin ativo fica em coral brilhante e os demais ficados, card de conteúdo com: eyebrow (ex: "PRIMEIRO ENCONTRO"), nome do lugar em serif, data, polaroide com foto e caption em itálico, descrição em itálico, seta de scroll.
- RF-54: A ativação da PlaceSection (pin brilhante + card visível) deve ser driven por scroll — a seção que ocupa mais de 50% do viewport é a ativa.
- RF-55: **TravelTransition** (entre cada par de lugares) — seção de 90vh com SVG de rota decorativa em coral animada por `stroke-dashoffset` conforme o scroll. Três variantes de path alternadas. Texto central: "de [lugar A] / pra / [lugar B]".
- RF-56: **FinalMapScreen** — mapa interativo real (MapLibre GL JS) dark style com todos os places como pins, polaroides flutuando sobre cada pin (com rotação e drop shadow), rota dashed coral conectando todos, headline "Esse é o nosso mapa do amor.", CTA "Compartilhar no Instagram" (Web Share API no mobile, copy-link no desktop), link "Voltar ao começo ↑".
- RF-57: A música deve continuar tocando durante todo o scroll. Loop conforme configuração do casal.
- RF-58: Não deve haver nenhum chrome de navegação (navbar, footer) na página pública.

---

## Integrações Externas

| Integração | Uso | Autenticação |
|---|---|---|
| **Backend API** | Todas as operações de dados | Nenhuma (token na query string para mapa público) |
| **Maptiler Geocoding API** | Autocomplete de endereço no wizard (Step 2) | API Key no env |
| **Maptiler Maps** | Tiles do mapa dark no FinalMapScreen | Mesma API Key |
| **YouTube Data API v3** | Busca de músicas no Step 3 | API Key no env |
| **YouTube IFrame API** | Reprodução da música na página pública | Nenhuma |
| **AbacatePay** | Redirect para checkout de cartão | URL retornada pelo backend |

---

## Rotas do Frontend

| Rota | Componente | Descrição |
|---|---|---|
| `/` | `<Landing />` | Landing page de marketing |
| `/criar` | `<Wizard />` | Wizard de criação (4 steps) |
| `/acesso` | `<PublicMap />` | Página pública via `?token=<token>` |

---

## Responsividade

- RF-59: Breakpoints: 480 / 768 / 1024 / 1280px.
- RF-60: Wizard: abaixo de 720px, o painel de preview desce abaixo do form; progress dots ficam compactos (só ícone, sem label).
- RF-61: Landing: abaixo de 768px, Hero vira layout single-column (mockup abaixo do texto); grid de 4 colunas (UseCases, BentoFeatures) vira 2 colunas; Pricing vira single-column.
- RF-62: Página pública: já é mobile-first por natureza (cards de lugar em full width, mapa final responsivo).

---

## Design e Experiência

- Tokens de design em `src/styles/tokens.css` (copiado de `design_handoff/design_files/tokens.css`) — importado uma vez no root.
- Fontes: DM Serif Display (serif, headings/ênfase) e Plus Jakarta Sans (sans, UI/body) — self-hosted via arquivos TTF do handoff.
- Estilização: Tailwind CSS com design tokens mapeados em `tailwind.config.ts`.
- Animações: Framer Motion para transições de steps (240ms ease-out), scroll-driven animations na página pública e microinterações de botões (`scale(0.98)` no press).
- Ícones: Lucide React (stroke 1.75px).
- O "e" entre os nomes do casal deve ser renderizado em coral e itálico (`<em>`) em todos os contextos onde o nome aparece.
- Sombras: sempre lavender-tinted (`--sh-*`), nunca gray.

---

## Restrições Técnicas

- **Framework**: React 18 + Vite + TypeScript
- **Estilização**: Tailwind CSS (sem styled-components)
- **Formulários**: `react-hook-form` + `zod`
- **Drag-to-reorder**: `@dnd-kit/core`
- **Animações**: Framer Motion
- **Mapa**: MapLibre GL JS
- **Geocoding/tiles**: Maptiler (API key obrigatória)
- **Música**: YouTube Data API v3 (busca) + YouTube IFrame API (player)
- **Variáveis de ambiente**: `VITE_API_BASE_URL`, `VITE_MAPTILER_API_KEY`, `VITE_YOUTUBE_API_KEY`
- **Testes**: Jest + React Testing Library (componentes críticos)
- **Persistência de wizard**: `localStorage`

---

## Fora de Escopo

- Painel de edição do mapa após o pagamento
- Autenticação / área logada
- Sistema de comentários ou interação do destinatário
- Notificações push ou SMS
- Internacionalização (i18n) — produto em PT-BR
- Integração direta com Instagram Stories API (apenas Web Share API nativa)
- Upload de vídeo (apenas links do YouTube)
- Reembolso ou cancelamento via frontend
