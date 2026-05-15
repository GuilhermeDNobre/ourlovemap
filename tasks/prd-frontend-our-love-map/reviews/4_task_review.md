# Review: Task 4.0 - Wizard — Infraestrutura + Steps 1 e 2

**Reviewer**: AI Code Reviewer
**Date**: 2026-05-11
**Task file**: 4_task.md
**Status**: APROVADO COM OBSERVAÇÕES

## Resumo

A implementação cobre com fidelidade os componentes centrais da tarefa: store Zustand com persist, hook de contador de relacionamento, seletor de plano, progress dots, slug card, live preview, Step 1 e Step 2 com drag-and-drop. Os 37 testes do escopo do wizard passam e a compilação TypeScript está limpa. Existem, contudo, três desvios funcionais notáveis em relação aos requisitos da tarefa (geocoding não implementado, layout mobile fixado com `style` inline, `canProceed` ausente), além de um bug de memory leak em URL de preview de foto e um helper de teste declarado mas jamais chamado.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `src/stores/wizard-store.ts` | OK | 0 |
| `src/hooks/use-relationship-counter.ts` | Problemas | 2 |
| `src/components/wizard/PlanSelector.tsx` | OK | 0 |
| `src/components/wizard/ProgressDots.tsx` | OK | 0 |
| `src/components/wizard/SlugCard.tsx` | OK | 0 |
| `src/components/wizard/LivePreview.tsx` | OK | 0 |
| `src/components/wizard/PlaceCardEditor.tsx` | Problemas | 2 |
| `src/components/wizard/Wizard.tsx` | Problemas | 2 |
| `src/components/wizard/steps/Step1Voces.tsx` | Problemas | 1 |
| `src/components/wizard/steps/Step2Localizacoes.tsx` | OK | 0 |
| `src/pages/WizardPage.tsx` | OK | 0 |
| `src/__tests__/wizard/wizard-store.test.ts` | OK | 0 |
| `src/__tests__/wizard/use-relationship-counter.test.ts` | OK | 0 |
| `src/__tests__/wizard/ProgressDots.test.tsx` | OK | 0 |
| `src/__tests__/wizard/Step1Voces.test.tsx` | OK | 0 |
| `src/__tests__/wizard/Step2Localizacoes.test.tsx` | OK | 0 |
| `src/__tests__/wizard/PlaceCardEditor.test.tsx` | Problemas | 1 |

## Problemas Encontrados

### Criticos

Nenhum problema critico encontrado.

### Principais

**[MAIN-1] `PlaceCardEditor.tsx` linha 50 — Memory leak: `URL.createObjectURL` sem `URL.revokeObjectURL`**

A URL de objeto é criada a cada render sem ser liberada. Em componentes que renderizam frequentemente (como o live preview), isso acumula entradas na memória do browser.

```tsx
// Problema: nova URL criada a cada render
const previewUrl = place.photo instanceof File ? URL.createObjectURL(place.photo) : null;

// Solução: usar useMemo + useEffect para revogar ao desmontar/trocar arquivo
const previewUrl = useMemo(
  () => (place.photo instanceof File ? URL.createObjectURL(place.photo) : null),
  [place.photo],
);
useEffect(() => {
  return () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };
}, [previewUrl]);
```

---

**[MAIN-2] `PlaceCardEditor.tsx` (subtarefa 4.8) — `GeocodingControl` do Maptiler não implementado**

A tarefa define explicitamente: "campo de busca de endereço (`GeocodingControl` do Maptiler), [...] O callback `onPick` deve salvar `latitude`, `longitude` e `address` no place correspondente no store." O campo de endereço foi implementado como um `Input` de texto simples. O pacote `@maptiler/geocoding-control` está presente no `package.json`, mas não é utilizado em nenhum arquivo do wizard. Os campos `latitude` e `longitude` do `Place` ficam permanentemente em 0.

Critério de sucesso violado:
- "Autocomplete de endereço no Step 2 sugere resultados reais ao digitar"
- "Selecionar um endereço salva `latitude` e `longitude` no store"

---

**[MAIN-3] `Wizard.tsx` linhas 29–32 — Layout mobile não implementado; `style` inline sobrescreve Tailwind**

A tarefa exige: "Em mobile (< 720px): single-column, preview abaixo." O layout de duas colunas é fixado com `style={{ flexDirection: 'row' }}`, o que impede qualquer override via Tailwind responsive e mantém o layout de duas colunas em telas pequenas. A classe Tailwind correta seria removida em favor de classes responsivas.

