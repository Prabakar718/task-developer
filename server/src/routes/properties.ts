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

// ── PROJECTS ──────────────────────────────────────────────

router.get('/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search     = qs(req.query.search);
    const where: any = {};
    if (search) {
      where.OR = [
        { name:     { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: { select: { buildings: true } },
        buildings: { include: { _count: { select: { units: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const projectsWithStats = await Promise.all(projects.map(async (project) => {
      const unitStats = await prisma.unit.groupBy({
        by: ['status'],
        where: { building: { projectId: project.id } },
        _count: { status: true },
      });
      const totalUnits     = unitStats.reduce((s, u) => s + u._count.status, 0);
      const availableUnits = unitStats.find(u => u.status === 'AVAILABLE')?._count.status || 0;
      const bookedUnits    = unitStats.find(u => u.status === 'BOOKED')?._count.status    || 0;
      const soldUnits      = unitStats.find(u => u.status === 'SOLD')?._count.status      || 0;
      return { ...project, totalUnits, availableUnits, bookedUnits, soldUnits };
    }));

    res.json({ projects: projectsWithStats });
  } catch (error) { next(error); }
});

router.get('/projects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: String(req.params.id) },
      include: {
        buildings: {
          include: {
            units: { orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }] },
            _count: { select: { units: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ project });
  } catch (error) { next(error); }
});

router.post('/projects', authorize('ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('description').optional().trim(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const project = await prisma.project.create({
        data: { name: req.body.name, location: req.body.location, description: req.body.description || null },
      });
      res.status(201).json({ project });
    } catch (error) { next(error); }
  }
);

router.put('/projects/:id', authorize('ADMIN'),
  [
    body('name').optional().trim().notEmpty(),
    body('location').optional().trim().notEmpty(),
    body('description').optional().trim(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await prisma.project.update({ where: { id: String(req.params.id) }, data: req.body });
      res.json({ project });
    } catch (error) { next(error); }
  }
);

// ── BUILDINGS ─────────────────────────────────────────────

router.get('/buildings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId  = qs(req.query.projectId);
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const buildings = await prisma.building.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, location: true } },
        _count: { select: { units: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ buildings });
  } catch (error) { next(error); }
});

router.post('/buildings', authorize('ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Building name is required'),
    body('projectId').isUUID().withMessage('Valid project ID is required'),
    body('floors').isInt({ min: 1 }).withMessage('Floors must be at least 1'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const building = await prisma.building.create({
        data: { name: req.body.name, projectId: req.body.projectId, floors: parseInt(req.body.floors) },
        include: { project: { select: { id: true, name: true } } },
      });
      res.status(201).json({ building });
    } catch (error) { next(error); }
  }
);

router.put('/buildings/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const building = await prisma.building.update({
      where: { id: String(req.params.id) },
      data: req.body,
      include: { project: { select: { id: true, name: true } } },
    });
    res.json({ building });
  } catch (error) { next(error); }
});

// ── UNITS ─────────────────────────────────────────────────

router.get('/units', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buildingId = qs(req.query.buildingId);
    const projectId  = qs(req.query.projectId);
    const status     = qs(req.query.status);
    const type       = qs(req.query.type);
    const minPrice   = qs(req.query.minPrice);
    const maxPrice   = qs(req.query.maxPrice);

    const where: any = {};
    if (buildingId) where.buildingId = buildingId;
    if (projectId)  where.building   = { projectId };
    if (status)     where.status     = status;
    if (type)       where.type       = type;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const units = await prisma.unit.findMany({
      where,
      include: {
        building: { include: { project: { select: { id: true, name: true, location: true } } } },
      },
      orderBy: [{ building: { name: 'asc' } }, { floor: 'asc' }, { unitNumber: 'asc' }],
    });
    res.json({ units });
  } catch (error) { next(error); }
});

router.post('/units', authorize('ADMIN'),
  [
    body('unitNumber').trim().notEmpty().withMessage('Unit number is required'),
    body('buildingId').isUUID().withMessage('Valid building ID is required'),
    body('type').isIn(['STUDIO','ONE_BHK','TWO_BHK','THREE_BHK','FOUR_BHK','PENTHOUSE','VILLA','PLOT','COMMERCIAL']),
    body('floor').isInt({ min: 0 }).withMessage('Floor must be 0 or greater'),
    body('area').isFloat({ min: 1 }).withMessage('Area must be positive'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const unit = await prisma.unit.create({
        data: {
          unitNumber: req.body.unitNumber,
          buildingId: req.body.buildingId,
          type:       req.body.type,
          floor:      parseInt(req.body.floor),
          area:       parseFloat(req.body.area),
          price:      parseFloat(req.body.price),
        },
        include: { building: { include: { project: { select: { id: true, name: true } } } } },
      });
      res.status(201).json({ unit });
    } catch (error) { next(error); }
  }
);

router.put('/units/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: any = {};
    if (req.body.unitNumber       !== undefined) data.unitNumber = req.body.unitNumber;
    if (req.body.type             !== undefined) data.type       = req.body.type;
    if (req.body.floor            !== undefined) data.floor      = parseInt(req.body.floor);
    if (req.body.area             !== undefined) data.area       = parseFloat(req.body.area);
    if (req.body.price            !== undefined) data.price      = parseFloat(req.body.price);
    if (req.body.status           !== undefined) data.status     = req.body.status;

    const unit = await prisma.unit.update({
      where: { id: String(req.params.id) },
      data,
      include: { building: { include: { project: { select: { id: true, name: true } } } } },
    });
    res.json({ unit });
  } catch (error) { next(error); }
});

export default router;
