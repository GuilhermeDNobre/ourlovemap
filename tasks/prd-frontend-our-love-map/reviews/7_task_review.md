# Review: Task 7.0 - Página pública — Cover, PlaceSection e TravelTransition

**Reviewer**: AI Code Reviewer
**Date**: 2026-05-12
**Task file**: 7_task.md
**Status**: APROVADO COM OBSERVAÇÕES

---

## Resumo

A implementação cobre todos os requisitos funcionais da tarefa: fetch de dados com `useQuery` (subtarefa 7.1), telas de erro de acesso 401/403 (7.2), `CoverScreen` com animações GSAP de rings e contador ao vivo (7.3), `PlaceSection` com MapLibre GL JS imperativo, markers reativos e animação de card via GSAP (7.4), `useActivePlace` via `react-intersection-observer` (7.5), `TravelTransition` com ScrollTrigger e path SVG animado (7.6), orquestrador `PublicMap` (7.7) e `PublicMapPage` sem chrome de navegação (7.8).

Todos os 263 testes da suíte passam. TypeScript compila sem erros (`tsc --noEmit`). Os 7 arquivos de teste para a feature totalizam 33 testes, cobrindo todos os componentes e hooks requeridos pela tarefa. A qualidade geral é boa: o código adere à stack mandatória (GSAP, MapLibre imperativo, react-intersection-observer, sem Framer Motion), respeita as convenções TypeScript e React do projeto, e não usa `any` exceto no arquivo pré-existente `client-env.ts`.

Os problemas encontrados são de caráter minor ou estético, sem nenhuma issue crítica ou blocante.

---

## Arquivos Revisados

| Arquivo | Status | Issues |
|---------|--------|--------|
| `src/types/map.ts` | ✅ OK | 0 |
| `src/hooks/use-map-data.ts` | ✅ OK | 0 |
| `src/hooks/use-active-place.ts` | ✅ OK | 0 |
| `src/components/public-map/AccessError.tsx` | ✅ OK | 0 |
| `src/components/public-map/CoverScreen.tsx` | ✅ OK | 0 |
| `src/components/public-map/PlaceSection.tsx` | ⚠️ Issues | 3 |
| `src/components/public-map/TravelTransition.tsx` | ⚠️ Issues | 1 |
| `src/components/public-map/PublicMap.tsx` | ✅ OK | 0 |
| `src/pages/PublicMapPage.tsx` | ⚠️ Issues | 1 |
| `src/__mocks__/maplibre-gl-mock.ts` | ✅ OK | 0 |
| `src/__mocks__/gsap-mock.ts` | ✅ OK | 0 |
| `src/__mocks__/gsap-plugins-mock.ts` | ✅ OK | 0 |
| `src/__mocks__/intersection-observer-mock.ts` | ✅ OK | 0 |
| `jest.config.ts` | ✅ OK | 0 |
| `jest.setup.ts` | ✅ OK | 0 |
| `src/__tests__/public-map/use-map-data.test.tsx` | ✅ OK | 0 |
| `src/__tests__/public-map/use-active-place.test.ts` | ✅ OK | 0 |
| `src/__tests__/public-map/AccessError.test.tsx` | ✅ OK | 0 |
| `src/__tests__/public-map/CoverScreen.test.tsx` | ✅ OK | 0 |
| `src/__tests__/public-map/PlaceSection.test.tsx` | ⚠️ Issues | 1 |
| `src/__tests__/public-map/TravelTransition.test.tsx` | ✅ OK | 0 |
| `src/__tests__/public-map/PublicMap.test.tsx` | ✅ OK | 0 |

---

## Issues Encontradas

### Criticas

Nenhuma issue crítica encontrada.

---

### Maiores

Nenhuma issue maior encontrada.

---

### Menores

**[MINOR-1] Tipo errado em teste de `PlaceSection` — `undefined` onde o tipo exige `string | null`**

Arquivo: `src/__tests__/public-map/PlaceSection.test.tsx`, linha 76

```typescript
renderSection({ location: { ...baseLocation, description: undefined } });
```

O campo `description` em `ApiLocation` é declarado como `string | null`, mas o teste passa `undefined`. O comportamento em runtime é identico (o guard `location.description &&` trata ambos), mas o teste viola a tipagem do contrato. Como `diagnostics: false` está configurado no `ts-jest`, o erro de tipo é silenciado e o teste passa. O correto é usar `null`:

```typescript
renderSection({ location: { ...baseLocation, description: null } });
```

---

**[MINOR-2] Campo `message` declarado em `ApiLocation` mas nunca renderizado**

Arquivo: `src/types/map.ts`, linha 4; `src/components/public-map/PlaceSection.tsx`

