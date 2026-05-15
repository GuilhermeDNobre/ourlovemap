
# Tarefa 9.0: Correções de tipos e envio de `youtubeLoop`

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

Durante a análise de consistência entre frontend e backend foram identificados três gaps no frontend que precisam ser corrigidos:

1. **`buildMapFormData.ts` nunca envia `youtube_loop`** — o wizard armazena `music.loop` no store, mas `buildMapFormData` nunca o inclui no `FormData`. O backend (após task 11.0) estará pronto para receber `youtube_loop`; o frontend precisa enviá-lo.

2. **`PaymentStatus` está incompleto** — o tipo `PaymentStatus` em `use-payment-polling.ts` não inclui o status `'expired'` que o backend pode retornar. Se o backend retornar `expired` durante o polling, `isActive` e `isFailed` serão ambos `false` e a UI ficará em estado indefinido sem parar o polling.

3. **`ApiLocation` não tem `address`** — após a task 12.0 do backend, `GET /api/maps/by-token` passará a retornar `address` nas localizações. O tipo `ApiLocation` no frontend precisa ser atualizado para refletir isso.

## Subtarefas

- [ ] 9.1 Atualizar `src/lib/build-map-form-data.ts`:
  - Adicionar envio de `youtube_loop` ao `FormData` quando `store.music.videoId` existir
  - Valor deve ser enviado como string `'true'` ou `'false'`

- [ ] 9.2 Atualizar `src/hooks/use-payment-polling.ts`:
  - Adicionar `'expired'` ao union type de `PaymentStatus.status`
  - Garantir que status `'expired'` pare o polling (mesma lógica de `'payment_failed'`)
  - Expor `isExpired` no retorno do hook para uso nos componentes que precisarem

- [ ] 9.3 Atualizar `src/types/map.ts`:
  - Adicionar `address?: string | null` à interface `ApiLocation`

- [ ] 9.4 Atualizar testes:
  - `build-map-form-data.test.ts`: verificar que `youtube_loop` é incluído no FormData quando há videoId
  - `use-payment-polling.test.ts` (se existir): verificar que status `expired` para o polling e expõe `isExpired: true`

## Detalhes de Implementação

**`buildMapFormData.ts` — envio de loop:**
```ts
if (store.music.videoId) {
  formData.append('youtube_url', `https://www.youtube.com/watch?v=${store.music.videoId}`);
  formData.append('youtube_start_time', String(store.music.startTime));
  formData.append('youtube_end_time', String(store.music.endTime));
  formData.append('youtube_loop', String(store.music.loop));
}
```

**`use-payment-polling.ts` — tipo e lógica corrigidos:**
```ts
export interface PaymentStatus {
  status: 'pending_payment' | 'active' | 'payment_failed' | 'expired';
}

// refetchInterval: parar em qualquer status terminal
refetchInterval: (q) => {
  const data = q.state.data as PaymentStatus | undefined;
  return data?.status === 'pending_payment' ? 3000 : false;
},

// retorno do hook
return {
  ...query,
  isActive: query.data?.status === 'active',
  isFailed: query.data?.status === 'payment_failed',
  isExpired: query.data?.status === 'expired',
};
```

**`ApiLocation` — campo address:**
```ts
export interface ApiLocation {
  title: string;
  description: string | null;
  message: string | null;
  address: string | null;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  order: number;
}
```

## Critérios de Sucesso

- `buildMapFormData` com `music.videoId` e `music.loop = true` → FormData contém `youtube_loop: 'true'`
- `buildMapFormData` com `music.videoId` e `music.loop = false` → FormData contém `youtube_loop: 'false'`
- `buildMapFormData` sem `music.videoId` → FormData não contém `youtube_loop`
- `usePaymentPolling` com status `expired` → `isExpired: true`, polling parado
- `ApiLocation` compila com campo `address`
- Todos os testes existentes continuam passando

## Testes da Tarefa

- [ ] `src/__tests__/wizard/build-map-form-data.test.ts`:
  - Com `music.videoId` definido e `music.loop = true` → FormData contém `youtube_loop` = `'true'`
  - Com `music.videoId` definido e `music.loop = false` → FormData contém `youtube_loop` = `'false'`
  - Sem `music.videoId` → FormData não contém `youtube_loop`
- [ ] `src/__tests__/public-map/use-payment-polling.test.tsx` (criar se não existir):
  - Status `expired` → `isExpired: true`, refetch parado
  - Status `pending_payment` → polling continua (refetchInterval = 3000)
  - Status `active` → `isActive: true`, polling parado

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `frontend/src/lib/build-map-form-data.ts`
- `frontend/src/hooks/use-payment-polling.ts`
- `frontend/src/types/map.ts`
- `frontend/src/__tests__/wizard/build-map-form-data.test.ts`
