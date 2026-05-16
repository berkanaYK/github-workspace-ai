import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ── GET /users/:id ────────────────────────────
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true,
        avatar: true, bio: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı bilgisi alınamadı.' });
  }
});

// ── PATCH /users/:id ──────────────────────────
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (req.userId !== id) {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }
    const { username, bio, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { username, bio, avatar },
    });
    res.json({ username: user.username, bio: user.bio, avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ error: 'Profil güncellenemedi.' });
  }
});

// ── GET /users/:id/favorites ──────────────────
router.get('/:id/favorites', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { content: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(favorites.map(f => f.content));
  } catch (error) {
    res.status(500).json({ error: 'Favoriler alınamadı.' });
  }
});

// ── POST /users/:id/favorites/toggle ──────────
router.post('/:id/favorites/toggle', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { contentId } = req.body;
    const existing = await prisma.favorite.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      res.json({ isFavorite: false });
    } else {
      await prisma.favorite.create({
        data: { userId, contentId },
      });
      res.json({ isFavorite: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Favori işlemi başarısız.' });
  }
});

// ── GET /users/:id/progress ───────────────────
router.get('/:id/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: { content: true },
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'İlerleme bilgisi alınamadı.' });
  }
});

// ── PUT /users/:id/progress/:contentId ────────
router.put('/:id/progress/:contentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const contentId = req.params.contentId as string;
    const { watchStatus, lastEpisodeId, lastEpisodeNumber, lastEpisodeTimestamp,
            lastChapterId, lastChapterNumber, lastPageIndex,
            lastNovelChapterId, lastNovelPosition } = req.body;

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_contentId: { userId, contentId },
      },
      update: {
        watchStatus, lastEpisodeId, lastEpisodeNumber, lastEpisodeTimestamp,
        lastChapterId, lastChapterNumber, lastPageIndex,
        lastNovelChapterId, lastNovelPosition,
      },
      create: {
        userId, contentId,
        watchStatus: watchStatus || 'WATCHING',
        lastEpisodeId, lastEpisodeNumber, lastEpisodeTimestamp,
        lastChapterId, lastChapterNumber, lastPageIndex,
        lastNovelChapterId, lastNovelPosition,
      },
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'İlerleme kaydedilemedi.' });
  }
});

// ── GET /users/:id/history ────────────────────
router.get('/:id/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      prisma.viewHistory.findMany({
        where: { userId },
        include: { content: true },
        orderBy: { viewedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.viewHistory.count({ where: { userId } }),
    ]);
    res.json({
      data: data.map(h => h.content),
      total,
      page: Number(page),
      limit: Number(limit),
      hasMore: skip + Number(limit) < total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Geçmiş alınamadı.' });
  }
});

export default router;