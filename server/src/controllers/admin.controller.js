const accountService = require('../services/account.service');
const catalogService = require('../services/catalog.service');
const movieService = require('../services/movie.service');
const personService = require('../services/person.service');

async function listUsers(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const search = req.query.search || '';
    const result = await accountService.listAccounts({ page, limit, search });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const user = await accountService.updateAccountRole(Number(req.params.id), req.body.role);

    res.json({
      success: true,
      message: 'Cap nhat vai tro thanh cong.',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await accountService.updateAccountStatus(Number(req.params.id), req.body.status);

    res.json({
      success: true,
      message: 'Cap nhat trang thai thanh cong.',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function listMovies(req, res, next) {
  try {
    const result = await movieService.listMovies({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search || '',
      genreId: req.query.genreId ? Number(req.query.genreId) : null,
      countryId: req.query.countryId ? Number(req.query.countryId) : null,
      year: req.query.year ? Number(req.query.year) : null,
      type: req.query.type || '',
      status: req.query.status || '',
      sort: req.query.sort || 'latest',
      publicOnly: false
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function listActors(req, res, next) {
  try {
    const result = await personService.listPeople('actors', req.query);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function createActor(req, res, next) {
  try {
    const actor = await personService.createPerson('actors', req.body);

    res.status(201).json({
      success: true,
      message: 'Da tao dien vien.',
      data: actor
    });
  } catch (error) {
    next(error);
  }
}

async function updateActor(req, res, next) {
  try {
    const actor = await personService.updatePerson('actors', Number(req.params.id), req.body);

    res.json({
      success: true,
      message: 'Da cap nhat dien vien.',
      data: actor
    });
  } catch (error) {
    next(error);
  }
}

async function deleteActor(req, res, next) {
  try {
    await personService.deletePerson('actors', Number(req.params.id));

    res.json({
      success: true,
      message: 'Da xoa dien vien.'
    });
  } catch (error) {
    next(error);
  }
}

async function listDirectors(req, res, next) {
  try {
    const result = await personService.listPeople('directors', req.query);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function createDirector(req, res, next) {
  try {
    const director = await personService.createPerson('directors', req.body);

    res.status(201).json({
      success: true,
      message: 'Da tao dao dien.',
      data: director
    });
  } catch (error) {
    next(error);
  }
}

async function updateDirector(req, res, next) {
  try {
    const director = await personService.updatePerson('directors', Number(req.params.id), req.body);

    res.json({
      success: true,
      message: 'Da cap nhat dao dien.',
      data: director
    });
  } catch (error) {
    next(error);
  }
}

async function deleteDirector(req, res, next) {
  try {
    await personService.deletePerson('directors', Number(req.params.id));

    res.json({
      success: true,
      message: 'Da xoa dao dien.'
    });
  } catch (error) {
    next(error);
  }
}

async function stats(req, res, next) {
  try {
    const result = await movieService.getAdminStats();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function listEpisodes(req, res, next) {
  try {
    const result = await movieService.listAdminEpisodes({
      page: req.query.page,
      limit: req.query.limit,
      movieId: req.query.movieId ? Number(req.query.movieId) : null
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function getEpisode(req, res, next) {
  try {
    const episode = await movieService.getAdminEpisodeById(Number(req.params.id));

    res.json({
      success: true,
      data: episode
    });
  } catch (error) {
    next(error);
  }
}

async function createEpisode(req, res, next) {
  try {
    const episode = await movieService.createEpisode(req.body);

    res.status(201).json({
      success: true,
      message: 'Da tao tap phim.',
      data: episode
    });
  } catch (error) {
    next(error);
  }
}

async function updateEpisode(req, res, next) {
  try {
    const episode = await movieService.updateEpisode(Number(req.params.id), req.body);

    res.json({
      success: true,
      message: 'Da cap nhat tap phim.',
      data: episode
    });
  } catch (error) {
    next(error);
  }
}

async function deleteEpisode(req, res, next) {
  try {
    await movieService.deleteEpisode(Number(req.params.id));

    res.json({
      success: true,
      message: 'Da xoa tap phim.'
    });
  } catch (error) {
    next(error);
  }
}

async function createEpisodeUpload(req, res, next) {
  try {
    const result = await movieService.createEpisodeUpload(req.body);

    res.status(201).json({
      success: true,
      message: 'Da tao URL upload tap phim.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function markEpisodeUploaded(req, res, next) {
  try {
    const episode = await movieService.markEpisodeUploaded(Number(req.params.id), req.body);

    res.json({
      success: true,
      message: 'Da danh dau tap phim da upload.',
      data: episode
    });
  } catch (error) {
    next(error);
  }
}

async function submitEpisodeTranscode(req, res, next) {
  try {
    const result = await movieService.submitEpisodeTranscode(Number(req.params.id), req.body);

    res.status(202).json({
      success: true,
      message: 'Da gui job MediaConvert.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function syncEpisodeTranscodeStatus(req, res, next) {
  try {
    const result = await movieService.syncEpisodeTranscodeStatus(Number(req.params.id), req.body);

    res.json({
      success: true,
      message: 'Da dong bo trang thai MediaConvert.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getMovie(req, res, next) {
  try {
    const movie = await movieService.getAdminMovieById(Number(req.params.id));

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    next(error);
  }
}

async function createMovie(req, res, next) {
  try {
    const movie = await movieService.createMovie(req.body);

    res.status(201).json({
      success: true,
      message: 'Da tao phim.',
      data: movie
    });
  } catch (error) {
    next(error);
  }
}

async function updateMovie(req, res, next) {
  try {
    const movie = await movieService.updateMovie(Number(req.params.id), req.body);

    res.json({
      success: true,
      message: 'Da cap nhat phim.',
      data: movie
    });
  } catch (error) {
    next(error);
  }
}

async function deleteMovie(req, res, next) {
  try {
    await movieService.deleteMovie(Number(req.params.id));

    res.json({
      success: true,
      message: 'Da xoa phim.'
    });
  } catch (error) {
    next(error);
  }
}

async function createGenre(req, res, next) {
  try {
    const genre = await catalogService.createGenre(req.body.name);

    res.status(201).json({
      success: true,
      message: 'Da tao the loai.',
      data: genre
    });
  } catch (error) {
    next(error);
  }
}

async function updateGenre(req, res, next) {
  try {
    const genre = await catalogService.updateGenre(Number(req.params.id), req.body.name);

    res.json({
      success: true,
      message: 'Da cap nhat the loai.',
      data: genre
    });
  } catch (error) {
    next(error);
  }
}

async function deleteGenre(req, res, next) {
  try {
    await catalogService.deleteGenre(Number(req.params.id));

    res.json({
      success: true,
      message: 'Da xoa the loai.'
    });
  } catch (error) {
    next(error);
  }
}

async function createCountry(req, res, next) {
  try {
    const country = await catalogService.createCountry(req.body.name);

    res.status(201).json({
      success: true,
      message: 'Da tao quoc gia.',
      data: country
    });
  } catch (error) {
    next(error);
  }
}

async function updateCountry(req, res, next) {
  try {
    const country = await catalogService.updateCountry(Number(req.params.id), req.body.name);

    res.json({
      success: true,
      message: 'Da cap nhat quoc gia.',
      data: country
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCountry(req, res, next) {
  try {
    await catalogService.deleteCountry(Number(req.params.id));

    res.json({
      success: true,
      message: 'Da xoa quoc gia.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createActor,
  createCountry,
  createDirector,
  createEpisode,
  createEpisodeUpload,
  createGenre,
  createMovie,
  deleteActor,
  deleteCountry,
  deleteDirector,
  deleteEpisode,
  deleteGenre,
  deleteMovie,
  getEpisode,
  getMovie,
  listActors,
  listDirectors,
  listEpisodes,
  listMovies,
  listUsers,
  markEpisodeUploaded,
  stats,
  submitEpisodeTranscode,
  syncEpisodeTranscodeStatus,
  updateActor,
  updateEpisode,
  updateCountry,
  updateDirector,
  updateGenre,
  updateMovie,
  updateUserRole,
  updateUserStatus
};
