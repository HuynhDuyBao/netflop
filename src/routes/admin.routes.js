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

router.get('/users', adminOnly, adminController.listUsers);
router.patch('/users/:id/role', adminOnly, validate(updateRoleSchema), adminController.updateUserRole);
router.patch('/users/:id/status', adminOnly, validate(updateStatusSchema), adminController.updateUserStatus);

module.exports = router;
