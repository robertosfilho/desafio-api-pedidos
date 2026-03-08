const express = require('express');
const { Pool } = require('pg');
const app = express();

app.use(express.json());

// ==========================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================
const pool = new Pool({
    user: 'postgres',      
    host: 'localhost',
    database: 'api_pedidos',    
    password: '1998',    
    port: 5432,
});

// ==========================================
// ROTAS OPCIONAIS
// ==========================================

// ➔ GET: Listar todos os pedidos
app.get('/order/list', async (req, res) => {
    try {
        const query = `
            SELECT 
                o."orderId", 
                o."value", 
                o."creationDate",
                COALESCE(json_agg(
                    json_build_object('productId', i."productId", 'quantity', i."quantity", 'price', i."price")
                ) FILTER (WHERE i."productId" IS NOT NULL), '[]') AS items
            FROM "Order" o
            LEFT JOIN "Items" i ON o."orderId" = i."orderId"
            GROUP BY o."orderId";
        `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (erro) {
        console.error('Erro ao listar pedidos:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor ao listar os pedidos.' });
    }
});

// ==========================================
// ROTAS OBRIGATÓRIAS
// ==========================================

// ➔ POST: Criar um novo pedido
app.post('/order', async (req, res) => {
    const { orderId, value, creationDate, items } = req.body;

    // Validação de entrada (Retorna 400 Bad Request se faltar algo)
    if (!orderId || value === undefined || !creationDate || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ erro: 'Dados inválidos. Certifique-se de enviar orderId, value, creationDate e um array de items.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Inicia a transação

        const insertOrderText = 'INSERT INTO "Order"("orderId", "value", "creationDate") VALUES ($1, $2, $3)';
        await client.query(insertOrderText, [orderId, value, creationDate]);

        const insertItemText = 'INSERT INTO "Items"("orderId", "productId", "quantity", "price") VALUES ($1, $2, $3, $4)';
        for (const item of items) {
            if (!item.productId || item.quantity === undefined || item.price === undefined) {
                throw new Error('ITEM_INVALIDO'); // Força o erro para cair no catch e dar Rollback
            }
            await client.query(insertItemText, [orderId, item.productId, item.quantity, item.price]);
        }

        await client.query('COMMIT'); // Confirma a transação
        res.status(201).json({ mensagem: 'Pedido criado com sucesso!', orderId });
    } catch (erro) {
        await client.query('ROLLBACK'); // Desfaz as alterações em caso de erro
        
        if (erro.message === 'ITEM_INVALIDO') {
            return res.status(400).json({ erro: 'Os itens devem conter productId, quantity e price.' });
        }
        if (erro.code === '23505') {
            return res.status(409).json({ erro: 'Conflito: Este orderId já está cadastrado no sistema.' });
        }
        
        console.error('Erro ao criar pedido:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor ao criar o pedido.' });
    } finally {
        client.release();
    }
});

// ➔ GET: Obter pedido por ID
app.get('/order/:numeroPedido', async (req, res) => {
    const { numeroPedido } = req.params; 
    
    try {
        const query = `
            SELECT 
                o."orderId", 
                o."value", 
                o."creationDate",
                COALESCE(json_agg(
                    json_build_object('productId', i."productId", 'quantity', i."quantity", 'price', i."price")
                ) FILTER (WHERE i."productId" IS NOT NULL), '[]') AS items
            FROM "Order" o
            LEFT JOIN "Items" i ON o."orderId" = i."orderId"
            WHERE o."orderId" = $1
            GROUP BY o."orderId";
        `;
        
        const resultado = await pool.query(query, [numeroPedido]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Not Found: Pedido não encontrado.' });
        }

        res.status(200).json(resultado.rows[0]);
    } catch (erro) {
        console.error('Erro ao buscar pedido:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor ao buscar o pedido.' });
    }
});

// ➔ PUT: Atualizar o pedido
app.put('/order/:numeroPedido', async (req, res) => {
    const { numeroPedido } = req.params;
    const { value, creationDate } = req.body;

    if (value === undefined && !creationDate) {
        return res.status(400).json({ erro: 'Bad Request: Envie ao menos o value ou creationDate para atualizar.' });
    }

    try {
        const query = `
            UPDATE "Order" 
            SET "value" = COALESCE($1, "value"), 
                "creationDate" = COALESCE($2, "creationDate")
            WHERE "orderId" = $3 
            RETURNING *;
        `;
        
        const resultado = await pool.query(query, [value, creationDate, numeroPedido]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Not Found: Pedido não encontrado para atualização.' });
        }

        res.status(200).json({ mensagem: 'Pedido atualizado com sucesso.', pedido: resultado.rows[0] });
    } catch (erro) {
        console.error('Erro ao atualizar pedido:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor ao atualizar o pedido.' });
    }
});

// ➔ DELETE: Deletar o pedido
app.delete('/order/:numeroPedido', async (req, res) => {
    const { numeroPedido } = req.params;

    try {
        const resultado = await pool.query('DELETE FROM "Order" WHERE "orderId" = $1 RETURNING *', [numeroPedido]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Not Found: Pedido não encontrado para exclusão.' });
        }

        res.status(204).send(); // 204 No Content indica sucesso na exclusão sem corpo na resposta
    } catch (erro) {
        console.error('Erro ao deletar pedido:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor ao deletar o pedido.' });
    }
});

const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`🚀 API rodando na porta ${PORTA}`);
});