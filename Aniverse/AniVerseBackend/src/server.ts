import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import watchRoutes from './routes/watch';

dotenv.config();

import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import userRoutes from './routes/user';
import searchRoutes from './routes/search';
import homeRoutes from './routes/home';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting — dakikada 100 istek
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.' },
});
app.use(limiter);

// ── Routes ────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/home', homeRoutes);
app.use('/api/v1/watch', watchRoutes);

// ── Health check ──────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'AniVerse API çalışıyor! 🚀' });
});

// ── 404 handler ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı.' });
});

// ── Error handler ─────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Sunucu hatası:', err.message);
  res.status(500).json({ error: 'Sunucu hatası oluştu.' });
});

// ── Sunucuyu başlat ───────────────────────────
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 AniVerse API çalışıyor: http://0.0.0.0:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/v1/health`);
});

export default app;