const express = require('express');
const router = express.Router();
const panelsController = require('../controllers/panels.controller');

router.post('/', panelsController.savePanel);
router.get('/:id', panelsController.loadPanel);

module.exports = router;