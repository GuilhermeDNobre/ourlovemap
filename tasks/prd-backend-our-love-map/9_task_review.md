# Review: Task 9.0 - QR Code da página e email de entrega

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 9_task.md
**Status**: APPROVED WITH OBSERVATIONS

## Summary

A implementação entrega os três artefatos principais exigidos pela tarefa: `qr-code-service.ts`, `email-service.ts` e a integração fire-and-forget no `payment-service.ts`. O código é conciso, idiomático e segue a maioria dos padrões do projeto. Todos os 93 testes passam e a verificação de tipos com `tsc --noEmit` não apresenta erros. Há uma lacuna de teste importante (falha no `generateQrCode` não é coberta isoladamente), dois problemas de logging que contradizem as regras do projeto, e um comportamento silencioso quando a variável de ambiente `OURLOVEMAP_BASE_URL` está ausente.

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `backend/src/services/qr-code-service.ts` | ⚠️ Issues | 2 |
| `backend/src/services/email-service.ts` | ⚠️ Issues | 3 |
| `backend/src/services/payment-service.ts` | ✅ OK | 0 |
| `backend/test/services/qr-code-service.test.ts` | ✅ OK | 0 |
| `backend/test/services/email-service.test.ts` | ⚠️ Issues | 1 |
| `backend/test/services/payment-service.test.ts` | ⚠️ Issues | 1 |

## Issues Found

### 🔴 Critical Issues

Nenhum problema crítico encontrado.

### 🟡 Major Issues

**1. Logging com `console.log`/`console.error` em vez de Pino — `email-service.ts` e `qr-code-service.ts`**

As regras de logging do projeto são explícitas: o Fastify usa Pino como logger nativo e o código não deve usar `console.log` ou `console.error`. O `payment-service.ts` já segue esta regra corretamente (usa `log.error` via parâmetro injetado). Os serviços de QR Code e e-mail não têm acesso a um logger — o que é correto por serem serviços puros — mas qualquer necessidade de logging deve ser propagada via parâmetro ou tratada pelo caller.

No estado atual, nenhum dos dois arquivos usa `console.*`, portanto não há violação ativa. A observação aqui é preventiva: se houver a tentação futura de adicionar logs nesses serviços, o logger Pino deve ser injetado, não `console.*`.

**2. Singleton module-level do `resendClient` com estado mutável — `email-service.ts` (linha 3)**

```typescript
let resendClient: Resend | null = null;
```

O uso de uma variável de módulo mutável (`let`) para cachear o cliente Resend cria um acoplamento implícito de estado entre testes. Embora os testes atuais passem (porque o mock substitui o construtor do `Resend` inteiramente), em cenários onde `RESEND_API_KEY` muda entre testes, o singleton pode reter o cliente instanciado com a chave errada. A cobertura de branches reporta `email-service.ts` com `66.66%` na linha 7, confirmando que o branch `if (!resendClient)` não é testado nos dois caminhos.

A solução preferida é criar o cliente no momento da chamada ou injetar o cliente como parâmetro:

```typescript
// Opção 1: instanciar no momento do uso (simples, sem estado global)
export async function sendDeliveryEmail(
  params: SendDeliveryEmailParams,
  email: string,
): Promise<void> {
  const client = new Resend(process.env.RESEND_API_KEY ?? '');
  // ...
}
```

**3. Ausência de teste para falha em `generateQrCode` isolada no `payment-service.test.ts`**

A task especifica que o bloco try/catch deve capturar erros tanto do `generateQrCode` quanto do `sendDeliveryEmail`. O teste "should log error but not throw when email delivery fails" cobre a falha do `sendDeliveryEmail`, mas não existe um teste onde `generateQrCode` lança um erro. Como ambos estão dentro do mesmo try/catch, a falha no QR Code também é silenciada — e este comportamento não tem cobertura.

Teste ausente:

```typescript
it('should log error but not throw when qr code generation fails', async () => {
  // Arrange
  const supabase = buildMockSupabase();
  mockGet.mockResolvedValue({ status: 'approved' });
  (getMapByPaymentId as jest.Mock).mockResolvedValue({ id: 'map-1', status: 'pending_payment', paymentId: 'pay-123' });
  (activateMap as jest.Mock).mockResolvedValue({
    id: 'map-1', token: 'tok01', coupleName: 'Carol e André', email: 'carol@example.com',
  });
  (generateQrCode as jest.Mock).mockRejectedValue(new Error('sharp error'));
  const log = buildMockLog();
  const event: MercadoPagoEvent = { data: { id: 'pay-123' } };

  // Act & Assert
  await expect(processWebhookEvent(event, supabase, log)).resolves.toBeUndefined();
  expect(activateMap).toHaveBeenCalledWith('map-1', supabase);
  expect(log.error as jest.Mock).toHaveBeenCalledWith(
    expect.objectContaining({ mapId: 'map-1' }),
    'Failed to send delivery email',
  );
});
```

