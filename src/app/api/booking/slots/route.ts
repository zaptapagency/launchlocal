import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { services, staff, availabilityRules, availabilityOverrides, bookings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateSlots } from '@/modules/booking/slot-engine';
import type { SlotEngineInput } from '@/modules/booking/slot-engine';
import { tenants } from '@/db/schema';

/**
 * POST /api/booking/slots
 * Generate available booking slots for a service/staff combination
 *
 * Returns slots that are:
 * - Within availability rules/overrides
 * - Not conflicting with existing bookings
 * - 15-minute intervals
 * - Timezone-correct
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
      staffId: z.string().uuid(),
      searchStartDate: z.string().datetime(), // ISO 8601
      searchEndDate: z.string().datetime(), // ISO 8601
    });

    const parsed = schema.parse(body);

    // Fetch tenant timezone
    const [tenantData] = await db.select().from(tenants).where(eq(tenants.id, tenantId));

    if (!tenantData) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Fetch service
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.tenantId, tenantId), eq(services.id, parsed.serviceId)));

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    // Fetch staff
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.tenantId, tenantId), eq(staff.id, parsed.staffId)));

    if (!staffMember) {
      return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    }

    // Fetch availability rules for this staff
    const rules = await db
      .select()
      .from(availabilityRules)
      .where(
        and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.staffId, parsed.staffId))
      );

    // Fetch availability overrides
    const overrides = await db
      .select()
      .from(availabilityOverrides)
      .where(
        and(
          eq(availabilityOverrides.tenantId, tenantId),
          eq(availabilityOverrides.staffId, parsed.staffId)
        )
      );

    // Fetch existing bookings in the search range
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, tenantId),
          eq(bookings.staffId, parsed.staffId),
          eq(bookings.serviceId, parsed.serviceId)
        )
      );

    // Convert availability overrides to slot engine format
    const overridesForSlotEngine = overrides.map((o) => ({
      date: o.date,
      closed: o.closed,
      startTime: o.startTime || undefined,
      endTime: o.endTime || undefined,
    }));

    // Convert availability rules to slot engine format (time strings only)
    const rulesForSlotEngine = rules.map((r) => ({
      weekday: r.weekday,
      startTime: r.startTime,
      endTime: r.endTime,
    }));

    // Build slot engine input
    const slotEngineInput: SlotEngineInput = {
      staffId: parsed.staffId,
      serviceId: parsed.serviceId,
      tenantTimezone: tenantData.timezone,
      serviceDurationMinutes: service.durationMin,
      bufferBeforeMinutes: service.bufferBeforeMin,
      bufferAfterMinutes: service.bufferAfterMin,
      searchStartDate: new Date(parsed.searchStartDate),
      searchEndDate: new Date(parsed.searchEndDate),
      availabilityRules: rulesForSlotEngine,
      overrides: overridesForSlotEngine,
      existingBookings: existingBookings.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    };

    // Generate slots
    const slots = generateSlots(slotEngineInput);

    return NextResponse.json({
      success: true,
      slots,
      metadata: {
        timezone: tenantData.timezone,
        serviceName: service.name,
        staffName: staffMember.displayName,
        totalSlots: slots.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('POST /api/booking/slots error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate slots',
      },
      { status: 500 }
    );
  }
}
