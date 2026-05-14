const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/security.middleware');

const app = express();

const allowedOrigins = env.corsOrigin === '*'
  ? []
  : env.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

const corsOptions = env.corsOrigin === '*'
  ? { origin: true, credentials: true }
  : {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin khong duoc phep boi CORS.'));
    }
  };

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'http:', 'https:'],
      mediaSrc: ["'self'", 'http:', 'https:', 'blob:'],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors(corsOptions));
app.use('/api', apiLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Netflop API is running.'
  });
});

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