```tsx
// Problema: inline style sobrescreve qualquer classe responsive
<div className="flex gap-10 items-start" style={{ flexDirection: 'row' }}>

// Solução: remover o style inline e usar classes Tailwind responsive
<div className="flex flex-col gap-10 items-start lg:flex-row">
```

---

**[MAIN-4] `Wizard.tsx` linha 21 — `canProceed` ausente; navegação avança sem validação nos steps 3 e 4**

A tarefa define "Botões 'Voltar' e 'Continuar' com validação de `canProceed` por step." Os steps 3 e 4 (placeholders) permitem avançar livremente sem qualquer verificação. O Step 1 delega a validação ao react-hook-form corretamente, mas o Wizard não implementa a lógica centralizada de `canProceed`.

---

**[MAIN-5] `use-relationship-counter.ts` linhas 30–32 — `hours`, `minutes`, `seconds` mostram o horário atual, não a duração do dia**

A duração em horas/minutos/segundos deveria ser o tempo decorrido desde a meia-noite do dia corrente do relacionamento (i.e., `hours = elapsed_seconds_since_start % 86400 / 3600`), ou no mínimo as horas decorridas desde o início do dia. O código atual retorna `now.getHours()`, `now.getMinutes()`, `now.getSeconds()` — que são o horário do relógio do sistema, não a duração.

```typescript
// Problema: retorna horário do relógio, não duração intradiária
const hours = now.getHours();
const minutes = now.getMinutes();
const seconds = now.getSeconds();

// Solução: calcular a fração do dia decorrida desde a data de início
const totalMs = now.getTime() - start.getTime();
const remainingMs = totalMs % (24 * 60 * 60 * 1000);
const hours = Math.floor(remainingMs / (60 * 60 * 1000));
const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
```

O teste em `use-relationship-counter.test.ts` que verifica "should update seconds when time advances" passa porque compara `(initialSeconds + 1) % 60`, o que funciona com ambas as implementações — mas não detecta o bug semântico.

### Menores

**[MINOR-1] `PlaceCardEditor.test.tsx` linhas 16–27 — `makeDndSortable` declarado mas nunca chamado**

A função auxiliar `makeDndSortable` que contém o mock do `@dnd-kit/sortable` é definida mas nenhum teste a invoca. O mock nunca é aplicado, o que significa que os testes estão usando a implementação real do `useSortable`. Os testes passam porque `@dnd-kit` funciona em ambiente JSDOM com as props retornadas, mas a intenção do autor claramente era isolar o componente via mock.

```typescript
// Remover a função sem uso ou chamar dentro de beforeEach:
beforeEach(() => {
  jest.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
  }));
});
```

---

**[MINOR-2] `Step1Voces.tsx` linhas 52–55 — Efeito colateral: `setField` no store chamado a cada keystroke dentro do `onChange` do campo controlado**

O padrão de sincronizar o store a cada tecla viola o princípio "uma função faz mutação OU consulta, nunca os dois" para o handler onChange. A abordagem correta seria persistir no store apenas no `onSubmit`, que já existe. O live preview pode ser alimentado via `watch` do react-hook-form sem escrever no store a cada keystroke.

```tsx
// Problema: dois efeitos por onChange (atualiza form E store)
onChange={(value) => {
  field.onChange(value);
  setField('names', value);
}}

// Preferível: salvar no store somente no submit
const onSubmit = (data: Step1Fields) => {
  Object.entries(data).forEach(([k, v]) =>
    setField(k as keyof Step1Fields, v),
  );
  onNext();
};
```

---

**[MINOR-3] `Wizard.tsx` linha 9–13 — Blank lines inside constant declaration block**

O padrão de código proíbe linhas em branco dentro de funções. A constante `STEP_TITLES` possui uma linha em branco interna desnecessária.

```tsx
// Problema
const STEP_TITLES = [
  'Vocês',
  'Localizações',
  'Música',
  'Envio',        // linha em branco após 'Música'
];

// Correto: sem linha em branco
const STEP_TITLES = ['Vocês', 'Localizações', 'Música', 'Envio'];
```

---

**[MINOR-4] Cobertura de testes abaixo do ideal em arquivos com lógica de negócio**

