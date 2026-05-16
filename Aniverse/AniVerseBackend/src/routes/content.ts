import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ── GET /content ──────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, status, sortBy, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (type) where.type = (type as string).toUpperCase();
    if (status) where.status = (status as string).toUpperCase();

    const orderBy: any = {};
    if (sortBy === 'rating') orderBy.rating = 'desc';
    else if (sortBy === 'newest') orderBy.createdAt = 'desc';
    else if (sortBy === 'title') orderBy.title = 'asc';
    else orderBy.popularity = 'desc';

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
        include: {
          genres: { include: { genre: true } },
        },
      }),
      prisma.content.count({ where }),
    ]);

    res.json({
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      hasMore: skip + Number(limit) < total,
    });
  } catch (error: any) {
    console.error('Content list error:', error);
    res.status(500).json({ error: 'İçerik listesi alınamadı.' });
  }
});

// ── GET /content/:id ──────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        seasons: {
          orderBy: { number: 'asc' },
          include: {
            episodes: { orderBy: { number: 'asc' } },
          },
        },
        chapters: { orderBy: { number: 'desc' } },
        novelChapters: { orderBy: { number: 'desc' } },
        relatedFrom: {
          include: {
            to: { select: { id: true, title: true, type: true, coverImage: true } },
          },
        },
        characters: { include: { character: true } },
      },
    });

    if (!content) {
      return res.status(404).json({ error: 'İçerik bulunamadı.' });
    }

    res.json(content);
  } catch (error: any) {
    console.error('Content detail error:', error);
    res.status(500).json({ error: 'İçerik detayı alınamadı.' });
  }
});

export default router;