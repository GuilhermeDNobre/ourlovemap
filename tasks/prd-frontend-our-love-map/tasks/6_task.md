# Tarefa 6.0: Wizard — Fluxo de pagamento

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

Implementar o fluxo completo de pagamento: submissão do formulário para o backend via `POST /api/maps` (multipart/form-data), exibição do modal de pagamento PIX com QR Code e copia-e-cola, polling automático do status a cada 3 segundos, fluxo alternativo de pagamento com cartão de crédito (CPF + redirect para AbacatePay), e tela de confirmação de sucesso quando o pagamento é aprovado.

## Subtarefas

- [ ] 6.1 Criar `src/lib/build-map-form-data.ts` — função `buildMapFormData(store: WizardStore): FormData` que constrói o `FormData` com a notação de colchetes exigida pelo backend: campos escalares (`couple_name`, `buyer_name`, `buyer_phone`, `email`, `plan`, `relationship_start_date`, `youtube_url`, `youtube_start_time`, `youtube_end_time`) e localizações indexadas (`locations[0][title]`, `locations[0][latitude]`, etc.) incluindo o arquivo de foto via `formData.append`
- [ ] 6.2 Criar `src/hooks/use-create-map.ts` — mutation TanStack Query (`useMutation`) que chama `POST /api/maps` com o FormData. Em `onSuccess`, salva o `mapId` retornado no wizard store. Em `onError`, exibe mensagem de erro inline no Step 4 sem abrir o modal
- [ ] 6.3 Criar `src/hooks/use-payment-polling.ts` — hook que usa `useQuery` com `refetchInterval: (data) => data?.status === 'pending_payment' ? 3000 : false` para `GET /api/maps/:id/payment-status`. Retorna `{ status, isActive, isFailed }`
- [ ] 6.4 Criar `src/components/wizard/PaymentModal.tsx` com três estados internos:
  - **Estado PIX** (inicial): exibe QR Code (`<img src={brCodeBase64} />`), código copia-e-cola com botão "Copiar código" (usa `navigator.clipboard.writeText`), timer de expiração em contagem regressiva (calcula segundos restantes a partir de `expiresAt`), botão "Pagar com cartão de crédito"
  - **Estado Cartão**: campo de CPF (`taxId`, formatação `000.000.000-00`), botão "Ir para pagamento" que chama `POST /api/maps/:id/card-payment` e redireciona para `checkoutUrl` via `window.open`
  - **Estado Sucesso**: ícone de check, mensagem "Pagamento confirmado! Seu QR Code está a caminho do seu email.", botão para fechar
  - **Estado Erro**: mensagem de erro, botão "Tentar novamente" que rechama o PIX
- [ ] 6.5 Conectar o polling no `PaymentModal`: ao detectar `status === 'active'` → transitar para Estado Sucesso. Ao detectar `status === 'payment_failed'` → transitar para Estado Erro
- [ ] 6.6 Conectar o botão "Finalizar compra" do Step 4 ao fluxo completo: chamar `buildMapFormData` → `useCreateMap` mutation → ao receber `mapId`, abrir `PaymentModal` e chamar `POST /api/maps/:id/pix-payment` → exibir QR Code

## Detalhes de Implementação

Consultar RF-39 a RF-44 do prd.md e as seções **Submissão Multipart — FormData manual** e **Data Fetching — TanStack Query** da techspec.md.

**Nunca setar o header `Content-Type` manualmente no Axios quando usar FormData.** O Axios detecta o `FormData` e define o boundary correto automaticamente. Se o header for setado manualmente, o backend não conseguirá parsear o multipart.

**Campos obrigatórios do backend:** `couple_name`, `buyer_name`, `buyer_phone`, `email`, `plan`, `relationship_start_date`. O campo `youtube_url` só é enviado se o usuário selecionou uma música.

**Timer de expiração do PIX:** `expiresAt` é uma string ISO 8601. Calcular segundos restantes: `Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))`. Atualizar a cada segundo via `setInterval`. Quando chegar a zero: exibir "QR Code expirado" com botão de gerar novo.

**Formatação de CPF:** aplicar máscara `000.000.000-00` em tempo real no campo de CPF (substituir caracteres não numéricos e inserir pontos e traço nas posições corretas).

**Erro do backend `422`:** ocorre quando o número de localizações excede o limite do plano. Exibir mensagem clara: "Você tem X lugares, mas o plano Basic permite apenas 3. Altere para Premium."

## Critérios de Sucesso

- Clicar em "Finalizar compra" chama `POST /api/maps` com todos os campos corretos no formato multipart
- Modal PIX abre com QR Code e código copia-e-cola
- Botão "Copiar código" copia o `brCode` para o clipboard
- Timer de expiração faz contagem regressiva em tempo real
- Polling detecta `status === 'active'` e transita para tela de sucesso automaticamente
- Polling detecta `status === 'payment_failed'` e exibe tela de erro
- Fluxo de cartão: campo de CPF com máscara, chama `POST /card-payment` e redireciona para `checkoutUrl`
- Erro 400/422 do backend exibe mensagem inline no Step 4 sem abrir modal

## Testes da Tarefa

- [ ] Testes unitários `build-map-form-data.ts`: campos escalares corretos, localizações indexadas com notação de colchetes, foto anexada como File, `youtube_url` ausente quando não há música
- [ ] Testes de integração `use-payment-polling` (MSW): retorna `pending_payment` → polling continua, retorna `active` → `isActive` vira `true` e refetch para, retorna `payment_failed` → `isFailed` vira `true`
- [ ] Testes de renderização `PaymentModal`: exibe QR Code no estado PIX, botão "Copiar código" chama `navigator.clipboard.writeText`, transita para estado sucesso quando `status` muda para `active`, transita para estado erro quando `status` muda para `payment_failed`
- [ ] Testes de integração fluxo completo (MSW): mock `POST /api/maps` retorna `{ mapId }`, mock `POST /pix-payment` retorna QR Code, modal abre com dados corretos

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `frontend/src/lib/build-map-form-data.ts`
- `frontend/src/hooks/use-create-map.ts`
- `frontend/src/hooks/use-payment-polling.ts`
- `frontend/src/components/wizard/PaymentModal.tsx`
- `frontend/src/components/wizard/steps/Step4Envio.tsx` (atualização)
- `frontend/src/components/wizard/Wizard.tsx` (atualização)
