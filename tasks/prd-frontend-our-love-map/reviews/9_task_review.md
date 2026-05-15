# Review: Task 9.0 - Correções de tipos e envio de youtubeLoop

**Revisor**: AI Code Reviewer
**Data**: 2026-05-13
**Arquivo da tarefa**: tasks/9_task.md
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

A tarefa implementou três correções de tipos e funcionalidades no frontend: envio de `youtube_loop` no `FormData`, adição de `'expired'` ao union type `PaymentStatus`, e inclusão do campo `address` na interface `ApiLocation`. Cinco casos de teste foram adicionados ou criados. Todos os 289 testes passam e a compilação TypeScript (`tsc --noEmit`) não apresenta erros.

A qualidade geral é boa: as correções são precisas, focadas e seguem os padrões do projeto. Há dois pontos de atenção: o campo `address` foi adicionado como obrigatório (`string | null`) em vez de opcional (`?: string | null`) conforme especificado na tarefa, e os testes existentes que constroem fixtures de `ApiLocation` (em `PlaceSection.test.tsx` e `FinalMapScreen.test.tsx`) não foram atualizados para incluir o novo campo. Esses testes passam apenas porque `ts-jest` está configurado com `diagnostics: false`, ocultando o erro de tipo.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `src/lib/build-map-form-data.ts` | OK | 0 |
| `src/hooks/use-payment-polling.ts` | OK | 0 |
| `src/types/map.ts` | Problemas | 1 |
| `src/__tests__/wizard/build-map-form-data.test.ts` | OK | 0 |
| `src/__tests__/public-map/use-payment-polling.test.tsx` | Problemas | 1 |

## Problemas Encontrados

### Criticos

Nenhum problema crítico encontrado.

### Principais

**1. Campo `address` adicionado como obrigatório, divergindo da especificação da tarefa e quebrando fixtures existentes**

- **Arquivo**: `src/types/map.ts`, linha 5
- **Arquivo afetado**: `src/__tests__/public-map/PlaceSection.test.tsx`, linhas 5-13 e 17-24
- **Arquivo afetado**: `src/__tests__/public-map/FinalMapScreen.test.tsx`, linhas 5-8

A tarefa especifica na seção "Detalhes de Implementação":
```ts
address?: string | null;  // opcional, com "?"
```

A implementação adicionou:
```ts
address: string | null;  // obrigatório, sem "?"
```

Consequentemente, os fixtures de `ApiLocation` em `PlaceSection.test.tsx` e `FinalMapScreen.test.tsx` passaram a ser inválidos do ponto de vista dos tipos — eles não incluem o campo `address`. Esses testes passam apenas porque `ts-jest` está configurado com `diagnostics: false`, o que suprime a verificação de tipos durante a execução dos testes.

O campo `address` é opcional no modelo do backend (`address?: string` em `location-model.ts`) e o endpoint de GET retorna `address: loc.address ?? null` — o que significa que o campo sempre virá na resposta, mas pode ser `null`. Adicionar como obrigatório no frontend é semanticamente defensável, porém introduz uma quebra silenciosa nos testes existentes.

**Correção recomendada — opção A (alinhar à spec da tarefa):**
```ts
// src/types/map.ts
export interface ApiLocation {
  title: string;
  description: string | null;
  message: string | null;
  address?: string | null;   // opcional, como na spec
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  order: number;
}
```

**Correção recomendada — opção B (manter obrigatório e atualizar fixtures):**
```ts
// src/__tests__/public-map/PlaceSection.test.tsx
const baseLocation: ApiLocation = {
  title: 'Café do Amor',
  description: 'Nosso primeiro encontro',
  message: null,
  address: null,   // adicionar
  photoUrl: null,
  latitude: -23.5,
  longitude: -46.6,
  order: 0,
};

// src/__tests__/public-map/FinalMapScreen.test.tsx — atualizar ambas as entradas do array
const locations: ApiLocation[] = [
  { title: 'Café do Amor', description: null, message: null, address: null, photoUrl: null, latitude: -23.5, longitude: -46.6, order: 0 },
  { title: 'Parque Ibirapuera', description: null, message: null, address: null, photoUrl: null, latitude: -23.6, longitude: -46.7, order: 1 },
];
```

**2. Teste de `expired` não verifica que o polling é interrompido**

- **Arquivo**: `src/__tests__/public-map/use-payment-polling.test.tsx`, linhas 43-50

A tarefa exige explicitamente: "Status `expired` → `isExpired: true`, refetch parado". O teste verifica `isExpired: true`, mas não verifica que `refetchInterval` retorna `false` para o status `expired`, nem que o polling não continua. O arquivo de testes pre-existente (`src/__tests__/wizard/use-payment-polling.test.tsx`) também não cobre esse comportamento.

Da mesma forma, a tarefa pede "Status `pending_payment` → polling continua (refetchInterval = 3000)", mas nenhum teste verifica que `refetchInterval` retorna `3000` para esse status. O teste de `pending_payment` no novo arquivo apenas verifica que os flags derivados são `false`.

