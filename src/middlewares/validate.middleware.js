const HttpError = require('../utils/httpError');

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      next(new HttpError(422, 'Du lieu gui len khong hop le.', error.details.map((item) => item.message)));
      return;
    }

    req[property] = value;
    next();
  };
}

module.exports = validate;
