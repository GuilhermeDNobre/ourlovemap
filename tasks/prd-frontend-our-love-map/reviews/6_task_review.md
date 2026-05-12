# Review: Task 6.0 - Wizard — Fluxo de pagamento

**Reviewer**: AI Code Reviewer
**Date**: 2026-05-12
**Task file**: 6_task.md
**Status**: APPROVED WITH OBSERVATIONS

## Summary

A implementação cobre integralmente o fluxo de pagamento descrito na tarefa: construção do `FormData` multipart, mutation para `POST /api/maps`, polling de status, modal PIX com QR Code e copia-e-cola, fluxo de cartão com CPF mascarado, redirecionamento e estados de sucesso/erro. Todos os 36 testes das 5 suítes passam e a tipagem TypeScript compila sem erros. A qualidade geral é boa — sem uso de `any`, sem callbacks, sem dependências circulares. Existem algumas oportunidades de melhoria em convenções de código (comment `eslint-disable`, cast de tipo, redundância na prop `isOpen`) e nos testes (warnings `act()` nos testes do `PaymentModal`).

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `src/__mocks__/client-env-mock.ts` | OK | 0 |
| `src/lib/client-env.ts` | OK | 0 |
| `src/lib/api.ts` | OK | 0 |
| `src/lib/build-map-form-data.ts` | OK | 0 |
| `src/hooks/use-create-map.ts` | OK | 0 |
| `src/hooks/use-payment-polling.ts` | OK | 0 |
| `src/components/wizard/PaymentModal.tsx` | Issues | 3 |
| `src/components/wizard/steps/Step4Envio.tsx` | Issues | 1 |
| `src/components/wizard/Wizard.tsx` | Issues | 1 |
| `jest.setup.ts` | OK | 0 |
| `src/__tests__/wizard/build-map-form-data.test.ts` | OK | 0 |
| `src/__tests__/wizard/use-payment-polling.test.tsx` | OK | 0 |
| `src/__tests__/wizard/PaymentModal.test.tsx` | Issues | 1 |
| `src/__tests__/wizard/payment-flow.test.tsx` | OK | 0 |
| `src/__tests__/wizard/Step4Envio.test.tsx` | OK | 0 |

## Issues Found

### Critial Issues

Nenhum issue crítico encontrado.

### Major Issues

**1. `PaymentModal.tsx` linha 87 — Supressão de dependência do hook sem justificativa técnica sólida**

O comentário `// eslint-disable-next-line react-hooks/exhaustive-deps` suprime o aviso sobre `pixMutation` não estar listada como dependência do `useEffect` da linha 80–88. `useMutation` retorna um objeto estável por design (o TanStack Query garante estabilidade referencial de `mutate`), mas o padrão correto é extrair apenas `pixMutation.mutate` na lista de dependências e não silenciar a regra. Suprimir o lint sem comentário explicativo é uma violação dos padrões de manutenibilidade.

```tsx
// Prefira
const { mutate: triggerPixPayment } = pixMutation;

useEffect(() => {
  if (!isOpen || !mapId) return;
  setView('loading');
  setPixData(null);
  setTaxId('');
  setCopied(false);
  triggerPixPayment();
}, [isOpen, mapId, triggerPixPayment]);
```

**2. `PaymentModal.test.tsx` — Warnings `act()` nos testes**

As suítes do `PaymentModal` emitem múltiplos warnings `Warning: An update to PaymentModal inside a test was not wrapped in act(...)`. Os testes passam, mas os warnings indicam que atualizações de estado assíncronas estão acontecendo fora do ciclo controlado de `act`. Isso pode mascarar comportamento real de race condition e torna o CI menos confiável. O padrão correto é garantir que qualquer efeito assíncrono disparado pelo render inicial seja aguardado antes das asserções, usando `waitFor` ou `act` para esvaziar a fila de microtasks.

```tsx
// Exemplo de correção no teste "should show loading state initially"
it('should show loading state initially', async () => {
  renderModal();
  // Captura o estado loading ANTES de qualquer await que deixe a mutação resolver
  expect(screen.getByText(/Gerando QR Code PIX/i)).toBeInTheDocument();
  // Aguarda a resolução para não vazar estado pendente
  await waitFor(() => screen.getByAltText('QR Code PIX'));
});
```

### Minor Issues

**3. `Wizard.tsx` linha 60–65 — Prop `isOpen` redundante quando o componente já é renderizado condicionalmente**

O componente é montado apenas quando `mapId` é truthy (`{mapId && <PaymentModal .../>}`), portanto `isOpen={!!mapId}` será sempre `true` enquanto o componente existir. A prop `isOpen` é usada internamente apenas no `useEffect` de inicialização do modal. A dupla verificação é redundante e pode causar confusão futura.

