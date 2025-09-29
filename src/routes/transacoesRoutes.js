// src/routes/transacoesRoutes.js
const express = require('express');
const router = express.Router();
const {
  getTransacoes,
  getResumo,
  addTransacao,
  updateTransacao,
  deleteTransacao
} = require('../controllers/transacoesController');

router.get('/transacoes', getTransacoes);
router.get('/resumo', getResumo);
router.post('/transacoes', addTransacao);
router.put('/transacoes/:id', updateTransacao);
router.delete('/transacoes/:id', deleteTransacao);

module.exports = router;