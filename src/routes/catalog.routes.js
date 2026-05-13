const express = require('express');
const catalogController = require('../controllers/catalog.controller');

const router = express.Router();

router.get('/genres', catalogController.listGenres);
router.get('/countries', catalogController.listCountries);

module.exports = router;
