import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import multer from 'multer';

import carsRouter from './routes/cars.js';
import authRouter from './routes/auth.js';
import settingsRouter from './routes/settings.js';
import uploadsRouter from './routes/uploads.js';
import { UPLOAD_DIR } from './storage.js';

const { MONGODB_URI, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
const missing = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing settings in server/.env: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // Render/Vercel sit behind a proxy; needed for correct rate limiting.

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const origins = (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim());
app.use(cors({ origin: origins.includes('*') ? true : origins }));
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/cars', carsRouter);
app.use('/api/uploads', uploadsRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be under 8 MB.' : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err.message?.startsWith('Only JPG')) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Try again.' });
});

const port = process.env.PORT || 5000;
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(port, () => console.log(`API running on port ${port}`));
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
