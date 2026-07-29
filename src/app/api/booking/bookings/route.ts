import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBookingService } from '@/modules/booking/booking-service';

/**
 * POST /api/booking/bookings
 * Create a new booking with payment hold
 *
 * Returns booking with cancelToken for public reschedule/cancel links
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
      serviceId: z.string().uuid(),
      staffId: z.string().uuid().optional(),
      customerId: z.string().uuid(),
      startTime: z.string().datetime(), // ISO 8601
      endTime: z.string().datetime(), // ISO 8601
      priceCents: z.number().int().nonnegative(),
      depositCents: z.number().int().nonnegative().optional(),
      stripePaymentIntentId: z.string().optional(),
      source: z.string().optional(),
    });

    const parsed = schema.parse(body);

    const service = getBookingService();
    const booking = await service.createBooking({
      tenantId,
      serviceId: parsed.serviceId,
      staffId: parsed.staffId || null,
      customerId: parsed.customerId,
      startTime: new Date(parsed.startTime),
      endTime: new Date(parsed.endTime),
      priceCents: parsed.priceCents,
      depositCents: parsed.depositCents,
      stripePaymentIntentId: parsed.stripePaymentIntentId,
      source: parsed.source,
    });

    return NextResponse.json(
      {
        success: true,
        booking,
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

    console.error('POST /api/booking/bookings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
