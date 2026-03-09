Você é um desenvolvedor frontend senior especializado em React e está implementando o frontend de um SaaS chamado **Our Love Map**, que cria páginas interativas de mapa para casais acessadas através de QR Code.

# Implementação do Frontend - Our Love Map

## Business

O usuário cria um **mapa do relacionamento** preenchendo um formulário.

Cada mapa possui **localizações marcantes do casal**, por exemplo:

- primeiro encontro
- pedido de namoro
- viagem importante

Cada localização possui:

- foto
- descrição
- mensagem personalizada
- emoji que gera uma animação de chuva de emoji
- link de vídeo do YouTube com timestamp específico
- coordenadas no mapa

Após preencher o formulário o usuário realiza o pagamento.

Após confirmação do pagamento:

- uma página personalizada é gerada
- um QR Code é enviado por email
- visitantes acessam a experiência escaneando o QR Code.

Planos disponíveis:

Plano Básico
- até 3 localizações
- página ativa por 1 ano

Plano Vitalício
- até 7 localizações
- página sem expiração

Ao final da experiência aparece uma seção:

- “Este é o nosso mapa do amor”
- mapa com todos os pins
- contador mostrando há quanto tempo o casal está junto
- botão para compartilhar no Instagram Stories.

O usuário **não possui conta ou autenticação**.

---

## Technical

Estrutura do projeto:


./frontend


Stack:

- React
- Vite
- TailwindCSS
- Framer Motion
- React Hook Form
- Mapbox

Regras importantes:

- O frontend **NUNCA acessa o banco diretamente**
- O frontend **SEMPRE consome a API do backend**

Endpoints do backend:


POST /api/maps
GET /api/maps/:slug


Slug exemplo:


/carol-e-andre


Acesso real:


/carol-e-andre?t=<token>


---

## UI/UX

Fluxo do formulário em **wizard multi-step**.

### Etapa 1
Informações do casal

- nome do casal
- email
- data de início do relacionamento

### Etapa 2
Escolha do plano

- plano básico
- plano vitalício

### Etapa 3
Adicionar localizações

Cada localização possui:

- foto
- descrição
- mensagem
- emoji
- busca de vídeo do YouTube
- escolha do timestamp
- seleção de coordenadas no mapa

---

## Experiência da Página Pública

Ao abrir a página via QR Code:

1. Exibir mapa com **tema dark**
2. Mostrar primeiro pin
3. Ao clicar no pin:
   - chuva do emoji escolhido
   - exibir foto
   - exibir descrição
   - exibir mensagem

4. Ao rolar a página:
   - animação conectando o caminho até o próximo ponto

5. Repetir o processo para cada localização

6. Ao final:

- mostrar todos os pins com fotos estilo **polaroid**
- contador mostrando há quanto tempo o casal está junto
- botão de compartilhar no Instagram

---

## Requisitos de UX

- design **mobile-first**
- carregamento progressivo de imagens
- skeleton loading durante carregamento
- animações suaves com Framer Motion
- mapa com tema escuro
- narrativa baseada em scroll

---

## Fora do Escopo

- **NÃO** implementar autenticação
- **NÃO** criar painel administrativo
- **NÃO** permitir edição da página após pagamento
- **NÃO** implementar customização de cores
- **NÃO** permitir escolha de ícones de pin