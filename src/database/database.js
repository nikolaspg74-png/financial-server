// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'financeiro.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS transacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      categoria TEXT NOT NULL,
      titulo TEXT NOT NULL,
      valor REAL NOT NULL,
      tipo TEXT CHECK(tipo IN ('receita', 'despesa'))
    )
  `);
});

module.exports = db;