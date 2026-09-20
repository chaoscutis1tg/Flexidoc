import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../../frontend/dist');

const app = express();

// 1. Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: config.corsOrigin === '*' ? true : (config.corsOrigin?.includes(',') ? config.corsOrigin.split(',') : config.corsOrigin),
  credentials: true,
}));

// 2. Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. NoSQL Injection Sanitization
app.use(mongoSanitize());

// 4. API Routes
app.use('/api/v1', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', system: 'MT-CTMS API Server', version: '1.0.0' });
});

// 5. Serve Frontend Static Files & SPA Routing Fallback
app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
    if (req.originalUrl.match(/\.(js|css|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
      return res.status(404).send('Not Found');
    }
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
  next();
});

// 6. Global Error Handler
app.use(errorHandler);

export default app;
