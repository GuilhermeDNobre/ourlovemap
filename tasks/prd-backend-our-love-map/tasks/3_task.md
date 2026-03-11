# Tarefa 3.0: Utilitários core (slug, token, HMAC)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar os três utilitários core da aplicação: geração de slug a partir do nome do casal, geração de token alfanumérico de acesso e validação da assinatura HMAC-SHA256 do webhook do Mercado Pago. Cada utilitário é puro (sem efeitos colaterais) e totalmente coberto por testes unitários.

<requirements>
- `slug.ts`: converte `couple_name` em kebab-case sem acentos; duplicatas são permitidas
- `token.ts`: gera token alfanumérico (a-z, A-Z, 0-9) com exatamente 5 caracteres usando `crypto.randomBytes`
- `hmac.ts`: valida assinatura HMAC-SHA256 do Mercado Pago usando `crypto.timingSafeEqual`; retorna `false` se qualquer campo estiver ausente
- Nenhum utilitário deve usar `any`
</requirements>

## Subtarefas

- [ ] 3.1 Implementar `src/utils/slug.ts`
  - Recebe `coupleName: string`, retorna `string`
  - Pipeline: trim → normalize NFD → remover diacríticos → lowercase → substituir espaços por `-` → remover caracteres não alfanuméricos (exceto `-`)
  - Exemplo: `"Carol e André"` → `"carol-e-andre"`
- [ ] 3.2 Implementar `src/utils/token.ts`
  - Recebe nenhum parâmetro, retorna `string` de 5 chars
  - Charset: `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789` (62 chars)
  - Usar `crypto.randomBytes` para gerar bytes aleatórios e mapear para o charset via módulo
- [ ] 3.3 Implementar `src/utils/hmac.ts`
  - Exportar função `verifyWebhookSignature({ signature, requestId, dataId }: WebhookSignatureParams): boolean`
  - Extrair `ts` e `v1` do header `x-signature` (formato: `ts=<timestamp>,v1=<hash>`)
  - Template: `` `id:${dataId};request-id:${requestId};ts:${ts};` ``
  - Calcular HMAC-SHA256 com `process.env.MP_WEBHOOK_SECRET`
  - Comparar com `crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))`
  - Retornar `false` se `signature`, `requestId` ou `dataId` estiverem ausentes/nulos
- [ ] 3.4 Escrever testes unitários para `slug.ts`
- [ ] 3.5 Escrever testes unitários para `token.ts`
- [ ] 3.6 Escrever testes unitários para `hmac.ts`

## Detalhes de Implementação

Consultar seção **Lógicas Críticas** da techspec.md para detalhes do algoritmo de cada utilitário.

Referência do algoritmo HMAC do Mercado Pago:
- Header `x-signature`: `ts=1704067200,v1=abc123...`
- Header `x-request-id`: `req-uuid-here`
- Body `data.id`: `payment_id_here`

## Critérios de Sucesso

- `slug("Carol e André")` retorna `"carol-e-andre"`
- `slug("João & Maria!!!")` retorna `"joao--maria"` ou similar sem acentos/especiais
- `generateToken()` sempre retorna string de exatamente 5 caracteres do charset correto
- `verifyWebhookSignature` retorna `true` para assinatura válida e `false` para inválida ou campos ausentes
- Cobertura de testes 100% para os três arquivos

## Testes da Tarefa

- [ ] `test/utils/slug.test.ts`:
  - Nomes com acentos → sem acentos
  - Letras maiúsculas → lowercase
  - Espaços múltiplos → hífens
  - Caracteres especiais → removidos
- [ ] `test/utils/token.test.ts`:
  - Comprimento sempre igual a 5
  - Todos os caracteres pertencem ao charset
  - Duas chamadas consecutivas raramente retornam o mesmo valor (probabilístico)
- [ ] `test/utils/hmac.test.ts`:
  - Assinatura válida → `true`
  - Assinatura adulterada → `false`
  - `signature` ausente → `false`
  - `requestId` ausente → `false`
  - `dataId` ausente → `false`

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/utils/slug.ts`
- `./backend/src/utils/token.ts`
- `./backend/src/utils/hmac.ts`
- `./backend/test/utils/slug.test.ts`
- `./backend/test/utils/token.test.ts`
- `./backend/test/utils/hmac.test.ts`
