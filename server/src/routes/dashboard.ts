import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/dashboard — Dashboard stats
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';
    const userId = req.user!.id;

    // Base filters for sales employees
    const leadWhere = isAdmin ? {} : { assignedToId: userId };
    const bookingWhere = isAdmin ? {} : { bookedById: userId };

    // Lead counts by stage
    const leadsByStage = await prisma.lead.groupBy({
      by: ['stage'],
      where: leadWhere,
      _count: { stage: true },
    });

    const totalLeads = leadsByStage.reduce((sum, s) => sum + s._count.stage, 0);

    // Follow-ups: overdue + next 7 days (excludes null followUpDate)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const followUpWhere = {
      ...leadWhere,
      followUpDate: { not: null, lte: nextWeek },
      stage: { notIn: ['BOOKED', 'LOST'] as any },
    };

    const [overdueFollowUps, upcomingFollowUps] = await Promise.all([
      prisma.lead.count({
        where: {
          ...leadWhere,
          followUpDate: { not: null, lt: now },
          stage: { notIn: ['BOOKED', 'LOST'] as any },
        },
      }),
      prisma.lead.findMany({
        where: followUpWhere,
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { followUpDate: 'asc' },
        take: 10,
      }),
    ]);

    // Booking stats
    const bookingStats = await prisma.booking.groupBy({
      by: ['status'],
      where: bookingWhere,
      _count: { status: true },
      _sum: { amount: true },
    });

    const totalBookings = bookingStats.reduce((sum, s) => sum + s._count.status, 0);
    const totalRevenue = bookingStats
      .filter(s => s.status !== 'CANCELLED')
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    // Recent leads
    const recentLeads = await prisma.lead.findMany({
      where: leadWhere,
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        lead: { select: { id: true, name: true } },
        unit: {
          include: {
            building: {
              include: { project: { select: { id: true, name: true } } },
            },
          },
        },
        bookedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Property stats (global for all users)
    const unitStats = await prisma.unit.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const totalUnits = unitStats.reduce((sum, s) => sum + s._count.status, 0);
    const availableUnits = unitStats.find(s => s.status === 'AVAILABLE')?._count.status || 0;

    // Lead source breakdown
    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: leadWhere,
      _count: { source: true },
    });

    // Monthly leads trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyLeads = await prisma.lead.groupBy({
      by: ['createdAt'],
      where: {
        ...leadWhere,
        createdAt: { gte: sixMonthsAgo },
      },
      _count: { id: true },
    });

    res.json({
      stats: {
        totalLeads,
        totalBookings,
        totalRevenue,
        totalUnits,
        availableUnits,
        overdueFollowUps,
      },
      leadsByStage: leadsByStage.map(s => ({
        stage: s.stage,
        count: s._count.stage,
      })),
      leadsBySource: leadsBySource.map(s => ({
        source: s.source || 'Unknown',
        count: s._count.source,
      })),
      bookingStats: bookingStats.map(s => ({
        status: s.status,
        count: s._count.status,
        amount: s._sum.amount || 0,
      })),
      recentLeads,
      recentBookings,
      upcomingFollowUps,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
