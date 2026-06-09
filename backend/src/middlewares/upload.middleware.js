let multer = null;

try {
  multer = require('multer');
} catch (error) {
  multer = null;
}

function missingMulter(req, res) {
  res.status(500).json({
    success: false,
    message: 'Missing dependency multer. Run: npm --prefix backend install'
  });
}

const upload = multer
  ? multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 1024 * 1024 * 1024
      }
    })
  : null;

module.exports = upload || {
  single: () => missingMulter
};
