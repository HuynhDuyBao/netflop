const { authorizeRoles } = require('./auth.middleware');

module.exports = authorizeRoles('admin', 'super_admin');
