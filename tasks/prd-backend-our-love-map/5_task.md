# Tarefa 5.0: Map service (CRUD de mapas e localizações)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o `map-service.ts` com todas as operações de banco de dados para mapas e localizações: criação, ativação, consulta por token, atualização de status e verificação de expiração. Este serviço é consumido pelas rotas e pelo `payment-service`.

<requirements>
- Criar mapa com status `pending_payment` e suas localizações associadas
- Validar limite de localizações por plano (básico = 3, premium = 7)
- Ativar mapa após pagamento aprovado (definir slug, token, `expires_at`, status `active`)
- Atualizar status para `payment_failed` quando pagamento falha
- Buscar mapa por token com verificação de expiração automática (básico expira em 7 dias)
- Buscar status de pagamento por `map_id`
- Buscar mapa por `payment_id` (necessário no webhook)
</requirements>

## Subtarefas

- [ ] 5.1 Implementar `src/services/map-service.ts` com as seguintes funções:
  - `createMap(data: CreateMapData, supabase: SupabaseClient): Promise<Map>`
    - Valida limite de localizações por plano antes de inserir
    - Insere na tabela `maps` com status `pending_payment`
    - Insere localizações na tabela `locations` em batch
  - `activateMap(mapId: string, supabase: SupabaseClient): Promise<Map>`
    - Gera slug via `slug.ts`
    - Gera token via `token.ts`
    - Calcula `expires_at`: `basic` → `now + 7 dias`; `premium` → `null`
    - Atualiza status para `active`
  - `setPaymentFailed(mapId: string, supabase: SupabaseClient): Promise<void>`
  - `getMapByToken(token: string, supabase: SupabaseClient): Promise<Map | null>`
    - Se `expires_at` < `now` e status `active` → chamar `expireMap` antes de retornar
  - `getMapByPaymentId(paymentId: string, supabase: SupabaseClient): Promise<Map | null>`
  - `getPaymentStatus(mapId: string, supabase: SupabaseClient): Promise<MapPaymentStatus>`
  - `updatePaymentData(mapId: string, data: PaymentData, supabase: SupabaseClient): Promise<void>`
    - Salva `payment_id`, `pix_qr_code`, `pix_code`, `payment_expires_at`
- [ ] 5.2 Definir interfaces TypeScript: `CreateMapData`, `Map`, `Location`, `MapPaymentStatus`, `PaymentData`
- [ ] 5.3 Escrever testes unitários para `map-service.ts`

## Detalhes de Implementação

Consultar seções **Interfaces Principais**, **Modelos de Dados** e **Lógicas Críticas** da techspec.md.

Constantes para os limites de plano:
```typescript
const PLAN_LOCATION_LIMITS: Record<Plan, number> = {
  basic: 3,
  premium: 7,
}
const BASIC_PLAN_EXPIRY_DAYS = 7
```

A função `expireMap` (privada) atualiza status para `expired` no banco — não deve ser exportada.

Todos os erros do Supabase devem ser verificados (`if (error) throw new Error(error.message)`).

## Critérios de Sucesso

- `createMap` rejeita com 422 se número de localizações exceder o limite do plano
- `activateMap` persiste slug, token e `expires_at` corretos para cada plano
- `getMapByToken` retorna `null` para token inexistente
- `getMapByToken` atualiza status para `expired` e retorna o mapa atualizado se estiver vencido
- `getPaymentStatus` retorna todos os campos necessários para o polling do frontend

## Testes da Tarefa

- [ ] `test/services/map-service.test.ts` (com mock do Supabase client):
  - `createMap` com plano `basic` e 3 localizações → sucesso
  - `createMap` com plano `basic` e 4 localizações → lança erro 422
  - `createMap` com plano `premium` e 7 localizações → sucesso
  - `createMap` com plano `premium` e 8 localizações → lança erro 422
  - `activateMap` → slug gerado corretamente, token com 5 chars, `expires_at` = now+7d para `basic`
  - `activateMap` → `expires_at` = null para `premium`
  - `getMapByToken` com token válido e mapa ativo → retorna mapa
  - `getMapByToken` com mapa expirado → atualiza status para `expired`
  - `getMapByToken` com token inexistente → retorna `null`
  - `setPaymentFailed` → status atualizado para `payment_failed`

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/services/map-service.ts`
- `./backend/src/utils/slug.ts` (dependência)
- `./backend/src/utils/token.ts` (dependência)
- `./backend/test/services/map-service.test.ts`
