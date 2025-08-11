# NaMata - Sistema de Gestão para Restaurantes

NaMata é um sistema de Ponto de Venda (PDV) e gestão completo, projetado para otimizar as operações diárias de restaurantes, bares e casas noturnas. Desenvolvido com tecnologias modernas, o sistema oferece uma interface intuitiva e funcionalidades robustas para gerenciar todo o fluxo de trabalho, desde o check-in do cliente até o fechamento financeiro do dia.

O projeto foi construído de forma colaborativa e iterativa, focando em resolver problemas reais do setor com soluções eficientes e elegantes.

## ✨ Principais Funcionalidades

O sistema é dividido em módulos acessíveis com base em perfis de usuário, garantindo segurança e foco nas tarefas de cada equipe.

### 👤 **Gestão de Usuários e Permissões**
- **Sistema de Autenticação:** Login seguro baseado em perfis pré-definidos.
- **Perfis de Usuário:**
    - **Chefe:** Acesso total a todas as funcionalidades, incluindo relatórios e configurações.
    - **Portaria:** Focado no check-in de clientes e associação de comandas.
    - **Garçom:** Lançamento de pedidos para mesas e comandas.
    - **Caixa:** Fechamento de contas, cancelamento de itens e acesso aos relatórios diários.
    - **Bar / Cozinha:** Visualização dos pedidos pendentes em suas respectivas estações (KDS - Kitchen Display System).

### 顧客 **Controle de Comandas e Clientes**
- **Check-in de Clientes:** Cadastro rápido de clientes associando-os a uma comanda ou pulseira.
- **Consulta de Comandas Abertas:** Visualização em tempo real de todos os clientes que estão no estabelecimento.

### 🍔 **Gestão de Produtos**
- **Cardápio Digital:** Cadastro de produtos com nome, preço e departamento (Cozinha, Bar, Geral).
- **Flexibilidade de Departamentos:** Permite a organização de produtos diversos, facilitando a separação dos pedidos.

### 📝 **Lançamento e Gestão de Pedidos**
- **Interface de Pedidos:** Garçons e Chefes podem lançar pedidos de forma rápida, selecionando produtos do cardápio para uma comanda ou mesa específica.
- **Separação Automática:** Os pedidos são automaticamente enviados para as estações de impressão e telas dos departamentos correspondentes (Cozinha, Bar, Geral).

### 🖥️ **Telas de Preparo (KDS)**
- **Dashboard para Cozinha e Bar:** Telas dedicadas que mostram os pedidos pendentes em tempo real, permitindo que as equipes de preparo visualizem e gerenciem a fila de produção.

### 📠 **Estações de Impressão**
- **Impressão por Departamento:** Páginas dedicadas que "ouvem" novos pedidos e os enviam para a impressora correta (Cozinha, Bar ou Geral).
- **Wake Lock:** A tela da estação de impressão permanece sempre ativa, garantindo que nenhum pedido seja perdido.

### 💳 **Operações de Caixa**
- **Fechamento de Conta Individual:** Busca de comandas para visualizar o consumo e finalizar a venda.
- **Cancelamento Granular de Itens:** O caixa pode cancelar uma quantidade específica de um item (ex: cancelar 2 de 5 cervejas), mantendo o controle preciso do estoque e do faturamento.
- **Seleção de Método de Pagamento:** Registro de pagamentos em Dinheiro, Crédito ou Débito.

### 📅 **Gestão de Reservas**
- **Agendamento:** Criação e visualização de reservas.
- **Filtros:** Busca de reservas por data e por nome do cliente.
- **Atribuição de Mesas:** Possibilidade de associar uma reserva a uma mesa específica.

### 📊 **Relatórios e Fechamento de Caixa**
- **Fechamento Diário:** Funcionalidade para consolidar todas as transações do dia.
- **Relatório Detalhado:** Geração de um relatório completo com:
  - Faturamento total.
  - Faturamento detalhado por método de pagamento (Dinheiro, Crédito, Débito).
  - Total da taxa de serviço.
  - Número de clientes atendidos.
  - Lista de itens cancelados e valor do prejuízo.
- **Histórico de Fechamentos:** O Chefe e o Caixa podem consultar relatórios de dias anteriores.
- **Reabertura de Caixa:** O Chefe tem a permissão para reabrir um caixa já fechado, caso seja necessário fazer correções.

## 🚀 Tecnologias Utilizadas

- **Frontend:** Next.js, React, TypeScript
- **UI/Componentes:** ShadCN, Tailwind CSS, Lucide Icons
- **Backend & Banco de Dados:** Firebase (Firestore, Authentication)
- **State Management:** React Hooks & Context API
- **AI (Stack preparada):** Genkit

## 🚀 Como Usar

1.  **Clone o repositório.**
2.  **Instale as dependências:** `npm install`.
3.  **Execute o projeto:** `npm run dev`.
4.  **Acesse a aplicação:** Abra `http://localhost:9002` no seu navegador.

### Perfis de Teste

A tela de login permite simular a experiência de cada membro da equipe. Não é necessário criar contas; basta clicar no perfil desejado para fazer login com um usuário de teste:

- **Chefe:** `chefe@namata.com`
- **Portaria:** `portaria@namata.com`
- **Garçom:** `garcom@namata.com`
- **Bar:** `bar@namata.com`
- **Cozinha:** `cozinha@namata.com`
- **Caixa:** `caixa@namata.com`

### Fluxo de Trabalho Básico

1.  **Login como Portaria:** Faça o check-in de um novo cliente em `Comandas Individuais`, criando uma nova comanda.
2.  **Login como Garçom:** Em `Lançar Pedido`, insira o número da comanda criada e uma mesa para iniciar um pedido. Adicione itens da Cozinha e do Bar.
3.  **Login como Cozinha/Bar:** Acesse as páginas `Pedidos da Cozinha` ou `Pedidos do Bar` para ver os itens pendentes.
4.  **Login como Caixa:** Em `Caixa`, busque a comanda do cliente para visualizar o consumo, cancelar itens (se necessário) e `Fechar a Conta`, selecionando o método de pagamento.
5.  **Login como Chefe:** No final do dia, vá para `Relatórios` e realize o `Fechamento do Dia` para gerar um relatório consolidado. Consulte o histórico e, se precisar, `Reabra o Caixa`.