```tsx
// Opção A — remover a prop isOpen da interface e sempre assumir true quando montado
// Opção B — manter isOpen mas passar apenas mapId para o guard externo controlar:
<PaymentModal isOpen onClose={handleModalClose} mapId={mapId} />
```

**4. `Step4Envio.tsx` linha 163 — Cast de tipo não tipado para extrair status HTTP**

A função `getBackendErrorMessage` faz um cast manual via `(error as { response?: { status?: number } })`. O tipo correto para erros do Axios é `AxiosError`, disponível no pacote `axios` sem instalação extra.

```tsx
import { isAxiosError } from 'axios';

function getBackendErrorMessage(error: unknown, placesCount: number, plan: string): string {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  // ...
}
```

**5. `PaymentModal.tsx` linha 95–101 — Timer do `useEffect` reinicia a cada render quando `secondsLeft` muda**

O `useEffect` do timer tem `[view, secondsLeft]` como dependências. Como `secondsLeft` muda a cada segundo, o effect é recriado e o `clearInterval` anterior é chamado seguido de um novo `setInterval`. O comportamento está correto na prática (um único intervalo ativo por vez), mas gera overhead desnecessário. A forma idiomática é ter apenas `[view]` na dependência e usar o callback form do `setState`.

```tsx
useEffect(() => {
  if (view !== 'pix' || secondsLeft <= 0) return;
  const interval = setInterval(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(interval);
}, [view]); // secondsLeft removido das dependências
```

## Positive Highlights

- **`build-map-form-data.ts`**: implementação limpa e direta. A condicional para `youtube_url` e a verificação `instanceof File` para fotos estão corretas e bem cobertas pelos 8 testes unitários.
- **`use-create-map.ts`**: hook mínimo e coeso. O `onSuccess` salva apenas o `mapId` no store, sem efeitos colaterais extras.
- **`use-payment-polling.ts`**: uso correto de `refetchInterval` com callback baseado no estado atual da query; `staleTime: 0` garante que o polling sempre reflita dados frescos. O hook retorna `isActive` e `isFailed` derivados, eliminando lógica duplicada nos consumidores.
- **`PaymentModal.tsx`**: a separação em `ModalView` (union type) torna o fluxo de estados explícito e fácil de auditar. A formatação de CPF e do timer são funções puras extraídas do componente — boa aplicação das convenções de código.
- **`Step4Envio.tsx`**: a função `getBackendErrorMessage` foi extraída para fora do componente, mantendo-o abaixo do limite de 50 linhas por método. O `role="alert"` no parágrafo de erro é uma boa prática de acessibilidade.
- **Nenhum `any`** foi utilizado nos arquivos de produção.
- **Sem `Content-Type` manual no Axios** com FormData — a instrução crítica da tarefa foi seguida corretamente.
- **Suíte de testes completa**: 36 testes distribuídos em 5 arquivos, cobrindo casos unitários, de renderização e de integração com mock do Axios.
- **`jest.setup.ts`**: o mock do `navigator.clipboard` foi adicionado de forma limpa e centralizada, evitando duplicação nos testes individuais.

## Standards Compliance

| Standard | Status |
|----------|--------|
| Code Standards | OK |
| TypeScript/Node.js | OK |
| REST/HTTP | OK |
| Logging | OK |
| React | OK |
| Tests | Issues |

## Recommendations

1. **(Major)** Corrigir os warnings `act()` no `PaymentModal.test.tsx` adicionando `await waitFor(...)` ou `await act(async () => {})` após o render inicial para esvaziar a fila de microtasks antes das primeiras asserções.
2. **(Major)** Remover o comentário `eslint-disable-next-line react-hooks/exhaustive-deps` do `PaymentModal.tsx` e listar explicitamente `triggerPixPayment` (extraído de `pixMutation.mutate`) nas dependências do `useEffect`.
3. **(Minor)** Substituir o cast manual de `error` por `isAxiosError` do Axios em `getBackendErrorMessage` para tipagem correta e sem cast inseguro.
4. **(Minor)** Simplificar o `useEffect` do timer para depender apenas de `[view]`, usando o callback form do `setState` para eliminar a recriação desnecessária do intervalo a cada tick.
5. **(Minor)** Eliminar a redundância `isOpen={!!mapId}` no `Wizard.tsx` — se o componente é montado condicionalmente, a prop pode ser simplificada para `isOpen` (sempre `true` quando montado) ou a lógica de guard pode ser movida para dentro do `PaymentModal`.

## Verdict

A implementação está **aprovada com observações**. Os requisitos funcionais foram atendidos integralmente, o TypeScript compila sem erros e todos os testes passam. Os pontos Major (warnings de `act` e supressão de lint) não bloqueiam o funcionamento, mas devem ser corrigidos antes da próxima tarefa para manter a qualidade do CI e a rastreabilidade de bugs assíncronos. Os Minor são melhorias de estilo e eficiência que podem ser adressados no mesmo PR ou em tarefa de refatoração subsequente.
