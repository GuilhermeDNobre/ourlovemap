# Review: Task 3.0 - Utilitarios core (slug, token, HMAC)

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-09
**Task file**: 3_task.md
**Status**: APPROVED WITH OBSERVATIONS

## Summary

A tarefa 3.0 implementou tres utilitarios core sem dependencias externas: `generateSlug`, `generateToken` e `verifyWebhookSignature`. Todos os 22 novos testes passam, `npx tsc --noEmit` nao reporta erros de tipagem e a cobertura dos tres arquivos de utilitario e de 96-100%. A implementacao esta correta e alinhada com os requisitos da techspec.

Ha uma observacao de seguranca menor em `token.ts` (vies estatistico no mapeamento byte→charset) e duas observacoes menores de qualidade de teste em `token.test.ts`. Nenhum dos problemas e bloqueante para producao no contexto de um MVP, mas devem ser conhecidos.

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `backend/src/utils/slug.ts` | OK | 0 |
| `backend/src/utils/token.ts` | Issues | 1 |
| `backend/src/utils/hmac.ts` | OK | 0 |
| `backend/test/utils/slug.test.ts` | OK | 0 |
| `backend/test/utils/token.test.ts` | Issues | 2 |
| `backend/test/utils/hmac.test.ts` | OK | 0 |

## Issues Found

### Criticos

Nenhum problema critico encontrado.

### Principais

Nenhum problema principal encontrado.

### Menores

**1. `backend/src/utils/token.ts` linha 9 — vies estatistico no mapeamento byte→charset**

O mapeamento usa `byte % CHARSET.length` onde `CHARSET.length = 62`. Como `crypto.randomBytes` retorna bytes no intervalo `[0, 255]`, e 256 nao e divisivel por 62, os primeiros `256 % 62 = 8` caracteres do charset (`a` ate `h`) aparecem com probabilidade ligeiramente maior (`5/256 ≈ 1.95%`) do que os demais (`4/256 ≈ 1.56%`). Para um token de acesso publico em um MVP, esse vies e negligenciavel — mas para completude, a abordagem padrao e rejeitar bytes que causam o vies (rejection sampling):

```typescript
export function generateToken(): string {
  const LIMIT = 256 - (256 % CHARSET.length); // 248
  const result: string[] = [];
  while (result.length < TOKEN_LENGTH) {
    const bytes = randomBytes(TOKEN_LENGTH * 2);
    for (const byte of bytes) {
      if (result.length < TOKEN_LENGTH && byte < LIMIT) {
        result.push(CHARSET[byte % CHARSET.length]);
      }
    }
  }
  return result.join('');
}
```

**2. `backend/test/utils/token.test.ts` linha 18-24 — teste probabilistico fragil**

O teste "should rarely return the same value on consecutive calls" verifica que tres tokens nao sao todos identicos. Com espaco amostral de 62^5 ≈ 916 milhoes de combinacoes, a probabilidade de falha falsa e astronomicamente baixa, tornando o teste essencialmente uma verificacao tautologica. Isso nao e um bug, mas o teste nao agrega cobertura significativa alem do que os demais ja garantem. O nome `allSame` com a verificacao de igualdade tripla tambem nao e a forma idiomatica de verificar unicidade estatistica.

**3. `backend/test/utils/token.test.ts` linhas 26-31 e 33-40 — testes redundantes**

Os testes "should always return a string of 5 chars across multiple calls" e "should always use only charset characters across multiple calls" executam os mesmos invariantes dos dois primeiros testes (linhas 6-16), repetindo-os 20 vezes em loops `for`. Em Jest, repetir a mesma assertiva N vezes em um unico `it` nao aumenta a confianca de forma significativa — a verificacao de invariante ja e garantida pelo primeiro `it`. Esses dois testes poderiam ser substituidos por uma abordagem de property-based testing ou simplesmente removidos sem reducao de cobertura.

## Destaques Positivos

- **`slug.ts` e impecavel**: o pipeline `trim → normalize NFD → remover diacriticos → lowercase → substituir espacos → remover nao-alfanumericos` esta correto, idiomatico e em exatamente 8 linhas encadeadas. Sem magic strings, sem comentarios desnecessarios.

- **`hmac.ts` trata corretamente o timing attack**: o uso de `timingSafeEqual` com a verificacao de igualdade de tamanho antecipada (`if (expectedBuf.length !== receivedBuf.length) return false`) e a abordagem correta — `timingSafeEqual` lanca excecao se os buffers tiverem tamanhos diferentes, portanto a guarda e necessaria.

- **`hmac.ts` usa `process.env.MP_WEBHOOK_SECRET ?? ''`**: o operador `??` evita que `undefined` seja convertido para a string `"undefined"`, garantindo que um secret ausente resulte em falha de validacao, nao em uma comparacao invalida silenciosa.

- **Tipagem sem `any`**: todos os tres arquivos de implementacao usam tipagem forte. `WebhookSignatureParams` com `string | null | undefined` para cada campo e a representacao correta dos valores que chegam de headers HTTP.

- **Testes do `hmac.test.ts` cobrem null e undefined separadamente**: separar os cenarios `null` e `undefined` para cada um dos tres campos (`signature`, `requestId`, `dataId`) resulta em 6 testes distintos que cobrem todos os caminhos da guarda `if (!signature || !requestId || !dataId)`.

- **`buildSignature` como helper de teste**: a funcao auxiliar em `hmac.test.ts` replica o algoritmo de geracao de assinatura usando a mesma logica do Mercado Pago, tornando os testes de "assinatura valida" e "ts adulterado" precisos e autodocumentados.

- **`slug.test.ts` cobre o caso de entrada vazia e entrada somente de especiais**: os dois ultimos testes garantem que a funcao e robusta para entradas degeneradas, alinhando com o criterio de sucesso da tarefa.

- **Constantes nomeadas em `token.ts`**: `CHARSET` e `TOKEN_LENGTH` eliminam magic strings/numbers e tornam o codigo autoexplicativo.

## Conformidade com Padroes

| Padrao | Status |
|--------|--------|
| Code Standards | OK |
| TypeScript/Node.js | OK |
| REST/HTTP | N/A |
| Logging | N/A |
| React | N/A |
| Tests | Issues (observacoes menores) |

## Recomendacoes

1. **[Menor]** Avaliar substituir `byte % CHARSET.length` por rejection sampling em `token.ts` para eliminar o vies estatistico. Para o contexto de MVP com 62^5 combinacoes, o risco operacional e negligenciavel — mas a correcao e simples e e a pratica padrao para tokens criptograficos.

2. **[Menor]** Remover ou simplificar os dois testes de loop em `token.test.ts` (linhas 26-40). Eles nao aumentam a cobertura e adicionam ruido a suite. O invariante de comprimento e charset ja e verificado nos dois primeiros testes.

3. **[Menor]** Reformular o teste probabilistico (linha 18-24) para algo mais expressivo, como verificar que 100 tokens gerados nao sao todos identicos, ou simplesmente remover — o teste de charset em loop ja implica que a funcao gera valores variaveis.

## Veredicto

A implementacao da tarefa 3.0 esta aprovada com observacoes. Os tres utilitarios estao corretos, idiomaticos, sem uso de `any`, com tipagem forte e totalmente cobertos por testes. Os 22 testes passam e `tsc --noEmit` nao reporta erros. As observacoes sao todas menores: um vies estatistico de baixo impacto em `token.ts` e redundancia de testes em `token.test.ts`. Nenhum deles e bloqueante. O codigo esta apto para ser usado pelas tarefas subsequentes da techspec.
