# Tarefa 8.0: Página pública — FinalMapScreen e Player de música

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

Implementar a segunda metade da página pública (`/acesso?token=<token>`): `FinalMapScreen` com MapLibre interativo mostrando todos os lugares como pins com polaroides flutuantes e rota coral dashed, player de música invisível via `react-youtube` com lógica de autoplay bloqueado, botão de compartilhamento via Web Share API (mobile) ou copy-link (desktop), e link de retorno ao topo. Referência visual: abrir `design_handoff_our_love_map/design_files/ui_kits/public_map/FinalMap.jsx`.

## Subtarefas

- [ ] 8.1 Criar `src/hooks/use-music-player.ts` — hook que encapsula o player do YouTube:
  - Aceita `videoId: string | undefined`, `startTime: number`, `endTime: number`, `loop: boolean`
  - Retorna `{ playerRef, isBlocked, unblock }` onde `isBlocked` indica que o autoplay foi bloqueado pelo browser
  - Gerencia o estado interno do player: `playing`, `blocked`
  - Ao receber `onAutoplayBlocked` do `react-youtube`: seta `isBlocked = true`
  - `unblock()` chama `playerRef.current.playVideo()` e seta `isBlocked = false`
  - Configura `start` e `end` via `playerVars`; loop via `onEnd` → `seekTo(startTime)` + `playVideo()`
- [ ] 8.2 Criar `src/components/public-map/MusicLayer.tsx` — camada de música global da página pública:
  - Renderiza `<YouTube>` com `className="sr-only"` (visualmente oculto, acessível para screen readers)
  - Quando `isBlocked`: exibe overlay fixo de baixo da tela com botão "▶ Tocar música" em coral — ao clicar, chama `unblock()` e remove o overlay
  - Só renderiza se `videoId` existir nos dados do mapa
  - Player deve iniciar automaticamente ao primeiro scroll (`onStateChange` detecta quando scroll começa)
- [ ] 8.3 Criar `src/components/public-map/FinalMapScreen.tsx` — tela final da página pública:
  - MapLibre GL JS interativo (ao contrário do `PlaceSection`, este mapa é clicável) com dark style Maptiler
  - Todos os places como `maplibregl.Marker` com elemento DOM SVG coral (pin customizado idêntico ao do PlaceSection)
  - Rota entre os places como `GeoJSON LineString` adicionada via `map.addSource` + `map.addLayer` com `line-dasharray: [2, 3]` e cor coral
  - Polaroides flutuando sobre cada pin via `maplibregl.Popup` (sem seta, customizado com DOM), com rotação aleatória fixa por index (`[-4, 3, -2, 5, -3, 4][index % 6]` graus)
  - Canto superior: headline "Esse é o nosso mapa do amor." em serif cream
  - CTA de compartilhamento: detectar `navigator.share` — se disponível (mobile): chamar `navigator.share({ title, text, url })` com a URL atual; se não disponível (desktop): copiar URL para clipboard com `navigator.clipboard.writeText` + feedback visual "Link copiado!"
  - Link "Voltar ao começo ↑" como âncora para o topo da página (`href="#top"`)
  - Cleanup: `map.remove()` no `useEffect` cleanup
- [ ] 8.4 Atualizar `src/components/public-map/PublicMap.tsx` para incluir:
  - `<MusicLayer>` como primeiro filho (fora do scroll, persiste durante toda a navegação)
  - `<FinalMapScreen>` após o último `TravelTransition` (não há `TravelTransition` depois da última `PlaceSection`, mas há uma antes do `FinalMapScreen` — ajustar a lógica de renderização)
  - Passar `locations`, `youtubeVideoId`, `youtubeStartTime`, `youtubeEndTime`, `youtubeLoop` para os componentes corretos

## Detalhes de Implementação

Consultar RF-52, RF-56, RF-57 e RF-58 do prd.md, e as seções **Mapa — MapLibre GL JS imperativo** e **YouTube IFrame API** da techspec.md.

**MapLibre rota dashed:** após `map.on('load', ...)`, adicionar:
```ts
map.addSource('route', {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: locations.map(l => [l.longitude, l.latitude]),
    },
  },
});
map.addLayer({
  id: 'route',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#E8634A',
    'line-width': 2,
    'line-dasharray': [2, 3],
  },
});
```

**Polaroides como Popup customizado:** criar elemento DOM para cada polaroid e passar para `new maplibregl.Popup({ closeButton: false, closeOnClick: false, anchor: 'bottom' }).setDOMContent(el)`. Chamar `popup.addTo(map)` e vincular ao mesmo latlng do marker. O elemento DOM deve conter a foto (ou gradiente placeholder) com `transform: rotate(Xdeg)` e `box-shadow: var(--sh-lg)`.

**Iniciar música no primeiro scroll:** no `PublicMap.tsx`, adicionar listener `{ once: true }` no `window` para o evento `scroll` — dentro do callback chamar `playerRef.current?.playVideo()`. Isso contorna o bloqueio de autoplay porque ocorre após gesto do usuário.

**Web Share API fallback:** sempre verificar `typeof navigator.share === 'function'` antes de chamar. O botão deve ter dois labels: "Compartilhar no Instagram" (mobile com share) e "Copiar link" (desktop).

**FinalMapScreen bounds:** ao inicializar o mapa, usar `map.fitBounds(bounds, { padding: 60, maxZoom: 14 })` onde `bounds` é construído com `new maplibregl.LngLatBounds()` + `bounds.extend([lon, lat])` para cada localização — garante que todos os pins sejam visíveis.

## Critérios de Sucesso

- `FinalMapScreen` exibe mapa interativo real com todos os pins
- Rota coral dashed conecta os lugares na ordem correta
- Polaroides aparecem flutuando sobre os pins com rotações distintas
- Player de música toca automaticamente após o primeiro scroll
- Se autoplay bloqueado, overlay de "Tocar música" aparece
- Clicar no overlay inicia a música e remove o overlay
- Música continua durante todo o scroll (persiste entre seções)
- Botão de compartilhar chama Web Share API no mobile
- Botão de compartilhar copia o link no desktop com feedback "Link copiado!"
- Link "Voltar ao começo ↑" retorna ao topo da página
- Página não tem Navbar nem Footer

## Testes da Tarefa

- [ ] Testes unitários `use-music-player`: `isBlocked` inicia como `false`, `isBlocked` vira `true` ao chamar `onAutoplayBlocked`, `unblock()` chama `playVideo` e seta `isBlocked = false`, loop chama `seekTo` + `playVideo` ao `onEnd`
- [ ] Testes de renderização `MusicLayer`: renderiza nulo quando não há `videoId`, renderiza YouTube oculto quando `videoId` existe, overlay "Tocar música" visível quando `isBlocked = true`, overlay some ao clicar no botão
- [ ] Testes de renderização `FinalMapScreen`: renderiza headline "Esse é o nosso mapa do amor.", renderiza botão de compartilhamento, chama `navigator.share` quando disponível, chama `navigator.clipboard.writeText` quando `navigator.share` indisponível, feedback "Link copiado!" aparece após copiar
- [ ] Testes de renderização `PublicMap` (completo, MSW): exibe `MusicLayer` + `CoverScreen` + `PlaceSection` + `TravelTransition` + `FinalMapScreen` em resposta 200 com dados completos

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `frontend/src/hooks/use-music-player.ts`
- `frontend/src/components/public-map/MusicLayer.tsx`
- `frontend/src/components/public-map/FinalMapScreen.tsx`
- `frontend/src/components/public-map/PublicMap.tsx` (atualização)
