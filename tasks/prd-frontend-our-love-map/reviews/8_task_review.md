# Review: Task 8.0 - Página pública — FinalMapScreen e Player de música

**Reviewer**: AI Code Reviewer
**Date**: 2026-05-12
**Task file**: 8_task.md
**Status**: APPROVED WITH OBSERVATIONS

## Summary

A tarefa implementou a segunda metade da página pública: o hook `useMusicPlayer`, o componente `MusicLayer` com player YouTube oculto e overlay de desbloqueio, o componente `FinalMapScreen` com mapa MapLibre interativo, rota coral dashed, polaroides flutuantes, botão de compartilhamento e link de retorno ao topo, além da atualização do `PublicMap` para orquestrar todos esses elementos. O código é funcionalmente correto, todos os 279 testes passam e o TypeScript compila sem erros. Contudo, há um bug comportamental crítico (wiring de `onAutoplayBlocked` ausente), um import não utilizado em `FinalMapScreen.tsx` e algumas violações menores dos padrões do projeto.

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `src/types/map.ts` | OK | 0 |
| `src/hooks/use-music-player.ts` | OK | 0 |
| `src/components/public-map/MusicLayer.tsx` | Problemas | 2 |
| `src/components/public-map/FinalMapScreen.tsx` | Problemas | 4 |
| `src/components/public-map/PublicMap.tsx` | Problemas | 2 |
| `src/__mocks__/react-youtube-mock.tsx` | OK | 0 |
| `src/__mocks__/maplibre-gl-mock.ts` | OK | 0 |
| `jest.config.ts` | OK | 0 |
| `src/__tests__/public-map/use-music-player.test.ts` | OK | 0 |
| `src/__tests__/public-map/MusicLayer.test.tsx` | OK | 0 |
| `src/__tests__/public-map/FinalMapScreen.test.tsx` | Observações | 1 |
| `src/__tests__/public-map/PublicMap.test.tsx` | OK | 0 |

## Issues Found

### Criticos

#### CRITICO-1 — `onAutoplayBlocked` jamais é passado para `MusicLayer`

**Arquivo:** `src/components/public-map/MusicLayer.tsx` e `src/components/public-map/PublicMap.tsx`

**Descrição:** O hook `useMusicPlayer` retorna `onAutoplayBlocked`, que deve ser acionado quando o YouTube bloqueia o autoplay do browser (evento de erro do player). Essa callback é devidamente extraída em `PublicMap.tsx` (linha 18), porém nunca é conectada ao player. O componente `MusicLayer` não possui a prop `onAutoplayBlocked`, portanto o componente `<YouTube>` não tem nenhum handler para o evento correspondente. Na prática, `isBlocked` nunca será `true` de forma automática — o overlay "Tocar música" nunca aparece por conta própria.

**Correção sugerida:**

```tsx
// MusicLayer.tsx — adicionar prop e conectar ao player
interface MusicLayerProps {
  videoId: string | null | undefined;
  startTime: number;
  endTime: number;
  playerRef: React.MutableRefObject<YouTubePlayer | null>;
  isBlocked: boolean;
  unblock: () => void;
  onEnd: () => void;
  onAutoplayBlocked: () => void;  // nova prop
}

export function MusicLayer({
  videoId, startTime, endTime, playerRef,
  isBlocked, unblock, onEnd, onAutoplayBlocked,  // nova prop
}: MusicLayerProps) {
  if (!videoId) return null;
  const handleReady = (e: YouTubeEvent) => { playerRef.current = e.target; };
  return (
    <>
      <YouTube
        videoId={videoId}
        className="sr-only"
        opts={{ playerVars: { autoplay: 0, start: startTime, end: endTime } }}
        onReady={handleReady}
        onEnd={onEnd}
        onError={onAutoplayBlocked}   // conecta o handler
      />
      {/* overlay ... */}
    </>
  );
}

// PublicMap.tsx — passar a prop
<MusicLayer
  videoId={data.youtubeVideoId}
  startTime={data.youtubeStartTime ?? 0}
  endTime={data.youtubeEndTime ?? 0}
  playerRef={playerRef}
  isBlocked={isBlocked}
  unblock={unblock}
  onEnd={handleEnd}
  onAutoplayBlocked={onAutoplayBlocked}   // conecta
/>
```

