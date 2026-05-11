# Review: Task 5.0 — Wizard — Steps 3 e 4 + validação Zod completa

**Reviewer**: AI Code Reviewer
**Date**: 2026-05-11
**Task file**: 5_task.md
**Status**: APPROVED WITH OBSERVATIONS

---

## Summary

A implementação cobre integralmente os requisitos da Tarefa 5.0: Step 3 (busca YouTube com debounce, detecção de URL, sliders e loop) e Step 4 (email com validação ao vivo via `watch`, banner de aviso, resumo e seletor de plano). Os schemas Zod estão corretos, os testes passam (204/204), a tipagem TypeScript está limpa (`tsc --noEmit` sem erros) e o padrão de arquitetura do projeto foi respeitado. Foram identificadas algumas violações menores dos padrões de código — nenhuma crítica — principalmente linhas em branco dentro de funções, magic numbers residuais e uma oportunidade de simplificação em `canFinalize`.

---

## Files Reviewed

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `src/lib/youtube-api.ts` | ✅ OK | 0 |
| `src/lib/wizard-schema.ts` | ⚠️ Issues | 1 |
| `src/lib/client-env.ts` | ✅ OK | 0 |
| `src/__mocks__/client-env-mock.ts` | ✅ OK | 0 |
| `src/components/wizard/steps/Step3Musica.tsx` | ⚠️ Issues | 3 |
| `src/components/wizard/steps/Step4Envio.tsx` | ⚠️ Issues | 2 |
| `src/components/wizard/Wizard.tsx` | ⚠️ Issues | 1 |
| `jest.config.ts` | ✅ OK | 0 |
| `src/__tests__/wizard/youtube-api.test.ts` | ✅ OK | 0 |
| `src/__tests__/wizard/wizard-schema.test.ts` | ✅ OK | 0 |
| `src/__tests__/wizard/Step3Musica.test.tsx` | ⚠️ Issues | 1 |
| `src/__tests__/wizard/Step4Envio.test.tsx` | ✅ OK | 0 |

---

## Issues Found

### 🔴 Critical Issues

Nenhum problema crítico encontrado.

---

### 🟡 Major Issues

**[M1] `wizard-schema.ts` — `z.any()` no campo `photo` do `placeSchema`**

Arquivo: `src/lib/wizard-schema.ts`, linha 23.

```typescript
photo: z.any().nullable(),
```

O padrão do projeto proíbe explicitamente o uso de `any`. O campo `photo` pode ser tipado como `z.instanceof(File).nullable()`, que é mais preciso e elimina o `any`:

```typescript
photo: z.instanceof(File).nullable(),
```

> Nota: em ambiente de teste (jsdom), `File` está disponível globalmente — não há necessidade de condicionais.

---

### 🟢 Minor Issues

**[m1] `Step3Musica.tsx` — Linhas em branco dentro de funções**

Arquivo: `src/components/wizard/steps/Step3Musica.tsx`, linhas 45–46, 85–86, 91–92, 96–97, 101–102.

O padrão `code-standards.md` proíbe linhas em branco dentro de métodos e funções. As funções `updateMusic`, `handleSelectTrack`, `handleRemoveTrack`, `handleStartChange` e `handleEndChange` têm uma linha em branco separando a declaração `const` do `setField`. Exemplo:

```typescript
// Atual (linhas 45–47):
const updateMusic = (patch: Partial<MusicData>) => {
  setField('music', { ...music, ...patch });
};

// Já correto — mas handleQueryChange tem linha em branco após o clearTimeout:
if (debounceRef.current) clearTimeout(debounceRef.current);
// linha em branco aqui (linha 53) — remover
if (!value.trim()) {
```

As funções em si são curtas e o problema é de formatação, não de lógica.

**[m2] `Step3Musica.tsx` — Magic number `30` no `endTime` padrão**

Arquivo: `src/components/wizard/steps/Step3Musica.tsx`, linhas 61 e 86.

```typescript
setField('music', { ...music, videoId, query: 'Vídeo do YouTube', startTime: 0, endTime: 30 });
```

O valor `30` (segundos) é um magic number. Já existem constantes `MAX_END_TIME`, `MAX_START_TIME` e `MIN_CLIP_DURATION` no mesmo arquivo; uma constante `DEFAULT_END_TIME = 30` eliminaria a ambiguidade.

**[m3] `Step4Envio.tsx` — `canFinalize` re-implementa a lógica que o próprio `zodResolver` já controla**

Arquivo: `src/components/wizard/steps/Step4Envio.tsx`, linhas 30–31.

```typescript
const canFinalize =
  !errors.email && !errors.emailConfirm && watchedEmail.length > 0 && watchedEmail === watchedEmailConfirm;
```

A condição `watchedEmail === watchedEmailConfirm` duplica a validação do `step4Schema`. Com `mode: 'onChange'` ativo, a simples checagem `!errors.email && !errors.emailConfirm` é suficiente e única fonte de verdade:

```typescript
const canFinalize = !errors.email && !errors.emailConfirm && watchedEmail.length > 0;
```

A verificação de igualdade ao vivo já está delegada ao Zod via `zodResolver`. A duplicação não causa bug, mas viola o princípio de única responsabilidade da validação.

**[m4] `Wizard.tsx` — `canProceedFromStep` retorna `true` para steps 1, 3 e 4 sem verificação**

