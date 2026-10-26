import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import jwt, { type SignOptions } from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_OPTS: SignOptions = { expiresIn: '7d' };

router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
      if (!user.active) return res.status(403).json({ error: 'Account is deactivated. Contact admin.' });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).json({ error: 'Invalid email or password.' });

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, JWT_OPTS);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error) { next(error); }
  }
);

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['ADMIN', 'SALES_EMPLOYEE']).withMessage('Invalid role'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, email, password, role, phone } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered.' });

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role: role || 'SALES_EMPLOYEE', phone },
        select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
      });

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, JWT_OPTS);
      res.status(201).json({ token, user });
    } catch (error) { next(error); }
  }
);

router.get('/me', authenticate, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
