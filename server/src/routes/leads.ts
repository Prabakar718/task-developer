import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Helper to safely extract string query params
function qs(val: any): string | undefined {
  if (val === undefined || val === null) return undefined;
  return Array.isArray(val) ? val[0] : String(val);
}

router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search       = qs(req.query.search);
    const stage        = qs(req.query.stage);
    const assignedToId = qs(req.query.assignedToId);
    const source       = qs(req.query.source);
    const page         = qs(req.query.page)        || '1';
    const limit        = qs(req.query.limit)       || '20';
    const sortBy   = qs(req.query.sortBy)      || 'createdAt';
    const sortOrder    = qs(req.query.sortOrder)   || 'desc';

    const where: any = {};

    if (req.user!.role === 'SALES_EMPLOYEE') {
      where.assignedToId = req.user!.id;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stage)  where.stage  = stage;
    if (source) where.source = source;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { notes: true, bookings: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({ leads, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: String(req.params.id) },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        notes: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          include: {
            unit: { include: { building: { include: { project: { select: { id: true, name: true } } } } } },
            bookedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    if (req.user!.role === 'SALES_EMPLOYEE' && lead.assignedToId !== req.user!.id)
      return res.status(403).json({ error: 'Access denied.' });

    res.json({ lead });
  } catch (error) { next(error); }
});

router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').optional({ nullable: true }).isEmail(),
    body('stage').optional().isIn(['NEW','CONTACTED','SITE_VISIT','INTERESTED','NEGOTIATION','BOOKED','LOST']),
    body('source').optional().trim(),
    body('budget').optional({ nullable: true }).isFloat({ min: 0 }),
    body('followUpDate').optional({ nullable: true }).isISO8601(),
    body('assignedToId').optional({ nullable: true }).isUUID(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, email, phone, stage, source, budget, followUpDate, assignedToId } = req.body;
      const finalAssignedToId = req.user!.role === 'SALES_EMPLOYEE' ? req.user!.id : (assignedToId || null);

      const lead = await prisma.lead.create({
        data: {
          name, email: email || null, phone,
          stage: stage || 'NEW',
          source: source || null,
          budget: budget ? parseFloat(budget) : null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          assignedToId: finalAssignedToId,
        },
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
      });

      res.status(201).json({ lead });
    } catch (error) { next(error); }
  }
);

router.put('/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('email').optional({ nullable: true }).isEmail(),
    body('stage').optional().isIn(['NEW','CONTACTED','SITE_VISIT','INTERESTED','NEGOTIATION','BOOKED','LOST']),
    body('budget').optional({ nullable: true }).isFloat({ min: 0 }),
    body('followUpDate').optional({ nullable: true }),
    body('assignedToId').optional({ nullable: true }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const existing = await prisma.lead.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) return res.status(404).json({ error: 'Lead not found.' });

      if (req.user!.role === 'SALES_EMPLOYEE' && existing.assignedToId !== req.user!.id)
        return res.status(403).json({ error: 'Access denied.' });

      if (req.user!.role === 'SALES_EMPLOYEE' && req.body.assignedToId && req.body.assignedToId !== req.user!.id)
        return res.status(403).json({ error: 'Cannot reassign leads.' });

      const data: any = {};
      if (req.body.name         !== undefined) data.name         = req.body.name;
      if (req.body.email        !== undefined) data.email        = req.body.email || null;
      if (req.body.phone        !== undefined) data.phone        = req.body.phone;
      if (req.body.stage        !== undefined) data.stage        = req.body.stage;
      if (req.body.source       !== undefined) data.source       = req.body.source;
      if (req.body.budget       !== undefined) data.budget       = req.body.budget ? parseFloat(req.body.budget) : null;
      if (req.body.followUpDate !== undefined) data.followUpDate = req.body.followUpDate ? new Date(req.body.followUpDate) : null;
      if (req.body.assignedToId !== undefined && req.user!.role === 'ADMIN')
        data.assignedToId = req.body.assignedToId || null;

      const lead = await prisma.lead.update({
        where: { id: String(req.params.id) },
        data,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { notes: true, bookings: true } },
        },
      });

      res.json({ lead });
    } catch (error) { next(error); }
  }
);

router.delete('/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.lead.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Lead deleted successfully.' });
  } catch (error) { next(error); }
});

router.post('/:id/notes',
  [body('content').trim().notEmpty().withMessage('Note content is required')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const lead = await prisma.lead.findUnique({ where: { id: String(req.params.id) } });
      if (!lead) return res.status(404).json({ error: 'Lead not found.' });
      if (req.user!.role === 'SALES_EMPLOYEE' && lead.assignedToId !== req.user!.id)
        return res.status(403).json({ error: 'Access denied.' });

      const note = await prisma.leadNote.create({
        data: { content: req.body.content, leadId: String(req.params.id), userId: req.user!.id },
        include: { user: { select: { id: true, name: true } } },
      });

      res.status(201).json({ note });
    } catch (error) { next(error); }
  }
);

export default router;
