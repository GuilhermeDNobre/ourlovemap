# Tarefa 7.0: Página pública — Cover, PlaceSection e TravelTransition

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

Implementar a primeira metade da página pública (`/acesso?token=<token>`): fetch dos dados do mapa, tela de erro de acesso (401/403), `CoverScreen` com contador ao vivo e pin pulsante, `PlaceSection` com mapa de fundo MapLibre + card de conteúdo animado por scroll, e `TravelTransition` com SVG animado por `pathLength`. A página usa o surface dark (`#25212A`) e não tem nenhum chrome de navegação. Referência visual: abrir `design_handoff_our_love_map/design_files/ui_kits/public_map/index.html`.

## Subtarefas

- [ ] 7.1 Criar `src/hooks/use-map-data.ts` — hook `useQuery` que chama `GET /api/maps/by-token?token=<token>`. Lê o `token` de `useSearchParams`. Configura `retry: false` e `staleTime: Infinity`. Retorna `{ data, isLoading, isError, error }`
- [ ] 7.2 Criar `src/components/public-map/AccessError.tsx` — telas de erro:
  - **401** (token inválido ou ausente): headline "Acesso inválido", subtítulo explicativo, sem CTA
  - **403 com `map_expired`**: headline "Seu acesso expirou", CTA "Fazer upgrade para Premium" que leva para `/`
- [ ] 7.3 Criar `src/components/public-map/CoverScreen.tsx` — seção de viewport completo com:
  - SVG de mapa decorativo de fundo (grid + ruas abstratas + glow radial coral)
  - Logo cream + eyebrow "Um mapa pra você"
  - Headline com `CoupleNames` (nomes com "e" em coral/itálico)
  - Frase de abertura em itálico serif
  - Contador ao vivo `useRelationshipCounter` com anos · meses · dias · HH:MM:SS
  - Pin central pulsante com 3 anéis de `ringPulse` + label "toque pra começar" → link âncora para a primeira `PlaceSection`
  - Seta "role pra baixo" com animação `bob`
- [ ] 7.4 Criar `src/components/public-map/PlaceSection.tsx` — seção de viewport completo por lugar:
  - MapLibre GL JS no fundo (dark style Maptiler) com todos os pins. O pin do lugar ativo: coral brilhante com halo pulsante. Os demais: coral escurecido (opacidade 0.35). Transição suave de opacidade ao mudar o ativo
  - Glow radial coral posicionado nas coordenadas do lugar ativo
  - Card de conteúdo centralizado com `backdropFilter: blur(18px)`, contendo: eyebrow do lugar (ex: "PRIMEIRO ENCONTRO"), nome do lugar em serif, data, `Polaroid` com foto (ou gradiente placeholder), descrição em itálico
  - O card usa Framer Motion: `animate={{ opacity: isActive ? 1 : 0.35, y: isActive ? 0 : 20 }}`
  - Seta "role para continuar" visível apenas quando o lugar está ativo
- [ ] 7.5 Criar `src/hooks/use-active-place.ts` — hook baseado em `react-intersection-observer` (`useInView`) que monitora quais seções estão visíveis e retorna o índice da seção com maior área visível no viewport. Atualiza `activeIndex` conforme o usuário rola
- [ ] 7.6 Criar `src/components/public-map/TravelTransition.tsx` — seção de 90vh entre lugares:
  - Grid decorativo de fundo (SVG com `opacity: 0.35`)
  - `<motion.path>` com `style={{ pathLength: scrollProgress }}` onde `scrollProgress` vem de `useScroll({ target: sectionRef, offset: ["start end", "end start"] })` → `useTransform` para mapear `[0, 1]` em `pathLength`
  - Path fantasma (branco 8% opacidade) sobreposto pelo path animado (coral com `drop-shadow`)
  - Ponto de traveler (`circle`) que segue o progresso do path
  - Texto central em itálico: "de [lugar A] / pra / [lugar B]"
  - 3 variantes de path alternadas entre transições
