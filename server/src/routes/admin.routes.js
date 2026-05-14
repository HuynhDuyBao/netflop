const express = require('express');
const adminController = require('../controllers/admin.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const {
  episodeSchema,
  episodeTranscodeSchema,
  episodeUploadCompleteSchema,
  episodeUploadUrlSchema,
  movieSchema,
  nameSchema,
  personSchema,
  updateEpisodeSchema,
  updateMovieSchema,
  updatePersonSchema,
  updateRoleSchema,
  updateStatusSchema
} = require('../validators/admin.validator');

const router = express.Router();

const adminOnly = [authenticate, authorizeRoles('admin')];

router.get('/stats', adminOnly, adminController.stats);

router.get('/users', adminOnly, adminController.listUsers);
router.patch('/users/:id/role', adminOnly, validate(updateRoleSchema), adminController.updateUserRole);
router.patch('/users/:id/status', adminOnly, validate(updateStatusSchema), adminController.updateUserStatus);

router.get('/movies', adminOnly, adminController.listMovies);
router.post('/movies', adminOnly, validate(movieSchema), adminController.createMovie);
router.get('/movies/:id', adminOnly, adminController.getMovie);
router.patch('/movies/:id', adminOnly, validate(updateMovieSchema), adminController.updateMovie);
router.delete('/movies/:id', adminOnly, adminController.deleteMovie);

router.get('/episodes', adminOnly, adminController.listEpisodes);
router.post('/episodes', adminOnly, validate(episodeSchema), adminController.createEpisode);
router.post('/episodes/upload-url', adminOnly, validate(episodeUploadUrlSchema), adminController.createEpisodeUpload);
router.get('/episodes/:id', adminOnly, adminController.getEpisode);
router.patch('/episodes/:id', adminOnly, validate(updateEpisodeSchema), adminController.updateEpisode);
router.delete('/episodes/:id', adminOnly, adminController.deleteEpisode);
router.post('/episodes/:id/uploaded', adminOnly, validate(episodeUploadCompleteSchema), adminController.markEpisodeUploaded);
router.post('/episodes/:id/transcode', adminOnly, validate(episodeTranscodeSchema), adminController.submitEpisodeTranscode);
router.post('/episodes/:id/transcode/status', adminOnly, validate(episodeTranscodeSchema), adminController.syncEpisodeTranscodeStatus);

router.post('/genres', adminOnly, validate(nameSchema), adminController.createGenre);
router.patch('/genres/:id', adminOnly, validate(nameSchema), adminController.updateGenre);
router.delete('/genres/:id', adminOnly, adminController.deleteGenre);

router.post('/countries', adminOnly, validate(nameSchema), adminController.createCountry);
router.patch('/countries/:id', adminOnly, validate(nameSchema), adminController.updateCountry);
router.delete('/countries/:id', adminOnly, adminController.deleteCountry);

router.get('/actors', adminOnly, adminController.listActors);
router.post('/actors', adminOnly, validate(personSchema), adminController.createActor);
router.patch('/actors/:id', adminOnly, validate(updatePersonSchema), adminController.updateActor);
router.delete('/actors/:id', adminOnly, adminController.deleteActor);

router.get('/directors', adminOnly, adminController.listDirectors);
router.post('/directors', adminOnly, validate(personSchema), adminController.createDirector);
router.patch('/directors/:id', adminOnly, validate(updatePersonSchema), adminController.updateDirector);
router.delete('/directors/:id', adminOnly, adminController.deleteDirector);

module.exports = router;
