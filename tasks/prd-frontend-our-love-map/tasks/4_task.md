# Tarefa 4.0: Wizard — Infraestrutura + Steps 1 e 2

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

Criar toda a infraestrutura do wizard (Zustand store, layout dois-colunas, progress dots, preview ao vivo) e implementar os Steps 1 (dados do casal) e 2 (localizações com geocoding e drag-to-reorder). Ao final desta tarefa, o usuário consegue preencher os dados básicos e adicionar/reordenar lugares com autocomplete de endereço real. Referência visual: abrir `design_handoff_our_love_map/design_files/ui_kits/landing_wizard/index.html` e alternar para a view de Wizard.

## Subtarefas

- [ ] 4.1 Criar `src/stores/wizard-store.ts` com Zustand + middleware `persist` (`localStorage`, key `olm-wizard`). O store deve conter: `plan`, `step`, `names`, `buyerName`, `buyerPhone`, `startDate`, `opening`, `places` (array de `Place`), `music`, `email`, `emailConfirm`, `mapId`. Incluir actions: `setPlan`, `setStep`, `setField`, `addPlace`, `removePlace`, `updatePlace`, `reorderPlaces`, `reset`
- [ ] 4.2 Criar `src/hooks/use-relationship-counter.ts` — hook que recebe `startDate: string` (ISO) e retorna `{ years, months, days, hours, minutes, seconds }` atualizado a cada segundo via `setInterval`
- [ ] 4.3 Criar `src/components/wizard/PlanSelector.tsx` — modal ou tela que exibe os 2 cards de plano (Basic / Premium) com features e preços. Exibido antes do Step 1 se o plano ainda não foi selecionado. Lê o query param `?plano=` via `useSearchParams` para pré-selecionar
- [ ] 4.4 Criar `src/components/wizard/ProgressDots.tsx` — 4 dots com número e label. Dot passado: fundo coral + ícone de check (✓). Dot ativo: fundo título. Dot futuro: fundo surface. Linha conectora entre dots
- [ ] 4.5 Criar `src/components/wizard/SlugCard.tsx` — card que exibe `ourlovemap.com.br/<slug>` derivado de `names` via `slugify`. Nota sobre acesso protegido por token
- [ ] 4.6 Criar `src/components/wizard/LivePreview.tsx` — phone preview 9:16 com fundo dark. Exibe: logo cream, eyebrow, nomes do casal (`CoupleNames`), frase de abertura em itálico, contador ao vivo (`useRelationshipCounter`), polaroide do primeiro lugar (step 2+), chip de música (step 3+). Atualiza em tempo real conforme o store
- [ ] 4.7 Criar `src/components/wizard/steps/Step1Voces.tsx` — campos: nomes do casal (obrigatório), nome completo do comprador, telefone, data de início (obrigatório), frase de abertura (opcional, max 200 chars). Todos validados com Zod + react-hook-form
- [ ] 4.8 Criar `src/components/wizard/PlaceCardEditor.tsx` — card de lugar com: handle de drag (6 pontos), badge numerado, campo de busca de endereço (`GeocodingControl` do Maptiler), campo "Nome do lugar", campo "Descrição", upload de foto (JPEG/PNG/WebP, máx 5MB, preview da imagem). Botão de remover (visível se houver mais de 1 lugar)
- [ ] 4.9 Criar `src/components/wizard/steps/Step2Localizacoes.tsx` — lista de `PlaceCardEditor` envolvida por `DndContext` + `SortableContext` do `@dnd-kit/sortable`. Botão "+ Adicionar lugar". Ao adicionar o 4º lugar com plano Basic: exibir `Modal` de confirmação de upgrade para Premium. Footer: `{n} de {limite} lugares ({plano})`
- [ ] 4.10 Criar `src/components/wizard/Wizard.tsx` — layout dois-colunas: form (1.35fr) à esquerda + `LivePreview` + `SlugCard` sticky (1fr) à direita. Em mobile (< 720px): single-column, preview abaixo. Renderiza o step correto baseado no store. Botões "Voltar" e "Continuar" com validação de `canProceed` por step

## Detalhes de Implementação

Consultar RF-12 a RF-26 e RF-45 a RF-49 do prd.md, e as seções **Estado do Wizard — Zustand + persist**, **Geocoding** e **dnd-kit** da techspec.md.

O `GeocodingControl` do Maptiler deve ser configurado com `country="br"`, `language="pt"` e `minLength={3}`. O callback `onPick` deve salvar `latitude`, `longitude` e `address` no place correspondente no store.

A reordenação com `@dnd-kit` usa `useSortable` em cada `PlaceCardEditor` e `arrayMove` do `@dnd-kit/sortable` no handler `onDragEnd` do `DndContext`. O `id` de cada place é um UUID gerado com `crypto.randomUUID()` no momento da criação.

Validação de upload de foto: verificar `file.size <= 5 * 1024 * 1024` e `['image/jpeg', 'image/png', 'image/webp'].includes(file.type)` antes de salvar no store. Exibir erro inline se inválido.

## Critérios de Sucesso

- Seletor de plano lê `?plano=premium` da URL e pré-seleciona o plano correto
- O store persiste no `localStorage` — após recarregar a página, os dados permanecem
- O preview ao vivo atualiza em tempo real ao digitar no Step 1
- O contador de relacionamento conta segundos ao vivo
- Autocomplete de endereço no Step 2 sugere resultados reais ao digitar
- Selecionar um endereço salva `latitude` e `longitude` no store
- Drag-to-reorder funciona com mouse e touch
- Adicionar o 4º lugar com plano Basic exibe o modal de upgrade
- Upload de foto acima de 5MB exibe mensagem de erro

## Testes da Tarefa

- [ ] Testes unitários `use-relationship-counter`: mock de `Date`, verifica cálculo de anos/meses/dias, verifica atualização a cada segundo
- [ ] Testes unitários `wizard-store`: `addPlace` adiciona corretamente, `removePlace` remove pelo id, `reorderPlaces` reordena o array, `reset` limpa o store, `persist` salva no localStorage
- [ ] Testes de renderização `ProgressDots`: dot passado exibe ✓, dot ativo tem estilo diferenciado, dot futuro tem estilo neutro
- [ ] Testes de renderização `Step1Voces`: submissão sem `names` exibe erro de validação, submissão sem `startDate` exibe erro de validação
- [ ] Testes de renderização `Step2Localizacoes`: "+ Adicionar lugar" adiciona card, botão remover remove card, modal de upgrade aparece ao adicionar 4º lugar com plano Basic
- [ ] Testes de renderização `PlaceCardEditor`: erro de arquivo grande (> 5MB) exibe mensagem de erro, erro de tipo inválido exibe mensagem de erro

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `frontend/src/stores/wizard-store.ts`
- `frontend/src/hooks/use-relationship-counter.ts`
- `frontend/src/components/wizard/PlanSelector.tsx`
- `frontend/src/components/wizard/ProgressDots.tsx`
- `frontend/src/components/wizard/SlugCard.tsx`
- `frontend/src/components/wizard/LivePreview.tsx`
- `frontend/src/components/wizard/PlaceCardEditor.tsx`
- `frontend/src/components/wizard/Wizard.tsx`
- `frontend/src/components/wizard/steps/Step1Voces.tsx`
- `frontend/src/components/wizard/steps/Step2Localizacoes.tsx`
- `frontend/src/pages/WizardPage.tsx`
