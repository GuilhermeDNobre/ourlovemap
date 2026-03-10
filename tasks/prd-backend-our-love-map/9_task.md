# Tarefa 9.0: QR Code da página e email de entrega

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o `qr-code-service.ts` que gera o QR Code da página pública do mapa (diferente do QR Code PIX do pagamento) e o `email-service.ts` que envia o email de entrega com o QR Code ao casal após a aprovação do pagamento. O envio de email deve ser fire-and-forget: uma falha no email não deve bloquear a ativação do mapa.

<requirements>
- QR Code gerado em formato JPG apontando para `https://ourlovemap.com/access?token=<token>`
- URL base lida da variável de ambiente `OURLOVEMAP_BASE_URL`
- Email enviado via Resend com: nome do casal, mensagem afetiva, link de acesso e QR Code como imagem JPG anexa
- Falha no envio de email deve ser logada como `error` mas não deve lançar exceção para o caller
- `qr-code-service` e `email-service` chamados dentro do `payment-service.processWebhookEvent` após ativação bem-sucedida
</requirements>

## Subtarefas

- [x] 9.1 Implementar `src/services/qr-code-service.ts`
  - `generateQrCode(token: string): Promise<Buffer>`
  - Construir URL: `${process.env.OURLOVEMAP_BASE_URL}/access?token=${token}`
  - Gerar PNG com `qrcode.toBuffer(url)`
  - Converter para JPG com `sharp(pngBuffer).jpeg({ quality: 90 }).toBuffer()`
  - Retornar o buffer JPG
- [x] 9.2 Implementar `src/services/email-service.ts`
  - `sendDeliveryEmail({ coupleName, token, qrCodeBuffer }: SendDeliveryEmailParams, email: string): Promise<void>`
  - Construir o link: `${process.env.OURLOVEMAP_BASE_URL}/access?token=${token}`
  - Enviar via Resend com:
    - Subject: `Seu Mapa do Amor está pronto, ${coupleName}! 💌`
    - Body HTML com mensagem afetiva, link clicável e QR Code inline como base64 (`<img src="data:image/jpeg;base64,...">`)
    - Ou anexar o JPG via `attachments` do Resend (preferir se a API suportar)
- [x] 9.3 Integrar `qr-code-service` e `email-service` no `payment-service.processWebhookEvent`:
  - Após `map-service.activateMap`, chamar `generateQrCode` e depois `sendDeliveryEmail`
  - Envolver o bloco de email em try/catch: logar erro mas não relançar
- [x] 9.4 Escrever testes unitários para `qr-code-service.ts` e `email-service.ts`

## Detalhes de Implementação

Consultar seções **Lógicas Críticas** (QR Code), **Pontos de Integração** (Resend, fire-and-forget) e **Decisões Principais** da techspec.md.

O QR Code gerado nesta tarefa é o **QR Code da página pública** (para o casal compartilhar), não o QR Code PIX (que o Mercado Pago já gera automaticamente).

Exemplo de tratamento fire-and-forget no payment-service:
```typescript
try {
  const qrBuffer = await generateQrCode(map.token)
  await sendDeliveryEmail({ coupleName: map.couple_name, token: map.token, qrCodeBuffer: qrBuffer }, map.email)
} catch (error) {
  fastify.log.error({ mapId, error }, 'Failed to send delivery email')
}
```

## Critérios de Sucesso

- `generateQrCode` retorna um Buffer válido em formato JPG (verificável via `sharp(buffer).metadata()`)
- URL embutida no QR Code aponta para `OURLOVEMAP_BASE_URL/access?token=<token>`
- `sendDeliveryEmail` chama Resend com os campos corretos (subject, HTML com nome do casal, link, QR Code)
- Falha no Resend → erro logado, nenhuma exceção propagada para o webhook handler
- `npm test` passa com todos os cenários cobertos

## Testes da Tarefa

- [x] `test/services/qr-code-service.test.ts` (com mock do `qrcode` e `sharp`):
  - `generateQrCode("abc12")` → Buffer retornado
  - URL passada para `qrcode.toBuffer` contém o token correto
  - `sharp` é chamado com o buffer PNG para conversão JPG
- [x] `test/services/email-service.test.ts` (com mock do Resend):
  - `sendDeliveryEmail` chama `resend.emails.send` com subject correto
  - HTML do email contém o `coupleName` e o link com token
- [x] `test/services/payment-service.test.ts` (complementar):
  - `processWebhookEvent` com `approved` → `sendDeliveryEmail` chamado
  - `processWebhookEvent` com `approved` + falha no email → `activateMap` ainda bem-sucedido, erro logado

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/services/qr-code-service.ts`
- `./backend/src/services/email-service.ts`
- `./backend/src/services/payment-service.ts` (modificado para integrar email e QR Code)
- `./backend/test/services/qr-code-service.test.ts`
- `./backend/test/services/email-service.test.ts`
- `./backend/test/services/payment-service.test.ts` (modificado)
