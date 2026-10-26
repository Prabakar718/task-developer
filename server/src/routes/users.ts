import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
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
    const role   = qs(req.query.role);
    const active = qs(req.query.active);
    const where: any = {};
    if (role)              where.role   = role;
    if (active !== undefined) where.active = active === 'true';

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, active: true, createdAt: true,
        _count: { select: { assignedLeads: true, bookings: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ users });
  } catch (error) { next(error); }
});

router.post('/', authorize('ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').isIn(['ADMIN', 'SALES_EMPLOYEE']).withMessage('Invalid role'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
      if (existing) return res.status(409).json({ error: 'Email already registered.' });

      const hashedPassword = await bcrypt.hash(req.body.password, 12);
      const user = await prisma.user.create({
        data: {
          name: req.body.name, email: req.body.email,
          password: hashedPassword, role: req.body.role,
          phone: req.body.phone || null,
        },
        select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
      });
      res.status(201).json({ user });
    } catch (error) { next(error); }
  }
);

router.put('/:id/toggle-active', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.id === req.user!.id) return res.status(400).json({ error: 'Cannot deactivate your own account.' });

    const updated = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { active: !user.active },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    res.json({ user: updated });
  } catch (error) { next(error); }
});

export default router;
