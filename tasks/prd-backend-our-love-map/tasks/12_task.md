# Tarefa 12.0: Campo `address` nas localizações — modelo, POST e GET by-token

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

O frontend envia `locations[N][address]` com o endereço formatado de cada lugar (retornado pelo autocomplete do Maptiler). Atualmente o backend recebe esse campo via multipart mas o **descarta silenciosamente** — o `ParsedLocationField` não declara `address`, o `LocationDocument` não tem o campo, e o `buildLocations` nunca o lê.

Guardar o endereço é importante para:
- Exibição futura na página pública (RF-53 menciona dados de localização)
- Integridade dos dados do casal
- Eventual painel de edição do mapa

Adicionalmente, o campo `message` existe no `LocationDocument` e no `LocationModel` mas **nunca é enviado pelo frontend** nem exibido na página pública — clarificar seu propósito ou mantê-lo como campo reservado para uso futuro (não remover para evitar breaking change).

## Subtarefas

- [ ] 12.1 Atualizar `src/models/location-model.ts`:
  - Adicionar `address?: string` ao `LocationDocument` interface
  - Adicionar `address: { type: String }` ao `locationSchema`

- [ ] 12.2 Atualizar `src/routes/map-routes.ts` — `ParsedLocationField`:
  - Adicionar `address?: string` à interface `ParsedLocationField`

- [ ] 12.3 Atualizar `src/routes/map-routes.ts` — `buildLocations()`:
  - Incluir `address: loc.address` no objeto `LocationInput` retornado

- [ ] 12.4 Atualizar `src/services/map-service.ts`:
  - Adicionar `address?: string` ao type `LocationInput`
  - Garantir que `address` seja salvo ao criar localizações

- [ ] 12.5 Atualizar `src/routes/map-routes.ts` — GET `/api/maps/by-token`:
  - Incluir `address: loc.address ?? null` no mapeamento das localizações
  - Atualizar o schema Swagger do objeto `Location` com o campo `address`

- [ ] 12.6 Escrever testes de integração:
  - `POST /api/maps` com `locations[0][address]="Rua Augusta, São Paulo"` → `GET /by-token` retorna `address` na localização
  - `POST /api/maps` sem `address` → `GET /by-token` retorna `address: null`

## Detalhes de Implementação

**`ParsedLocationField` atualizado:**
```ts
interface ParsedLocationField {
  title?: string;
  description?: string;
  message?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  order?: string;
}
```

**`buildLocations` atualizado:**
```ts
return {
  title: loc.title ?? '',
  description: loc.description,
  message: loc.message,
  address: loc.address,
  photoUrl,
  latitude: parseFloat(loc.latitude ?? '0'),
  longitude: parseFloat(loc.longitude ?? '0'),
  order: parseInt(loc.order ?? '0', 10),
};
```

**Resposta GET /by-token — locations:**
```ts
locations: locations.map(loc => ({
  title: loc.title,
  description: loc.description ?? null,
  message: loc.message ?? null,
  address: loc.address ?? null,
  photoUrl: loc.photoUrl ?? null,
  latitude: loc.latitude,
  longitude: loc.longitude,
  order: loc.order,
})),
```

**Schema Swagger do objeto Location** — o `Location` é referenciado via `$ref: 'https://ourlovemap.com/schemas/Location#'`. Atualizar o schema registrado em `src/app.ts` ou no plugin de schemas para incluir `address: { type: 'string', nullable: true }`.

**Campo `message`:** manter no modelo sem modificação — é um campo reservado para uso futuro (ex: legenda da polaroide ou recado privado). Não expor na resposta pública por enquanto, mas não remover.

## Critérios de Sucesso

- `POST /api/maps` com `locations[0][address]="Rua Augusta, 1000, São Paulo"` → endereço salvo no MongoDB
- `GET /api/maps/by-token?token=<valid>` → `locations[0].address` presente e correto
- `POST /api/maps` sem `address` em uma localização → `GET /by-token` retorna `address: null` para aquela localização
- Todos os testes existentes continuam passando

## Testes da Tarefa

- [ ] `test/routes/map-routes.test.ts`:
  - `POST /api/maps` com `address` → `GET /by-token` retorna `address` na localização
  - `POST /api/maps` sem `address` → `GET /by-token` retorna `address: null`

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `backend/src/models/location-model.ts` — adicionar `address` ao schema
- `backend/src/routes/map-routes.ts` — `ParsedLocationField`, `buildLocations`, resposta GET
- `backend/src/services/map-service.ts` — `LocationInput`
- `backend/src/app.ts` (ou plugin de schemas) — schema Swagger do objeto Location
- `backend/test/routes/map-routes.test.ts` — testes de integração
