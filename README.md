# ECS Financial System 🚀

Bem-vindo ao **ECS Financial System**, um sistema completo de gerenciamento financeiro pessoal construído com tecnologias web modernas. Esta aplicação foi projetada para ajudar você a ter um controle claro e eficiente de suas finanças, desde o acompanhamento de transações diárias até o planejamento de metas de longo prazo.

## ✨ Funcionalidades Principais

O sistema oferece um conjunto robusto de ferramentas para capacitar sua jornada financeira:

- **📊 Dashboard Intuitivo:** Tenha uma visão geral e instantânea da sua saúde financeira, com saldo total, receitas, despesas e economias do mês.
- **💸 Gestão de Transações:** Adicione, edite e exclua transações de receita e despesa com facilidade.
- **📄 Importação de CSV:** Importe suas transações em lote a partir de um arquivo CSV, com um assistente inteligente para mapear colunas e categorias.
- **🏦 Contas Múltiplas:** Gerencie diversas contas, como conta corrente, poupança ou carteiras digitais.
- **🎯 Metas Financeiras:** Crie e acompanhe suas metas (ex: "Viagem de Férias", "Fundo de Emergência") e veja seu progresso em tempo real ao fazer aportes.
- **💰 Orçamentos por Categoria:** Defina orçamentos mensais para categorias de despesas (Moradia, Alimentação, etc.) e monitore seus gastos para não estourar o limite.
- **🔄 Lançamentos Recorrentes:** Cadastre despesas e receitas fixas (como salários e assinaturas) para automatizar o planejamento.
- **📈 Relatórios e Projeções:** Analise seus gastos com gráficos interativos e projete seu fluxo de caixa futuro para tomar decisões mais inteligentes.
- **🎨 Tema Claro e Escuro:** Personalize a aparência do sistema de acordo com sua preferência.

## 🛠️ Stack de Tecnologia

Este projeto foi construído utilizando uma stack moderna e performática, focada em produtividade e experiência do desenvolvedor:

- **Framework:** [Next.js](https://nextjs.org/) (com App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **UI Framework:** [React](https://react.dev/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/)
- **Banco de Dados:** [Firebase Firestore](https://firebase.google.com/products/firestore) (em tempo real)
- **Autenticação:** [Firebase Authentication](https://firebase.google.com/products/auth)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Formulários:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## 🚀 Como Executar Localmente

Para executar este projeto em seu ambiente de desenvolvimento, siga os passos abaixo:

1.  **Clone o Repositório** (se aplicável)
    ```bash
    git clone [URL_DO_REPOSITORIO]
    cd [NOME_DO_DIRETORIO]
    ```

2.  **Instale as Dependências**
    Use o `npm` para instalar todos os pacotes necessários:
    ```bash
    npm install
    ```

3.  **Configure o Firebase**
    - **Configuração do Cliente:** O arquivo `src/lib/firebase.ts` já contém a configuração do SDK do cliente Firebase. Certifique-se de que os valores correspondem ao seu projeto no [Console do Firebase](https://console.firebase.google.com/).
    - **Configuração do Servidor (Opcional):** Para funcionalidades de servidor (como Server Actions futuras), você precisará de uma conta de serviço. Crie um arquivo `.env.local` na raiz do projeto e adicione sua chave de conta de serviço:
      ```
      FIREBASE_SERVICE_ACCOUNT={...sua chave JSON aqui...}
      ```

4.  **Inicie o Servidor de Desenvolvimento**
    Execute o comando abaixo para iniciar a aplicação em modo de desenvolvimento:
    ```bash
    npm run dev
    ```

5.  **Acesse a Aplicação**
    Abra seu navegador e acesse [http://localhost:9002](http://localhost:9002) (ou a porta que for indicada no seu terminal).

---

Feito com FirebaseStudio por **Eduardo Campos**.
