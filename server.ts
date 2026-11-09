import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './src/server/db/migrate.ts';
import { seedDatabase } from './src/server/seed.ts';
import { authMiddleware } from './src/server/middleware/auth.ts';
import { authRouter } from './src/server/routes/auth.ts';
import { therapistsRouter } from './src/server/routes/therapists.ts';
import { patientsRouter } from './src/server/routes/patients.ts';
import { appointmentsRouter } from './src/server/routes/appointments.ts';
import { painRouter } from './src/server/routes/pain.ts';
import { exercisesRouter } from './src/server/routes/exercises.ts';
import { therapistWorkspaceRouter } from './src/server/routes/therapistWorkspace.ts';
import { startCronJobs } from './src/server/cron.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // 1. Initialize DB migrations and seed
  try {
    runMigrations();
    await seedDatabase();
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  // 2. Schedule reminders
  startCronJobs();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares
  app.use(express.json());
  app.use(cookieParser());
  app.use(authMiddleware);

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/therapists', therapistsRouter);
  app.use('/api/patients', patientsRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/pain', painRouter);
  app.use('/api/exercises', exercisesRouter);
  app.use('/api/therapist-workspace', therapistWorkspaceRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'RECURA by Physio Hub',
      currency: 'PKR',
      timestamp: new Date().toISOString(),
    });
  });

  // Global API error handler
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({
      error: 'An unexpected internal error occurred. Please try again.',
    });
  });

  // Frontend integration: Vite middleware in dev, static files in production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 RECURA Server running on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
