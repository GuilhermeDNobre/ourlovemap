# Tarefa 2.0: Banco de dados e plugin Supabase

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Criar as tabelas `maps` e `locations` no Supabase e implementar o plugin Fastify que injeta o client `@supabase/supabase-js` via decorator, disponibilizando-o para todos os serviços e rotas.

<requirements>
- Tabelas `maps` e `locations` criadas conforme schema definido na techspec.md
- Plugin Fastify `supabase-plugin.ts` registra o client Supabase como decorator `fastify.supabase`
- Credenciais lidas de variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)
- Migrations SQL versionadas em `./backend/migrations/`
</requirements>

## Subtarefas

- [ ] 2.1 Criar arquivo `./backend/migrations/001_create_maps.sql` com o schema completo da tabela `maps` (todos os campos da techspec.md, incluindo `payment_id`, `pix_qr_code`, `pix_code`, `payment_expires_at`, `youtube_end_time`)
- [ ] 2.2 Criar arquivo `./backend/migrations/002_create_locations.sql` com o schema completo da tabela `locations` e a foreign key para `maps`
- [ ] 2.3 Executar as migrations no projeto Supabase (via SQL Editor no dashboard ou CLI)
- [ ] 2.4 Criar `src/plugins/supabase-plugin.ts` que inicializa `createClient(url, key)` e registra via `fastify.decorate('supabase', client)`
- [ ] 2.5 Registrar o plugin em `src/app.ts` antes de qualquer rota

## Detalhes de Implementação

Consultar seção **Modelos de Dados** e **Pontos de Integração** da techspec.md para o schema completo das tabelas e as variáveis de ambiente necessárias.

O plugin deve usar `fastify-plugin` (`fp`) para que o decorator `fastify.supabase` seja acessível fora do escopo do plugin.

```typescript
// Exemplo de estrutura do plugin
import fp from 'fastify-plugin'
import { createClient } from '@supabase/supabase-js'

export default fp(async (fastify) => {
  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  fastify.decorate('supabase', client)
})
```

## Critérios de Sucesso

- Tabelas `maps` e `locations` existem no Supabase com todos os campos e constraints corretos
- `fastify.supabase` está disponível em rotas e serviços após o registro do plugin
- `npm run build` compila sem erros após adição do plugin

## Testes da Tarefa

- [ ] Teste de unidade: `supabase-plugin.ts` decora a instância Fastify corretamente (mock do `createClient`)
- [ ] Teste de integração: `buildApp()` inicializa com o plugin registrado sem lançar exceção

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/migrations/001_create_maps.sql`
- `./backend/migrations/002_create_locations.sql`
- `./backend/src/plugins/supabase-plugin.ts`
- `./backend/src/app.ts` (modificado para registrar o plugin)
- `./backend/test/helpers/build-app.ts` (modificado para incluir o plugin)