O tipo `ApiLocation` declara `message: string | null`, mas `PlaceSection` não renderiza esse campo em lugar algum. A tarefa (subtarefa 7.4) menciona "card de conteúdo [...] descrição em itálico" — o campo `description` cobre esse requisito. O campo `message` veio provavelmente do modelo do backend mas não tem representação visual na UI.

Não há impacto funcional, mas o campo morto polui o contrato de tipos e pode confundir futuros mantenedores. Se o campo não for usado agora, o tipo deveria omiti-lo ou marcá-lo para implementação futura com um comentário explicativo.

---

**[MINOR-3] `gsap.registerPlugin(ScrollTrigger)` declarado no escopo do módulo**

Arquivo: `src/components/public-map/TravelTransition.tsx`, linha 5

```typescript
gsap.registerPlugin(ScrollTrigger);
```

Registrar o plugin no topo do módulo (escopo global, executado na importação) é um side effect de módulo. Embora GSAP tolere re-registros sem erro, a abordagem recomendada para aplicações com múltiplos pontos de entrada é registrar plugins uma única vez em um módulo de setup centralizado (ex: `src/lib/gsap-setup.ts` importado em `main.tsx`). Isso evita registros duplicados silenciosos e facilita testes que não carregam o componente.

---

**[MINOR-4] `eslint-disable-next-line` sem comentário explicativo no `PlaceSection`**

Arquivo: `src/components/public-map/PlaceSection.tsx`, linha 60

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

O `useEffect` que instancia o mapa MapLibre omite `allLocations` e `index` das dependências intencionalmente (para não destruir e recriar o mapa a cada render). A decisão técnica é correta para uso imperativo de mapas, mas o disable sem explicação dificulta manutenção futura. Sugestão:

