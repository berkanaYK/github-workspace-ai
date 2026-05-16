import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ── GET /search ───────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { query, type, page = 1, limit = 20 } = req.query;

    if (!query || (query as string).length < 2) {
      return res.status(400).json({ error: 'Arama terimi en az 2 karakter olmalı.' });
    }

    const where: any = {
      OR: [
        { title: { contains: query as string, mode: 'insensitive' } },
        { titleAlt: { contains: query as string, mode: 'insensitive' } },
        { synopsis: { contains: query as string, mode: 'insensitive' } },
      ],
    };

    if (type && type !== 'all') {
      where.type = (type as string).toUpperCase();
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { popularity: 'desc' },
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
    console.error('Search error:', error);
    res.status(500).json({ error: 'Arama yapılamadı.' });
  }
});

export default router;