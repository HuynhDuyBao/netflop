const Joi = require('joi');

const movieStatusValues = ['Đang chiếu', 'Sắp chiếu', 'Đã kết thúc'];
const movieTypeValues = ['Lẻ', 'Bộ'];
const uploadStatusValues = ['pending', 'uploading', 'uploaded', 'processing', 'ready', 'failed', 'deleted'];

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
  status: Joi.string().valid(...movieStatusValues).default('Đang chiếu'),
  type: Joi.string().valid(...movieTypeValues).default('Lẻ'),
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
  status: Joi.string().valid(...movieStatusValues),
  type: Joi.string().valid(...movieTypeValues),
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
  uploadStatus: Joi.string().valid(...uploadStatusValues).default('ready')
});

const updateEpisodeSchema = episodeSchema.fork(['movieId'], (schema) => schema.optional()).min(1);

const episodeUploadUrlSchema = Joi.object({
  movieId: Joi.number().integer().positive().required(),
  name: Joi.string().trim().max(50).allow('', null),
  fileName: Joi.string().trim().min(1).max(255).required(),
  contentType: Joi.string().trim().max(100).default('video/mp4'),
  fileSizeBytes: Joi.number().integer().min(0).allow(null),
  duration: Joi.number().integer().min(0).allow(null)
});

const episodeUploadCompleteSchema = Joi.object({
  fileSizeBytes: Joi.number().integer().min(0).allow(null)
});

const episodeTranscodeSchema = Joi.object({
  publishMovieWhenReady: Joi.boolean().default(false)
});

module.exports = {
  episodeTranscodeSchema,
  episodeSchema,
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
};
