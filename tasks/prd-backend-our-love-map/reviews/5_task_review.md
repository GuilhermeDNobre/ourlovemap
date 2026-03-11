# Review: Task 5.0 - Map service (CRUD de mapas e localizacoes)

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 5_task.md
**Status**: APPROVED WITH OBSERVATIONS

---

## Resumo

A implementacao do `map-service.ts` esta correta e funcional. Todas as sete funcoes exportadas requeridas pela task foram implementadas (`createMap`, `activateMap`, `setPaymentFailed`, `getMapByToken`, `getMapByPaymentId`, `getPaymentStatus`, `updatePaymentData`), a funcao privada `expireMap` nao e exportada conforme exigido, as interfaces TypeScript estao bem definidas e sem uso de `any`, as constantes de limite de plano sao nomeadas corretamente sem magic numbers, e o fluxo de expiracao automatica em `getMapByToken` esta implementado conforme especificado pela techspec. O `tsc --noEmit` passa sem erros. Todos os 49 testes do projeto passam.

O problema principal e de cobertura de testes: tres das sete funcoes exportadas publicas (`getMapByPaymentId`, `getPaymentStatus`, `updatePaymentData`) nao possuem nenhum caso de teste, deixando as linhas 167-173, 177-183 e 192-201 descobertas (cobertura de funcoes: 70%, cobertura de linhas: 84.31%). Ha tambem um problema de codigo na funcao `createMap` que viola o padrao de linhas em branco dentro de funcoes (`code-standards.md`) e um cast de tipo fragil em `getPaymentStatus`. Nenhum problema critico foi encontrado.

---

## Arquivos Revisados

| Arquivo | Status | Issues |
|---------|--------|--------|
| `backend/src/services/map-service.ts` | Problemas leves | 3 |
| `backend/test/services/map-service.test.ts` | Problema medio | 1 |

---

## Problemas Encontrados

### Criticos

Nenhum problema critico encontrado.

---

### Principais

**[M1] Tres funcoes exportadas sem cobertura de testes**

- Arquivo: `backend/test/services/map-service.test.ts`
- Contexto: As funcoes `getMapByPaymentId` (linhas 167-173), `getPaymentStatus` (linhas 177-183) e `updatePaymentData` (linhas 192-201) estao implementadas e exportadas em `map-service.ts` mas nao possuem nenhum teste correspondente. O relatorio de cobertura confirma: funcoes com 70% de cobertura e linhas 167-173, 177-183, 192-201 descobertas.
- Impacto: O criterio de cobertura de `tests.md` exige cobertura completa do codigo escrito. Adicionalmente, `getMapByPaymentId` e chamada pelo webhook (task 8.0), `getPaymentStatus` e usada pelo polling do frontend (task 10.0) e `updatePaymentData` persiste dados PIX criticos. Bugs nessas funcoes seriam detectados somente nos testes de integracao das tasks futuras.
- Correcao recomendada: adicionar ao menos dois casos de teste por funcao (caminho feliz + erro do Supabase):

```typescript
describe('getMapByPaymentId', () => {
  it('should return map for valid payment id', async () => {
    const mapRow = buildBaseMapRow({ payment_id: 'pay-123', status: 'active' });
    const supabase = {
      from: jest.fn().mockImplementation(() => makeBuilder({ data: mapRow, error: null })),
    } as unknown as SupabaseClient;

    const result = await getMapByPaymentId('pay-123', supabase);

    expect(result).not.toBeNull();
    expect(result?.paymentId).toBe('pay-123');
  });

  it('should return null when payment id does not exist', async () => {
    const supabase = {
      from: jest.fn().mockImplementation(() =>
        makeBuilder({ data: null, error: { message: 'No rows found' } }),
      ),
    } as unknown as SupabaseClient;

    const result = await getMapByPaymentId('nonexistent', supabase);

    expect(result).toBeNull();
  });
});

describe('getPaymentStatus', () => {
  it('should return payment status fields for existing map', async () => {
    const supabase = {
      from: jest.fn().mockImplementation(() =>
        makeBuilder({
          data: {
            status: 'pending_payment',
            pix_qr_code: 'qr-data',
            pix_code: 'pix-123',
            payment_expires_at: '2026-03-11T00:00:00Z',
          },
          error: null,
        }),
      ),
    } as unknown as SupabaseClient;

    const result = await getPaymentStatus('map-1', supabase);

    expect(result.status).toBe('pending_payment');
    expect(result.pixQrCode).toBe('qr-data');
    expect(result.pixCode).toBe('pix-123');
    expect(result.paymentExpiresAt).toBe('2026-03-11T00:00:00Z');
  });

  it('should throw when supabase returns error', async () => {
    const supabase = {
      from: jest.fn().mockImplementation(() =>
        makeBuilder({ data: null, error: { message: 'DB error' } }),
      ),
    } as unknown as SupabaseClient;

    await expect(getPaymentStatus('map-1', supabase)).rejects.toThrow('DB error');
  });
});

describe('updatePaymentData', () => {
  it('should persist all payment fields to database', async () => {
    const capturedUpdate = { args: null as Record<string, unknown> | null };
    const builder = makeBuilder({ data: null, error: null });
    builder.update.mockImplementation((args: Record<string, unknown>) => {
      capturedUpdate.args = args;
      return builder;
    });
    const supabase = {
      from: jest.fn().mockImplementation(() => builder),
    } as unknown as SupabaseClient;
    const expiresAt = new Date('2026-03-11T00:00:00Z');

    await updatePaymentData('map-1', {
      paymentId: 'pay-123',
      pixQrCode: 'qr-data',
      pixCode: 'pix-code',
      paymentExpiresAt: expiresAt,
    }, supabase);

    expect(capturedUpdate.args?.payment_id).toBe('pay-123');
    expect(capturedUpdate.args?.pix_qr_code).toBe('qr-data');
    expect(capturedUpdate.args?.pix_code).toBe('pix-code');
    expect(capturedUpdate.args?.payment_expires_at).toBe(expiresAt.toISOString());
  });

  it('should throw when supabase returns error', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'DB error' } });
    const supabase = {
      from: jest.fn().mockImplementation(() => builder),
    } as unknown as SupabaseClient;

    await expect(
      updatePaymentData('map-1', {
        paymentId: 'pay-123',
        pixQrCode: 'qr',
        pixCode: 'code',
        paymentExpiresAt: new Date(),
      }, supabase),
    ).rejects.toThrow('DB error');
  });
});
```

