// src/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares - IMPORTANTE: cors() primeiro
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/financeiro.db'
  : path.join(__dirname, '../financeiro.db');

console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar com SQLite:', err);
  } else {
    console.log('✅ Conectado ao SQLite');
    
    // Criar tabela após conexão
    db.run(`
      CREATE TABLE IF NOT EXISTS transacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        categoria TEXT NOT NULL,
        titulo TEXT NOT NULL,
        valor REAL NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa'))
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erro ao criar tabela:', err);
      } else {
        console.log('✅ Tabela transacoes pronta');
        
        // Inserir dados iniciais se estiver vazia
        db.get("SELECT COUNT(*) as count FROM transacoes", (err, row) => {
          if (!err && row.count === 0) {
            console.log('📥 Inserindo dados iniciais...');
            const initialData = [
              ['29/09/2025', 'Salário', 'Salário', 4735.00, 'receita'],
              ['15/09/2025', 'Salário', 'Aluguel', 1000.00, 'receita'],
              ['27/09/2025', 'Aluguel', 'Casa', 1714.00, 'despesa'],
              ['29/09/2025', 'Carro', 'Uno', 857.00, 'despesa'],
              ['28/09/2025', 'Aluguel', 'Mãe', 900.00, 'despesa'],
              ['28/09/2025', 'Cartão', 'Caixa', 1304.00, 'despesa']
            ];
            
            const insert = db.prepare("INSERT INTO transacoes (data, categoria, titulo, valor, tipo) VALUES (?, ?, ?, ?, ?)");
            initialData.forEach(data => insert.run(data));
            insert.finalize();
            console.log('✅ Dados iniciais inseridos');
          }
        });
      }
    });
  }
});

// ===== ROTAS =====

// GET - Todas as transações
app.get('/api/transacoes', (req, res) => {
  console.log('📥 GET /api/transacoes chamado');
  
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
      console.error('❌ Erro ao buscar transações:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Retornando ${rows.length} transações`);
    res.json(rows);
  });
});

// GET - Resumo
app.get('/api/resumo', (req, res) => {
  console.log('📊 GET /api/resumo chamado');
  
  const sql = `
    SELECT 
      SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as totalReceitas,
      SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as totalDespesas,
      SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) as balanco
    FROM transacoes
  `;
  
  db.get(sql, [], (err, row) => {
    if (err) {
      console.error('❌ Erro ao buscar resumo:', err);
      return res.status(500).json({ error: err.message });
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
  console.log('➕ POST /api/transacoes chamado');
  
  const { data, categoria, titulo, valor, tipo } = req.body;
  
  if (!data || !categoria || !titulo || !valor || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const sql = `INSERT INTO transacoes (data, categoria, titulo, valor, tipo) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [data, categoria, titulo, parseFloat(valor), tipo], function(err) {
    if (err) {
      console.error('❌ Erro ao adicionar transação:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ Transação adicionada com ID:', this.lastID);
    res.json({
      id: this.lastID,
      message: 'Transação adicionada com sucesso!'
    });
  });
});

// DELETE - Remover transação
app.delete('/api/transacoes/:id', (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE /api/transacoes/${id} chamado`);
  
  const sql = `DELETE FROM transacoes WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('❌ Erro ao deletar transação:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ Transação deletada');
    res.json({ message: 'Transação deletada com sucesso!' });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Financeira funcionando!',
    timestamp: new Date().toISOString()
  });
});
// Adicione esta rota no seu server.js
app.put('/api/transacoes/:id', (req, res) => {
  const { id } = req.params;
  const { data, categoria, titulo, valor, tipo } = req.body;
  
  console.log(`✏️ PUT /api/transacoes/${id} chamado`, req.body);

  if (!data || !categoria || !titulo || !valor || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const sql = `UPDATE transacoes SET data = ?, categoria = ?, titulo = ?, valor = ?, tipo = ? WHERE id = ?`;
  
  db.run(sql, [data, categoria, titulo, parseFloat(valor), tipo, id], function(err) {
    if (err) {
      console.error('❌ Erro ao atualizar transação:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    console.log('✅ Transação atualizada');
    res.json({ 
      message: 'Transação atualizada com sucesso!',
      changes: this.changes
    });
  });
});
// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Financeira Online!',
    endpoints: [
      'GET /health',
      'GET /api/transacoes', 
      'GET /api/resumo',
      'POST /api/transacoes',
      'DELETE /api/transacoes/:id'
    ]
  });
});



// Rota de fallback para 4045
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl,
    availableRoutes: [
      '/',
      '/health', 
      '/api/transacoes',
      '/api/resumo'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});