# Tech Spec — Frontend Our Love Map

## Visão Geral da Arquitetura

Aplicação SPA React 18 + Vite + TypeScript com três rotas isoladas. Não há layout compartilhado entre elas — cada rota carrega apenas o que precisa. A comunicação com o backend usa Axios (instância centralizada) + TanStack Query para cache, loading/error states e polling. Estado do wizard persiste via Zustand + `persist` middleware no `localStorage`. Deploy em Cloudflare Pages com `_redirects` para SPA routing.

```
src/
├── styles/tokens.css          ← CSS vars do handoff (importado em main.tsx)
├── lib/
│   ├── api.ts                 ← instância Axios com VITE_API_BASE_URL
│   ├── slug.ts                ← slugify(names: string): string
│   └── youtube.ts             ← extractYoutubeId, validateYoutubeUrl
├── stores/
│   └── wizard-store.ts        ← Zustand store com persist
├── hooks/
│   ├── use-relationship-counter.ts
│   ├── use-payment-polling.ts
│   └── use-map-data.ts
├── components/
│   ├── ui/                    ← Button, Input, Toggle, Field, Card, Modal
│   ├── landing/               ← Navbar, Hero, HowItWorks, PreviewExperience,
│   │                             UseCases, BentoFeatures, Pricing, FAQ,
│   │                             FinalCTA, Footer
│   ├── wizard/
│   │   ├── Wizard.tsx
│   │   ├── PlanSelector.tsx
│   │   ├── ProgressDots.tsx
│   │   ├── LivePreview.tsx
│   │   ├── SlugCard.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── PlaceCardEditor.tsx
│   │   └── steps/
│   │       ├── Step1Voces.tsx
│   │       ├── Step2Localizacoes.tsx
│   │       ├── Step3Musica.tsx
│   │       └── Step4Envio.tsx
│   └── public-map/
│       ├── PublicMap.tsx
│       ├── CoverScreen.tsx
│       ├── PlaceSection.tsx
│       ├── TravelTransition.tsx
│       ├── FinalMapScreen.tsx
│       └── Polaroid.tsx
├── pages/
│   ├── Landing.tsx
│   ├── WizardPage.tsx
│   └── PublicMapPage.tsx
└── routes.tsx                 ← React Router v6
```

---

## Decisões Técnicas Chave

### 1. Estado do Wizard — Zustand + persist

`wizard-store.ts` define o store completo com middleware `persist` no `localStorage`. Todos os steps leem e escrevem no mesmo store — não há prop drilling ou Context.

```ts
interface WizardStore {
  plan: 'basic' | 'premium';
  step: number;
  names: string;
  buyerName: string;
  buyerPhone: string;
  startDate: string;
  opening: string;
  places: Place[];
  music: MusicData;
  email: string;
  emailConfirm: string;
  mapId: string | null;
  setPlan: (plan: Plan) => void;
  setStep: (step: number) => void;
  setField: <K extends keyof WizardStore>(key: K, value: WizardStore[K]) => void;
  reset: () => void;
}
```

### 2. Data Fetching — TanStack Query

| Operação | Hook | Config |
|---|---|---|
| Fetch página pública | `useQuery(['map', token])` | `staleTime: Infinity`, `retry: false` |
| Criar mapa | `useMutation` | `onSuccess: (data) => setMapId(data.mapId)` |
| Gerar PIX | `useMutation` | chamado após mapa criado |
| Gerar link cartão | `useMutation` | requer `taxId` no body |
| Polling de status | `useQuery(['payment-status', mapId])` | `refetchInterval: 3000`, parado em `active` / `payment_failed` |

O polling é gerenciado com `refetchInterval: (data) => data?.status === 'pending_payment' ? 3000 : false`.

### 3. Submissão Multipart — FormData manual

`react-hook-form` + Zod validam os campos na UI. Na submissão, o `handleSubmit` constrói um `FormData` imperativo com a notação de colchetes exigida pelo backend:

```ts
places.forEach((place, i) => {
  formData.append(`locations[${i}][title]`, place.title);
  formData.append(`locations[${i}][latitude]`, String(place.latitude));
  formData.append(`locations[${i}][longitude]`, String(place.longitude));
  formData.append(`locations[${i}][order]`, String(i));
  if (place.photo instanceof File) {
    formData.append(`locations[${i}][photo]`, place.photo);
  }
});
```

