const express = require('express');
const Joi = require('joi');
const adminController = require('../controllers/admin.controller');
const contactController = require('../controllers/contact.controller');
const notificationController = require('../controllers/notification.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

const adminOnly = [authenticate, authorizeRoles('admin', 'super_admin')];

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'admin', 'moderator', 'super_admin').required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'banned').required()
});

const movieSchema = Joi.object({
  tmdbId: Joi.number().integer().positive().allow(null),
  tmdbType: Joi.string().valid('movie', 'tv').default('movie'),
  name: Joi.string().trim().min(1).max(100).required(),
  title: Joi.string().trim().max(255).allow('', null),
  description: Joi.string().trim().allow('', null),
  content: Joi.string().trim().allow('', null),
  duration: Joi.number().integer().min(0).allow(null),
  year: Joi.number().integer().min(1900).max(2100).allow(null),
  rating: Joi.number().min(0).max(10).allow(null),
  views: Joi.number().integer().min(0).allow(null),
  status: Joi.string().valid('Đang chiếu', 'Sắp chiếu', 'Đã kết thúc', 'Tạm dừng', 'Đã hủy').default('Đang chiếu'),
  type: Joi.string().valid('Lẻ', 'Bộ').default('Lẻ'),
  poster: Joi.string().trim().max(700).allow('', null),
  banner: Joi.string().trim().max(700).allow('', null),
  link: Joi.string().trim().max(700).allow('', null),
  trailerKey: Joi.string().trim().max(100).allow('', null),
  videoUrl: Joi.string().trim().max(700).allow('', null),
  countryId: Joi.number().integer().positive().allow(null),
  hlsMasterUrl: Joi.string().trim().max(700).allow('', null),
  isPublished: Joi.boolean().default(false),
  genreIds: Joi.array().items(Joi.number().integer().positive()).default([]),
  cast: Joi.array().items(Joi.object({
    tmdbId: Joi.number().integer().positive().allow(null),
    name: Joi.string().trim().min(1).max(150).required(),
    character: Joi.string().trim().max(150).allow('', null),
    profile: Joi.string().trim().max(700).allow('', null)
  })).default([]),
  directors: Joi.array().items(Joi.object({
    tmdbId: Joi.number().integer().positive().allow(null),
    name: Joi.string().trim().min(1).max(150).required(),
    job: Joi.string().trim().max(100).allow('', null),
    profile: Joi.string().trim().max(700).allow('', null)
  })).default([])
});

const updateMovieSchema = Joi.object({
  tmdbId: Joi.number().integer().positive().allow(null),
  tmdbType: Joi.string().valid('movie', 'tv'),
  name: Joi.string().trim().min(1).max(100),
  title: Joi.string().trim().max(255).allow('', null),
  description: Joi.string().trim().allow('', null),
  content: Joi.string().trim().allow('', null),
  duration: Joi.number().integer().min(0).allow(null),
  year: Joi.number().integer().min(1900).max(2100).allow(null),
  rating: Joi.number().min(0).max(10).allow(null),
  views: Joi.number().integer().min(0).allow(null),
  status: Joi.string().valid('Đang chiếu', 'Sắp chiếu', 'Đã kết thúc', 'Tạm dừng', 'Đã hủy'),
  type: Joi.string().valid('Lẻ', 'Bộ'),
  poster: Joi.string().trim().max(700).allow('', null),
  banner: Joi.string().trim().max(700).allow('', null),
  link: Joi.string().trim().max(700).allow('', null),
  trailerKey: Joi.string().trim().max(100).allow('', null),
  videoUrl: Joi.string().trim().max(700).allow('', null),
  countryId: Joi.number().integer().positive().allow(null),
  hlsMasterUrl: Joi.string().trim().max(700).allow('', null),
  isPublished: Joi.boolean(),
  genreIds: Joi.array().items(Joi.number().integer().positive()),
  cast: Joi.array().items(Joi.object({
    tmdbId: Joi.number().integer().positive().allow(null),
    name: Joi.string().trim().min(1).max(150).required(),
    character: Joi.string().trim().max(150).allow('', null),
    profile: Joi.string().trim().max(700).allow('', null)
  })),
  directors: Joi.array().items(Joi.object({
    tmdbId: Joi.number().integer().positive().allow(null),
    name: Joi.string().trim().min(1).max(150).required(),
    job: Joi.string().trim().max(100).allow('', null),
    profile: Joi.string().trim().max(700).allow('', null)
  }))
}).min(1);

const nameSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
});

const contactStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'reviewing', 'done').required()
});

const notificationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(180).required(),
  message: Joi.string().trim().min(1).max(2000).required(),
  type: Joi.string().trim().max(60).default('admin'),
  link: Joi.string().trim().max(500).allow('', null)
});

router.get('/dashboard', adminOnly, adminController.dashboard);
router.get('/users', adminOnly, adminController.listUsers);
router.patch('/users/:id/role', adminOnly, validate(updateRoleSchema), adminController.updateUserRole);
router.patch('/users/:id/status', adminOnly, validate(updateStatusSchema), adminController.updateUserStatus);

router.get('/contacts', adminOnly, contactController.listMessages);
router.patch('/contacts/:id/status', adminOnly, validate(contactStatusSchema), contactController.updateMessageStatus);

router.get('/notifications', adminOnly, notificationController.listPublicNotifications);
router.post('/notifications', adminOnly, validate(notificationSchema), notificationController.createPublicNotification);
router.delete('/notifications/:id', adminOnly, notificationController.deletePublicNotification);

router.get('/movies', adminOnly, adminController.listMovies);
router.post('/movies', adminOnly, validate(movieSchema), adminController.createMovie);
router.get('/movies/:id', adminOnly, adminController.getMovie);
router.patch('/movies/:id', adminOnly, validate(updateMovieSchema), adminController.updateMovie);
router.delete('/movies/:id', adminOnly, adminController.deleteMovie);

router.post('/genres', adminOnly, validate(nameSchema), adminController.createGenre);
router.patch('/genres/:id', adminOnly, validate(nameSchema), adminController.updateGenre);
router.delete('/genres/:id', adminOnly, adminController.deleteGenre);

router.post('/countries', adminOnly, validate(nameSchema), adminController.createCountry);
router.patch('/countries/:id', adminOnly, validate(nameSchema), adminController.updateCountry);
router.delete('/countries/:id', adminOnly, adminController.deleteCountry);

module.exports = router;
