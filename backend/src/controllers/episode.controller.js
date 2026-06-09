const episodeModel = require('../models/episode.model');
const HttpError = require('../utils/httpError');

async function list(req, res, next) {
  try {
    const episodes = await episodeModel.list({
      movieId: req.query.movieId ? Number(req.query.movieId) : null
    });

    res.json({ success: true, data: episodes });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const episode = await episodeModel.create(req.body);
    res.status(201).json({ success: true, message: 'Da tao tap phim.', data: episode });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const episode = await episodeModel.update(Number(req.params.id), req.body);

    if (!episode) {
      throw new HttpError(404, 'Khong tim thay tap phim.');
    }

    res.json({ success: true, message: 'Da cap nhat tap phim.', data: episode });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const removed = await episodeModel.remove(Number(req.params.id));

    if (!removed) {
      throw new HttpError(404, 'Khong tim thay tap phim.');
    }

    res.json({ success: true, message: 'Da xoa tap phim.' });
  } catch (error) {
    next(error);
  }
}

async function createSubtitle(req, res, next) {
  try {
    const subtitle = await episodeModel.createSubtitle(Number(req.params.id), req.body);
    res.status(201).json({ success: true, message: 'Đã thêm phụ đề.', data: subtitle });
  } catch (error) {
    next(error);
  }
}

async function removeSubtitle(req, res, next) {
  try {
    const removed = await episodeModel.removeSubtitle(Number(req.params.id), Number(req.params.subtitleId));
    if (!removed) throw new HttpError(404, 'Không tìm thấy phụ đề.');
    res.json({ success: true, message: 'Đã xóa phụ đề.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  createSubtitle,
  list,
  remove,
  removeSubtitle,
  update
};
