import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getEnv } from '@/lib/config';
import * as schema from './schema';
import { v4 as uuid } from 'uuid';

const env = getEnv();

async function seed() {
  console.log('🌱 Starting seed...');

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    // Create demo superadmin user
    const adminId = uuid();
    await db
      .insert(schema.users)
      .values({
        id: adminId,
        email: 'admin@launchlocal.test',
        name: 'Admin User',
        emailVerified: true,
      })
      .onConflictDoNothing();

    console.log('✅ Admin user created');

    // Create demo tenant "Fade Factory"
    const tenantId = uuid();
    await db
      .insert(schema.tenants)
      .values({
        id: tenantId,
        slug: 'fade-factory',
        name: 'Fade Factory Barbershop',
        description: "Premium men's grooming and haircuts",
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        phone: '+966123456789',
        address: 'Riyadh, Saudi Arabia',
        categories: ['Barbershop', 'Hair Care'],
        brandColor: '#000000',
        publishedAt: new Date(),
      })
      .onConflictDoNothing();

    console.log('✅ Demo tenant created (Fade Factory)');

    // Create owner user and membership
    const ownerId = uuid();
    await db
      .insert(schema.users)
      .values({
        id: ownerId,
        email: 'owner@fadeactory.test',
        name: 'Owner Name',
        emailVerified: true,
      })
      .onConflictDoNothing();

    await db
      .insert(schema.memberships)
      .values({
        id: uuid(),
        userId: ownerId,
        tenantId,
        role: 'owner',
      })
      .onConflictDoNothing();

    console.log('✅ Owner user and membership created');

    // Create staff
    const staff1Id = uuid();
    const staff2Id = uuid();
    await db
      .insert(schema.staff)
      .values([
        {
          id: staff1Id,
          tenantId,
          displayName: 'Ahmad',
          active: true,
        },
        {
          id: staff2Id,
          tenantId,
          displayName: 'Mohammed',
          active: true,
        },
      ])
      .onConflictDoNothing();

    console.log('✅ Staff created');

    // Create services
    const service1Id = uuid();
    const service2Id = uuid();
    const service3Id = uuid();
    const service4Id = uuid();
    const service5Id = uuid();

    await db
      .insert(schema.services)
      .values([
        {
          id: service1Id,
          tenantId,
          name: 'Haircut',
          description: 'Classic haircut',
          durationMin: 30,
          priceCents: 5000, // 50 SAR
          paymentMode: 'deposit',
          depositCents: 2500, // 25 SAR deposit
          bufferBeforeMin: 10,
          bufferAfterMin: 10,
          active: true,
        },
        {
          id: service2Id,
          tenantId,
          name: 'Shave',
          description: 'Close shave and grooming',
          durationMin: 20,
          priceCents: 3000, // 30 SAR
          paymentMode: 'deposit',
          depositCents: 1500, // 15 SAR deposit
          bufferBeforeMin: 5,
          bufferAfterMin: 5,
          active: true,
        },
        {
          id: service3Id,
          tenantId,
          name: 'Haircut + Shave',
          description: 'Complete grooming package',
          durationMin: 45,
          priceCents: 7000, // 70 SAR
          paymentMode: 'full',
          bufferBeforeMin: 10,
          bufferAfterMin: 10,
          active: true,
        },
        {
          id: service4Id,
          tenantId,
          name: 'Beard Trim',
          description: 'Beard trim and shape',
          durationMin: 15,
          priceCents: 2000, // 20 SAR
          paymentMode: 'none',
          bufferBeforeMin: 5,
          bufferAfterMin: 5,
          active: true,
        },
        {
          id: service5Id,
          tenantId,
          name: 'Hair Coloring',
          description: 'Professional hair coloring',
          durationMin: 60,
          priceCents: 12000, // 120 SAR
          paymentMode: 'deposit',
          depositCents: 6000, // 60 SAR deposit
          bufferBeforeMin: 15,
          bufferAfterMin: 15,
          active: true,
        },
      ])
      .onConflictDoNothing();

    console.log('✅ Services created');

    // Assign services to staff
    await db
      .insert(schema.staffServices)
      .values([
        { id: uuid(), staffId: staff1Id, serviceId: service1Id },
        { id: uuid(), staffId: staff1Id, serviceId: service2Id },
        { id: uuid(), staffId: staff1Id, serviceId: service3Id },
        { id: uuid(), staffId: staff1Id, serviceId: service4Id },
        { id: uuid(), staffId: staff1Id, serviceId: service5Id },
        { id: uuid(), staffId: staff2Id, serviceId: service1Id },
        { id: uuid(), staffId: staff2Id, serviceId: service2Id },
        { id: uuid(), staffId: staff2Id, serviceId: service3Id },
      ])
      .onConflictDoNothing();

    console.log('✅ Staff services assigned');

    // Create availability rules (9 AM - 6 PM, closed Fridays)
    const days = [1, 2, 3, 4, 5, 6]; // Monday-Saturday (0=Sunday, 5=Friday)
    for (const day of days) {
      if (day === 5) continue; // Skip Friday
      await db
        .insert(schema.availabilityRules)
        .values([
          {
            id: uuid(),
            tenantId,
            staffId: staff1Id,
            weekday: day,
            startTime: '09:00',
            endTime: '18:00',
          },
          {
            id: uuid(),
            tenantId,
            staffId: staff2Id,
            weekday: day,
            startTime: '09:00',
            endTime: '18:00',
          },
        ])
        .onConflictDoNothing();
    }

    console.log('✅ Availability rules created');

    // Create demo customers
    const customer1Id = uuid();
    const customer2Id = uuid();
    const customer3Id = uuid();

    await db
      .insert(schema.customers)
      .values([
        {
          id: customer1Id,
          tenantId,
          email: 'customer1@example.com',
          name: 'Ahmed Al-Dosari',
          phone: '+966501234567',
          marketingOptIn: true,
        },
        {
          id: customer2Id,
          tenantId,
          email: 'customer2@example.com',
          name: 'Saud Al-Shehri',
          phone: '+966502345678',
          marketingOptIn: false,
        },
        {
          id: customer3Id,
          tenantId,
          email: 'customer3@example.com',
          name: 'Khalid Al-Harbi',
          phone: '+966503456789',
          marketingOptIn: true,
        },
      ])
      .onConflictDoNothing();

    console.log('✅ Demo customers created');

    // Create sample bookings (mix of past, today, and future)
    const now = new Date();
    const riyadhOffset = 3; // UTC+3
    const bookings = [
      // Past bookings
      {
        id: uuid(),
        tenantId,
        serviceId: service1Id,
        staffId: staff1Id,
        customerId: customer1Id,
        status: 'completed' as const,
        startTime: new Date(new Date().setDate(now.getDate() - 5) + riyadhOffset * 3600000),
        endTime: new Date(new Date().setDate(now.getDate() - 5) + (riyadhOffset + 0.5) * 3600000),
        priceCents: 5000,
        depositCents: 2500,
        noShowFeeCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuid(),
        tenantId,
        serviceId: service2Id,
        staffId: staff2Id,
        customerId: customer2Id,
        status: 'completed' as const,
        startTime: new Date(new Date().setDate(now.getDate() - 3) + riyadhOffset * 3600000),
        endTime: new Date(new Date().setDate(now.getDate() - 3) + (riyadhOffset + 0.33) * 3600000),
        priceCents: 3000,
        depositCents: 1500,
        noShowFeeCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Today/upcoming
      {
        id: uuid(),
        tenantId,
        serviceId: service1Id,
        staffId: staff1Id,
        customerId: customer3Id,
        status: 'confirmed' as const,
        startTime: new Date(now.getTime() + 2 * 3600000),
        endTime: new Date(now.getTime() + 2.5 * 3600000),
        priceCents: 5000,
        depositCents: 2500,
        noShowFeeCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Future bookings
      {
        id: uuid(),
        tenantId,
        serviceId: service3Id,
        staffId: staff2Id,
        customerId: customer1Id,
        status: 'confirmed' as const,
        startTime: new Date(new Date().setDate(now.getDate() + 2) + (riyadhOffset + 9) * 3600000),
        endTime: new Date(new Date().setDate(now.getDate() + 2) + (riyadhOffset + 9.75) * 3600000),
        priceCents: 7000,
        depositCents: 0,
        noShowFeeCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuid(),
        tenantId,
        serviceId: service1Id,
        staffId: staff1Id,
        customerId: customer2Id,
        status: 'pending' as const,
        startTime: new Date(new Date().setDate(now.getDate() + 5) + (riyadhOffset + 10) * 3600000),
        endTime: new Date(new Date().setDate(now.getDate() + 5) + (riyadhOffset + 10.5) * 3600000),
        priceCents: 5000,
        depositCents: 2500,
        noShowFeeCents: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const booking of bookings) {
      await db.insert(schema.bookings).values(booking).onConflictDoNothing();
    }

    console.log('✅ Sample bookings created (5 bookings)');

    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('Demo credentials:');
    console.log('  Admin email: admin@launchlocal.test');
    console.log('  Owner email: owner@fadeactory.test');
    console.log('  Tenant slug: fade-factory');
    console.log('  Tenant timezone: Asia/Riyadh');
    console.log('');
    console.log('Demo site: http://fade-factory.lvh.me:3000');
    console.log('Dashboard: http://localhost:3000/dashboard');
    console.log('');
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
