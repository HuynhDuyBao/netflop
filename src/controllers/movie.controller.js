const movieService = require('../services/movie.service');

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
      sort: req.query.sort || 'latest'
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function getMovie(req, res, next) {
  try {
    const movie = await movieService.getMovieById(Number(req.params.id), req.user?.id);

    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    next(error);
  }
}

async function listEpisodes(req, res, next) {
  try {
    const episodes = await movieService.listEpisodes(Number(req.params.id));

    res.json({
      success: true,
      data: episodes
    });
  } catch (error) {
    next(error);
  }
}

async function addFavorite(req, res, next) {
  try {
    await movieService.addFavorite(Number(req.params.id), req.user.id);

    res.status(201).json({
      success: true,
      message: 'Da them phim vao danh sach yeu thich.'
    });
  } catch (error) {
    next(error);
  }
}

async function removeFavorite(req, res, next) {
  try {
    await movieService.removeFavorite(Number(req.params.id), req.user.id);

    res.json({
      success: true,
      message: 'Da xoa phim khoi danh sach yeu thich.'
    });
  } catch (error) {
    next(error);
  }
}

async function saveHistory(req, res, next) {
  try {
    await movieService.saveHistory({
      user: req.user,
      movieId: Number(req.params.id),
      episodeId: req.body.episodeId || null,
      watchedSeconds: req.body.watchedSeconds || 0
    });

    res.status(201).json({
      success: true,
      message: 'Da luu lich su xem.'
    });
  } catch (error) {
    next(error);
  }
}

async function rateMovie(req, res, next) {
  try {
    await movieService.rateMovie({
      user: req.user,
      movieId: Number(req.params.id),
      score: req.body.score,
      comment: req.body.comment || null
    });

    res.json({
      success: true,
      message: 'Da cap nhat danh gia.'
    });
  } catch (error) {
    next(error);
  }
}

async function listComments(req, res, next) {
  try {
    const result = await movieService.listComments(Number(req.params.id), {
      page: req.query.page,
      limit: req.query.limit
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function createComment(req, res, next) {
  try {
    const comment = await movieService.createComment({
      user: req.user,
      movieId: Number(req.params.id),
      content: req.body.content,
      parentId: req.body.parentId || null
    });

    res.status(201).json({
      success: true,
      message: 'Da them binh luan.',
      data: comment
    });
  } catch (error) {
    next(error);
  }
}

async function listFavorites(req, res, next) {
  try {
    const result = await movieService.listFavorites(req.user.id, {
      page: req.query.page,
      limit: req.query.limit
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function listHistory(req, res, next) {
  try {
    const result = await movieService.listHistory(req.user, {
      page: req.query.page,
      limit: req.query.limit
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
  addFavorite,
  createComment,
  getMovie,
  listComments,
  listEpisodes,
  listFavorites,
  listHistory,
  listMovies,
  rateMovie,
  removeFavorite,
  saveHistory
};
