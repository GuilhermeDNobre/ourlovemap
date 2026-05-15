# Tarefa 5.0: Wizard — Steps 3 e 4 + validação Zod completa

<critical>Ler os arquivos de prd.md e techspec.md desta pasta antes de começar. Se você não ler esses arquivos sua tarefa será invalidada.</critical>

## Visão Geral

Implementar os dois últimos steps do wizard: Step 3 (busca e seleção de música via YouTube Data API) e Step 4 (email com confirmação ao vivo, resumo e seletor final de plano). Ao final desta tarefa, o usuário pode buscar uma música no YouTube ou colar um link, definir o trecho, e confirmar o email antes de finalizar. Toda a validação Zod do wizard deve estar funcionando.

## Subtarefas

- [ ] 5.1 Criar `src/lib/youtube-api.ts` — função `searchYouTube(query: string): Promise<YouTubeResult[]>` que chama a YouTube Data API v3 (`search.list`, parâmetros: `part=snippet`, `type=video`, `maxResults=5`, `key=VITE_YOUTUBE_API_KEY`). Retorna array com `videoId`, `title` e `thumbnailUrl`
- [ ] 5.2 Criar `src/components/wizard/steps/Step3Musica.tsx` com:
  - Campo de busca com ícone de lupa — debounce de 500ms antes de chamar a API
  - Se o valor digitado for uma URL válida do YouTube (`isValidYoutubeUrl`): pular a busca e exibir diretamente o card da faixa com o `videoId` extraído
  - Se for texto livre: chamar `searchYouTube` e exibir lista de resultados (thumbnail + título) para o usuário selecionar
  - Card da faixa selecionada com thumbnail, título e botão de remover
  - Dois sliders: "Início" (0–270s, cor coral via `accent-color`) e "Fim" (start+5 até 272s, cor lavender). Exibir tempo em formato `M:SS`
  - `Toggle` de loop com label "Repetir em loop"
  - Step opcional — botão "Continuar" habilitado mesmo sem música selecionada
- [ ] 5.3 Criar `src/components/wizard/steps/Step4Envio.tsx` com:
  - Banner de aviso: "QR Code e link de edição vão APENAS para esse email" (fundo gradiente coral + lavender a 8% de opacidade)
  - Campo de email (obrigatório, validação de formato)
  - Campo de confirmação de email — borda vermelha + mensagem de erro ao vivo se os valores não coincidem (validação em tempo real via `watch` do react-hook-form, não apenas no submit)
  - Card de resumo com: nomes do casal, número de lugares, plano atual, música (✓ ou —)
  - Seletor final de plano — dois botões (Basic / Premium) que alteram o `plan` no store. Exibir diferenças entre os planos
  - Botão "Finalizar compra" — habilitado apenas se email e confirmação coincidem e são válidos
- [ ] 5.4 Criar `src/lib/wizard-schema.ts` com os schemas Zod para cada step:
  - `step1Schema`: `names` (obrigatório, min 3 chars), `buyerName` (obrigatório), `buyerPhone` (obrigatório), `startDate` (obrigatório, data válida no passado), `opening` (opcional, max 200 chars)
  - `step2Schema`: `places` (array, mínimo 1 item, cada place com `title` obrigatório, `latitude` e `longitude` obrigatórios)
  - `step4Schema`: `email` (obrigatório, formato válido), `emailConfirm` (deve ser igual a `email`)
- [ ] 5.5 Integrar os schemas Zod nos steps via `zodResolver` do `@hookform/resolvers/zod`
- [ ] 5.6 Atualizar `Wizard.tsx` para que o botão "Continuar" de cada step só habilite após a validação Zod do step correspondente passar

## Detalhes de Implementação

Consultar RF-27 a RF-39 do prd.md e a seção **Pontos de Integração e Modos de Falha** da techspec.md.

**YouTube Data API quota:** o free tier tem 10.000 unidades/dia. Uma busca (`search.list`) consome 100 unidades. Implementar debounce de 500ms no campo de busca para evitar chamadas a cada keystroke. Se a API retornar erro 403 (quota esgotada), exibir mensagem: "Busca indisponível. Cole o link direto do YouTube."

**Slider de tempo:** o slider de "Fim" deve ter `min={startTime + 5}`. Atualizar o valor de `endTime` no store ao arrastar. Formatar o tempo como `M:SS`:
```ts
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
```

**Validação ao vivo do email:** usar `watch(['email', 'emailConfirm'])` do react-hook-form para comparar os dois campos em tempo real, sem precisar submeter o formulário.

## Critérios de Sucesso

- Busca por texto retorna resultados reais do YouTube
- Colar URL `https://www.youtube.com/watch?v=dQw4w9WgXcQ` exibe o card da faixa sem chamar a busca
- Colar uma URL inválida exibe mensagem de erro
- Sliders atualizam o tempo exibido em `M:SS` em tempo real
- Slider de "Fim" não permite valor menor que "Início + 5"
- Step 4: borda vermelha e mensagem de erro aparecem imediatamente ao divergir os emails
- Botão "Finalizar compra" fica desabilitado enquanto os emails não coincidem
- Step 3 é opcional: "Continuar" está habilitado sem música

## Testes da Tarefa

- [ ] Testes unitários `youtube-api.ts`: mock do fetch, retorna array de resultados no formato correto, trata erro 403 de quota
- [ ] Testes unitários `wizard-schema.ts`: `step1Schema` rejeita `names` vazio, `step4Schema` rejeita emails divergentes, `step4Schema` rejeita email com formato inválido
- [ ] Testes de renderização `Step3Musica`: URL válida do YouTube mostra card sem chamar busca, texto inválido de URL não dispara busca imediata (debounce), "Continuar" está habilitado sem música
- [ ] Testes de renderização `Step4Envio`: emails divergentes exibem borda vermelha e mensagem, botão "Finalizar compra" desabilitado quando emails divergem, botão "Finalizar compra" habilitado quando emails coincidem e são válidos

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

## Arquivos relevantes

- `frontend/src/lib/youtube-api.ts`
- `frontend/src/lib/wizard-schema.ts`
- `frontend/src/components/wizard/steps/Step3Musica.tsx`
- `frontend/src/components/wizard/steps/Step4Envio.tsx`
- `frontend/src/components/wizard/Wizard.tsx` (atualização)