**Nota:** `react-youtube` expõe o callback `onError` (chamado pelo YouTube IFrame API com código 5 quando autoplay é bloqueado) e também `onStateChange` (estado -1 pode indicar bloqueio). O handler exato depende da biblioteca — o importante é que exista um canal para o YouTube notificar o app do bloqueio.

---

### Principais

#### MAJOR-1 — Import não utilizado: `Polaroid` em `FinalMapScreen.tsx`

**Arquivo:** `src/components/public-map/FinalMapScreen.tsx`, linha 3

**Descrição:** O componente `Polaroid` é importado mas nunca referenciado. As polaroides são criadas manualmente com `document.createElement` dentro do `useEffect`. Além de ser código morto, viola a regra de imports desnecessários e pode confundir futuros mantenedores.

```tsx
// Remover:
import { Polaroid } from '../ui/Polaroid';
```

#### MAJOR-2 — Magic number `2000` em `handleShare`

**Arquivo:** `src/components/public-map/FinalMapScreen.tsx`, linha 98

**Descrição:** O valor `2000` (ms de feedback "Link copiado!") é um magic number sem nome declarado. Segundo os padrões do projeto, magic numbers devem ser representados por constantes nomeadas.

```tsx
// Antes
setTimeout(() => setCopied(false), 2000);

// Depois — declarar no escopo do arquivo
const COPY_FEEDBACK_DURATION_MS = 2000;

// ...dentro do componente
setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
```

#### MAJOR-3 — Linhas em branco dentro de métodos e função-componente

**Arquivos:** `src/components/public-map/FinalMapScreen.tsx` (múltiplas) e `src/hooks/use-music-player.ts`

**Descrição:** Os padrões do projeto proíbem linhas em branco dentro de métodos e funções. São observadas várias linhas em branco dentro do corpo do `useEffect` de `FinalMapScreen.tsx` (entre blocos de `addSource`, `addLayer` e o `forEach`) e entre as callbacks do hook `useMusicPlayer`.

#### MAJOR-4 — `onAutoplayBlocked` não testado no `MusicLayer`

**Arquivo:** `src/__tests__/public-map/MusicLayer.test.tsx`

**Descrição:** Os testes do `MusicLayer` validam renderização e o clique no botão de desbloqueio, mas não há nenhum teste verificando que o componente passa corretamente o handler de bloqueio ao player do YouTube. Após a correção do CRITICO-1, deve ser criado um teste que confirme que `onAutoplayBlocked` é conectado ao player.

---

### Menores

#### MINOR-1 — `eslint-disable-next-line` usado duas vezes sem justificativa técnica real no `PublicMap.tsx`

**Arquivo:** `src/components/public-map/PublicMap.tsx`, linha 27

**Descrição:** O `useEffect` que adiciona o listener de scroll tem `[]` como dependências e `eslint-disable-next-line react-hooks/exhaustive-deps` para ignorar `playerRef`. Como `playerRef` é uma ref (`useRef`), sua referência de objeto é estável entre renders — não é necessário incluí-la nas deps, e o disable é justificado. Entretanto, o comentário deveria explicar o motivo para futuros leitores. O mesmo vale para `FinalMapScreen.tsx` linha 88.

