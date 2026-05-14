const app = require('./app');
const env = require('./config/env');
const { pingDatabase } = require('./config/database');

async function bootstrap() {
  try {
    await pingDatabase();
    console.log('Connected to MySQL.');

    app.listen(env.port, () => {
      console.log(`Netflop API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Cannot start server:', error.message);
    process.exit(1);
  }
}

bootstrap();
