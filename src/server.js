// Versão alternativa - mais simples
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database - versão super simples
const dbPath = '/tmp/financeiro.db'; // Sempre usa /tmp no Render
const db = new sqlite3.Database(dbPath);

// Apenas cria tabela se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS transacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    categoria TEXT,
    titulo TEXT,
    valor REAL,
    tipo TEXT
  )
`);

// Suas rotas aqui (mantenha as mesmas rotas)

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});