```tsx
// Prefira comentário explicativo:
// playerRef.current é acessado somente no callback de scroll,
// não é necessário incluir a ref estável nas deps.
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

#### MINOR-2 — `handleShare` executa mutation E consulta (side effects)

**Arquivo:** `src/components/public-map/FinalMapScreen.tsx`, linha 91

**Descrição:** O padrão do projeto pede que funções façam mutação OU consulta, não ambas. `handleShare` consulta `window.location.href` e também escreve no clipboard/dispara share. Para o contexto de handlers de evento React isso é aceitável e comum, mas vale registrar como ponto de atenção. Impacto real é baixo.

#### MINOR-3 — `FinalMapScreen.test.tsx`: asserção da headline incompleta

**Arquivo:** `src/__tests__/public-map/FinalMapScreen.test.tsx`, linha 13

**Descrição:** O teste verifica que o `<h2>` contém `"Esse é o nosso"` e que `"mapa do amor"` está no documento, mas não verifica que o texto completo está dentro do mesmo heading. Conforme os padrões de testes, as expectativas devem ser consistentes e completas.

```tsx
// Sugestão de asserção mais robusta:
const heading = screen.getByRole('heading', { level: 2 });
expect(heading).toHaveTextContent('Esse é o nosso mapa do amor.');
```

#### MINOR-4 — `autoplay: 0` nos `playerVars` do YouTube

**Arquivo:** `src/components/public-map/MusicLayer.tsx`, linha 25

**Descrição:** O `autoplay` está configurado como `0` (desativado). A intenção da tarefa é que o player não dispare autoplay imediatamente — correto. O início da música é feito pelo scroll listener em `PublicMap`. Porém, com `autoplay: 0`, o YouTube nunca tentará reproduzir automaticamente e, portanto, o `onError`/`onAutoplayBlocked` também não seria disparado de forma espontânea. A lógica de bloqueio só faria sentido com `autoplay: 1`. Após resolver o CRITICO-1, deve-se avaliar se `autoplay: 1` é a configuração correta para que o browser bloqueie e o handler seja chamado.

---

## Positivos

- Separação de responsabilidades excelente: `useMusicPlayer` encapsula toda a lógica de estado do player, `MusicLayer` cuida apenas da renderização, `FinalMapScreen` cuida apenas do mapa final. Cada arquivo tem uma responsabilidade clara.
- O hook `useMusicPlayer` utiliza `useCallback` corretamente para todas as funções retornadas, evitando re-renderizações desnecessárias.
- A estratégia de iniciar a música no primeiro scroll via `{ once: true }` é elegante e contorna o bloqueio de autoplay dos browsers de forma idiomatica.
- `FinalMapScreen` faz o cleanup do mapa no `useEffect` return (`mapRef.current?.remove()`), evitando memory leaks.
- Uso de `LngLatBounds` + `fitBounds` para ajustar o zoom automaticamente a todos os pins é correto e segue a especificação da tarefa.
- Testes do `useMusicPlayer` são exemplares: seguem o padrão AAA, são independentes, cobrem os 5 cenários solicitados (estado inicial, bloqueio, desbloqueio, loop ativo, loop inativo).
- A lógica de label do botão de compartilhamento com detecção de `typeof navigator.share === 'function'` é robusta para SSR/jsdom.
- O mock `react-youtube-mock.tsx` é minimal e correto, expondo `data-testid="youtube-player"` para asserções de presença.
- Todos os 279 testes da suíte passam. TypeScript compila sem erros (`tsc --noEmit`).
- `youtubeLoop: boolean | null` adicionado ao tipo `MapApiResponse` de forma consistente com os outros campos opcionais já existentes.

## Standards Compliance

| Standard | Status |
|----------|--------|
| Code Standards | Observações |
| TypeScript/Node.js | OK |
| REST/HTTP | N/A |
| Logging | N/A |
| React | Observações |
| Tests | Observações |

## Recommendations

1. **(CRITICO) Conectar `onAutoplayBlocked` ao `<YouTube>` em `MusicLayer`** — adicionar a prop ao componente e passar o callback para `onError` do player. Sem isso, o overlay "Tocar música" nunca aparece automaticamente. Ao fazer isso, reavalie se `autoplay: 1` é necessário (MINOR-4).
2. **(MAJOR) Remover o import de `Polaroid`** em `FinalMapScreen.tsx` — é código morto e cria ruído.
3. **(MAJOR) Extrair a constante `COPY_FEEDBACK_DURATION_MS = 2000`** no escopo do arquivo para eliminar o magic number.
4. **(MAJOR) Remover linhas em branco dentro dos corpos de funções** em `FinalMapScreen.tsx` e `use-music-player.ts`, conforme padrão do projeto.
5. **(MAJOR) Adicionar teste para o wiring de `onAutoplayBlocked`** em `MusicLayer.test.tsx` após a correção do item 1.
6. **(MINOR) Adicionar comentário explicativo** nos dois `eslint-disable-next-line react-hooks/exhaustive-deps` para documentar por que o disable é justificado.
7. **(MINOR) Fortalecer asserção da headline** em `FinalMapScreen.test.tsx` para verificar o texto completo no `<h2>`.

## Verdict

O código está bem estruturado, os tipos estão corretos, a cobertura de testes é adequada para os cenários especificados e toda a suíte passa. Contudo, o bug de wiring do `onAutoplayBlocked` (CRITICO-1) torna o critério de sucesso "Se autoplay bloqueado, overlay de 'Tocar música' aparece" inatingível em produção. As demais pendências são correções rápidas de padrões (import morto, magic number, linhas em branco) que não afetam a funcionalidade mas devem ser corrigidas antes do merge.

**Ação requerida:** corrigir CRITICO-1 e MAJOR-1/2/3/4, e então a tarefa estará pronta para merge.
