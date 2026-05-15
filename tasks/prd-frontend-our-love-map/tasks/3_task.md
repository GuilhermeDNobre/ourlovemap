# Tarefa 3.0: Landing Page

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

Implementar a Landing Page completa (`/`) com todas as seções de marketing. O objetivo desta página é converter visitantes em compradores. Ela deve ser fiel ao design do handoff em `design_handoff_our_love_map/design_files/ui_kits/landing_wizard/` e responsiva a partir de 768px. Referência visual: abrir `design_handoff_our_love_map/design_files/ui_kits/landing_wizard/index.html` no browser para ver o protótipo funcionando.

## Subtarefas

- [ ] 3.1 Criar `src/components/landing/Navbar.tsx` — sticky com logo + links âncora (Como funciona, Funcionalidades, Preços, FAQ) + CTA "Criar nosso mapa". Ao scroll > 12px: `backdrop-filter: blur(14px)` + borda inferior. CTA navega para `/criar`
- [ ] 3.2 Criar `src/components/landing/DarkMockup.tsx` — mockup de celular dark reutilizável com SVG de mapa decorativo, pins coral, rota dashed e polaroide. Usado no Hero e no PreviewExperience
- [ ] 3.3 Criar `src/components/landing/Hero.tsx` — layout 2 colunas: esquerda com headline (serif, "e" em coral), subtítulo, CTAs e prova social; direita com `DarkMockup`. Abaixo de 768px: single-column, mockup abaixo do texto
- [ ] 3.4 Criar `src/components/landing/HowItWorks.tsx` — 3 passos ilustrados com ícone, número e seta decorativa entre eles. Fundo branco
- [ ] 3.5 Criar `src/components/landing/PreviewExperience.tsx` — 2 colunas: esquerda com `DarkMockup` maior, direita com headline + lista de features com checkmarks. Fundo cream
- [ ] 3.6 Criar `src/components/landing/UseCases.tsx` — grid de 4 cards com ícone, título e descrição. Hover: `translateY(-4px)` + sombra. Abaixo de 768px: grid 2 colunas
- [ ] 3.7 Criar `src/components/landing/BentoFeatures.tsx` — grid bento 4 colunas com tiles de diferentes tamanhos: mapa interativo (dark, 2x2), polaroides (2x1), YouTube, contador (dark), Instagram share, QR Code. Abaixo de 768px: grid 2 colunas
- [ ] 3.8 Criar `src/components/landing/Pricing.tsx` — 2 cards de plano: Basic (R$19,90, 3 localizações, 7 dias) e Premium (R$29,90, 7 localizações, sem expiração, destaque com borda lavender). Cada CTA navega para `/criar?plano=basic` ou `/criar?plano=premium`. Abaixo de 768px: single-column
- [ ] 3.9 Criar `src/components/landing/FAQ.tsx` — accordion com 5 perguntas. Cada item abre/fecha com animação de `maxHeight`. Ícone `+` rotaciona 45° ao abrir
- [ ] 3.10 Criar `src/components/landing/FinalCTA.tsx` — seção com gradiente dark (título → near-black), headline serif, subtítulo e botão CTA
- [ ] 3.11 Criar `src/components/landing/Footer.tsx` — logo + links legais (Termos, Privacidade, Contato, Instagram) + crédito. Fundo `--olm-dark`
- [ ] 3.12 Criar `src/pages/Landing.tsx` compondo todos os componentes na ordem correta

## Detalhes de Implementação

Consultar RF-01 a RF-11 do prd.md e os arquivos de referência:
- `design_handoff_our_love_map/design_files/ui_kits/landing_wizard/Hero.jsx`
- `design_handoff_our_love_map/design_files/ui_kits/landing_wizard/LandingSections.jsx`
- `design_handoff_our_love_map/design_files/ui_kits/landing_wizard/LandingBottom.jsx`

A `Navbar` deve usar `useEffect` com listener de `scroll` para detectar a posição e aplicar o blur. O scroll state deve ser local ao componente (`useState`).

Os CTAs de plano no `Pricing` devem usar `useNavigate` do React Router com `navigate('/criar?plano=premium')` para que o `WizardPage` possa ler o query param e pré-selecionar o plano.

Ícones Lucide: `ArrowRight`, `Check`, `MapPin`, `Camera`, `Music`, `Calendar`, `QrCode`. Stroke width: `1.75`.

## Critérios de Sucesso

- Página renderiza sem erros em desktop e mobile
- Navbar aplica blur ao rolar e volta ao normal ao subir
- Links âncora funcionam (smooth scroll para as seções)
- CTA "Criar nosso mapa" (Basic) navega para `/criar?plano=basic`
- CTA Premium navega para `/criar?plano=premium`
- Accordion do FAQ abre e fecha corretamente
- Cards do UseCases têm hover com elevação
- Layout responsivo correto em 768px (single-column no Hero e Pricing)

## Testes da Tarefa

- [ ] Teste de renderização `Navbar`: renderiza logo e links, aplica classe de blur após scroll simulado
- [ ] Teste de renderização `FAQ`: item abre ao clicar no botão, fecha ao clicar novamente, apenas um item abre por vez
- [ ] Teste de renderização `Pricing`: botão Basic navega para `/criar?plano=basic`, botão Premium navega para `/criar?plano=premium`
- [ ] Teste de renderização `Landing`: todos os componentes renderizam sem erros (smoke test)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `frontend/src/pages/Landing.tsx`
- `frontend/src/components/landing/Navbar.tsx`
- `frontend/src/components/landing/DarkMockup.tsx`
- `frontend/src/components/landing/Hero.tsx`
- `frontend/src/components/landing/HowItWorks.tsx`
- `frontend/src/components/landing/PreviewExperience.tsx`
- `frontend/src/components/landing/UseCases.tsx`
- `frontend/src/components/landing/BentoFeatures.tsx`
- `frontend/src/components/landing/Pricing.tsx`
- `frontend/src/components/landing/FAQ.tsx`
- `frontend/src/components/landing/FinalCTA.tsx`
- `frontend/src/components/landing/Footer.tsx`
