# Review: Task 9.0 - QR Code da página e email de entrega

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 9_task.md
**Status**: APPROVED WITH OBSERVATIONS

## Summary

A tarefa implementou com sucesso o `qr-code-service.ts` para geração do QR Code da página pública do mapa e o `email-service.ts` para envio do email de entrega via Resend. A integração fire-and-forget no `payment-service.ts` foi realizada corretamente — uma falha no envio de email não propaga exceção para o caller. Todos os 110 testes passam e o TypeScript compila sem erros (`tsc --noEmit` limpo).

O código é funcional, limpo e segue a maioria dos padrões do projeto. Foram encontradas duas questões principais relacionadas à arquitetura do `email-service.ts` (instanciacao do cliente Resend e ausencia de fail-fast para variavel de ambiente obrigatoria) e uma questao menor de legibilidade. Um aspecto de risco arquitetural no `processWebhookEvent` tambem merece atencao.

## Files Reviewed

| File | Status | Issues |
|------|--------|--------|
| `backend/src/services/qr-code-service.ts` | OK | 0 |
| `backend/src/services/email-service.ts` | Issues | 2 |
| `backend/src/services/payment-service.ts` | Issues | 2 |
| `backend/test/services/qr-code-service.test.ts` | OK | 0 |
| `backend/test/services/email-service.test.ts` | Issues | 1 |
| `backend/test/services/payment-service.test.ts` | OK | 0 |

## Issues Found

### Criticos

Nenhum problema critico encontrado.

### Principais

**[MAJOR-1] `email-service.ts` linha 13 — Instancia do `Resend` criada a cada chamada de funcao**

```typescript
// Atual: instancia criada em cada invocacao de sendDeliveryEmail
export async function sendDeliveryEmail(params, email) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? '');
  ...
}
```

Criar `new Resend(...)` dentro da funcao de envio introduz um side-effect de inicializacao de recurso dentro de uma funcao cujo objetivo e fazer uma consulta/envio — violando o principio descrito em `code-standards.md` (funcoes devem fazer mutacao OU consulta, sem efeitos colaterais adicionais). O padrao adotado no restante do projeto e instanciar clientes externos uma unica vez no escopo do modulo:

```typescript
// Sugestao: instanciar uma vez no escopo do modulo
const resend = new Resend(process.env.RESEND_API_KEY ?? '');

export async function sendDeliveryEmail(
  params: SendDeliveryEmailParams,
  email: string,
): Promise<void> {
  const link = `${process.env.OURLOVEMAP_BASE_URL}/access?token=${params.token}`;
  await resend.emails.send({ ... });
}
```

**[MAJOR-2] `email-service.ts` linha 13 — Valor de fallback `''` mascara ausencia de variavel de ambiente obrigatoria**

```typescript
const resend = new Resend(process.env.RESEND_API_KEY ?? '');
```

O operador `?? ''` faz com que a ausencia de `RESEND_API_KEY` resulte em tentativas silenciosas de autenticacao com chave vazia. A falha ocorre apenas no momento do envio (com erro de autenticacao da API externa), em vez de falhar rapidamente (fail-fast) na inicializacao. O comportamento esperado e que a aplicacao nao suba sem as variaveis obrigatorias configuradas:

```typescript
// Sugestao (fail-fast no escopo do modulo):
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) throw new Error('RESEND_API_KEY environment variable is not set');
const resend = new Resend(resendApiKey);
```

O mesmo padrao se aplica a `OURLOVEMAP_BASE_URL` em `qr-code-service.ts` (linha 7) e `email-service.ts` (linha 14): quando ausente, o template literal produz `"undefined/access?token=..."` silenciosamente.

### Menores

**[MINOR-1] `email-service.test.ts` — Ausencia de teste para o campo `from` do email**

Os testes verificam `subject`, `to`, `html` e `attachments`, mas nao verificam o campo `from`. O remetente e um dado literal critico para entregabilidade do email (`'Our Love Map <noreply@ourlovemap.com>'`). Cobri-lo e consistente com a diretriz de "expectativas consistentes" do `tests.md`:

```typescript
it('should send email from the correct sender address', async () => {
  const params: SendDeliveryEmailParams = {
    coupleName: 'Carol e Andre',
    token: 'abc12',
    qrCodeBuffer: Buffer.from('jpg-data'),
  };

  await sendDeliveryEmail(params, 'carol@example.com');

  expect(mockEmailsSend).toHaveBeenCalledWith(
    expect.objectContaining({
      from: 'Our Love Map <noreply@ourlovemap.com>',
    }),
  );
});
```

**[MINOR-2] `payment-service.ts` linha 108 — Linha longa reduz legibilidade**

```typescript
log.error({ mapId: map.id, error: error instanceof Error ? error.message : error }, 'Failed to send delivery email');
```

