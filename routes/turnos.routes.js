// routes/turnos.routes.js
const express = require('express');
const router = express.Router();
const { getTurnos, agregarTurno, avanzarTurno, getHistorialTurnos } = require('../controllers/turnos.controller');

const { io } = require('../server');



router.get('/', getTurnos);
router.get('/historial', getHistorialTurnos);

router.post('/', agregarTurno);
router.post('/avanzar', avanzarTurno);

module.exports = router;