# Tarefa 10.0: Endpoint público GET /api/maps/by-token + observabilidade

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o endpoint público `GET /api/maps/by-token?token=<token>` que valida o token, verifica o status e a expiração do mapa, e retorna os dados para a página pública. Em seguida, adicionar Sentry e PostHog em todos os pontos relevantes da aplicação para monitoramento de erros e analytics.

<requirements>
- `GET /api/maps/by-token?token=<token>` valida token, status e expiração
- Token ausente ou inválido → 401
- Mapa `expired` → 403 com mensagem sugerindo upgrade para premium
- Mapa `payment_failed` ou `pending_payment` → 403
- Mapa `active` → 200 com dados públicos do mapa e localizações
- Sentry captura todas as exceções não tratadas via `setErrorHandler`
- PostHog registra eventos: `map_created`, `payment_approved`, `payment_failed`, `map_expired_accessed`
- PostHog sempre fire-and-forget (nunca bloquear fluxo principal)
</requirements>

## Subtarefas

- [ ] 10.1 Implementar `GET /api/maps/by-token` em `src/routes/map-routes.ts`:
  - Ler `token` da query string; retornar 401 se ausente
  - Chamar `map-service.getMapByToken`; retornar 401 se `null`
  - Se status `expired` → retornar 403 com `{ error: "map_expired", message: "Seu acesso expirou. Faça upgrade para o plano Premium e mantenha seu mapa para sempre." }`
  - Se status não for `active` → retornar 403
  - Retornar 200 com dados públicos (ver estrutura na techspec.md)
- [ ] 10.2 Integrar Sentry:
  - Instalar e inicializar `@sentry/node` em `src/app.ts` antes de qualquer registro
  - Capturar exceções no `setErrorHandler` via `Sentry.captureException(error)`
  - Capturar falhas de integrações externas nos serviços (Supabase, MP, Resend) nos blocos catch
- [ ] 10.3 Integrar PostHog:
  - Criar `src/plugins/posthog-plugin.ts` que inicializa `PostHog` e decora `fastify.posthog`
  - Adicionar `fastify.posthog.capture` nos pontos corretos:
    - `map-service.createMap` → `map_created` com `{ plan }`
    - `payment-service.processWebhookEvent` status `approved` → `payment_approved` com `{ plan }`
    - `payment-service.processWebhookEvent` status `rejected`/`cancelled` → `payment_failed`
    - `GET /api/maps/by-token` mapa expirado → `map_expired_accessed`
  - Sempre envolver chamadas PostHog em try/catch sem relançar
- [ ] 10.4 Escrever testes de integração para `GET /api/maps/by-token`

## Detalhes de Implementação

Consultar seções **Monitoramento e Observabilidade** e **Conformidade com Padrões** da techspec.md.

O PostHog deve usar `distinctId` anônimo (ex: `mapId`) — nunca usar email ou nome do casal como identificador para respeitar privacidade.

Sentry deve ser inicializado com `dsn: process.env.SENTRY_DSN` e `environment: process.env.NODE_ENV`.

Dados nunca devem ser logados em produção: email, `couple_name`, dados do PIX. Verificar todos os logs existentes após integrar Sentry.

## Critérios de Sucesso

- `GET /api/maps/by-token?token=validtoken` → 200 com `coupleName`, localizações e dados do YouTube
- `GET /api/maps/by-token` sem token → 401
- `GET /api/maps/by-token?token=unknowntoken` → 401
- Mapa expirado → 403 com mensagem de upgrade
- Exceção não tratada em qualquer rota → Sentry recebe o evento
- Evento `map_created` capturado no PostHog após `POST /api/maps`
- PostHog nunca bloqueia nem lança exceção para o fluxo principal

## Testes da Tarefa

- [ ] `test/routes/map-routes.test.ts` (complementar):
  - `GET /api/maps/by-token?token=valid` → 200 com dados completos
  - `GET /api/maps/by-token` sem query param → 401
  - Token inexistente → 401
  - Mapa com status `expired` → 403 com mensagem de upgrade
  - Mapa com status `pending_payment` → 403
- [ ] Verificar manualmente (ou com teste de smoke) que Sentry recebe eventos em ambiente de desenvolvimento
- [ ] Verificar manualmente que PostHog captura `map_created` após `POST /api/maps`

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/routes/map-routes.ts` (modificado)
- `./backend/src/plugins/posthog-plugin.ts`
- `./backend/src/app.ts` (modificado para Sentry e PostHog)
- `./backend/src/services/map-service.ts` (modificado para PostHog)
- `./backend/src/services/payment-service.ts` (modificado para PostHog)
- `./backend/test/routes/map-routes.test.ts` (modificado)
