function success(res, data = null, message = 'OK') {
  return res.json({ success: true, message, data });
}

function error(res, status = 500, message = 'Internal server error') {
  return res.status(status).json({ success: false, message });
}

module.exports = {
  success,
  error
};
