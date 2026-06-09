const express = require('express');
const Joi = require('joi');
const episodeController = require('../controllers/episode.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();
const adminOnly = [authenticate, authorizeRoles('admin', 'super_admin')];

const episodeSchema = Joi.object({
  movieId: Joi.number().integer().positive().required(),
  title: Joi.string().trim().min(1).max(150).required(),
  sourceUrl: Joi.string().trim().max(700).allow('', null),
  hlsUrl: Joi.string().trim().max(700).allow('', null),
  cloudFrontUrl: Joi.string().trim().max(700).allow('', null),
  uploadStatus: Joi.string().trim().max(50).default('ready'),
  duration: Joi.number().integer().min(0).allow(null)
});

const subtitleSchema = Joi.object({
  languageCode: Joi.string().trim().min(2).max(20).required(),
  languageName: Joi.string().trim().min(2).max(100).required(),
  format: Joi.string().valid('vtt').default('vtt'),
  url: Joi.string().trim().max(700).required(),
  isDefault: Joi.boolean().default(false)
});

router.get('/', adminOnly, episodeController.list);
router.post('/', adminOnly, validate(episodeSchema), episodeController.create);
router.patch('/:id', adminOnly, validate(episodeSchema), episodeController.update);
router.delete('/:id', adminOnly, episodeController.remove);
router.post('/:id/subtitles', adminOnly, validate(subtitleSchema), episodeController.createSubtitle);
router.delete('/:id/subtitles/:subtitleId', adminOnly, episodeController.removeSubtitle);

module.exports = router;
