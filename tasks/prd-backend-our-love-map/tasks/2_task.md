# Tarefa 2.0: Banco de dados e plugin MongoDB

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Definir os modelos Mongoose para as coleções `maps` e `locations` e implementar o plugin Fastify que conecta ao MongoDB via mongoose e injeta a conexão via decorator, disponibilizando-o para todos os serviços e rotas.

<requirements>
- Models `Map` e `Location` criados conforme schema definido na techspec.md
- Plugin Fastify `mongodb-plugin.ts` conecta ao MongoDB e registra a conexão como decorator `fastify.mongoose`
- URI de conexão lida da variável de ambiente `MONGODB_URI`
- Plugin encerra a conexão graciosamente ao fechar o servidor
</requirements>

## Subtarefas

- [ ] 2.1 Criar `src/models/map-model.ts` com o schema e model Mongoose completo da coleção `maps` (todos os campos da techspec.md: `coupleName`, `slug`, `email`, `plan`, `relationshipStartDate`, `token`, `status`, `youtubeVideoId`, `youtubeStartTime`, `youtubeEndTime`, `paymentId`, `checkoutUrl`, `expiresAt`, `timestamps: true`)
- [ ] 2.2 Criar `src/models/location-model.ts` com o schema e model Mongoose completo da coleção `locations` e referência para `Map` via `mapId`
- [ ] 2.3 Criar `src/plugins/mongodb-plugin.ts` que conecta via `mongoose.connect(MONGODB_URI)` e registra via `fastify.decorate('mongoose', mongoose)`
- [ ] 2.4 Registrar o plugin em `src/app.ts` antes de qualquer rota
- [ ] 2.5 Adicionar hook `onClose` no plugin para encerrar a conexão com `mongoose.disconnect()`

## Detalhes de Implementação

Consultar seção **Modelos de Dados** e **Pontos de Integração** da techspec.md para o schema completo dos models e as variáveis de ambiente necessárias.

O plugin deve usar `fastify-plugin` (`fp`) para que o decorator `fastify.mongoose` seja acessível fora do escopo do plugin.

```typescript
// Exemplo de estrutura do plugin
import fp from 'fastify-plugin';
import mongoose from 'mongoose';

export default fp(async (fastify) => {
  await mongoose.connect(process.env.MONGODB_URI!);
  fastify.decorate('mongoose', mongoose);
  fastify.addHook('onClose', async () => {
    await mongoose.disconnect();
  });
});
```

Os models devem ser importados diretamente nos serviços — não precisam passar pelo decorator. O decorator serve apenas para garantir que a conexão foi estabelecida antes das rotas serem registradas.

## Critérios de Sucesso

- Models `Map` e `Location` exportam tipos `MapDocument` e `LocationDocument` e os models Mongoose correspondentes
- `fastify.mongoose` está disponível após o registro do plugin
- Conexão é encerrada corretamente ao fechar o servidor
- `npm run build` compila sem erros após adição do plugin

## Testes da Tarefa

- [ ] Teste de unidade: `mongodb-plugin.ts` decora a instância Fastify corretamente (mock de `mongoose.connect`)
- [ ] Teste de integração: `buildApp()` inicializa com o plugin registrado sem lançar exceção (mock do `mongoose.connect`)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `./backend/src/models/map-model.ts`
- `./backend/src/models/location-model.ts`
- `./backend/src/plugins/mongodb-plugin.ts`
- `./backend/src/app.ts` (modificado para registrar o plugin)
- `./backend/test/helpers/build-app.ts` (modificado para incluir o plugin)