Axios detecta `FormData` e define `Content-Type: multipart/form-data` automaticamente — nunca setar o header manualmente.

### 4. Mapa — MapLibre GL JS imperativo

Sem wrapper declarativo. `FinalMapScreen` e `PlaceSection` usam `useRef<HTMLDivElement>` para o container e instanciam `new maplibregl.Map()` dentro de `useEffect`. Cleanup faz `map.remove()`. Estilo: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${KEY}`.

Pins em coral são `maplibregl.Marker` com elemento DOM customizado (div com SVG do pin do design). Polaroides sobre os pins no `FinalMapScreen` são sobrepostos via `marker.getElement()` com CSS `position: absolute`.

### 5. Geocoding — @maptiler/geocoding-control/react

Componente oficial com React binding. Usado standalone (sem mapa embutido). `onPick` callback retorna o feature GeoJSON com `geometry.coordinates` e `place_name`. Armazena `latitude`, `longitude` e `address` no `Place` do store.

```tsx
import { GeocodingControl } from '@maptiler/geocoding-control/react';

<GeocodingControl
  apiKey={import.meta.env.VITE_MAPTILER_API_KEY}
  onPick={(feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    updatePlace(index, { latitude: lat, longitude: lng, address: feature.place_name });
  }}
  country="br"
  language="pt"
  minLength={3}
/>
```

### 6. YouTube Player — react-youtube

Instância do player criada no `CoverScreen` e reutilizada via ref passada ao `PublicMap`. Autoplay disparado no primeiro scroll/toque via `player.playVideo()`. Se `onAutoplayBlocked` disparar, exibe overlay com botão "▶ Tocar música".

```tsx
<YouTube
  videoId={youtubeVideoId}
  opts={{ playerVars: { autoplay: 0, start: startTime, end: endTime } }}
  onReady={(e) => playerRef.current = e.target}
/>
```

O `<YouTube />` fica posicionado com `position: absolute; opacity: 0; pointer-events: none` — invisível, mas o áudio toca.

### 7. Scroll Animations — Framer Motion

**TravelTransition:** `useScroll({ target: sectionRef, offset: ["start end", "end start"] })` → `scrollYProgress` → `useTransform([0,1], [pathLength, 0])` → `style={{ pathLength }}` no `<motion.path>`. Framer Motion gerencia `stroke-dashoffset` internamente via `pathLength` (0–1).

**PlaceSection ativa:** `Intersection Observer` via `react-intersection-observer` monitora cada seção. A seção com `inView` e maior área visível é a `activeIndex`. Card usa `<motion.div animate={{ opacity: isActive ? 1 : 0.35, y: isActive ? 0 : 20 }}>`.

### 8. Tailwind + Design Tokens

`tailwind.config.ts` mapeia todos os tokens do `tokens.css` via `var()`:

```ts
colors: {
  'olm-primary': 'var(--olm-primary)',
  'olm-title': 'var(--olm-title)',
  'olm-accent': 'var(--olm-accent)',
  'olm-dark': 'var(--olm-dark)',
  'olm-bg': 'var(--olm-bg)',
  // ...
},
boxShadow: {
  'sm': 'var(--sh-sm)',
  'md': 'var(--sh-md)',
  'lg': 'var(--sh-lg)',
  'glow-primary': 'var(--sh-glow-primary)',
},
borderRadius: {
  'sm': 'var(--r-sm)',
  'md': 'var(--r-md)',
  'lg': 'var(--r-lg)',
  'xl': 'var(--r-xl)',
  'pill': 'var(--r-pill)',
},
fontFamily: {
  serif: 'var(--font-serif)',
  sans: 'var(--font-sans)',
},
transitionTimingFunction: {
  'emphasized': 'var(--ease-emphasized)',
  'standard': 'var(--ease-standard)',
  'soft-spring': 'var(--ease-soft-spring)',
},
```

---

## Modelos de Dados

```ts
type Plan = 'basic' | 'premium';

interface Place {
  id: string;           // uuid gerado no client
  title: string;
  address: string;
  description: string;
  photo: File | null;
  latitude: number;
  longitude: number;
}

interface MusicData {
  videoId: string;
  query: string;
  startTime: number;
  endTime: number;
  loop: boolean;
}

interface MapApiResponse {
  coupleName: string;
  relationshipStartDate: string;
  youtubeVideoId: string | null;
  youtubeStartTime: number | null;
  youtubeEndTime: number | null;
  locations: ApiLocation[];
}

