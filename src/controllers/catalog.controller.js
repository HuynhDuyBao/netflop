const catalogService = require('../services/catalog.service');

async function listGenres(req, res, next) {
  try {
    const genres = await catalogService.listGenres();

    res.json({
      success: true,
      data: genres
    });
  } catch (error) {
    next(error);
  }
}

async function listCountries(req, res, next) {
  try {
    const countries = await catalogService.listCountries();

    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCountries,
  listGenres
};
