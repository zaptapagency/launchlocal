import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { staff } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/booking/staff
 * Get all staff for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Missing tenantId' }, { status: 400 });
    }

    const allStaff = await db.select().from(staff).where(eq(staff.tenantId, tenantId));

    return NextResponse.json({
      success: true,
      staff: allStaff,
    });
  } catch (error) {
    console.error('GET /api/booking/staff error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch staff' }, { status: 500 });
  }
}

/**
 * POST /api/booking/staff
 * Create a new staff member
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
      displayName: z.string().min(1).max(255),
      avatarUrl: z.string().url().optional(),
      userId: z.string().uuid().optional(), // Optional link to user account
    });

    const parsed = schema.parse(body);

    const [staffMember] = await db
      .insert(staff)
      .values({
        tenantId,
        ...parsed,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        staff: staffMember,
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

    console.error('POST /api/booking/staff error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