interface ApiLocation {
  title: string;
  description: string | null;
  message: string | null;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  order: number;
}
```

---

## Contratos de API Consumidos

| Método | Endpoint | Body | Resposta |
|---|---|---|---|
| `POST` | `/api/maps` | `multipart/form-data` | `{ mapId }` |
| `POST` | `/api/maps/:id/pix-payment` | — | `{ brCode, brCodeBase64, expiresAt }` |
| `POST` | `/api/maps/:id/card-payment` | `{ taxId }` | `{ checkoutUrl }` |
| `GET` | `/api/maps/:id/payment-status` | — | `{ status, checkoutUrl }` |
| `GET` | `/api/maps/by-token?token=` | — | `MapApiResponse` |

---

## Pontos de Integração e Modos de Falha

| Integração | Modo de falha | Tratamento |
|---|---|---|
| Backend `POST /api/maps` | 400 / 422 | Exibir erro inline no step 4; não abrir modal |
| PIX payment | Timeout / 500 | Mensagem "Erro ao gerar QR Code" + botão de retry |
| Polling status | Network error | `refetchInterval` continua; não exibir erro ao usuário |
| Maptiler Geocoding | API key inválida / quota | Campo de endereço vira texto livre como fallback |
| YouTube Data API | Quota diária esgotada (10.000 req/dia free) | Exibir "Busca indisponível. Cole o link direto." |
| YouTube IFrame | Autoplay bloqueado | Overlay com botão de play manual |
| AbacatePay redirect | `checkoutUrl` inválida | Mensagem + opção de tentar PIX |

---

## Infraestrutura e Deploy

**Cloudflare Pages:**
- Build command: `npm run build`
- Output dir: `dist`
- `public/_redirects`: `/* /index.html 200`
- Variáveis de ambiente configuradas no dashboard: `VITE_API_BASE_URL`, `VITE_MAPTILER_API_KEY`, `VITE_YOUTUBE_API_KEY`
- Fontes self-hosted servidas pelo CDN do Cloudflare (melhor performance que Google Fonts no Brasil)

---

## Estratégia de Testes

**Unitários (Jest + React Testing Library):**
- `slug.ts` — `slugify` com acentos, espaços, casos extremos
- `youtube.ts` — `extractYoutubeId` e `validateYoutubeUrl` com URLs válidas e inválidas
- `use-relationship-counter` — mock de `Date` para verificar cálculo
- `ProgressDots` — render correto dos 4 estados (passado, ativo, futuro, completo)
- `PaymentModal` — render do QR Code, botão "Copiar código", transição para tela de sucesso
- `Step4Envio` — validação de email mismatch ao vivo

**Integração (React Testing Library + MSW):**
- Fluxo completo do wizard: preencher steps 1–4 → submit → mock do POST retorna `mapId` → modal PIX abre
- Polling de pagamento: mock retorna `pending_payment` 2x, depois `active` → modal fecha, tela de sucesso aparece
- Página pública: mock `GET /by-token` retorna data → Cover + PlaceSection + FinalMapScreen renderizados

**Testes E2E:** fora do escopo da v1.

---

## Observabilidade

- Erros de rede em mutações logados no `onError` do TanStack Query com `console.error` estruturado (sem dados sensíveis)
- `PaymentModal` loga `mapId` e `status` ao detectar mudança via polling
- Variáveis de ambiente validadas em `src/lib/env.ts` com `zod` no startup — falha rápida se ausente
- Cloudflare Pages Web Analytics (gratuito, sem cookie banner necessário)

---

## Conformidade com Padrões do Projeto

| Padrão | Aplicação |
|---|---|
| Componentes funcionais (`.tsx`) | Todos os componentes usam função, sem classes |
| Tailwind (sem styled-components) | Estilização 100% via classes Tailwind mapeadas aos tokens |
| `react-hook-form` + `zod` | Validação em todos os inputs do wizard |
| `const` sobre `let` | Stores e utilitários usam `const` |
| Sem `any` | Interfaces tipadas para todos os contratos de API e store |
| Hooks com prefixo `use` | `useRelationshipCounter`, `usePaymentPolling`, `useMapData` |
| Sem comentários óbvios | Apenas WHY não-óbvios (ex: workaround de autoplay) |
| Early returns | Componentes com guards antes do render principal |
