# Tarefa 1.0: Setup do projeto backend

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Criar a estrutura inicial do projeto backend dentro de `./backend`, com TypeScript, Fastify, scripts npm e configuração de ambiente. Ao final desta tarefa o servidor deve iniciar sem erros e responder em um healthcheck básico.

<requirements>
- Projeto em `./backend` com `package.json` e `tsconfig.json` próprios
- TypeScript como linguagem, sem JavaScript puro
- Fastify como framework HTTP com logger habilitado
- Estrutura de pastas conforme techspec.md
- Arquivo `.env.example` com todas as variáveis de ambiente necessárias
- Script `npm run dev` para desenvolvimento e `npm run build` para compilação
- Script `npm test` configurado com Jest e ts-jest
- Rota de healthcheck `GET /health` retornando `{ status: "ok" }`
</requirements>

## Subtarefas

- [ ] 1.1 Criar `./backend/package.json` com todas as dependências listadas na techspec.md (produção e dev)
- [ ] 1.2 Criar `./backend/tsconfig.json` com `strict: true`, `module: NodeNext`, `target: ES2022`
- [ ] 1.3 Criar estrutura de pastas: `src/routes/`, `src/services/`, `src/plugins/`, `src/utils/`, `test/helpers/`, `test/routes/`, `test/services/`, `test/utils/`
- [ ] 1.4 Criar `src/app.ts` que instancia e configura o Fastify (logger, error handler global, registro de plugins e rotas)
- [ ] 1.5 Criar `src/server.ts` que importa `app.ts` e inicia o servidor na porta definida em `PORT` (env)
- [ ] 1.6 Criar `GET /health` dentro de `src/routes/health-routes.ts`
- [ ] 1.7 Criar `.env.example` com: `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SENTRY_DSN`, `POSTHOG_API_KEY`, `OURLOVEMAP_BASE_URL`
- [ ] 1.8 Criar `test/helpers/build-app.ts` com a função `buildApp()` que retorna instância Fastify configurada para testes
- [ ] 1.9 Criar `jest.config.ts` com preset `ts-jest` e `testEnvironment: node`

## Detalhes de Implementação

Consultar seção **Arquitetura do Sistema** e **Conformidade com Padrões** da techspec.md.

O `setErrorHandler` global deve ser registrado em `app.ts` e logar o erro com `fastify.log.error` antes de retornar status 500.

## Critérios de Sucesso

- `npm run build` compila sem erros de TypeScript
- `npm run dev` inicia o servidor e `GET /health` retorna `{ "status": "ok" }` com status 200
- `npm test` executa sem falhas (mesmo que ainda sem casos de teste significativos)
- `npx tsc --noEmit` passa sem erros

## Testes da Tarefa

- [ ] Teste de integração: `GET /health` → status 200, body `{ status: "ok" }` usando `buildApp()` + `fastify.inject()`

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/package.json`
- `./backend/tsconfig.json`
- `./backend/jest.config.ts`
- `./backend/.env.example`
- `./backend/src/app.ts`
- `./backend/src/server.ts`
- `./backend/src/routes/health-routes.ts`
- `./backend/test/helpers/build-app.ts`
