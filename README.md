# API de Gerenciamento de Pedidos 

Este projeto é uma API RESTful para gerenciar pedidos, desenvolvida como parte de um desafio técnico.

##  Tecnologias
- **Node.js** com **Express**
- **PostgreSQL** (Banco de Dados)
- **JWT** (Autenticação de Segurança)

##  Como Rodar o Projeto

### 1. Configurar o Banco de Dados
- Abra o seu **pgAdmin 4**.
- Crie um banco de dados chamado `api_pedidos`.
- Abra a ferramenta de consulta (Query Tool) e execute o código que está no arquivo `database.sql` deste projeto.

### 2. Configurar a API
- No VS Code, abra o arquivo `index.js`.
- Na linha da conexão com o banco (`const pool = new Pool`), coloque a **sua senha** do PostgreSQL.
- No terminal, digite: `npm install` para baixar as bibliotecas.

### 3. Iniciar o Servidor
- No terminal, digite: `node index.js`.
- A mensagem ` API rodando na porta 3000` deve aparecer.

##  Como Testar a Autenticação (JWT)

Esta API é protegida. Para usar os endpoints de pedidos, você precisa de um "token":

1. Faça um **POST** para `http://localhost:3000/login`.
2. No corpo (Body) envie: 
   ```json
   { "usuario": "postgres", "senha": "1998" }
3. Copie o token que a API vai te devolver.
4. Nas outras rotas(como listar pedidos), use esse token no cabeçalho (Header) como Bearer Token.

Desenvolvido por Roberto Filho.
