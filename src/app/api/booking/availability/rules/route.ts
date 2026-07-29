import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAvailabilityService } from '@/modules/booking/availability-service';

/**
 * GET /api/booking/availability/rules
 * Get all availability rules for a staff member
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const staffId = request.nextUrl.searchParams.get('staffId');

    if (!tenantId || !staffId) {
      return NextResponse.json(
        { success: false, error: 'Missing tenantId or staffId' },
        { status: 400 }
      );
    }

    const service = getAvailabilityService();
    const rules = await service.getRules(tenantId, staffId);

    return NextResponse.json({
      success: true,
      rules,
    });
  } catch (error) {
    console.error('GET /api/booking/availability/rules error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rules' }, { status: 500 });
  }
}

/**
 * POST /api/booking/availability/rules
 * Create a new availability rule
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
      staffId: z.string().uuid(),
      weekday: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
      endTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
    });

    const parsed = schema.parse(body);

    const service = getAvailabilityService();
    const rule = await service.createRule({
      tenantId,
      ...parsed,
    });

    return NextResponse.json(
      {
        success: true,
        rule,
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

    console.error('POST /api/booking/availability/rules error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create rule' }, { status: 500 });
  }
}
