import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Prisma unique constraint violation
  if ((err as any).code === 'P2002') {
    return res.status(409).json({ error: 'A record with this data already exists.' });
  }

  // Prisma record not found
  if ((err as any).code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }

  return res.status(500).json({ error: 'Internal server error.' });
};
