const express = require('express');
const Joi = require('joi');
const adminController = require('../controllers/admin.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

const adminOnly = [authenticate, authorizeRoles('admin')];

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'admin', 'moderator').required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'banned').required()
});

const movieSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  title: Joi.string().trim().max(255).allow('', null),
  description: Joi.string().trim().allow('', null),
  content: Joi.string().trim().allow('', null),
  duration: Joi.number().integer().min(0).allow(null),
  year: Joi.number().integer().min(1900).max(2100).allow(null),
  rating: Joi.number().min(0).max(10).allow(null),
  views: Joi.number().integer().min(0).allow(null),
  status: Joi.string().valid('Đang chiếu', 'Sắp chiếu', 'Đã kết thúc').default('Đang chiếu'),
  type: Joi.string().valid('Lẻ', 'Bộ').default('Lẻ'),
  poster: Joi.string().trim().max(255).allow('', null),
  banner: Joi.string().trim().max(255).allow('', null),
  link: Joi.string().trim().max(255).allow('', null),
  countryId: Joi.number().integer().positive().allow(null),
  hlsMasterUrl: Joi.string().trim().max(700).allow('', null),
  isPublished: Joi.boolean().default(false),
  genreIds: Joi.array().items(Joi.number().integer().positive()).default([]),
  actorIds: Joi.array().items(Joi.number().integer().positive()).default([]),
  directorIds: Joi.array().items(Joi.number().integer().positive()).default([])
});

const updateMovieSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  title: Joi.string().trim().max(255).allow('', null),
  description: Joi.string().trim().allow('', null),
  content: Joi.string().trim().allow('', null),
  duration: Joi.number().integer().min(0).allow(null),
  year: Joi.number().integer().min(1900).max(2100).allow(null),
  rating: Joi.number().min(0).max(10).allow(null),
  views: Joi.number().integer().min(0).allow(null),
  status: Joi.string().valid('Đang chiếu', 'Sắp chiếu', 'Đã kết thúc'),
  type: Joi.string().valid('Lẻ', 'Bộ'),
  poster: Joi.string().trim().max(255).allow('', null),
  banner: Joi.string().trim().max(255).allow('', null),
  link: Joi.string().trim().max(255).allow('', null),
  countryId: Joi.number().integer().positive().allow(null),
  hlsMasterUrl: Joi.string().trim().max(700).allow('', null),
  isPublished: Joi.boolean(),
  genreIds: Joi.array().items(Joi.number().integer().positive()),
  actorIds: Joi.array().items(Joi.number().integer().positive()),
  directorIds: Joi.array().items(Joi.number().integer().positive())
}).min(1);

const nameSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
});

const personSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  birthDate: Joi.date().iso().allow('', null),
  countryId: Joi.number().integer().positive().allow(null),
  bio: Joi.string().trim().allow('', null),
  image: Joi.string().trim().max(255).allow('', null)
});

const updatePersonSchema = personSchema.fork(['name'], (schema) => schema.optional()).min(1);

const episodeSchema = Joi.object({
  movieId: Joi.number().integer().positive().required(),
  name: Joi.string().trim().max(50).allow('', null),
  link: Joi.string().trim().max(255).allow('', null),
  originalFile: Joi.string().trim().max(255).allow('', null),
  hlsUrl: Joi.string().trim().max(255).allow('', null),
  cloudfrontUrl: Joi.string().trim().max(700).allow('', null),
  status: Joi.string().trim().max(255).default('active'),
  duration: Joi.number().integer().min(0).allow(null),
  uploadStatus: Joi.string().valid('pending', 'uploading', 'uploaded', 'processing', 'ready', 'failed', 'deleted').default('ready')
});

const updateEpisodeSchema = episodeSchema.fork(['movieId'], (schema) => schema.optional()).min(1);

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
router.get('/episodes/:id', adminOnly, adminController.getEpisode);
router.patch('/episodes/:id', adminOnly, validate(updateEpisodeSchema), adminController.updateEpisode);
router.delete('/episodes/:id', adminOnly, adminController.deleteEpisode);

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
