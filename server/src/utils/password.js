const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, storedPassword) {
  if (!storedPassword) {
    return false;
  }

  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
    return bcrypt.compare(password, storedPassword);
  }

  // Supports legacy local accounts that were saved as plain text.
  return password === storedPassword;
}

module.exports = {
  hashPassword,
  verifyPassword
};
