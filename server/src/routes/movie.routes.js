const express = require('express');
const movieController = require('../controllers/movie.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth.middleware');
const { commentSchema, historySchema, ratingSchema } = require('../validators/movie.validator');

const router = express.Router();

router.get('/', movieController.listMovies);
router.get('/:id', optionalAuthenticate, movieController.getMovie);
router.get('/:id/episodes', movieController.listEpisodes);
router.get('/:id/comments', movieController.listComments);
router.post('/:id/comments', authenticate, validate(commentSchema), movieController.createComment);
router.post('/:id/favorite', authenticate, movieController.addFavorite);
router.delete('/:id/favorite', authenticate, movieController.removeFavorite);
router.post('/:id/history', authenticate, validate(historySchema), movieController.saveHistory);
router.post('/:id/rating', authenticate, validate(ratingSchema), movieController.rateMovie);

module.exports = router;
