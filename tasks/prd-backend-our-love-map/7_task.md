# Tarefa 7.0: Endpoint POST /api/maps

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a rota `POST /api/maps` que orquestra a criação completa de um mapa: recebe o formulário com dados e fotos (multipart), valida, salva no banco, faz upload das fotos no Storage e inicia o pagamento PIX. Retorna ao frontend os dados necessários para exibir o QR Code de pagamento.

<requirements>
- Aceitar `multipart/form-data` com campos de texto e arquivos de foto
- Validar campos obrigatórios: `couple_name`, `email`, `plan`, `relationship_start_date`, localizações
- Validar plano (`basic` ou `premium`)
- Validar número de localizações conforme o plano
- Validar cada foto: tamanho ≤ 5MB, tipo aceito (jpeg, png, webp)
- Fazer upload das fotos para o Supabase Storage
- Criar o mapa e as localizações no banco
- Criar o pagamento PIX no Mercado Pago
- Retornar: `mapId`, `pixQrCode`, `pixCode`, `paymentExpiresAt`
- Retornar 400 para erros de validação com mensagem descritiva
- Retornar 422 se criação do PIX falhar
</requirements>

## Subtarefas

- [ ] 7.1 Criar `src/routes/map-routes.ts` com o plugin de rotas registrado em `src/app.ts` com prefixo `/api`
- [ ] 7.2 Implementar `POST /api/maps`:
  - Ler os campos de texto do multipart (não há JSON body nesta rota)
  - Ler e processar cada arquivo de foto via `request.parts()`
  - Validar campos obrigatórios; retornar 400 se ausentes
  - Chamar `storage-service.uploadPhoto` para cada localização
  - Chamar `map-service.createMap` com os dados montados
  - Chamar `payment-service.createPixPayment` com `plan` e `email`
  - Retornar 200 com `{ mapId, pixQrCode, pixCode, paymentExpiresAt }`
- [ ] 7.3 Escrever testes de integração para `POST /api/maps`

## Detalhes de Implementação

Consultar seções **Endpoints de API** e **Design de Implementação** da techspec.md.

Estrutura esperada dos campos multipart:
- Campos de texto: `couple_name`, `email`, `plan`, `relationship_start_date`, `youtube_video_id` (opcional), `youtube_start_time` (opcional), `youtube_end_time` (opcional)
- Para cada localização `i`: `locations[i][title]`, `locations[i][description]`, `locations[i][message]`, `locations[i][latitude]`, `locations[i][longitude]`, `locations[i][order]`, `locations[i][photo]` (arquivo)

Usar early returns para validações antes de chamar os serviços.

## Critérios de Sucesso

- Requisição válida com plano `basic` e 3 localizações → status 200 com dados do PIX
- Requisição com 4 localizações no plano `basic` → status 422
- Foto com tamanho > 5MB → status 400
- Foto com tipo inválido → status 400
- Campo obrigatório ausente → status 400 com mensagem do campo
- Mapa e localizações criados no banco após requisição bem-sucedida
- Fotos armazenadas no Supabase Storage com URLs corretas

## Testes da Tarefa

- [ ] `test/routes/map-routes.test.ts` (usando `buildApp()` + `fastify.inject()`, com mocks dos serviços):
  - `POST /api/maps` válido → 200 com `mapId`, `pixQrCode`, `pixCode`, `paymentExpiresAt`
  - Sem `couple_name` → 400
  - Sem `email` → 400
  - Plano inválido → 400
  - 4 localizações no plano `basic` → 422
  - Foto com tipo inválido → 400
  - Falha no Mercado Pago → 422

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/routes/map-routes.ts`
- `./backend/src/services/map-service.ts` (dependência)
- `./backend/src/services/payment-service.ts` (dependência)
- `./backend/src/services/storage-service.ts` (dependência)
- `./backend/src/app.ts` (modificado para registrar map-routes)
- `./backend/test/routes/map-routes.test.ts`
