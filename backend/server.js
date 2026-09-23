import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { config } from './src/config/env.js';
import { initDailyBackupScheduler } from './src/utils/mongo-backup.util.js';
import { organizationService } from './src/services/organization.service.js';

const startServer = async () => {
  await connectDB();
  await organizationService.syncOrganizationManagers().catch(err => console.error('Startup org manager sync error:', err));
  initDailyBackupScheduler();
  app.listen(config.port, '0.0.0.0', () => {
    console.log(` Running on port ${config.port} (0.0.0.0)`);
    console.log(`🌍 Local / Internal: http://localhost:${config.port}`);
  });
};

startServer();
