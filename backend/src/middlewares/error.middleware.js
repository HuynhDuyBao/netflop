function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'API endpoint khong ton tai.'
  });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Server error.',
    details: error.details || undefined
  });
}

module.exports = {
  errorHandler,
  notFound
};
