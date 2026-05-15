# Review: Task 1.0 - Setup do Projeto Frontend

**Reviewer**: AI Code Reviewer
**Date**: 2026-05-11
**Task file**: 1_task.md
**Status**: APROVADO COM OBSERVAÇÕES

---

## Resumo

A implementação do setup inicial do projeto frontend está funcional e cobre os critérios de sucesso declarados na task: `npm test` passa com 9/9 testes, `npm run build` compila sem erros, e `npx tsc --noEmit` não reporta problemas. A estrutura de arquivos, os tokens CSS, a configuração do Tailwind, a instância do Axios, a validação de env com Zod, o router e os testes estão bem escritos e seguem os padrões do projeto.

Há dois problemas que merecem atenção antes das próximas tasks: (1) `framer-motion` foi substituído por `gsap` sem ser removido das dependências listadas na subtarefa 1.2, e a decisão não está refletida no `package.json` como troca explícita; (2) `@tailwindcss/vite` e `@types/maplibre-gl` estão listados como dependências de desenvolvimento obrigatórias na task 1.3, mas não foram instalados. Nenhum dos dois bloqueia o funcionamento atual, mas podem causar surpresas nas tarefas seguintes.

---

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `package.json` | Problemas | 3 |
| `vite.config.ts` | OK | 0 |
| `tailwind.config.ts` | OK | 0 |
| `postcss.config.js` | OK | 0 |
| `tsconfig.json` | OK | 0 |
| `tsconfig.app.json` | OK | 0 |
| `tsconfig.node.json` | OK | 0 |
| `jest.config.ts` | Observações | 1 |
| `jest.setup.ts` | OK | 0 |
| `src/main.tsx` | OK | 0 |
| `src/routes.tsx` | OK | 0 |
| `src/lib/api.ts` | OK | 0 |
| `src/lib/env.ts` | OK | 0 |
| `src/styles/tokens.css` | OK | 0 |
| `src/styles/fonts/` | OK | 0 |
| `src/pages/Landing.tsx` | OK | 0 |
| `src/pages/WizardPage.tsx` | OK | 0 |
| `src/pages/PublicMapPage.tsx` | OK | 0 |
| `src/__tests__/env.test.ts` | OK | 0 |
| `src/__tests__/routes.test.tsx` | OK | 0 |
| `.env.example` | OK | 0 |
| `public/_redirects` | OK | 0 |

---

## Problemas Encontrados

### Criticos

Nenhum problema crítico encontrado.

### Problemas Principais

**[MAIOR-01] `framer-motion` ausente do `package.json` sem substituição explícita documentada**

- **Arquivo**: `package.json`
- **Descrição**: A subtarefa 1.2 exige explicitamente a instalação de `framer-motion`. O descritivo da implementação menciona que `gsap` foi instalado "em vez de framer-motion (decisão do usuário nas tasks anteriores)", mas o `package.json` não contém `framer-motion` e a troca por `gsap` não está registrada como dependência de desenvolvimento ou anotada de forma rastreável no projeto. A techspec.md e o PRD mencionam `framer-motion` em múltiplos pontos (transições de step, scroll animations, TravelTransition, PlaceSection). Quando as tasks de UI começarem, o desenvolvedor precisará lidar com essa discrepância — componentes escritos com `framer-motion` na techspec precisarão ser adaptados para `gsap`.
- **Impacto**: Nenhum impacto imediato nesta task, mas representa uma divergência entre a especificação e a implementação que precisa ser registrada. A techspec deveria ser atualizada para refletir `gsap` em vez de `framer-motion`.
- **Sugestão**: Atualizar `techspec.md` para substituir as referências a `framer-motion` por `gsap`, ou adicionar uma nota de decisão técnica. Confirmar a decisão no `package.json` removendo a referência implícita e garantindo que `gsap` está listado nas dependências (o que já está: `"gsap": "^3.12.7"`).

---

**[MAIOR-02] `@tailwindcss/vite` ausente do `package.json` e não instalado**

- **Arquivo**: `package.json`
- **Descrição**: A subtarefa 1.3 lista `@tailwindcss/vite` como dependência de desenvolvimento obrigatória. O pacote não está instalado e o `vite.config.ts` usa `@vitejs/plugin-react` sem o plugin do Tailwind para Vite. A task optou por Tailwind v3 (via PostCSS), o que é uma decisão válida — mas nesse caso, `@tailwindcss/vite` é irrelevante para v3 (é um plugin para Tailwind v4). A ausência é coerente com a escolha de v3, mas a subtarefa 1.3 estava listando dependências voltadas para v4 e a decisão de usar v3 não foi explicitamente documentada no código ou na task.
- **Impacto**: Nenhum impacto funcional. O build está correto com PostCSS.
- **Sugestão**: Documentar no `vite.config.ts` ou em um comentário de decisão que Tailwind v3 foi escolhido (não v4), justificando a ausência de `@tailwindcss/vite`.