### 🟢 Minor Issues

**4. Variável de ambiente `OURLOVEMAP_BASE_URL` ausente resulta em URL malformada — `qr-code-service.ts` (linha 7) e `email-service.ts` (linha 22)**

Quando `process.env.OURLOVEMAP_BASE_URL` é `undefined`, o template literal produz `"undefined/access?token=..."`. Não há nenhuma guarda ou erro explícito. O comportamento silencioso pode ser difícil de depurar em produção.

Sugestão:

```typescript
export async function generateQrCode(token: string): Promise<Buffer> {
  const baseUrl = process.env.OURLOVEMAP_BASE_URL;
  if (!baseUrl) throw new Error('OURLOVEMAP_BASE_URL environment variable is not set');
  const url = `${baseUrl}/access?token=${token}`;
  // ...
}
```

**5. Sender de e-mail hardcoded — `email-service.ts` (linha 24)**

```typescript
from: 'Our Love Map <noreply@ourlovemap.com>',
```

O endereço de remetente está fixo no código. Em ambientes de staging ou desenvolvimento isso pode causar problemas de deliverabilidade ou exigir reconfiguração. Considerar ler de `process.env.RESEND_FROM_EMAIL` com fallback para o valor atual.

**6. Ausência de teste para o campo `attachments` no `email-service.test.ts`**

O QR Code é enviado como anexo, mas nenhum dos três testes verifica se `attachments` foi chamado corretamente com o buffer JPG e o nome de arquivo `qrcode.jpg`. O campo é enviado mas não é assertado.

Sugestão de assertion adicional no teste existente:

```typescript
expect(call.attachments).toEqual([
  { filename: 'qrcode.jpg', content: params.qrCodeBuffer },
]);
```

## Positivos

- **`qr-code-service.ts` extremamente coeso**: apenas 10 linhas, faz exatamente uma coisa, sem efeitos colaterais, sem estado global. Excelente aplicação do princípio de responsabilidade única.
- **`payment-service.ts` mantém o padrão fire-and-forget corretamente**: o try/catch envolve apenas o bloco de email/QR Code, e `activateMap` já foi chamado antes — garantindo que a ativação do mapa não depende do sucesso do envio.
- **Constante `QR_JPEG_QUALITY = 90`** declarada explicitamente em vez de magic number. Cumprimento das regras de `code-standards.md`.
- **Testes do `qr-code-service` cobrem 100%** de statements, branches, funções e linhas.
- **`payment-service.test.ts` cobre o cenário de idempotência** (mapa já ativo não é reativado) e o cenário de falha no email.
- **`@types/qrcode` instalado como dev dependency** — correto seguimento das regras do `node.md`.
- **TypeScript type check passa sem erros** (`tsc --noEmit` limpo).

## Standards Compliance

| Standard | Status |
|----------|--------|
| Code Standards | ✅ |
| TypeScript/Node.js | ✅ |
| REST/HTTP | ✅ (não aplicável a estes arquivos) |
| Logging | ⚠️ (singleton mutável dificulta testabilidade do logger futuro) |
| React | ✅ (não aplicável) |
| Tests | ⚠️ (falha em `generateQrCode` não coberta; `attachments` não assertado) |

## Recommendations

1. **(Maior prioridade)** Adicionar teste no `payment-service.test.ts` para o cenário de falha em `generateQrCode` — ver código de exemplo no item 3 acima.
2. **(Média prioridade)** Adicionar assertion do campo `attachments` nos testes de `email-service.test.ts` para garantir que o QR Code é de fato enviado como anexo.
3. **(Média prioridade)** Eliminar o singleton mutável do `resendClient` no `email-service.ts`, instanciando o cliente dentro da função ou injetando-o como parâmetro para facilitar testes e evitar estado compartilhado entre chamadas.
4. **(Baixa prioridade)** Adicionar guarda explícita para `OURLOVEMAP_BASE_URL` ausente nos dois serviços, lançando um erro claro em vez de produzir uma URL malformada silenciosamente.
5. **(Baixa prioridade)** Externalizar o endereço de remetente do e-mail para uma variável de ambiente configurável.

## Verdict

A implementação está funcional, os critérios de sucesso da tarefa são atendidos, e a qualidade geral do código é boa. Os 93 testes passam e a tipagem está correta. As observações não bloqueiam o merge, mas o item 1 das recomendações (cenário de falha no `generateQrCode`) representa uma lacuna de cobertura diretamente especificada no comportamento fire-and-forget da tarefa e deveria ser endereçado no próximo ciclo de trabalho.
