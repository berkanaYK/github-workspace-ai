import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ── POST /auth/register ───────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, şifre ve kullanıcı adı gerekli.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });
    }

    // Email veya username zaten var mı?
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username }] },
    });

    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı.' });
      }
      return res.status(409).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12);

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        username,
      },
    });

    res.status(201).json({
      message: 'Kayıt başarılı!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
  }
});

// ── POST /auth/login ──────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email ve şifre gerekli.' });
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }

    // Şifre doğrula
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }

    // Token oluştur
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Session kaydet
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
      },
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        language: user.language,
        theme: user.theme,
        createdAt: user.createdAt,
        preferences: {
          language: user.language,
          theme: user.theme,
          notifications: {
            newEpisode: true,
            newChapter: true,
            favorites: true,
            announcements: true,
          },
          contentFilters: [],
        },
      },
      token,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
  }
});

// ── POST /auth/refresh ────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token gerekli.' });
    }

    // Token doğrula
    const decoded = verifyRefreshToken(refreshToken);

    // Session bul
    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }

    // Yeni token oluştur
    const newToken = generateToken(decoded.userId);

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Geçersiz token.' });
  }
});

// ── POST /auth/logout ─────────────────────────
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Kullanıcının tüm session'larını sil
    await prisma.session.deleteMany({
      where: { userId: req.userId },
    });

    res.json({ message: 'Çıkış yapıldı.' });
  } catch (error) {
    res.status(500).json({ error: 'Çıkış sırasında hata oluştu.' });
  }
});

// ── GET /auth/me ──────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        language: true,
        theme: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Profil bilgisi alınamadı.' });
  }
});

export default router;