Sugestão de cobertura adicional — verificar a lógica de refetch usando a opção da query:
```ts
it('should stop polling when status is expired', async () => {
  // Arrange
  mockGet.mockResolvedValue({ data: { status: 'expired' } });
  const { result } = renderHook(() => usePaymentPolling('map-123'), { wrapper: makeWrapper() });

  // Act
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  // Assert — após retornar 'expired', não deve fazer novas chamadas
  const callCountAfterFetch = mockGet.mock.calls.length;
  await new Promise((r) => setTimeout(r, 4000));
  expect(mockGet.mock.calls.length).toBe(callCountAfterFetch);
});
```

### Menores

**1. Arquivo de testes novo não inclui `__esModule: true` de forma consistente**

- **Arquivo**: `src/__tests__/public-map/use-payment-polling.test.tsx`, linhas 8-11

O novo arquivo inclui `__esModule: true` no mock do módulo `api`:
```ts
jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: { get: (...args: unknown[]) => mockGet(...args) },
}));
```

O arquivo pre-existente `src/__tests__/wizard/use-payment-polling.test.tsx` não inclui `__esModule: true`:
```ts
jest.mock('../../lib/api', () => ({
  default: { get: (...args: unknown[]) => mockGet(...args) },
}));
```

Ambos funcionam, mas a inconsistência entre os dois arquivos de teste do mesmo hook pode confundir. O `__esModule: true` é desnecessário quando se usa `default` explícito com `jest.mock`. Considerar padronizar.

**2. Wrapper factory com padrão diferente entre os dois arquivos de teste**

- **Arquivo**: `src/__tests__/public-map/use-payment-polling.test.tsx`, linhas 13-18

O novo arquivo cria um `QueryClient` novo dentro da factory `makeWrapper()` a cada chamada:
```ts
function makeWrapper() {
  const queryClient = new QueryClient({ ... });
  return function Wrapper(...) { ... };
}
```

O arquivo pré-existente segrega a criação do cliente em `makeClient()` e aceita o cliente como parâmetro de `makeWrapper(queryClient)`. Ambas as abordagens garantem isolamento entre testes, mas a inconsistência entre arquivos que testam o mesmo hook é desnecessária. A abordagem do novo arquivo é mais simples e igualmente correta.

## Destaques Positivos

- A correção em `build-map-form-data.ts` é cirúrgica: uma única linha adicionada no lugar exato, dentro do bloco `if (store.music.videoId)`, garantindo que `youtube_loop` nunca seja enviado sem um `videoId`.
- A lógica de polling em `use-payment-polling.ts` já tratava corretamente qualquer status diferente de `'pending_payment'` retornando `false` para `refetchInterval`. Adicionar `'expired'` ao union type e `isExpired` ao retorno foi suficiente — não foi necessário alterar a lógica de polling.
- Os três novos testes de `youtube_loop` em `build-map-form-data.test.ts` seguem o padrão AAA e cobrem todos os cenários exigidos (loop=true, loop=false, sem videoId).
- O novo arquivo `use-payment-polling.test.tsx` é bem estruturado, com `beforeEach(() => jest.clearAllMocks())`, wrapper isolado por teste, e nomenclatura clara no padrão "should...".
- Todos os 289 testes passam e a compilação TypeScript (`tsc --noEmit`) não apresenta erros.

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | OK |
| TypeScript/Node.js | Problemas |
| REST/HTTP | N/A |
| Logging | N/A |
| React | OK |
| Testes | Problemas |

## Recomendações

1. **(Prioritário)** Decidir se `address` em `ApiLocation` deve ser obrigatório ou opcional e ser consistente: ou adotar `address?: string | null` conforme a spec da tarefa, ou manter `address: string | null` e atualizar todos os fixtures de testes afetados em `PlaceSection.test.tsx` e `FinalMapScreen.test.tsx`.

2. **(Médio)** Adicionar um caso de teste que verifique que o polling para quando o status é `expired` — seja verificando que `mockGet` não é chamado novamente após receber `expired`, ou verificando a configuração de `refetchInterval` indiretamente.

3. **(Baixo)** Considerar habilitar `diagnostics: true` no `ts-jest` ou criar um script de CI que execute `tsc --noEmit` incluindo os arquivos de teste (via `tsconfig.test.json`), para que erros de tipo em fixtures de testes sejam detectados na pipeline.

4. **(Baixo)** Padronizar o padrão de criação de wrapper/cliente entre os dois arquivos de teste de `usePaymentPolling`.

## Veredicto

A implementação está funcional e cobre os requisitos principais da tarefa. O ponto mais importante a resolver é a inconsistência do campo `address` (obrigatório vs. opcional) e seus efeitos nos fixtures de testes existentes. A falta do teste de interrupção do polling para `expired` é um gap menor, mas o comportamento em si está correto no código de produção. Recomenda-se resolver o problema 1 antes de considerar a tarefa totalmente concluída.
