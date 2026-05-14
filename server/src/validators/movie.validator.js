const Joi = require('joi');

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

module.exports = {
  commentSchema,
  historySchema,
  ratingSchema
};
