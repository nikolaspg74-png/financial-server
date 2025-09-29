// src/controllers/transacoesController.js
const db = require('../models/database');

// GET - Buscar todas transações
const getTransacoes = (req, res) => {
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
};

// GET - Buscar resumo (Receitas, Despesas, Balanço)
const getResumo = (req, res) => {
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
};

// POST - Adicionar nova transação
const addTransacao = (req, res) => {
  const { data, categoria, titulo, valor, tipo } = req.body;
  
  if (!data || !categoria || !titulo || !valor || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const sql = `INSERT INTO transacoes (data, categoria, titulo, valor, tipo) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [data, categoria, titulo, valor, tipo], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({
      id: this.lastID,
      message: 'Transação adicionada com sucesso!'
    });
  });
};

// PUT - Atualizar transação
const updateTransacao = (req, res) => {
  const { id } = req.params;
  const { data, categoria, titulo, valor, tipo } = req.body;
  
  const sql = `UPDATE transacoes SET data = ?, categoria = ?, titulo = ?, valor = ?, tipo = ? WHERE id = ?`;
  
  db.run(sql, [data, categoria, titulo, valor, tipo, id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Transação atualizada com sucesso!' });
  });
};

// DELETE - Remover transação
const deleteTransacao = (req, res) => {
  const { id } = req.params;
  
  const sql = `DELETE FROM transacoes WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Transação deletada com sucesso!' });
  });
};

module.exports = {
  getTransacoes,
  getResumo,
  addTransacao,
  updateTransacao,
  deleteTransacao
};