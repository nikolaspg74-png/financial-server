// src/models/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../financeiro.db');
const db = new sqlite3.Database(dbPath);

// Criar tabela
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

  // Inserir dados iniciais baseados na sua imagem
  const insertInitial = db.prepare(`
    INSERT OR IGNORE INTO transacoes (data, categoria, titulo, valor, tipo) 
    VALUES (?, ?, ?, ?, ?)
  `);

  // Dados da sua imagem
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
});

module.exports = db;