import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { config } from './src/config/env.js';

const startServer = async () => {
  await connectDB();
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[MT-CTMS Server] Running on port ${config.port} (0.0.0.0)`);
    console.log(`🌍 Local / Internal: http://localhost:${config.port}`);
  });
};

startServer();