---

**[MAIOR-03] `@types/maplibre-gl` ausente do `package.json` e não instalado**

- **Arquivo**: `package.json`
- **Descrição**: A subtarefa 1.3 lista `@types/maplibre-gl` como dependência de desenvolvimento. O pacote não está instalado. Entretanto, `maplibre-gl` v5 já inclui suas próprias definições de tipos (campo `types` no `package.json` do maplibre), então o pacote `@types/maplibre-gl` realmente não é necessário para esta versão.
- **Impacto**: Nenhum impacto. O TypeScript funciona corretamente sem o pacote externo de tipos.
- **Sugestão**: Nenhuma ação necessária do ponto de vista técnico. A ausência é correta para maplibre-gl v5.

---

### Observações Menores

**[MENOR-01] Aviso do ts-jest sobre `esModuleInterop`**

- **Arquivo**: `jest.config.ts`
- **Descrição**: A execução do `npm test` exibe o aviso `TS151001: If you have issues related to imports, you should consider setting esModuleInterop to true`. O aviso não causa falha nos testes, mas pode gerar confusão. A configuração inline do ts-jest no `jest.config.ts` não inclui `esModuleInterop: true`.
- **Sugestão**: Adicionar `esModuleInterop: true` na configuração do ts-jest dentro do `jest.config.ts`:

```ts
transform: {
  '^.+\\.tsx?$': [
    'ts-jest',
    {
      tsconfig: {
        jsx: 'react-jsx',
        moduleResolution: 'node',
        allowImportingTsExtensions: false,
        noEmit: false,
        esModuleInterop: true,  // adicionar esta linha
      },
      diagnostics: false,
    },
  ],
},
```

---

**[MENOR-02] `react-router-dom` instalado na versão 7 — task pedia v6**

- **Arquivo**: `package.json`
- **Descrição**: A subtarefa 1.9 especifica "React Router v6" e a task define o uso de `createBrowserRouter` e `RouterProvider`. O pacote `react-router-dom@^7.6.0` (v7) foi instalado e a versão instalada é `7.15.0`. A API de `createBrowserRouter` e `RouterProvider` existe em ambas as versões com a mesma assinatura, então não há quebra. As v7 traz mudanças internas mas mantém compatibilidade de API para o padrão usado.
- **Impacto**: Nenhum impacto funcional — a API utilizada (`createBrowserRouter`, `RouterProvider`, `createMemoryRouter`) está disponível e estável na v7.
- **Sugestão**: Nenhuma ação urgente. Considerar atualizar a documentação da task/techspec para refletir que v7 está sendo usado, para evitar discrepâncias de versão entre desenvolvedores.

---

**[MENOR-03] `tokens.css` inclui `@tailwind` directives dentro de um arquivo que deveria ser apenas de tokens**

- **Arquivo**: `src/styles/tokens.css`
- **Descrição**: O arquivo `tokens.css` contém as diretivas `@tailwind base`, `@tailwind components` e `@tailwind utilities` na linha 29-31, além das variáveis CSS e das classes `.olm-*`. A task 1.5 pede para "copiar `tokens.css` para `frontend/src/styles/tokens.css`", mas o arquivo original do design handoff (`design_handoff_our_love_map/design_files/tokens.css`) não contém essas diretivas do Tailwind — elas foram adicionadas durante a adaptação. Isso é uma prática válida de consolidação, mas o arquivo mistura responsabilidades: tokens de design + entry point do Tailwind.
- **Impacto**: Nenhum impacto funcional. O build e os estilos funcionam corretamente.
- **Sugestão**: Manter como está por ser uma decisão pragmática. Alternativamente, separar as diretivas do Tailwind para um `index.css` e manter `tokens.css` apenas com variáveis e classes utilitárias — o que facilitaria a manutenção futura.

---

**[MENOR-04] `validateEnv` chamada com cast inseguro em `main.tsx`**

