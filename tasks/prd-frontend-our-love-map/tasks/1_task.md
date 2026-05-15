# Tarefa 1.0: Setup do projeto frontend

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

Criar a estrutura inicial do projeto frontend dentro de `./frontend`, com Vite + React 18 + TypeScript, Tailwind CSS com os design tokens mapeados, React Router v6 com as 3 rotas da aplicação, instância Axios centralizada, Jest + React Testing Library configurados e o arquivo `_redirects` para o Cloudflare Pages. Ao final desta tarefa, `npm run dev` deve subir e as 3 rotas (`/`, `/criar`, `/acesso`) devem responder com uma página em branco sem erros no console.

## Subtarefas

- [ ] 1.1 Inicializar o projeto com `npm create vite@latest frontend -- --template react-ts` dentro da raiz do repositório
- [ ] 1.2 Instalar todas as dependências de produção: `react-router-dom`, `axios`, `zustand`, `@tanstack/react-query`, `framer-motion`, `maplibre-gl`, `@maptiler/geocoding-control`, `react-youtube`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lucide-react`
- [ ] 1.3 Instalar dependências de desenvolvimento: `tailwindcss`, `@tailwindcss/vite`, `@types/maplibre-gl`, `jest`, `@jest/globals`, `ts-jest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest-environment-jsdom`, `msw`
- [ ] 1.4 Configurar `tailwind.config.ts` mapeando todos os tokens do design system via `var(--olm-*)` — cores, sombras, radii, fontes e easings (ver seção correspondente na techspec.md)
- [ ] 1.5 Copiar `design_handoff_our_love_map/design_files/tokens.css` para `frontend/src/styles/tokens.css`
- [ ] 1.6 Copiar as fontes TTF de `design_handoff_our_love_map/design_files/fonts/` para `frontend/src/styles/fonts/`
- [ ] 1.7 Configurar `frontend/src/styles/tokens.css` com as declarações `@font-face` das fontes self-hosted (DM Serif Display e Plus Jakarta Sans) e importá-lo em `frontend/src/main.tsx`
- [ ] 1.8 Criar `frontend/src/lib/api.ts` com instância Axios usando `import.meta.env.VITE_API_BASE_URL` como `baseURL`
- [ ] 1.9 Criar `frontend/src/routes.tsx` com React Router v6 (`createBrowserRouter`) definindo as 3 rotas: `/` → `<Landing />`, `/criar` → `<WizardPage />`, `/acesso` → `<PublicMapPage />` — cada página pode ser um componente placeholder por enquanto
- [ ] 1.10 Criar `frontend/src/main.tsx` com `QueryClientProvider` (TanStack Query) e `RouterProvider` envolvendo a aplicação
- [ ] 1.11 Criar `frontend/src/lib/env.ts` que valida com Zod que `VITE_API_BASE_URL`, `VITE_MAPTILER_API_KEY` e `VITE_YOUTUBE_API_KEY` existem — deve lançar erro claro no startup se ausentes
- [ ] 1.12 Criar `frontend/.env.example` com as três variáveis de ambiente necessárias
- [ ] 1.13 Criar `frontend/public/_redirects` com `/* /index.html 200` para o Cloudflare Pages
- [ ] 1.14 Configurar `jest.config.ts`, `jest.setup.ts` e `tsconfig` com suporte a `@testing-library/jest-dom`

## Detalhes de Implementação

Consultar seções **Visão Geral da Arquitetura**, **Tailwind + Design Tokens** e **Infraestrutura e Deploy** da techspec.md.

O `tailwind.config.ts` deve usar a sintaxe de CSS vars para cada token. Exemplo:
```ts
colors: {
  'olm-primary': 'var(--olm-primary)',
  'olm-title': 'var(--olm-title)',
  // ...
}
```

O `api.ts` deve ser uma instância única do Axios sem nenhum header de autenticação por padrão — o token de acesso da página pública é passado como query string, não como header.

## Critérios de Sucesso

- `npm run dev` inicia sem erros e as 3 rotas respondem (mesmo que com placeholder)
- `npm run build` compila sem erros de TypeScript
- `npx tsc --noEmit` passa sem erros
- `npm test` executa sem falhas
- As fontes DM Serif Display e Plus Jakarta Sans carregam corretamente (verificar no DevTools → Network → Fonts)
- Os tokens CSS estão disponíveis no `:root` (verificar no DevTools → Elements → Computed)

## Testes da Tarefa

- [ ] Teste unitário: `env.ts` lança erro quando variável de ambiente obrigatória está ausente
- [ ] Teste unitário: `env.ts` não lança erro quando todas as variáveis estão presentes
- [ ] Teste de renderização: cada uma das 3 rotas renderiza sem lançar exceção (React Testing Library + `MemoryRouter`)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tailwind.config.ts`
- `frontend/tsconfig.json`
- `frontend/jest.config.ts`
- `frontend/jest.setup.ts`
- `frontend/.env.example`
- `frontend/public/_redirects`
- `frontend/src/main.tsx`
- `frontend/src/routes.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/env.ts`
- `frontend/src/styles/tokens.css`
- `frontend/src/styles/fonts/`
