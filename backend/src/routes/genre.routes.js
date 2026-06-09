const express = require('express');
const genreController = require('../controllers/genre.controller');

const router = express.Router();

router.get('/', genreController.list);

module.exports = router;
