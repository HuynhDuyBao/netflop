const express = require('express');
const personController = require('../controllers/person.controller');

const router = express.Router();

router.get('/:id', personController.getActor);

module.exports = router;