- `PlaceCardEditor.tsx`: 73,5% de statements / 54,5% de branches (linhas 47–48, 86, 100–135 descobertas). O fluxo de remoção da foto (botão "×") e o reset do input de arquivo não estão cobertos.
- `Step2Localizacoes.tsx`: 72% de statements / 73% de branches (linhas 53–57, 75, 110–119 descobertas). O cancelamento do modal de upgrade e o handler `handleDragEnd` não estão cobertos.
- `wizard-store.ts` branch 50% na linha 80: o branch do `setField` para tipos não-primitivos não está coberto.

---

**[MINOR-5] Ausência de testes para `LivePreview`, `SlugCard` e `PlanSelector`**

A regra de React do projeto determina: "Crie testes automatizados para todos os componentes." `LivePreview.tsx`, `SlugCard.tsx` e `PlanSelector.tsx` foram implementados sem arquivos de teste correspondentes. A tarefa não listou explicitamente testes para esses três, mas o padrão do projeto exige cobertura.

## Destaques Positivos

- **Persist corretamente configurado**: a `partialize` exclui o campo `photo` (não serializável como File) antes de persistir no localStorage, evitando erros silenciosos de serialização.
- **Constantes nomeadas**: `MAX_PHOTO_SIZE`, `BASIC_LIMIT`, `PREMIUM_LIMIT`, `DEFAULT_MUSIC`, `DEFAULT_STATE` — nenhum magic number exposto.
- **Tipagem sólida**: zero uso de `any`, interfaces bem definidas, inferência via `z.infer` no Step1.
- **`createPlace()` com `crypto.randomUUID()`**: IDs únicos gerados conforme especificação.
- **`ProgressDots` com acessibilidade**: uso correto de `aria-label` com estados "(completo)" e "(ativo)" — os testes exploram isso via `getByLabelText`.
- **Testes do store completamente independentes**: `beforeEach(() => useWizardStore.getState().reset())` garante isolamento entre casos.
- **Mock de `Date` nos testes de counter**: `jest.useFakeTimers()` + `jest.setSystemTime()` aplicados corretamente.
- **Lógica de upgrade bem integrada**: `handleUpgradeConfirm` altera o plano E adiciona o lugar atomicamente, sem estado inconsistente.

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | Observações |
| TypeScript/Node.js | OK |
| REST/HTTP | N/A |
| Logging | N/A |
| React | Observações |
| Testes | Observações |

## Recomendações

1. **(Alta prioridade)** Implementar o `GeocodingControl` do Maptiler no `PlaceCardEditor` substituindo o `Input` simples do campo de endereço. Este é um critério de sucesso explícito da tarefa e o pacote já está instalado.
2. **(Alta prioridade)** Corrigir o cálculo de `hours`/`minutes`/`seconds` no `use-relationship-counter.ts` para representar a duração intradiária desde o início do relacionamento, não o horário do relógio.
3. **(Alta prioridade)** Corrigir o memory leak de `URL.createObjectURL` no `PlaceCardEditor` com `useMemo` + `useEffect` de cleanup.
4. **(Média prioridade)** Implementar o layout responsive no `Wizard.tsx` removendo o `style={{ flexDirection: 'row' }}` e usando classes Tailwind (`flex-col lg:flex-row`).
5. **(Média prioridade)** Remover ou corrigir `makeDndSortable` no `PlaceCardEditor.test.tsx` — a função é dead code. Se o mock for necessário, usar `jest.mock` no nível do módulo.
6. **(Média prioridade)** Adicionar testes para `LivePreview`, `SlugCard` e `PlanSelector` conforme exige o padrão React do projeto.
7. **(Baixa prioridade)** Considerar salvar no store apenas no submit do Step1, alimentando o live preview via `watch` do react-hook-form em vez de disparar `setField` a cada keystroke.
8. **(Baixa prioridade)** Aumentar cobertura de branches em `PlaceCardEditor` (remoção de foto) e `Step2Localizacoes` (cancelamento do modal, drag end).

## Veredicto

A implementação entrega a estrutura central do wizard com qualidade de código satisfatória e sem erros de TypeScript. Contudo, o requisito do `GeocodingControl` (o diferencial de UX do Step 2) não foi implementado, o cálculo de duração em horas/minutos/segundos tem um bug semântico, e o layout mobile está bloqueado por um `style` inline. Esses três pontos são desvios diretos dos critérios de sucesso da tarefa. Recomenda-se implementar o geocoding e corrigir o bug do contador antes de marcar a tarefa como concluída. Os demais pontos podem ser tratados em paralelo ou na tarefa seguinte.