- **Arquivo**: `src/main.tsx`, linha 9
- **Descrição**: A chamada `validateEnv(import.meta.env as Record<string, string | undefined>)` utiliza `as` para forçar o tipo. O `import.meta.env` tem tipo `ImportMetaEnv` que pode conter valores de outros tipos além de `string`. O cast silencia o compilador sem garantia de correção em runtime.
- **Impacto**: Mínimo — na prática, as variáveis `VITE_*` sempre são strings. Zod valida corretamente o conteúdo em runtime.
- **Sugestão**: O design da `validateEnv` como função pura testável (com `Record<string, string | undefined>`) é correto. O cast em `main.tsx` é aceitável dado o contexto, mas poderia ser melhorado passando apenas as chaves conhecidas:

```ts
validateEnv({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_MAPTILER_API_KEY: import.meta.env.VITE_MAPTILER_API_KEY,
  VITE_YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY,
});
```

---

## Destaques Positivos

- **`env.ts` bem projetado**: A escolha de criar `validateEnv` como uma função pura que recebe `Record<string, string | undefined>` em vez de acessar `import.meta.env` diretamente é uma decisão arquitetural excelente — torna o módulo completamente testável sem mocks de ambiente.

- **Testes de rotas com `createMemoryRouter`**: O uso de `createMemoryRouter` no arquivo `routes.test.tsx` é a abordagem correta para testar rotas sem depender do ambiente de browser, seguindo as recomendações da documentação do React Router.

- **Cobertura de testes da task**: Os 6 testes de `env.test.ts` cobrem todos os cenários relevantes: ausência de todas as variáveis, ausência individual de cada variável, sucesso com todas presentes e validação dos valores retornados. Os 3 testes de `routes.test.tsx` cobrem cada rota individualmente, seguindo o princípio de um comportamento por teste.

- **`tailwind.config.ts` completo e preciso**: Os tokens foram mapeados com fidelidade ao design system — cores, sombras, radii, fontes e easings estão todos presentes, indo além do exemplo mínimo da techspec com tokens adicionais (variantes de cor `-600`, `-300`, `-100`, sombras dark `dsh-*`, `2xl` para border-radius).

- **Fontes self-hosted com `font-display: swap`**: A declaração correta de `font-display: swap` para as fontes TTF garante boa performance de carregamento e alinhamento com as melhores práticas de web performance.

- **Estrutura de mocks para testes**: Os arquivos `__mocks__/style-mock.ts` e `__mocks__/file-mock.ts` estão corretamente configurados para evitar que imports de CSS e arquivos binários quebrem os testes.

- **`_redirects` correto para Cloudflare Pages**: O arquivo `public/_redirects` com `/* /index.html 200` está exatamente no formato esperado pelo Cloudflare Pages para SPA routing.

- **Conformidade com padrões do projeto**: Todos os arquivos usam TypeScript, `const` sobre `let`, nomes em inglês, componentes funcionais, sem `any`, sem `require/module.exports`.

---

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Padrões de Código | OK |
| TypeScript/Node.js | OK |
| REST/HTTP | Não aplicável nesta task |
| Logging | Não aplicável nesta task |
| React | OK |
| Testes | OK |

---

## Recomendações

1. **[Prioritário]** Atualizar `techspec.md` para substituir todas as referências a `framer-motion` por `gsap`, formalizando a decisão técnica tomada anteriormente. Isso evitará confusão nas tasks de implementação de UI (tasks 3.0 a 8.0).

2. **[Recomendado]** Adicionar `esModuleInterop: true` à configuração do ts-jest em `jest.config.ts` para eliminar o aviso recorrente na execução dos testes.

3. **[Opcional]** Considerar passar as variáveis de ambiente individualmente para `validateEnv` em `main.tsx` em vez de usar `as Record<string, string | undefined>`, eliminando o cast e tornando o código mais explícito sobre quais variáveis são verificadas.

4. **[Informativo]** `@tailwindcss/vite` e `@types/maplibre-gl` corretamente ausentes: o primeiro é irrelevante para Tailwind v3, o segundo é desnecessário pois maplibre-gl v5 já inclui seus próprios tipos. Nenhuma ação necessária.

---

## Veredicto

A task 1.0 está **APROVADA COM OBSERVAÇÕES**. Os critérios de sucesso declarados foram todos atendidos: 9/9 testes passando, build sem erros, type-check limpo, estrutura de arquivos correta, tokens CSS mapeados, fontes self-hosted, router configurado e env validado.

O único ponto que exige atenção antes de começar as próximas tasks é a formalização da substituição de `framer-motion` por `gsap` na techspec — sem isso, quem implementar as tasks de UI pode seguir a techspec e tentar usar `framer-motion` que não está instalado. Os demais pontos são melhorias de qualidade não bloqueantes.
