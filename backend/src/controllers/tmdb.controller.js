const tmdbService = require('../services/tmdb.service');

async function search(req, res, next) {
  try {
    const result = await tmdbService.search({
      query: req.query.query || req.query.q || '',
      page: req.query.page || 1,
      type: req.query.type || 'movie'
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function importMovie(req, res, next) {
  try {
    const movie = await tmdbService.getDetail(req.body.tmdbId || req.params.tmdbId, req.body.type || 'movie');

    res.json({
      success: true,
      message: 'Da lay thong tin phim tu TMDB.',
      data: movie
    });
  } catch (error) {
    next(error);
  }
}

async function getTrailer(req, res, next) {
  try {
    const trailer = await tmdbService.getBestTrailer(req.params.tmdbId, req.params.type || 'movie');

    if (!trailer) {
      res.status(404).json({
        success: false,
        message: 'Khong tim thay trailer cho phim nay.'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Lay trailer thanh cong.',
      trailer
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTrailer,
  importMovie,
  search
};
