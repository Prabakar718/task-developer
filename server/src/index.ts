import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';
import propertyRoutes from './routes/properties';
import bookingRoutes from './routes/bookings';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/users';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Auto-seed initial users & project if database is empty
async function ensureSeedData() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 Empty database detected. Auto-seeding initial users and inventory...');
      const bcrypt = require('bcryptjs');
      const adminPassword = await bcrypt.hash('admin123', 12);
      const salesPassword = await bcrypt.hash('sales123', 12);

      // Create Admin accounts
      await prisma.user.create({
        data: {
          name: 'Rajesh Kumar (Admin)',
          email: 'admin@estatecrm.com',
          password: adminPassword,
          role: 'ADMIN',
          phone: '+91 98765 43210',
        },
      });

      await prisma.user.create({
        data: {
          name: 'Hari (Admin)',
          email: 'hari2004shp@gmail.com',
          password: adminPassword,
          role: 'ADMIN',
          phone: '+91 98765 43200',
        },
      });

      // Create Sales Rep
      await prisma.user.create({
        data: {
          name: 'Priya Sharma',
          email: 'priya@estatecrm.com',
          password: salesPassword,
          role: 'SALES_EMPLOYEE',
          phone: '+91 98765 43211',
        },
      });

      // Create Sample Project & Units
      const project = await prisma.project.create({
        data: {
          name: 'Sunrise Heights',
          location: 'Whitefield, Bangalore',
          description: 'Luxury residential high-rise with premium clubhouse and gardens.',
        },
      });

      const building = await prisma.building.create({
        data: { name: 'Tower A', projectId: project.id, floors: 10 },
      });

      for (let floor = 1; floor <= 6; floor++) {
        await prisma.unit.create({
          data: {
            unitNumber: `A-${floor}01`,
            buildingId: building.id,
            type: 'TWO_BHK',
            floor,
            area: 1150,
            price: 7500000 + floor * 100000,
            status: 'AVAILABLE',
          },
        });
        await prisma.unit.create({
          data: {
            unitNumber: `A-${floor}02`,
            buildingId: building.id,
            type: 'THREE_BHK',
            floor,
            area: 1550,
            price: 9800000 + floor * 100000,
            status: 'AVAILABLE',
          },
        });
      }

      console.log('✅ Auto-seed complete: Admin accounts (admin@estatecrm.com & hari2004shp@gmail.com) ready!');
    }
  } catch (err) {
    console.error('Auto-seed notice:', err);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await ensureSeedData();
});

export default app;
