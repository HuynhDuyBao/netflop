const express = require('express');
const catalogController = require('../controllers/catalog.controller');

const router = express.Router();

router.get('/genres', catalogController.listGenres);
router.get('/countries', catalogController.listCountries);
router.get('/actors', catalogController.listActors);
router.get('/directors', catalogController.listDirectors);

module.exports = router;