Extrair o valor do `error` para uma variavel local melhora a legibilidade e respeita a diretriz de declarar variaveis proximo de onde sao usadas:

```typescript
const errorMessage = error instanceof Error ? error.message : error;
log.error({ mapId: map.id, error: errorMessage }, 'Failed to send delivery email');
```

**[MINOR-3] `payment-service.ts` — `processWebhookEvent` ativa o mapa para qualquer webhook recebido sem verificar status do pagamento**

A funcao nao verifica nenhum campo de status no evento recebido (ex.: `paid_amount` vs `amount`). A implementacao assume implicitamente que o webhook so sera disparado para pagamentos aprovados. Se a InfinitePay enviar outros tipos de evento para o mesmo endpoint, o mapa seria ativado indevidamente.

Este ponto depende da documentacao da API da InfinitePay — se o webhook e exclusivo para pagamentos aprovados, o comportamento atual e correto e a decisao deve ser documentada. Se outros status forem possivels, adicionar validacao explicita antes de chamar `activateMap`.

## Positivos

- **`qr-code-service.ts` extremamente coeso**: 10 linhas, responsabilidade unica, sem efeitos colaterais, sem estado global. Aplicacao exemplar do principio de responsabilidade unica.
- **Constante `QR_JPEG_QUALITY = 90`** declarada explicitamente em vez de magic number — cumprimento correto das regras de `code-standards.md`.
- **Padrao fire-and-forget implementado corretamente**: o `try/catch` em `payment-service.ts` absorve falhas tanto de `generateQrCode` quanto de `sendDeliveryEmail`. O `activateMap` ja foi executado antes do bloco, garantindo que a ativacao do mapa nao depende do sucesso do envio de email.
- **Integracao com Sentry**: `Sentry.captureException(error)` adicionado ao bloco de tratamento de falha, garantindo rastreabilidade de erros em producao alem do log estruturado.
- **Cobertura de testes do `payment-service.test.ts`**: cobre idempotencia (mapa ja ativo), mapa nao encontrado, envio correto apos ativacao, falha no email E falha na geracao de QR Code — todos os cenarios criticos do requisito fire-and-forget.
- **Testes do `email-service.test.ts`** cobrem `subject`, `to`, `html` (com nome do casal e link com token) e `attachments` (buffer JPG com nome correto).
- **Sem uso de `any`**: toda a tipagem e explicita. O campo `error` no log e tratado com `error instanceof Error ? error.message : error`.
- **`@types/qrcode` instalado como dev dependency** — correto seguimento das regras do `node.md`.
- **TypeScript compila sem erros** (`tsc --noEmit` limpo). Todos os 110 testes passam.

## Standards Compliance

| Standard | Status |
|----------|--------|
| Code Standards | OK |
| TypeScript/Node.js | Issues |
| REST/HTTP | N/A |
| Logging | OK |
| React | N/A |
| Tests | Issues |

## Recommendations

1. **(Alta prioridade — MAJOR-1)** Mover a instancia do `Resend` para o escopo do modulo em `email-service.ts`, evitando recriacao a cada chamada e eliminando o side-effect de inicializacao de recurso dentro da funcao de envio.

2. **(Alta prioridade — MAJOR-2)** Substituir `process.env.RESEND_API_KEY ?? ''` e `process.env.OURLOVEMAP_BASE_URL` por validacao explicita em tempo de inicializacao (fail-fast). A ausencia de variaveis obrigatorias deve causar erro imediato ao subir a aplicacao, nao falha silenciosa na primeira chamada.

3. **(Baixa prioridade — MINOR-1)** Adicionar teste que verifica o campo `from` do email enviado em `email-service.test.ts` para completar a cobertura das expectativas de envio.

4. **(Baixa prioridade — MINOR-2)** Extrair `error instanceof Error ? error.message : error` para variavel local na linha 108 de `payment-service.ts` para melhorar legibilidade do log.

5. **(Para revisao arquitetural — MINOR-3)** Confirmar com a documentacao da InfinitePay se o webhook e exclusivo para pagamentos aprovados. Se outros status forem possiveis, adicionar validacao antes de chamar `activateMap` e documentar a decisao.

## Verdict

A implementacao esta funcional, o TypeScript compila sem erros e todos os 110 testes passam. Os criterios de sucesso da tarefa (geracao de QR Code, envio de email, fire-and-forget) sao plenamente atendidos. As issues MAJOR-1 e MAJOR-2 sao de arquitetura e robustez — nao causam bugs nos cenarios cobertos pelos testes (o mock do Resend intercepta antes da criacao real do cliente), mas podem resultar em comportamentos imprevistos em producao (falha silenciosa por chave vazia, overhead de inicializacao por chamada).

Recomenda-se enderecar os itens MAJOR antes do deploy em producao. O codigo pode seguir para a proxima tarefa com essas observacoes registradas.
