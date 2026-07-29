import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/booking/services
 * Get all services for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Missing tenantId' }, { status: 400 });
    }

    const allServices = await db.select().from(services).where(eq(services.tenantId, tenantId));

    return NextResponse.json({
      success: true,
      services: allServices,
    });
  } catch (error) {
    console.error('GET /api/booking/services error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/booking/services
 * Create a new service
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Missing tenantId' }, { status: 400 });
    }

    const body = await request.json();

    // Validate input
    const schema = z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      durationMin: z.number().int().positive(),
      priceCents: z.number().int().nonnegative(),
      paymentMode: z.enum(['none', 'deposit', 'full']).default('deposit'),
      depositCents: z.number().int().nonnegative().optional(),
      bufferBeforeMin: z.number().int().nonnegative().default(0),
      bufferAfterMin: z.number().int().nonnegative().default(0),
    });

    const parsed = schema.parse(body);

    const [service] = await db
      .insert(services)
      .values({
        tenantId,
        ...parsed,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        service,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/booking/services error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
