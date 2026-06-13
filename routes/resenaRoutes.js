const express = require('express');
const router = express.Router();
const resenaController = require('../controllers/resenaController');
const auth = require('../middleware/auth');

router.post('/', auth.verificarToken, resenaController.crearResena);
router.get('/marca/:marcaId', resenaController.obtenerResenasMarca);
router.get('/verificar/:pedidoId', auth.verificarToken, resenaController.verificarResena);

module.exports = router;