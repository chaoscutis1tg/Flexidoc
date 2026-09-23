import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { config } from './src/config/env.js';
import { initDailyBackupScheduler } from './src/utils/mongo-backup.util.js';

const startServer = async () => {
  await connectDB();
  initDailyBackupScheduler();
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[MT-CTMS Server] Running on port ${config.port} (0.0.0.0)`);
    console.log(`🌍 Local / Internal: http://localhost:${config.port}`);
  });
};

startServer();