- [ ] 7.7 Criar `src/components/public-map/PublicMap.tsx` — componente raiz que:
  - Usa `useMapData` para buscar os dados
  - Exibe spinner de carregamento durante o fetch
  - Exibe `AccessError` em caso de 401 ou 403
  - Ordena as localizações pelo campo `order`
  - Renderiza: `CoverScreen` → para cada place: `PlaceSection` + `TravelTransition` (exceto após o último)
  - Passa `activeIndex` para todos os `PlaceSection`
- [ ] 7.8 Criar `src/pages/PublicMapPage.tsx` que renderiza `PublicMap` com `overflow-x: hidden` e sem nenhum elemento de navegação

## Detalhes de Implementação

Consultar RF-50 a RF-55 e RF-58 do prd.md, e as seções **Mapa — MapLibre GL JS imperativo** e **Scroll Animations — Framer Motion** da techspec.md.

**MapLibre no PlaceSection:** instanciar `new maplibregl.Map()` em `useEffect` com `container: containerRef.current`. O mapa deve ter `interactive: false` (não é clicável no PlaceSection — apenas visual). Adicionar os pins como `maplibregl.Marker` com elemento DOM customizado (SVG do pin coral). Ao mudar `activeIndex`, atualizar a opacidade dos markers via `marker.getElement().style.opacity`. Fazer `map.remove()` no cleanup do `useEffect`.

**Style do mapa:** `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${VITE_MAPTILER_API_KEY}`.

**TravelTransition e Framer Motion:** usar `useScroll` com `target: sectionRef` para que a animação seja relativa àquela seção específica, não ao scroll global. Isso garante que cada transição anime independentemente.

**Animações de CSS:** as animações `ringPulse` e `bob` do protótipo devem ser implementadas com Framer Motion (`animate` + `transition: { repeat: Infinity }`) ou com `@keyframes` no Tailwind config (`animation: { 'ring-pulse': '...', bob: '...' }`).

## Critérios de Sucesso

- `GET /api/maps/by-token?token=TOKEN_INVALIDO` exibe tela de acesso inválido
- `GET /api/maps/by-token?token=TOKEN_EXPIRADO` exibe tela de expiração com CTA
- Cover renderiza com contador ao vivo que incrementa os segundos
- Pin pulsante com 3 anéis animados visível no centro da Cover
- PlaceSection com mapa de fundo real (Maptiler dark style)
- Ao rolar, o pin do lugar ativo fica coral brilhante e os demais ficam escurecidos
- Card do lugar aparece/desaparece com Framer Motion ao rolar
- TravelTransition anima o path SVG conforme o scroll (path coral se revela progressivamente)
- Página não tem Navbar nem Footer

## Testes da Tarefa

- [ ] Testes unitários `use-map-data` (MSW): retorna dados corretos em 200, trata 401 com `isError: true`, trata 403 com `error.response.status === 403`
- [ ] Testes de renderização `AccessError`: exibe mensagem correta para 401, exibe CTA de upgrade para 403 expirado
- [ ] Testes de renderização `CoverScreen`: exibe nomes do casal, exibe frase de abertura, contador renderiza sem crash (mock de Date)
- [ ] Testes de renderização `TravelTransition`: renderiza sem crash com cada uma das 3 variantes de path
- [ ] Testes de renderização `PublicMap` (MSW): exibe spinner durante loading, exibe `AccessError` em 401, exibe `CoverScreen` e `PlaceSection` em 200

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `frontend/src/hooks/use-map-data.ts`
- `frontend/src/hooks/use-active-place.ts`
- `frontend/src/components/public-map/AccessError.tsx`
- `frontend/src/components/public-map/CoverScreen.tsx`
- `frontend/src/components/public-map/PlaceSection.tsx`
- `frontend/src/components/public-map/TravelTransition.tsx`
- `frontend/src/components/public-map/PublicMap.tsx`
- `frontend/src/pages/PublicMapPage.tsx`
