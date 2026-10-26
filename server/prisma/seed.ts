import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.booking.deleteMany();
  await prisma.leadNote.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const salesPassword = await bcrypt.hash('sales123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'admin@estatecrm.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+91 98765 43210',
    },
  });

  // Also create Hari as Admin for convenient autofill login
  await prisma.user.create({
    data: {
      name: 'Hari (Admin)',
      email: 'hari2004shp@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+91 98765 43200',
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@estatecrm.com',
      password: salesPassword,
      role: 'SALES_EMPLOYEE',
      phone: '+91 98765 43211',
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: 'Amit Patel',
      email: 'amit@estatecrm.com',
      password: salesPassword,
      role: 'SALES_EMPLOYEE',
      phone: '+91 98765 43212',
    },
  });

  const sales3 = await prisma.user.create({
    data: {
      name: 'Sneha Reddy',
      email: 'sneha@estatecrm.com',
      password: salesPassword,
      role: 'SALES_EMPLOYEE',
      phone: '+91 98765 43213',
    },
  });

  console.log('✅ Users created');

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Sunrise Heights',
      location: 'Whitefield, Bangalore',
      description: 'Premium residential complex with world-class amenities including swimming pool, gym, and landscaped gardens.',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Green Valley Residences',
      location: 'Electronic City, Bangalore',
      description: 'Eco-friendly living spaces with green building certification and solar-powered common areas.',
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Royal Orchid Villas',
      location: 'Sarjapur Road, Bangalore',
      description: 'Luxury villa community with private gardens, clubhouse, and 24/7 concierge service.',
    },
  });

  console.log('✅ Projects created');

  // Create Buildings
  const building1A = await prisma.building.create({
    data: { name: 'Tower A', projectId: project1.id, floors: 15 },
  });

  const building1B = await prisma.building.create({
    data: { name: 'Tower B', projectId: project1.id, floors: 15 },
  });

  const building2A = await prisma.building.create({
    data: { name: 'Block 1', projectId: project2.id, floors: 10 },
  });

  const building2B = await prisma.building.create({
    data: { name: 'Block 2', projectId: project2.id, floors: 10 },
  });

  const building3A = await prisma.building.create({
    data: { name: 'Villa Zone A', projectId: project3.id, floors: 2 },
  });

  console.log('✅ Buildings created');

  // Create Units
  const unitTypes = ['ONE_BHK', 'TWO_BHK', 'THREE_BHK', 'FOUR_BHK'] as const;
  const unitAreas: Record<string, number> = {
    STUDIO: 450,
    ONE_BHK: 650,
    TWO_BHK: 1050,
    THREE_BHK: 1450,
    FOUR_BHK: 1850,
    PENTHOUSE: 2500,
    VILLA: 3200,
  };
  const basePrices: Record<string, number> = {
    STUDIO: 2500000,
    ONE_BHK: 4500000,
    TWO_BHK: 7200000,
    THREE_BHK: 9800000,
    FOUR_BHK: 13500000,
    PENTHOUSE: 22000000,
    VILLA: 35000000,
  };

  // Tower A units
  for (let floor = 1; floor <= 10; floor++) {
    for (let unit = 1; unit <= 4; unit++) {
      const typeIndex = (unit - 1) % 4;
      const type = unitTypes[typeIndex];
      await prisma.unit.create({
        data: {
          unitNumber: `A-${floor}0${unit}`,
          buildingId: building1A.id,
          type,
          floor,
          area: unitAreas[type] + Math.floor(Math.random() * 100),
          price: basePrices[type] + floor * 100000 + Math.floor(Math.random() * 500000),
          status: Math.random() > 0.7 ? 'BOOKED' : 'AVAILABLE',
        },
      });
    }
  }

  // Tower B units
  for (let floor = 1; floor <= 8; floor++) {
    for (let unit = 1; unit <= 3; unit++) {
      const typeIndex = unit - 1;
      const type = unitTypes[typeIndex];
      await prisma.unit.create({
        data: {
          unitNumber: `B-${floor}0${unit}`,
          buildingId: building1B.id,
          type,
          floor,
          area: unitAreas[type] + Math.floor(Math.random() * 100),
          price: basePrices[type] + floor * 100000 + Math.floor(Math.random() * 500000),
          status: 'AVAILABLE',
        },
      });
    }
  }

  // Block 1 units
  for (let floor = 1; floor <= 6; floor++) {
    for (let unit = 1; unit <= 4; unit++) {
      const type = unitTypes[(unit - 1) % 3];
      await prisma.unit.create({
        data: {
          unitNumber: `1-${floor}0${unit}`,
          buildingId: building2A.id,
          type,
          floor,
          area: unitAreas[type] + Math.floor(Math.random() * 100),
          price: basePrices[type] * 0.85 + floor * 80000,
          status: 'AVAILABLE',
        },
      });
    }
  }

  // Block 2 units
  for (let floor = 1; floor <= 6; floor++) {
    for (let unit = 1; unit <= 4; unit++) {
      const type = unitTypes[(unit - 1) % 3];
      await prisma.unit.create({
        data: {
          unitNumber: `2-${floor}0${unit}`,
          buildingId: building2B.id,
          type,
          floor,
          area: unitAreas[type] + Math.floor(Math.random() * 100),
          price: basePrices[type] * 0.85 + floor * 80000,
          status: 'AVAILABLE',
        },
      });
    }
  }

  // Villas
  for (let villa = 1; villa <= 8; villa++) {
    await prisma.unit.create({
      data: {
        unitNumber: `V-${villa.toString().padStart(2, '0')}`,
        buildingId: building3A.id,
        type: 'VILLA',
        floor: 0,
        area: 3200 + Math.floor(Math.random() * 800),
        price: 35000000 + Math.floor(Math.random() * 10000000),
        status: villa <= 2 ? 'SOLD' : 'AVAILABLE',
      },
    });
  }

  console.log('✅ Units created');

  // Create Leads
  const leadSources = ['Website', 'Walk-in', 'Referral', 'MagicBricks', '99acres', 'Housing.com', 'Facebook Ads', 'Google Ads'];
  const stages = ['NEW', 'CONTACTED', 'SITE_VISIT', 'INTERESTED', 'NEGOTIATION', 'BOOKED', 'LOST'] as const;
  const salesTeam = [sales1, sales2, sales3];

  const leadData = [
    { name: 'Vikram Malhotra', email: 'vikram.m@gmail.com', phone: '+91 98123 45001', budget: 8000000 },
    { name: 'Ananya Iyer', email: 'ananya.i@yahoo.com', phone: '+91 98123 45002', budget: 5000000 },
    { name: 'Karthik Nair', email: 'karthik.n@outlook.com', phone: '+91 98123 45003', budget: 12000000 },
    { name: 'Meera Joshi', email: 'meera.j@gmail.com', phone: '+91 98123 45004', budget: 7500000 },
    { name: 'Arjun Desai', email: 'arjun.d@gmail.com', phone: '+91 98123 45005', budget: 15000000 },
    { name: 'Divya Krishnan', email: 'divya.k@hotmail.com', phone: '+91 98123 45006', budget: 4500000 },
    { name: 'Rohan Gupta', email: 'rohan.g@gmail.com', phone: '+91 98123 45007', budget: 9000000 },
    { name: 'Sunita Rao', email: 'sunita.r@yahoo.com', phone: '+91 98123 45008', budget: 6000000 },
    { name: 'Nilesh Pandey', email: 'nilesh.p@gmail.com', phone: '+91 98123 45009', budget: 10000000 },
    { name: 'Pooja Verma', email: 'pooja.v@outlook.com', phone: '+91 98123 45010', budget: 35000000 },
    { name: 'Sanjay Mehta', email: 'sanjay.m@gmail.com', phone: '+91 98123 45011', budget: 7000000 },
    { name: 'Lakshmi Suresh', email: 'lakshmi.s@yahoo.com', phone: '+91 98123 45012', budget: 5500000 },
    { name: 'Deepak Sharma', email: null, phone: '+91 98123 45013', budget: 8500000 },
    { name: 'Kavita Nag', email: 'kavita.n@gmail.com', phone: '+91 98123 45014', budget: 11000000 },
    { name: 'Rahul Bhatia', email: 'rahul.b@gmail.com', phone: '+91 98123 45015', budget: 6500000 },
    { name: 'Nisha Agarwal', email: 'nisha.a@outlook.com', phone: '+91 98123 45016', budget: 9500000 },
    { name: 'Aditya Kulkarni', email: null, phone: '+91 98123 45017', budget: null },
    { name: 'Rekha Menon', email: 'rekha.m@gmail.com', phone: '+91 98123 45018', budget: 13000000 },
    { name: 'Vinod Saxena', email: 'vinod.s@yahoo.com', phone: '+91 98123 45019', budget: 7800000 },
    { name: 'Pallavi Rao', email: 'pallavi.r@gmail.com', phone: '+91 98123 45020', budget: 4800000 },
  ];

  const createdLeads = [];
  for (let i = 0; i < leadData.length; i++) {
    const data = leadData[i];
    const stageIndex = i % stages.length;
    const salesIndex = i % salesTeam.length;
    const sourceIndex = i % leadSources.length;

    const daysAgo = Math.floor(Math.random() * 30);
    const followUpDays = i % 3 === 0 ? -(i + 1) : Math.floor((i % 7) + 1); // mix of overdue & upcoming

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        stage: stages[stageIndex],
        source: leadSources[sourceIndex],
        budget: data.budget,
        assignedToId: salesTeam[salesIndex].id,
        followUpDate: stages[stageIndex] !== 'BOOKED' && stages[stageIndex] !== 'LOST'
          ? new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000)
          : null,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });

    createdLeads.push(lead);
  }

  console.log('✅ Leads created');

  // Create Notes for some leads
  const noteContents = [
    'Showed interest in 2BHK units near the garden area.',
    'Customer is comparing with a competitor project. Need to highlight our USPs.',
    'Called and scheduled a site visit for next weekend.',
    'Budget is flexible if EMI options are good.',
    'Wants east-facing flat on higher floor.',
    'Referred by existing customer Mr. Sharma.',
    'Looking for quick possession. Wants ready-to-move-in.',
    'Interested in investment purpose. Asked about rental yield.',
    'Requested floor plan and brochure via email.',
    'Very keen on the project. Moving to negotiation.',
  ];

  for (let i = 0; i < 15; i++) {
    const leadIndex = i % createdLeads.length;
    const salesIndex = i % salesTeam.length;
    const noteIndex = i % noteContents.length;

    await prisma.leadNote.create({
      data: {
        content: noteContents[noteIndex],
        leadId: createdLeads[leadIndex].id,
        userId: salesTeam[salesIndex].id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ Notes created');

  // Create some bookings for BOOKED stage leads
  const bookedLeads = createdLeads.filter(l => l.stage === 'BOOKED');
  const availableUnits = await prisma.unit.findMany({
    where: { status: 'AVAILABLE' },
    take: bookedLeads.length,
  });

  for (let i = 0; i < Math.min(bookedLeads.length, availableUnits.length); i++) {
    await prisma.booking.create({
      data: {
        leadId: bookedLeads[i].id,
        unitId: availableUnits[i].id,
        bookedById: salesTeam[i % salesTeam.length].id,
        amount: availableUnits[i].price,
        status: 'CONFIRMED',
        notes: 'Standard booking with all documentation complete.',
        bookingDate: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
      },
    });

    // Mark unit as booked
    await prisma.unit.update({
      where: { id: availableUnits[i].id },
      data: { status: 'BOOKED' },
    });
  }

  console.log('✅ Bookings created');

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin: admin@estatecrm.com / admin123');
  console.log('  Sales: priya@estatecrm.com / sales123');
  console.log('  Sales: amit@estatecrm.com / sales123');
  console.log('  Sales: sneha@estatecrm.com / sales123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
