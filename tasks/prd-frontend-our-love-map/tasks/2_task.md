# Tarefa 2.0: Design system e componentes UI base

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

Criar todos os componentes primitivos reutilizáveis e os utilitários de biblioteca que serão usados em toda a aplicação. Esta tarefa não tem dependência de chamadas de API — é puramente visual e utilitária. Os componentes devem seguir fielmente os design tokens mapeados no Tailwind e os protótipos do handoff em `design_handoff_our_love_map/design_files/`.

## Subtarefas

- [ ] 2.1 Criar `src/lib/slug.ts` — função `slugify(names: string): string` que remove acentos, caracteres especiais, converte para lowercase e substitui espaços por hífens (ex: "Ana e Lucas" → "ana-e-lucas")
- [ ] 2.2 Criar `src/lib/youtube.ts` — funções `extractYoutubeId(urlOrId: string): string | null` (aceita URLs `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/` e IDs de 11 chars) e `isValidYoutubeUrl(url: string): boolean`
- [ ] 2.3 Criar `src/components/ui/Button.tsx` — variantes: `primary` (coral, glow), `secondary` (outline título), `premium` (título com borda accent), `ghost` e `text`. Tamanhos: `sm`, `md`, `lg`. `scale(0.98)` no press via Framer Motion
- [ ] 2.4 Criar `src/components/ui/Input.tsx` — input com label, placeholder, mensagem de erro (borda vermelha) e help text. Focus com borda accent (lavender)
- [ ] 2.5 Criar `src/components/ui/Field.tsx` — wrapper de label + children + mensagem de erro/help, usado para envolver inputs, textareas e selects
- [ ] 2.6 Criar `src/components/ui/Toggle.tsx` — switch customizado com animação de bolinha deslizando (150ms ease-emphasized). Estado ligado = fundo coral, desligado = fundo surface
- [ ] 2.7 Criar `src/components/ui/Card.tsx` — card com variante `light` (fundo branco, sombra `--sh-md`) e `dark` (fundo `--olm-dark-800`, borda sutil `rgba(251,245,240,0.08)`)
- [ ] 2.8 Criar `src/components/ui/Modal.tsx` — modal com overlay escuro (`backdrop-filter: blur(20px)`), fechamento ao clicar fora e na tecla Escape, animação de entrada com Framer Motion (`AnimatePresence`)
- [ ] 2.9 Criar `src/components/ui/Polaroid.tsx` — frame branco com padding, rotação configurável via prop, caption em itálico serif na parte inferior
- [ ] 2.10 Criar `src/components/ui/Eyebrow.tsx` — texto uppercase, trackeado, pequeno, na cor coral (para headings de seção)
- [ ] 2.11 Copiar os assets de logo do handoff para `src/assets/`: `logo.svg`, `logo-cream.svg`, `logo-wordmark.svg`

## Detalhes de Implementação

Consultar seção **Design e Experiência** do prd.md e os arquivos `design_handoff_our_love_map/design_files/ui_kits/landing_wizard/primitives.jsx` e `design_handoff_our_love_map/design_files/preview/` como referência visual.

**Regra crítica:** o "e" entre nomes do casal deve ser renderizado em coral e itálico em qualquer componente que exiba o nome. Criar um helper `CoupleNames.tsx` que aceita `names: string` e renderiza a separação corretamente:
```tsx
// "Ana e Lucas" → <span>Ana <em className="text-olm-primary">e</em> Lucas</span>
```

Todos os componentes devem ter props tipadas com `interface`, sem uso de `any`. Seguir o padrão de componentes funcionais com `export function`.

## Critérios de Sucesso

- Todos os componentes renderizam isoladamente sem erros
- `Button` aplica `scale(0.98)` visivelmente no clique
- `Toggle` anima a bolinha com transição suave
- `Modal` fecha ao pressionar Escape e ao clicar no overlay
- `slugify("Ana e Lucas")` retorna `"ana-e-lucas"`
- `slugify("João & Maria")` retorna `"joao-maria"`
- `extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")` retorna `"dQw4w9WgXcQ"`
- `extractYoutubeId("https://youtu.be/dQw4w9WgXcQ")` retorna `"dQw4w9WgXcQ"`
- `extractYoutubeId("texto aleatório")` retorna `null`

## Testes da Tarefa

- [ ] Testes unitários `slug.ts`: nomes simples, com acentos, com caracteres especiais, string vazia (retorna `"seu-mapa"`)
- [ ] Testes unitários `youtube.ts`: URLs válidas de todas as variantes (`watch?v=`, `youtu.be/`, `shorts/`), ID direto de 11 chars, string inválida
- [ ] Testes de renderização `Button`: renderiza todas as variantes, dispara `onClick`, aplica classe de tamanho correta
- [ ] Testes de renderização `Toggle`: muda estado ao clicar, exibe estado inicial correto
- [ ] Testes de renderização `Modal`: renderiza quando `isOpen=true`, não renderiza quando `isOpen=false`, chama `onClose` ao pressionar Escape
- [ ] Testes de renderização `Input`: exibe mensagem de erro quando `error` é passado, exibe borda vermelha

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `frontend/src/lib/slug.ts`
- `frontend/src/lib/youtube.ts`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Field.tsx`
- `frontend/src/components/ui/Toggle.tsx`
- `frontend/src/components/ui/Card.tsx`
- `frontend/src/components/ui/Modal.tsx`
- `frontend/src/components/ui/Polaroid.tsx`
- `frontend/src/components/ui/Eyebrow.tsx`
- `frontend/src/components/ui/CoupleNames.tsx`
- `frontend/src/assets/`