---

### Menores

**[m1] Linhas em branco dentro da funcao `createMap` violam o padrao de formatacao**

- Arquivo: `backend/src/services/map-service.ts`, linhas 89-117
- Contexto: O `code-standards.md` proibe linhas em branco dentro de metodos e funcoes. A funcao `createMap` tem uma linha em branco entre o bloco `insert` (linhas 89-103) e a declaracao de `locationRows` (linha 105), e outra entre `locationRows` e o insert de locations (linha 115). O trecho abaixo ilustra o problema:

```typescript
// Linha 103: .single();
// Linha 104: [linha em branco]
// Linha 105: const locationRows = data.locations.map(loc => ({
```

- Correcao: remover as linhas em branco entre os blocos, mantendo o codigo continuo dentro da funcao.

**[m2] Cast `as` sem validacao de runtime em `getPaymentStatus` e `toMapRecord`**

- Arquivo: `backend/src/services/map-service.ts`, linhas 183-188 e 212-231
- Contexto: `getPaymentStatus` faz cast direto de `data.status as MapStatus` sem verificar se o valor retornado pelo Supabase pertence a uniao de tipos. Analogamente, `toMapRecord` aceita `Record<string, unknown>` e aplica `as string`, `as number | null`, etc. para cada campo sem validacao. Se uma migration futura renomear uma coluna, o erro sera silencioso e o campo retornara `undefined` sem lancar excecao ou erro de compilacao.
- Este e um padrao aceitavel para projetos que confiam no contrato do banco estabelecido pelas migrations, mas e importante ter consciencia do risco. A alternativa mais robusta seria tipar os retornos do Supabase com os generics `Database` do `@supabase/supabase-js`, o que eliminaria todos os casts e produziria erros de compilacao em caso de incompatibilidade de schema.
- Severidade: baixa para o MVP; o risco aumenta conforme o schema evolui.

**[m3] Verificacao de token fragil no teste `activateMap`**

- Arquivo: `backend/test/services/map-service.test.ts`, linha 157
- Contexto: A verificacao `expect(String(capturedUpdate.args?.token)).toHaveLength(5)` usa `String(...)` para converter o valor antes de checar o tamanho. Se `capturedUpdate.args?.token` for `undefined` (por exemplo, se o mock de `update` nao capturar o argumento corretamente), `String(undefined)` retorna `"undefined"` com comprimento 9, fazendo o teste falhar com mensagem enganosa em vez de indicar claramente que o token nao foi capturado.
- Correcao recomendada:

```typescript
expect(capturedUpdate.args?.token).toBeDefined();
expect(typeof capturedUpdate.args?.token).toBe('string');
expect((capturedUpdate.args?.token as string)).toHaveLength(5);
```

---

## Destaques Positivos