```typescript
// O mapa é instanciado apenas uma vez. A opacidade dos markers é
// atualizada de forma reativa no useEffect separado com [isActive, index].
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

---

**[MINOR-5] `PublicMapPage` usa `export default` em arrow function implícita enquanto restante do projeto usa `function` declaration**

Arquivo: `src/pages/PublicMapPage.tsx`, linha 8

```typescript
export default function PublicMapPage() {
```

A sintaxe em si está correta (`function` declaration com `export default`). Porém o `QueryClient` é instanciado no escopo do módulo:

```typescript
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
```

Em testes com múltiplas renderizações da página (ou em potencial SSR futuro), isso causa compartilhamento de estado do cache entre renders. O padrão mais seguro é instanciar dentro do componente com `useState` para garantir isolamento:

```typescript
export default function PublicMapPage() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  );
  return (
    <div data-testid="public-map-page" style={{ overflowX: 'hidden' }}>
      <QueryClientProvider client={queryClient}>
        <PublicMap />
      </QueryClientProvider>
    </div>
  );
}
```

---

**[MINOR-6] Eyebrow do lugar usa numeração genérica em vez do título contextual**

Arquivo: `src/components/public-map/PlaceSection.tsx`, linha 103

```tsx
<p ...>LUGAR {String(index + 1).padStart(2, '0')}</p>
```

A tarefa (subtarefa 7.4) e o PRD (RF-53) especificam: `"eyebrow (ex: 'PRIMEIRO ENCONTRO')"`. A implementação usa `"LUGAR 01"`, `"LUGAR 02"` etc., que se afasta do design handoff. O campo `title` da `ApiLocation` poderia ser usado em uppercase como eyebrow contextual:

```tsx
<p ...>{location.title.toUpperCase()}</p>
```

Ou, se o eyebrow for diferente do título, o backend precisaria expor um campo adicional. Como o modelo atual não tem campo dedicado para eyebrow, o uso do título em uppercase é a solução mais aderente ao requisito.

---

**[MINOR-7] Linhas em branco dentro de `useEffect` no `PlaceSection`**

Arquivo: `src/components/public-map/PlaceSection.tsx`, linhas 35-61

O `useEffect` de inicialização do mapa contém linhas em branco entre blocos de código, violando o padrão do projeto que proíbe linhas em branco dentro de funções/métodos. O bloco de criação do `Map` e o handler `map.on('load')` estão separados por uma linha em branco.

---

## Destaques Positivos

- **Cleanup correto de GSAP em todos os componentes**: todos os tweens são armazenados em variáveis/refs e `.kill()` é chamado no retorno do `useEffect`. O ScrollTrigger em `TravelTransition` tem cleanup via `st.kill()`. Isso previne memory leaks em navegação SPA.

- **Markers reativos implementados corretamente**: diferente do que uma leitura superficial poderia sugerir, `PlaceSection` tem dois `useEffect` separados — um para instanciar o mapa (sem dependências para não recriar o mapa) e outro com `[isActive, index]` que atualiza a opacidade e `boxShadow` dos markers em tempo real. Isso atende integralmente à subtarefa 7.4.

- **`use-map-data` bem implementado**: uso correto de `staleTime: Infinity`, `retry: false`, `enabled: !!token` e leitura de `useSearchParams`. Tipagem `MapApiResponse` completa e correta.

- **`useActivePlace` tem 5 testes com casos limítrofes**: além dos 3 básicos (estado inicial, atualização com `inView: true`, não atualização com `inView: false`), o teste verifica o comportamento de atualização sequencial e a estabilidade de referência do `updateVisibility` via `useCallback`. Isso é coverage de qualidade.

- **Tratamento de erro robusto no `PublicMap`**: uso correto de `isAxiosError` para discriminar o status HTTP e fallback `?? 401` para quando `error.response` é `undefined`. O caso 403 genérico (sem `errorCode`) também é tratado defensivamente em `AccessError`.

- **Mocks de teste precisos e funcionais**: o `maplibre-gl-mock` invoca o callback `load` sincronamente, o que permite testar o ciclo completo de inicialização de markers sem timers. O mock de `gsap` captura `.kill()` via `jest.fn()` possibilitando verificar cleanups.

- **Polyfills de SVG no `jest.setup.ts`**: `getTotalLength` e `getPointAtLength` adicionados como polyfills globais resolvem elegantemente a limitação do JSDOM para SVG, sem mockar individualmente em cada arquivo de teste.

- **Estrutura AAA clara nos testes**: todos os 33 testes seguem Arrange/Act/Assert com nomes descritivos iniciando em "should".

- **TypeScript sem `any`**: toda a feature usa tipos explícitos. O único `any` está em `client-env.ts` (arquivo pré-existente e documentado com `eslint-disable`).

- **`key={location.order}`** em `PublicMap`: uso do campo semanticamente único e estável (`order`) como key do Fragment, correto.

- **`useRelationshipCounter` reutilizado**: o hook da feature do wizard foi reaproveitado sem duplicação, com o Date corretamente mockado no teste de `CoverScreen`.

---

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Code Standards | ⚠️ |
| TypeScript/Node.js | ✅ |
| REST/HTTP | ✅ |
| Logging | N/A |
| React | ⚠️ |
| Testes | ✅ |

**Code Standards**: viola a regra de "sem linhas em branco dentro de funções" no `PlaceSection` (MINOR-7) e o campo `message` morto polui o tipo (MINOR-2).

**React**: eyebrow do lugar diverge do design handoff descrito no PRD/tarefa (MINOR-6). `QueryClient` instanciado fora do componente em `PublicMapPage` (MINOR-5).

**Testes**: 263 testes passam. Os 7 arquivos de teste da feature cobrem todos os componentes e hooks mandatados pela tarefa. Um teste usa tipo incorreto (`undefined` em campo `string | null`) — MINOR-1.

---

## Recomendações

1. **(Baixa prioridade)** Corrigir `description: undefined` para `description: null` no teste de `PlaceSection` (MINOR-1) para alinhar o teste ao contrato do tipo.

2. **(Baixa prioridade)** Decidir o destino do campo `message` em `ApiLocation`: renderizá-lo no card ou removê-lo do tipo até que seja necessário (MINOR-2).

3. **(Baixa prioridade)** Mover `gsap.registerPlugin(ScrollTrigger)` para um módulo centralizado `src/lib/gsap-setup.ts` importado em `main.tsx` (MINOR-3).

4. **(Baixa prioridade)** Adicionar comentário explicativo no `eslint-disable` do `PlaceSection` (MINOR-4).

5. **(Baixa prioridade)** Mover a instanciação do `QueryClient` em `PublicMapPage` para dentro de um `useState` (MINOR-5).

6. **(Baixa prioridade)** Revisar o eyebrow do lugar em `PlaceSection` para usar `location.title.toUpperCase()` em lugar de `"LUGAR 01"` (MINOR-6).

7. **(Baixa prioridade)** Remover a linha em branco dentro do `useEffect` de inicialização do mapa no `PlaceSection` (MINOR-7).

---

## Veredicto

A implementação está funcional, completa e bem testada. Todos os critérios de sucesso da tarefa foram atendidos: fetch com erro handling, telas de acesso inválido/expirado, Cover com GSAP rings e contador ao vivo, PlaceSection com mapa MapLibre imperativo e markers reativos, TravelTransition com ScrollTrigger scrub, e PublicMap sem chrome de navegação. Os 263 testes passam e o TypeScript compila sem erros.

Os 7 pontos levantados são todos de baixa prioridade — nenhum afeta funcionalidade, segurança ou corretude dos testes. O código pode seguir para integração.

**Proximos passos sugeridos (nao bloqueantes):**
- Corrigir o tipo no teste de `PlaceSection` (`null` em vez de `undefined`)
- Definir o destino do campo `message` no tipo `ApiLocation`
- Considerar centralizar o registro dos plugins GSAP em `main.tsx`
