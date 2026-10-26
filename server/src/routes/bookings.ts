import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Helper to safely extract string query params
function qs(val: any): string | undefined {
  if (val === undefined || val === null) return undefined;
  return Array.isArray(val) ? val[0] : String(val);
}

router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status  = qs(req.query.status);
    const leadId  = qs(req.query.leadId);
    const page    = qs(req.query.page)   || '1';
    const limit   = qs(req.query.limit)  || '20';

    const where: any = {};
    if (status) where.status = status;
    if (leadId) where.leadId = leadId;
    if (req.user!.role === 'SALES_EMPLOYEE') where.bookedById = req.user!.id;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          lead: { select: { id: true, name: true, phone: true, email: true } },
          unit: { include: { building: { include: { project: { select: { id: true, name: true, location: true } } } } } },
          bookedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ bookings, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) { next(error); }
});

router.post('/',
  [
    body('leadId').isUUID().withMessage('Valid lead ID is required'),
    body('unitId').isUUID().withMessage('Valid unit ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be non-negative'),
    body('notes').optional().trim(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { leadId, unitId, amount, notes } = req.body;

      const booking = await prisma.$transaction(async (tx) => {
        const unit = await tx.unit.findUnique({ where: { id: unitId } });
        if (!unit) throw new AppError('Unit not found.', 404);
        if (unit.status !== 'AVAILABLE') throw new AppError('This unit is no longer available.', 409);

        const lead = await tx.lead.findUnique({ where: { id: leadId } });
        if (!lead) throw new AppError('Lead not found.', 404);

        const existingBooking = await tx.booking.findFirst({ where: { leadId, unitId, status: { not: 'CANCELLED' } } });
        if (existingBooking) throw new AppError('This lead already has an active booking for this unit.', 409);

        await tx.unit.update({ where: { id: unitId }, data: { status: 'BOOKED' } });
        await tx.lead.update({ where: { id: leadId }, data: { stage: 'BOOKED' } });

        return tx.booking.create({
          data: { leadId, unitId, bookedById: req.user!.id, amount: parseFloat(amount), notes: notes || null, status: 'CONFIRMED' },
          include: {
            lead: { select: { id: true, name: true, phone: true, email: true } },
            unit: { include: { building: { include: { project: { select: { id: true, name: true } } } } } },
            bookedBy: { select: { id: true, name: true } },
          },
        });
      });

      res.status(201).json({ booking });
    } catch (error) { next(error); }
  }
);

router.put('/:id/cancel', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({ where: { id: String(req.params.id) }, include: { unit: true } });
      if (!existing) throw new AppError('Booking not found.', 404);
      if (existing.status === 'CANCELLED') throw new AppError('Booking is already cancelled.', 400);

      await tx.unit.update({ where: { id: existing.unitId }, data: { status: 'AVAILABLE' } });

      return tx.booking.update({
        where: { id: String(req.params.id) },
        data: { status: 'CANCELLED' },
        include: {
          lead: { select: { id: true, name: true } },
          unit: { include: { building: { include: { project: { select: { id: true, name: true } } } } } },
          bookedBy: { select: { id: true, name: true } },
        },
      });
    });

    res.json({ booking });
  } catch (error) { next(error); }
});

export default router;
