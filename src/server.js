// src/server.js - VERSÃO COMPLETA E FUNCIONAL
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, '../financeiro.db');
const db = new sqlite3.Database(dbPath);

// Criar tabela e dados iniciais
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS transacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      categoria TEXT NOT NULL,
      titulo TEXT NOT NULL,
      valor REAL NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa'))
    )
  `);

  // Verificar se já existem dados
  db.get("SELECT COUNT(*) as count FROM transacoes", (err, row) => {
    if (row.count === 0) {
      const insertInitial = db.prepare(`
        INSERT INTO transacoes (data, categoria, titulo, valor, tipo) 
        VALUES (?, ?, ?, ?, ?)
      `);

      const initialData = [
        ['29/09/2025', 'Salário', 'Salário', 4735.00, 'receita'],
        ['15/09/2025', 'Salário', 'Aluguel', 1000.00, 'receita'],
        ['27/09/2025', 'Aluguel', 'Casa', 1714.00, 'despesa'],
        ['29/09/2025', 'Carro', 'Uno', 857.00, 'despesa'],
        ['28/09/2025', 'Aluguel', 'Mãe', 900.00, 'despesa'],
        ['28/09/2025', 'Cartão', 'Caixa', 1304.00, 'despesa']
      ];

      initialData.forEach(data => {
        insertInitial.run(data);
      });

      insertInitial.finalize();
      console.log('📊 Dados iniciais inseridos!');
    }
  });
});

// ===== ROTAS =====

// GET - Todas as transações
app.get('/api/transacoes', (req, res) => {
  const sql = `
    SELECT *, 
           CASE 
             WHEN tipo = 'receita' THEN valor 
             ELSE -valor 
           END as valorComSinal
    FROM transacoes 
    ORDER BY 
      SUBSTR(data, 7, 4) || SUBSTR(data, 4, 2) || SUBSTR(data, 1, 2) DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET - Resumo (Receitas, Despesas, Balanço)
app.get('/api/resumo', (req, res) => {
  const sql = `
    SELECT 
      SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as totalReceitas,
      SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as totalDespesas,
      SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) as balanco
    FROM transacoes
  `;
  
  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({
      receitas: row.totalReceitas || 0,
      despesas: row.totalDespesas || 0,
      balanco: row.balanco || 0
    });
  });
});

// POST - Nova transação
app.post('/api/transacoes', (req, res) => {
  const { data, categoria, titulo, valor, tipo } = req.body;
  
  if (!data || !categoria || !titulo || !valor || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const sql = `INSERT INTO transacoes (data, categoria, titulo, valor, tipo) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [data, categoria, titulo, parseFloat(valor), tipo], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({
      id: this.lastID,
      message: 'Transação adicionada com sucesso!'
    });
  });
});

// PUT - Atualizar transação
app.put('/api/transacoes/:id', (req, res) => {
  const { id } = req.params;
  const { data, categoria, titulo, valor, tipo } = req.body;
  
  const sql = `UPDATE transacoes SET data = ?, categoria = ?, titulo = ?, valor = ?, tipo = ? WHERE id = ?`;
  
  db.run(sql, [data, categoria, titulo, parseFloat(valor), tipo, id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Transação atualizada com sucesso!' });
  });
});

// DELETE - Remover transação
app.delete('/api/transacoes/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = `DELETE FROM transacoes WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Transação deletada com sucesso!' });
  });
});

// Rota inicial
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ API do Controle Financeiro funcionando!',
    endpoints: {
      'GET /api/transacoes': 'Lista todas transações',
      'GET /api/resumo': 'Retorna resumo financeiro', 
      'POST /api/transacoes': 'Adiciona nova transação',
      'PUT /api/transacoes/:id': 'Atualiza transação',
      'DELETE /api/transacoes/:id': 'Remove transação'
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Acesse: http://localhost:${PORT}`);
  console.log(`💾 Banco de dados: ${dbPath}`);
});