const app = require('./app');
const env = require('./config/env');
const { pingDatabase } = require('./config/database');
const mediaConvertJob = require('./jobs/mediaConvertJob');

async function bootstrap() {
  try {
    await pingDatabase();
    console.log('Connected to MySQL.');

    app.listen(env.port, () => {
      console.log(`Netflop API listening on http://localhost:${env.port}`);
      if (env.nodeEnv !== 'test') {
        mediaConvertJob();
        console.log('MediaConvert watcher started.');
      }
    });
  } catch (error) {
    console.error('Cannot start server:', error.message);
    process.exit(1);
  }
}

bootstrap();
