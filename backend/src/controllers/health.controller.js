const { pingDatabase } = require('../config/database');

async function health(req, res, next) {
  try {
    await pingDatabase();

    res.json({
      success: true,
      message: 'API va MySQL dang hoat dong.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  health
};
