const catalogService = require('../services/catalog.service');
const personService = require('../services/person.service');

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

async function listActors(req, res, next) {
  try {
    const result = await personService.listPeople('actors', {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search || '',
      countryId: req.query.countryId ? Number(req.query.countryId) : null
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function listDirectors(req, res, next) {
  try {
    const result = await personService.listPeople('directors', {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search || '',
      countryId: req.query.countryId ? Number(req.query.countryId) : null
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listActors,
  listCountries,
  listDirectors,
  listGenres
};
