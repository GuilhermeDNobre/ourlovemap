# Review: Task 5.0 - Map service (CRUD de mapas e localizacoes)

**Reviewer**: AI Code Reviewer
**Date**: 2026-03-10
**Task file**: 5_task.md
**Status**: APPROVED WITH OBSERVATIONS

---

## Summary

A implementacao do `map-service.ts` esta correta e funcional. Todas as sete funcoes exportadas requeridas pelo PRD foram implementadas, a funcao privada `expireMap` nao e exportada, as interfaces TypeScript estao bem definidas, as constantes de limite de plano estao nomeadas corretamente e sem magic numbers, e o fluxo de expiração automatica em `getMapByToken` esta implementado conforme especificado. Os 10 testes escritos correspondem exatamente aos 10 casos de teste listados na tarefa e todos passam. O `tsc --noEmit` passa sem erros.

Os problemas encontrados sao de natureza menor/media: tres funcoes exportadas publicas (`getMapByPaymentId`, `getPaymentStatus`, `updatePaymentData`) nao possuem testes, o que representa cobertura incompleta. Ha tambem uma violacao de convencao de parametros (funcao com 3 params, sendo um deles um objeto de dados) e um uso de `as` casting extensivo na funcao `toMapRecord` que pode ser considerado fragil. Nenhum problema critico foi encontrado.

---

## Files Reviewed

| Arquivo | Status | Issues |
|---------|--------|--------|
| `backend/src/services/map-service.ts` | Problemas leves | 2 |
| `backend/test/services/map-service.test.ts` | Problemas medios | 1 |

---

## Issues Found

### Criticos

Nenhum problema critico encontrado.

---

### Principais

**[M1] Tres funcoes exportadas sem cobertura de testes**