- **Sem `any` em nenhuma parte do codigo.** Todas as tipagens usam tipos reais (`SupabaseClient`, `MapRecord`, `Plan`, `MapStatus`, `MapPaymentStatus`, `PaymentData`, `Record<string, unknown>`). O `tsc --noEmit` passa sem erros.
- **`expireMap` corretamente privada e nao exportada.** Conforme exigido pela task. O comportamento de retornar o mapa com status `expired` diretamente (sem re-fetch do banco) em `getMapByToken` e eficiente e correto: `return toMapRecord({ ...data, status: 'expired' })`.
- **Constantes nomeadas sem magic numbers.** `PLAN_LOCATION_LIMITS` e `BASIC_PLAN_EXPIRY_DAYS` eliminam todos os literais numericos do codigo de logica de negocio.
- **Tratamento de erros do Supabase consistente.** Todos os oito pontos de chamada ao Supabase verificam `if (error) throw new Error(error.message)`, exatamente conforme exigido pela task.
- **`createMap` insere localizacoes em batch** com um unico `supabase.from('locations').insert(locationRows)` em vez de N inserts individuais — decisao correta de performance que evita N roundtrips ao banco.
- **Interfaces bem definidas e exportadas.** `CreateMapData`, `MapRecord`, `Location`, `MapPaymentStatus`, `LocationInput` e `PaymentData` cobrem todos os contratos do servico. O alias `MapRecord` evita conflito com o tipo nativo `Map` do JavaScript.
- **Arquivo segue kebab-case** (`map-service.ts`) e tem 232 linhas — bem abaixo do limite de 300 linhas da `code-standards.md`.
- **Os 10 testes obrigatorios da task estao presentes e passam.** Os helpers `buildBaseMapRow`, `makeBuilder` e `buildCreateMapData` evitam repeticao de codigo de setup nos testes, seguindo boas praticas de legibilidade e manutencao.
- **Todos os 49 testes do projeto passam** e o `tsc --noEmit` nao reporta nenhum erro de tipagem.

---

## Conformidade com Padroes

| Padrao | Status |
|--------|--------|
| Code Standards | Problema leve — linhas em branco dentro de `createMap` (m1) |
| TypeScript/Node.js | OK — sem `any`, sem `var`, `const` em todo lugar, imports ESM, `tsc` limpo |
| REST/HTTP | N/A — nenhuma rota implementada nesta tarefa |
| Logging | N/A — servico puro sem logging (correto para este nivel de abstracao) |
| React | N/A |
| Testes | Problema medio — tres funcoes exportadas sem cobertura de testes (M1); cobertura de funcoes: 70%, linhas: 84.31% |

---

## Recomendacoes

1. **(Principal — recomendado antes da task 7.0)** Adicionar testes para `getMapByPaymentId`, `getPaymentStatus` e `updatePaymentData`. O codigo dessas funcoes sera exercitado pelas rotas e pelo webhook nas tasks 7.0 e 8.0, e bugs nelas seriam muito mais dificeis de diagnosticar sem testes unitarios. Os exemplos de codigo na secao de problemas principais (M1) podem ser usados diretamente.

2. **(Menor — recomendado antes de finalizar a task)** Remover as linhas em branco dentro da funcao `createMap` para conformidade com `code-standards.md`.

3. **(Menor — opcional)** No teste de `activateMap`, substituir `String(capturedUpdate.args?.token).toHaveLength(5)` por uma verificacao em duas etapas: primeiro afirmar que o token e uma string definida, depois checar o comprimento.

4. **(Informacional — longo prazo)** Para projetos que evoluem com migrations frequentes, considerar usar os generics `Database` do `@supabase/supabase-js` para tipar as chamadas ao Supabase. Isso eliminaria todos os casts `as` em `toMapRecord` e `getPaymentStatus` e produziria erros de compilacao se o schema do banco mudar.

---

## Situacao de Conclusao da Task

### O que foi completado

- [x] 5.1 `map-service.ts` com todas as 7 funcoes exportadas requeridas
- [x] 5.2 Todas as interfaces TypeScript: `CreateMapData`, `MapRecord`, `LocationInput`, `Location`, `MapPaymentStatus`, `PaymentData`, `MapStatus`, `Plan`
- [x] 5.3 Testes unitarios — os 10 casos obrigatorios listados na task passam

### O que esta faltando ou incompleto

- [ ] Testes para `getMapByPaymentId`, `getPaymentStatus` e `updatePaymentData` (cobertura de funcoes: 70%, cobertura de linhas: 84.31%)
- [ ] Correcao das linhas em branco dentro de `createMap`

### Proximos passos para finalizar a task

1. Adicionar os testes ausentes para as tres funcoes nao cobertas (exemplos fornecidos acima em M1)
2. Remover as linhas em branco dentro da funcao `createMap` (linhas 103-104 e 114-115 aproximadamente)
3. Executar `npm test` e verificar que a cobertura de funcoes alcanca 100% para `map-service.ts`
4. Executar `npx tsc --noEmit` para confirmar que o TypeScript continua limpo
5. Marcar a task 5.0 como concluida e avancar para a task 6.0 (Payment service)

---

## Veredicto

A implementacao esta substancialmente correta e a logica de negocio central esta funcionando. Os criterios de sucesso da task foram todos atendidos e os 10 testes obrigatorios passam. O problema principal (M1) — ausencia de testes para tres funcoes exportadas — deve ser resolvido antes de avancar para a task 7.0, pois essas funcoes serao chamadas diretamente pelas rotas e pelo webhook. Os problemas menores podem ser corrigidos junto com a adicao dos testes, sem bloquear o progresso.