Arquivo: `src/components/wizard/Wizard.tsx`, linhas 19–22.

```typescript
function canProceedFromStep(step: number, state: StepState): boolean {
  if (step === 2) return step2Schema.safeParse({ places: state.places }).success;
  return true;
}
```

A tarefa 5.6 pede que o botão "Continuar" de **cada step** só habilite após a validação Zod do step correspondente passar. O Step 1 usa `zodResolver` internamente e controla seu próprio botão, então está implicitamente coberto. O Step 3 é opcional por especificação. O Step 4 controla `canFinalize` internamente. Porém, não há validação de Step 1 via `canProceedFromStep` — se o usuário navegar para o passo 1 de volta e apertar "Continuar" sem preencher os campos, a UI do Wizard não bloqueia (o Step1Voces bloqueia pelo `react-hook-form` interno, mas o orquestrador não sabe). Isso é uma inconsistência de design menor que deve ser monitorada, não um bug funcional para o usuário final.

**[m5] `Step3Musica.test.tsx` — Aviso `act()` em teste com fake timers**

Arquivo: `src/__tests__/wizard/Step3Musica.test.tsx`, linha 107.

O teste `should select track from search results when clicked` produz um aviso de `act()` ao chamar `jest.runAllTimers()` fora de um `act()`. Os testes passam, mas o aviso indica que as atualizações de estado assíncronas dentro do `setTimeout` não estão corretamente encapsuladas. Solução:

```typescript
await act(async () => {
  jest.runAllTimers();
});
await waitFor(() => {
  expect(screen.getByText('Test Song Result')).toBeInTheDocument();
});
```

---

## Positive Highlights

- **Debounce corretamente implementado**: uso de `useRef` para armazenar o timer e limpeza no `useEffect` de cleanup — sem memory leaks.
- **Separação de responsabilidades clara**: `youtube-api.ts` é puro (sem side effects de store), Step3 orquestra UI/store, wizard-schema centraliza validação.
- **Validação ao vivo do email**: uso correto de `watch` do `react-hook-form` com `mode: 'onChange'` — atende ao requisito de feedback imediato sem submit.
- **`step4Schema` com `refine` no objeto raiz**: aplicado ao campo `emailConfirm` com `path` correto, garantindo que o erro apareça no campo certo — boa prática Zod.
- **Acessibilidade**: uso de `aria-label` nos sliders (`"Tempo de início"`, `"Tempo de fim"`), `role="alert"` nas mensagens de erro e `aria-label="Remover música"` no botão X.
- **Constantes nomeadas para magic numbers principais**: `MAX_END_TIME`, `MAX_START_TIME`, `MIN_CLIP_DURATION` estão declaradas no topo do arquivo.
- **Testes independentes**: cada teste faz `reset()` no `beforeEach` — sem dependências entre casos.
- **Cobertura alinhada aos critérios de sucesso da tarefa**: todos os 8 critérios de sucesso descritos na tarefa têm pelo menos um teste correspondente.
- **`jest.config.ts` com regex ampliado**: a correção do `moduleNameMapper` para `'(^|[./])client-env$'` é elegante e cobre importações aninhadas sem prejudicar outros mocks.

---

## Standards Compliance

| Padrão | Status |
|--------|--------|
| Code Standards | ⚠️ |
| TypeScript/Node.js | ⚠️ |
| REST/HTTP | N/A |
| Logging | N/A |
| React | ✅ |
| Tests | ⚠️ |

**Code Standards**: violações de formatação (linhas em branco dentro de funções) e magic number `30`.
**TypeScript/Node.js**: uso de `z.any()` no `placeSchema` viola a regra de nunca usar `any`.
**React**: componentes funcionais, TypeScript com `.tsx`, Tailwind, props explícitas, `useMemo` onde relevante — tudo conforme.
**Tests**: estrutura AAA respeitada, nomes descritivos começando com "should", independência garantida. Um aviso de `act()` em fake timers.

---

## Recommendations

1. **(Prioridade alta)** Substituir `z.any().nullable()` por `z.instanceof(File).nullable()` em `wizard-schema.ts` para eliminar o único `any` presente na entrega.

2. **(Prioridade média)** Extrair constante `DEFAULT_END_TIME = 30` em `Step3Musica.tsx` e usá-la nos dois lugares onde o valor literal `30` aparece como tempo de fim padrão.

3. **(Prioridade média)** Encapsular `jest.runAllTimers()` em `act(async () => { ... })` no teste `should select track from search results when clicked` para eliminar o aviso de `act()`.

4. **(Prioridade baixa)** Simplificar `canFinalize` em `Step4Envio.tsx` removendo a comparação redundante `watchedEmail === watchedEmailConfirm`, delegando toda a validação ao `zodResolver`.

5. **(Prioridade baixa)** Remover as linhas em branco dentro de funções em `Step3Musica.tsx` (linha 53 dentro de `handleQueryChange`) para conformidade com o padrão de formatação do projeto.

---

## Verdict

A implementação está funcionalmente correta, bem estruturada e alinhada com os requisitos da tarefa. Nenhum bug foi encontrado. O único issue classificado como Major (`z.any()`) é pontual e de fácil correção. O código pode seguir para integração; recomenda-se que as correções [M1], [m2] e [m5] sejam aplicadas na próxima janela de manutenção antes da entrega final ao usuário.