- Arquivo: `backend/test/services/map-service.test.ts`
- As funcoes `getMapByPaymentId`, `getPaymentStatus` e `updatePaymentData` estao implementadas e exportadas em `map-service.ts` mas nao possuem nenhum teste correspondente no arquivo de testes. A tarefa especifica na secao "Testes da Tarefa" apenas os 10 casos listados (que foram todos implementados), mas o criterio de cobertura de `tests.md` exige cobertura completa do codigo escrito: "Garanta que o codigo que esta sendo escrito esteja totalmente coberto por testes."
- As tres funcoes contem logica de negocio relevante: `getPaymentStatus` retorna o estado do polling de pagamento para o frontend; `getMapByPaymentId` e usada no webhook (caso critico); `updatePaymentData` persiste dados PIX. A ausencia de testes deixa esses caminhos sem verificacao automatizada.
- Correcao recomendada: adicionar ao menos um caso de teste para cada funcao, cobrindo o caminho feliz e o caminho de erro (quando `supabase` retorna `error`).

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
  it('should update payment data fields in database', async () => {
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
});
```

---

### Menores

**[m1] `updatePaymentData` recebe `data` como segundo parametro e `supabase` como terceiro — convencao de injecao de dependencia inconsistente**

- Arquivo: `backend/src/services/map-service.ts`, linha 191
- Todas as outras funcoes do servico recebem `supabase` como segundo parametro (apos o(s) identificador(es) de recurso). `updatePaymentData` recebe `mapId, data, supabase` — coloca o objeto de dados antes da dependencia. Isso nao e um bug, mas quebra a consistencia interna do modulo, dificultando a leitura de quem programa em sequencia. A ordem `(mapId, supabase, data)` seria mais consistente, ou manter `(mapId, data, supabase)` e documentar como padrao para funcoes que aceitam payload.
- Impacto: baixo, mas pode causar confusao na task 7.0 quando as rotas chamarem essas funcoes.

**[m2] `toMapRecord` usa casting `as` para todos os campos sem validacao de tipo em runtime**

- Arquivo: `backend/src/services/map-service.ts`, linha 212
- A funcao aceita `Record<string, unknown>` e faz `as string`, `as number | null`, etc. para cada campo sem nenhuma verificacao. Se o banco retornar um schema diferente do esperado (por exemplo, `relationship_start_date` renomeado numa migration futura), o erro sera silencioso e produzira `undefined` em vez de uma falha explicita.
- Este e um padrao aceitavel para projetos que confiam no contrato do banco, mas e importante ter consciencia do risco. Uma alternativa mais segura seria tipar o retorno do Supabase usando `Database` generics do `@supabase/supabase-js`, o que eliminaria os `as` completamente.
- Nao e exigido pelo escopo desta tarefa, mas e recomendado para o futuro.

**[m3] O teste `activateMap` verifica `token.length === 5` via `String(capturedUpdate.args?.token).toHaveLength(5)` — acoplamento fragil**

- Arquivo: `backend/test/services/map-service.test.ts`, linha 157
- A verificacao usa `String(...)` para garantir que o valor seja string antes de checar o tamanho. Se `capturedUpdate.args?.token` for `undefined` (por exemplo, se o mock de `update` nao capturar corretamente), `String(undefined)` retorna `"undefined"` com comprimento 9, o que faria o teste falhar com mensagem enganosa. Seria mais explicito verificar primeiro que o token nao e nulo:

```typescript
expect(capturedUpdate.args?.token).toBeDefined();
expect(typeof capturedUpdate.args?.token).toBe('string');
expect((capturedUpdate.args?.token as string)).toHaveLength(5);
```

---

## Positivos

- **Sem `any` em nenhuma parte do codigo.** Todas as tipagens usam tipos reais (`SupabaseClient`, `MapRecord`, `Plan`, `MapStatus`, `MapPaymentStatus`, `PaymentData`, `Record<string, unknown>`).
- **`expireMap` corretamente privada.** A funcao nao e exportada, conforme exigido pela task. O comportamento de expirar o mapa localmente (sem re-fetch do banco) em `getMapByToken` e eficiente e correto.
- **Constantes nomeadas sem magic numbers.** `PLAN_LOCATION_LIMITS` e `BASIC_PLAN_EXPIRY_DAYS` eliminam todos os literais numericos do codigo de logica.
- **Tratamento de erros do Supabase consistente.** Todos os oito pontos de chamada ao Supabase verificam `if (error) throw new Error(error.message)`, exatamente conforme exigido pela task.
- **`getMapByToken` retorna o mapa com status `expired` imediatamente** sem precisar de um segundo fetch ao banco — decisao correta que evita uma roundtrip desnecessaria:
  ```typescript
  return toMapRecord({ ...data, status: 'expired' });
  ```
- **`createMap` insere localizacoes em batch** com um unico `supabase.from('locations').insert(locationRows)` em vez de N inserts individuais — decisao correta de performance.
- **Interfaces bem definidas e exportadas.** `CreateMapData`, `MapRecord`, `Location`, `MapPaymentStatus` e `PaymentData` cobrem todos os contratos do servico. O alias `MapRecord` evita conflito com o tipo nativo `Map` do JavaScript.
- **Arquivo segue kebab-case** (`map-service.ts`) e tem 232 linhas — bem abaixo do limite de 300 linhas da `code-standards.md`.
- **Os 10 testes exigidos pela task estao presentes e passam.** O helper `buildBaseMapRow` e `makeBuilder` evitam repeticao de codigo de setup nos testes. A funcao `buildCreateMapData` parametrizada por plano e quantidade de localizacoes facilita testar as combinacoes de limite.
- **`tsc --noEmit` passa sem erros** e todos os 49 testes do projeto passam.

---

## Standards Compliance

| Padrao | Status |
|--------|--------|
| Code Standards | Problemas leves — convencao de ordem de parametros inconsistente em `updatePaymentData` (m1) |
| TypeScript/Node.js | OK — sem `any`, sem `var`, `const` em todo lugar, imports ESM, `tsc` limpo |
| REST/HTTP | N/A — nenhuma rota implementada nesta tarefa |
| Logging | N/A — servico puro sem logging (correto para este nivel de abstracao) |
| React | N/A |
| Testes | Problemas medios — tres funcoes exportadas sem cobertura de testes (M1) |

---

## Recommendations

1. **(Principal — recomendado antes da task 7.0)** Adicionar testes para `getMapByPaymentId`, `getPaymentStatus` e `updatePaymentData`. O codigo dessas funcoes sera exercitado indiretamente pelas rotas e pelo webhook nas tasks 7.0 e 8.0, e bugs nelas seriam muito mais dificeis de diagnosticar sem testes unitarios.

2. **(Menor — opcional)** Considerar padronizar a ordem dos parametros de todas as funcoes do servico para `(identificador, supabase, ...dados)` ou `(identificador, dados, supabase)` — escolher um padrao e mante-lo consistentemente para facilitar leitura e uso do servico.

3. **(Menor — opcional)** No teste de `activateMap`, substituir `String(capturedUpdate.args?.token).toHaveLength(5)` por uma verificacao em duas etapas que primeiro afirma que o token e uma string nao-nula antes de checar o comprimento, para evitar falsos negativos com mensagem enganosa.

4. **(Informacional — longo prazo)** Para projetos que evoluem com migrations frequentes, considerar usar os generics `Database` do `@supabase/supabase-js` para tipar as chamadas ao Supabase. Isso eliminaria todos os casts `as` em `toMapRecord` e produziria erros de compilacao se o schema do banco mudar.

---

## Verdict

A implementacao esta correta e pronta para avanco. A logica de negocio central esta funcionando, os criterios de sucesso da task foram todos atendidos, e os 10 testes obrigatorios passam. O problema principal (M1) — ausencia de testes para tres funcoes exportadas — e recomendado resolver antes da task 7.0, pois essas funcoes serao chamadas pelas rotas e pelo webhook. Os problemas menores podem ser resolvidos oportunisticamente sem bloquear o progresso.
