# Bem vindo ao Coffee and Cakes!!!

## Sobre o projeto
Essa aplicação se trata de uma aplicação de ecomerce para um food services, a ideia faz parte de um projeto de Engenharia de Software proposto pela universidade.

## Sobre a proposta
O desafio proposto pela universidade foi do desenvolvimento completo para uma aplicação de ecommerce para uma loja de cupcakes, partindo do desenvolvimento do escopo, levantamento de requisitos, diagramas de classes, casos de uso, sequência e desenho dos wireframes e protótipos de tela de alta fidelidade, chegando a um MVP funcional com desenvolvimento da arquitetura da aplicação, banco de dados e testes

Documento de Arquitetura de Software - Coffee & Cakes: https://docs.google.com/document/d/1niSCoqxPzwJ3xVEFNCQyPsOGcfjFyPeT5fLrVKLiLEE/edit?usp=sharing

## Desenvolvimento do projeto
A ideia é que aplicação seja desenvolvida em colaboração com a IA e não gerada totalmente por ela, quero usar o projeto para entender, durante o desenvolvimento, qual a lógica por trás de cada funcionalidade implementada, qual o padrão usado no mercado, quais as variações da solução implementada e onde cada variação se adequa mais. Após o desenvolvimento, a intensão é testar a aplicação até o limite, simulando requisições infinitas e conflitos como duas pessoas comprando o ultimo produto ao mesmo tempo, para entender onde a aplicação falha, desenvolver atualizações e entender como resolver problemas relacionados a regras de negócios e segurança

## Stacks da aplicação
 * Backend: Node e typescript
 * Banco de dados: PostgreSql hospedado no Supabase
 * Frontend: ReactJS

## 🚀 Instruções de Instalação e Uso

Certifique-se de ter o **Node.js (v18 ou superior)** e o **npm** instalados em sua máquina.

### 1. Configuração do Banco de Dados (Supabase / PostgreSQL)
Os scripts SQL para replicar a estrutura e a massa de dados inicial do sistema estão na pasta `database/`:
1. Crie um projeto gratuito no [Supabase](https://supabase.com/).
2. No menu lateral, acesse **SQL Editor** -> **New query**.
3. Execute o script `database/schema.sql` para criar as tabelas e seus relacionamentos.
4. Em seguida, execute o script `database/seed_dados.sql` para popular as categorias e produtos iniciais.
5. Para acessar o painel administrativo pela primeira vez, crie uma conta pela interface da aplicação e, na tabela `usuario` no **Table Editor** do Supabase, altere a coluna `role` desse usuário de `cliente` para `admin`.

### 2. Configuração das Variáveis de Ambiente (`.env`)
Crie os arquivos `.env` nas respectivas pastas utilizando as credenciais disponíveis no painel do seu projeto Supabase (**Project Settings -> API**):

**Back-end (`backend/.env`):**
PORT=3000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
JWT_SECRET=sua_chave_secreta_jwt

> ⚠️ **Importante:** A chave `service_role` deve ser utilizada exclusivamente no back-end para permitir operações administrativas de persistência, nunca sendo exposta no front-end.

**Front-end (`frontend/.env`):**
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_public_aqui

### 3. Instalação e Execução (Ambiente Único)
O projeto está configurado para instalar dependências e iniciar **back-end e front-end simultaneamente** a partir da raiz do repositório:
1. Na pasta raiz do projeto, instale as dependências com `npm install`.
2. Inicie a aplicação completa (API + Interface Web) com `npm run dev`.
3. Acesse a aplicação no navegador pelo endereço local exibido no terminal (por padrão, `http://localhost:5173`).

## Diário do projeto

### Antes do primeiro commit
* Bando de Dados: Para a hospedagem do banco de dados optei pelo supabase, por ser um sistema open source robusto baseado em PosgreSql (linguagem muito similar ao SQL que eu já domino) e ofertar um plano gratuito com todos os recursos de segurança do plano pago 
* Backend: Decidi que o projeto terá o backend em C#, sendo uma linguagem fortemente tipada e padrão em grandes empresas vai me obrigar a aprender conceitos mais avançados do mercado além de dar uma estrutura mais robusta para o projeto
* Frontend: React, é a linguagem que eu já usava a 4 anos atrás, portanto a curva de aprendizado será muito menor 

### Commits
* Commit - e4d0208: Decidi migrar o backend para o Nodejs com typescript, depois de analisar o todo do projeto e o prazo, entendi que seguir o plano inicial, backend em C#, causaria um cenário de overengeneer no projeto, migrar para Node simplificaria a comunicação com o frontend, me polpando de aprender Docker e outros conceitos que não permitiriam entregar a aplicação no prazo. 

  Aqui fiz toda a configuração do boilerplate, comunicação inicial com o banco de dados e a configuração segura das chaves do banco.

* 02/11/2026 - 21:35: Hoje eu entendi que isso aqui equivale a um TCC e não vai dar para codificar como eu gostaria, vendo como o gemini desenha o código para aprender e então replicando a estrutura na mão para as demais tabelas, como o prazo é curto, afinal tenho até 17/11/26 para entregar e o código vale apenas 20% da composição da nota. Vou adotar quase um "vibecoding", vou pedir para o Gemini gerar os códigos pelo chat mesmo e ir lapidando algumas coisas por pronpts outras por código escrito a mão, não vou conectar um claude code nem nada assim, pois quanto menos mastigado eu tiver a informação e mais trabalho tiver para lapidar mais eu aprendo, mesmo que seja uma migalha.

Hoje eu também entendi que preciso sanitizar todos os dados antes de mandar para o banco e que isso é bem mais profundo do que eu tinha em mente.

* 04/11/2026 01:23: Eu sei que eu disse que faria tudo na base do vibecoding mas vontade de aprender e entender como o código funciona é um pouco mais forte. Para hoje temos os 3 primeiros validadores, todos escritos a mão tendo o validador de usuário como padrão e a IA como para codereview. Quanto aos testes, a tabela pedido passou por todos os testes manuais de erro, mas não permitiu um post devido as regras de chave estrangeira no Postgres.



