const express = require('express');
const Joi = require('joi');
const movieController = require('../controllers/movie.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

const historySchema = Joi.object({
  episodeId: Joi.number().integer().positive().allow(null),
  watchedSeconds: Joi.number().min(0).default(0)
});

const ratingSchema = Joi.object({
  score: Joi.number().integer().min(1).max(10).required(),
  comment: Joi.string().trim().max(1000).allow('', null)
});

const commentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  parentId: Joi.number().integer().positive().allow(null)
});

router.get('/', movieController.listMovies);
router.get('/:id', movieController.getMovie);
router.get('/:id/episodes', movieController.listEpisodes);
router.get('/:id/comments', movieController.listComments);
router.post('/:id/comments', authenticate, validate(commentSchema), movieController.createComment);
router.post('/:id/favorite', authenticate, movieController.addFavorite);
router.delete('/:id/favorite', authenticate, movieController.removeFavorite);
router.post('/:id/history', authenticate, validate(historySchema), movieController.saveHistory);
router.post('/:id/rating', authenticate, validate(ratingSchema), movieController.rateMovie);

module.exports = router;
