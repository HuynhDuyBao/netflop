const accountService = require('../services/account.service');
const adminDashboardService = require('../services/adminDashboard.service');
const catalogService = require('../services/catalog.service');
const movieService = require('../services/movie.service');
const notificationService = require('../services/notification.service');
const slugify = require('../utils/slugify');

async function logAdminActivity({ title, message, type = 'admin_activity', link = null }) {
  try {
    await notificationService.createPublicNotification({ title, message, type, link });
  } catch (error) {
    console.error('Khong the tao thong bao admin:', error.message);
  }
}

async function dashboard(req, res, next) {
  try {
    const data = await adminDashboardService.listDashboard({ period: req.query.period });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

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
    await logAdminActivity({
      title: 'Phim moi da duoc them',
      message: `Admin vua them phim "${movie.TenPhim || movie.name || req.body.name}".`,
      link: `/movies/${movie.MaPhim || movie.id}`
    });

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
    await logAdminActivity({
      title: 'Phim vua duoc cap nhat',
      message: `Admin vua cap nhat phim "${movie.TenPhim || movie.name || req.body.name || `#${req.params.id}`}".`,
      link: `/movies/${movie.MaPhim || movie.id || req.params.id}`
    });

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
    await logAdminActivity({
      title: 'Phim vua duoc go khoi he thong',
      message: `Admin vua xoa phim #${req.params.id}.`,
      type: 'admin_delete'
    });

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
    await logAdminActivity({
      title: 'The loai moi',
      message: `Admin vua them the loai "${genre.TenTheLoai || req.body.name}".`,
      link: `/genre/${slugify(req.body.name)}`
    });

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
    await logAdminActivity({
      title: 'The loai vua duoc cap nhat',
      message: `Admin vua cap nhat the loai "${genre.TenTheLoai || req.body.name}".`,
      link: `/genre/${slugify(req.body.name)}`
    });

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
    await logAdminActivity({
      title: 'The loai vua duoc xoa',
      message: `Admin vua xoa the loai #${req.params.id}.`,
      type: 'admin_delete'
    });

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
    await logAdminActivity({
      title: 'Quoc gia moi',
      message: `Admin vua them quoc gia "${country.TenQuocGia || req.body.name}".`,
      link: `/country/${slugify(req.body.name)}`
    });

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
    await logAdminActivity({
      title: 'Quoc gia vua duoc cap nhat',
      message: `Admin vua cap nhat quoc gia "${country.TenQuocGia || req.body.name}".`,
      link: `/country/${slugify(req.body.name)}`
    });

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
    await logAdminActivity({
      title: 'Quoc gia vua duoc xoa',
      message: `Admin vua xoa quoc gia #${req.params.id}.`,
      type: 'admin_delete'
    });

    res.json({
      success: true,
      message: 'Da xoa quoc gia.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCountry,
  createGenre,
  createMovie,
  dashboard,
  deleteCountry,
  deleteGenre,
  deleteMovie,
  getMovie,
  listMovies,
  listUsers,
  updateCountry,
  updateGenre,
  updateMovie,
  updateUserRole,
  updateUserStatus
};
