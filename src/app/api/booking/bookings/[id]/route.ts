import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBookingService } from '@/modules/booking/booking-service';

/**
 * GET /api/booking/bookings/[id]
 * Get booking details
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Missing tenantId' }, { status: 400 });
    }

    const { id } = await params;
    const service = getBookingService();
    const booking = await service.getBooking(tenantId, id);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('GET /api/booking/bookings/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 });
  }
}

/**
 * PATCH /api/booking/bookings/[id]
 * Update booking status (confirm, complete, mark no-show)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Missing tenantId' }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();

    const schema = z.object({
      action: z.enum(['confirm', 'complete', 'no_show', 'cancel', 'reschedule']),
      cancelReason: z.string().optional(),
      refundCents: z.number().int().optional(),
      newStartTime: z.string().datetime().optional(),
      newEndTime: z.string().datetime().optional(),
    });

    const parsed = schema.parse(body);
    const service = getBookingService();

    let booking;

    switch (parsed.action) {
      case 'confirm':
        booking = await service.confirmBooking(tenantId, id);
        break;

      case 'complete':
        booking = await service.completeBooking(tenantId, id);
        break;

      case 'no_show':
        booking = await service.markNoShow(tenantId, id);
        break;

      case 'cancel':
        booking = await service.cancelBooking(
          tenantId,
          id,
          parsed.cancelReason,
          parsed.refundCents
        );
        break;

      case 'reschedule':
        if (!parsed.newStartTime || !parsed.newEndTime) {
          return NextResponse.json(
            { success: false, error: 'Missing newStartTime or newEndTime for reschedule' },
            { status: 400 }
          );
        }
        booking = await service.rescheduleBooking(
          tenantId,
          id,
          new Date(parsed.newStartTime),
          new Date(parsed.newEndTime)
        );
        break;
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('PATCH /api/booking/bookings/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}
