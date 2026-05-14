const express = require('express');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const movieRoutes = require('./movie.routes');
const catalogRoutes = require('./catalog.routes');
const healthController = require('../controllers/health.controller');
const movieController = require('../controllers/movie.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

function proxyUrl(url) {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}

function rewritePlaylist(playlist, sourceUrl) {
  return playlist
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => {
          const absolute = new URL(uri, sourceUrl).toString();
          return `URI="${proxyUrl(absolute)}"`;
        });
      }

      return proxyUrl(new URL(trimmed, sourceUrl).toString());
    })
    .join('\n');
}

router.get('/health', healthController.health);
router.get('/stream', async (req, res, next) => {
  try {
    if (!req.query.url || typeof req.query.url !== 'string') {
      return res.status(400).json({ success: false, message: 'Thieu URL stream.' });
    }

    const target = new URL(req.query.url);

    if (!['http:', 'https:'].includes(target.protocol)) {
      return res.status(400).json({ success: false, message: 'URL stream khong hop le.' });
    }

    const upstream = await fetch(target, {
      headers: req.headers.range ? { Range: req.headers.range } : undefined,
      signal: AbortSignal.timeout(30000)
    });
    const contentType = upstream.headers.get('content-type') || '';

    if (target.pathname.endsWith('.m3u8') || contentType.includes('mpegurl')) {
      const playlist = await upstream.text();
      res.status(upstream.status);
      res.setHeader('content-type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.send(rewritePlaylist(playlist, target.toString()));
      return;
    }

    res.status(upstream.status);
    ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'].forEach((header) => {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/movies', movieRoutes);
router.use('/catalog', catalogRoutes);
router.get('/me/favorites', authenticate, movieController.listFavorites);
router.get('/me/history', authenticate, movieController.listHistory);

module.exports = router;
