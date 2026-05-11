# Review: Task 2.0 - Design system e componentes UI base

**Reviewer**: AI Code Reviewer
**Date**: 2026-05-11
**Task file**: 2_task.md
**Status**: APPROVED

## Summary

Re-review apos aplicacao das correcoes apontadas no review anterior. Todos os quatro problemas identificados foram resolvidos: testes criados para os cinco componentes que estavam sem cobertura (Field, Card, Eyebrow, Polaroid, CoupleNames), `Eyebrow` migrado de `<div>` para `<span>`, `CoupleNames` com o `not-italic` removido do `<em>` (permitindo italico natural), e `stopPropagation` adicionado no `motion.div` do conteudo do `Modal`. A suite completa passa com 78/78 testes em 13 suites. TypeScript compila sem erros. O codigo esta pronto para producao.

## Files Reviewed

| Arquivo | Status | Issues |
|---------|--------|--------|
| `src/lib/slug.ts` | OK | 0 |
| `src/lib/youtube.ts` | OK | 0 |
| `src/components/ui/Button.tsx` | OK | 0 |
| `src/components/ui/Field.tsx` | OK | 0 |
| `src/components/ui/Input.tsx` | OK | 0 |
| `src/components/ui/Toggle.tsx` | OK | 0 |
| `src/components/ui/Card.tsx` | OK | 0 |
| `src/components/ui/Modal.tsx` | OK | 0 |
| `src/components/ui/Polaroid.tsx` | OK | 0 |
| `src/components/ui/Eyebrow.tsx` | OK | 0 |
| `src/components/ui/CoupleNames.tsx` | OK | 0 |
| `src/__tests__/slug.test.ts` | OK | 0 |
| `src/__tests__/youtube.test.ts` | OK | 0 |
| `src/__tests__/Button.test.tsx` | OK | 0 |
| `src/__tests__/Input.test.tsx` | OK | 0 |
| `src/__tests__/Toggle.test.tsx` | OK | 0 |
| `src/__tests__/Modal.test.tsx` | OK | 0 |
| `src/__tests__/Field.test.tsx` | OK | 0 |
| `src/__tests__/Card.test.tsx` | OK | 0 |
| `src/__tests__/Eyebrow.test.tsx` | OK | 0 |
| `src/__tests__/Polaroid.test.tsx` | OK | 0 |
| `src/__tests__/CoupleNames.test.tsx` | OK | 0 |

## Issues Found

### Criticos

Nenhum problema critico encontrado.

### Principais

Nenhum problema principal encontrado.

### Menores

**[MINOR-1] `slug.ts` — regex de diacriticos usa caracteres Unicode literais invisiveis**

Arquivo: `src/lib/slug.ts`, linha 6

A regex `/[̀-ͯ]/g` usa os codepoints U+0300 e U+036F como caracteres literais invisiveis no codigo-fonte. O comportamento esta correto (range exato do bloco Combining Diacritical Marks), mas a legibilidade e fragilidade de manutencao sao problemas: qualquer editor ou processo de normalizacao de texto pode corromper silenciosamente esses bytes. A alternativa com escapes unicode explicitos e mais robusta.

```typescript
// Atual (invisivel, fragil)
.replace(/[̀-ͯ]/g, '')

// Sugerido (explicito, seguro)
.replace(/[̀-ͯ]/g, '')
```

**[MINOR-2] `Button.test.tsx` — teste do variant `ghost` nao e discriminante**

Arquivo: `src/__tests__/Button.test.tsx`, linhas 37-41

O teste de `ghost` verifica apenas `bg-transparent`, que tambem e verdadeiro para `secondary` e `text`. O teste passa pela razao correta (o componente renderiza corretamente), mas nao distingue o `ghost` dos outros variants. Uma assertion adicional tornaria o teste mais preciso.

```tsx
// Situacao atual
it('should render ghost variant', () => {
  render(<Button variant="ghost">Ghost</Button>);
  const btn = screen.getByText('Ghost');
  expect(btn.className).toContain('bg-transparent');
});

// Sugerido
it('should render ghost variant', () => {
  render(<Button variant="ghost">Ghost</Button>);
  const btn = screen.getByText('Ghost');
  expect(btn.className).toContain('bg-transparent');
  expect(btn.className).not.toContain('border');
  expect(btn.className).not.toContain('shadow');
});
```

