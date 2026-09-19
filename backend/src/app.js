import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// 1. Security Middlewares
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
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

// 5. Global Error Handler
app.use(errorHandler);

export default app;
