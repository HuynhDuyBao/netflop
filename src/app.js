const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

const allowedOrigins = env.corsOrigin === '*'
  ? '*'
  : env.corsOrigin.split(',').map((origin) => origin.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Netflop API is running.',
    docs: {
      health: '/api/health',
      movies: 'GET /api/movies',
      genres: 'GET /api/catalog/genres',
      countries: 'GET /api/catalog/countries',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      favorites: 'GET /api/me/favorites',
      adminUsers: 'GET /api/admin/users'
    }
  });
});

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