**[MINOR-3] `Modal.test.tsx` — ausencia de teste para "clique no conteudo nao fecha o modal"**

Arquivo: `src/__tests__/Modal.test.tsx`

O `stopPropagation` foi adicionado corretamente no `motion.div` do conteudo, mas nao ha um teste que valide esse comportamento. A correcao existe no codigo mas nao esta coberta por teste automatizado — poderia regredir silenciosamente.

```tsx
it('should not call onClose when modal content is clicked', () => {
  const handleClose = jest.fn();
  render(
    <Modal isOpen={true} onClose={handleClose}>
      <div>Modal content</div>
    </Modal>,
  );
  fireEvent.click(screen.getByText('Modal content'));
  expect(handleClose).not.toHaveBeenCalled();
});
```

**[MINOR-4] Aviso `esModuleInterop` do `ts-jest` permanece**

Aviso persistente em todos os 13 test suites: `TS151001: If you have issues related to imports, you should consider setting esModuleInterop to true`. Nao causa falha nem afeta o comportamento dos testes, mas polui o output e indica configuracao incompleta. Adicionar `"esModuleInterop": true` no `tsconfig.json` ou no `tsconfig` especifico do Jest eliminaria o aviso.

## Positivos

- Todos os quatro problemas do review anterior foram corretamente resolvidos.
- Testes para `Field`, `Card`, `Eyebrow`, `Polaroid` e `CoupleNames` foram adicionados com boa qualidade: nomenclatura `should ...`, padrão AAA, independentes entre si, cobrindo os comportamentos mais importantes de cada componente.
- `CoupleNames.test.tsx` cobre o requisito critico da task: verifica que o "e" e renderizado como `<em>` com a classe `text-olm-primary`, inclusive para "E" maiusculo (case-insensitive).
- `Eyebrow` agora usa `<span class="block ...">` — semanticamente correto para texto inline com comportamento de bloco via CSS.
- `CoupleNames` — `<em>` sem `not-italic` renderiza italico naturalmente, alinhando semantica HTML com o design system.
- `Modal` — `stopPropagation` no conteudo impede que cliques internos propaguem para o overlay, comportamento defensivo correto.
- `slug.ts` — logica robusta: NFD normalize, strip diacriticos, lowercase, remove nao-alfanumericos, colapsa hifens. Fallback `"seu-mapa"` para string vazia confirmado em teste.
- `youtube.ts` — array de patterns extensivel. Aceita `watch?v=`, `youtu.be/`, `shorts/` e `embed/` (bonus). ID direto de 11 chars aceito sem URL.
- TypeScript compila sem erros (`tsc --noEmit` limpo).
- Nenhum uso de `any`. Todos os componentes tipados com `interface`.
- Framer Motion corretamente usado em `Button` (`whileTap scale(0.98)`) e `Toggle` (`animate x`).
- Assets de logo presentes: `logo.svg`, `logo-cream.svg`, `logo-wordmark.svg`.

## Conformidade com Padrões

| Padrao | Status |
|--------|--------|
| Code Standards | OK |
| TypeScript/Node.js | OK |
| REST/HTTP | N/A |
| Logging | N/A |
| React | OK |
| Testes | OK |

## Recomendações

1. Trocar a regex de diacriticos em `slug.ts` de caracteres literais invisiveis por `[̀-ͯ]` para melhorar legibilidade e seguranca de manutencao.

2. Adicionar um teste em `Modal.test.tsx` que valide que clicar no conteudo interno do modal NAO aciona `onClose` — o comportamento esta correto no codigo mas nao ha cobertura automatizada para ele.

3. Tornar o teste do variant `ghost` em `Button.test.tsx` mais discriminante, adicionando assertions sobre ausencia de `border` e `shadow`.

4. Adicionar `"esModuleInterop": true` no `tsconfig.json` (ou no tsconfig especifico do Jest) para eliminar o aviso recorrente do `ts-jest`.

## Veredicto

Todos os problemas bloqueantes e principais do review anterior foram corretamente corrigidos. O codigo esta completo, bem testado (78/78) e em conformidade com os padroes do projeto. Os itens restantes sao exclusivamente menores e nenhum deles impede a progressao para a proxima task. Task 2.0 aprovada.
