import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBookingService } from '@/modules/booking/booking-service';

/**
 * GET /api/public/bookings/[token]
 * Public endpoint to get booking details using cancel token
 * No authentication required - customer just needs the token from their email
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 });
    }

    const service = getBookingService();
    const booking = await service.getBookingByToken(token);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // Only expose non-sensitive data publicly
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    console.error('GET /api/public/bookings/[token] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 });
  }
}

/**
 * PATCH /api/public/bookings/[token]
 * Public endpoint to reschedule or cancel booking using cancel token
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 });
    }

    const body = await request.json();

    const schema = z.object({
      action: z.enum(['cancel', 'reschedule']),
      cancelReason: z.string().optional(),
      newStartTime: z.string().datetime().optional(),
      newEndTime: z.string().datetime().optional(),
    });

    const parsed = schema.parse(body);
    const service = getBookingService();
    const booking = await service.getBookingByToken(token);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    let updated;

    if (parsed.action === 'cancel') {
      updated = await service.cancelBooking(booking.tenantId, booking.id, parsed.cancelReason);
    } else if (parsed.action === 'reschedule') {
      if (!parsed.newStartTime || !parsed.newEndTime) {
        return NextResponse.json(
          { success: false, error: 'Missing newStartTime or newEndTime' },
          { status: 400 }
        );
      }
      updated = await service.rescheduleBooking(
        booking.tenantId,
        booking.id,
        new Date(parsed.newStartTime),
        new Date(parsed.newEndTime)
      );
    }

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('PATCH /api/public/bookings/[token] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}
