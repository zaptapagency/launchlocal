import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  eachDayOfInterval,
  startOfDay as startOfDayUTC,
  endOfDay as endOfDayUTC,
  addMinutes,
  isBefore,
  isAfter,
} from 'date-fns';

/**
 * Slot Engine — The moat of LaunchLocal
 *
 * Generates available booking slots that are:
 * - Timezone-correct (tenant's IANA timezone)
 * - DST-proof (handles spring-forward and fall-back)
 * - Double-booking-proof (never overlaps with existing bookings)
 * - Buffer-aware (service before/after buffers)
 * - Rule-respecting (weekly availability rules + date overrides)
 *
 * All math happens in tenant's local timezone, stored as UTC in DB.
 */

export interface SlotEngineInput {
  staffId: string;
  serviceId: string;
  tenantTimezone: string; // e.g., "America/New_York", "Asia/Riyadh"
  serviceDurationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  searchStartDate: Date; // UTC
  searchEndDate: Date; // UTC
  availabilityRules: Array<{
    weekday: number; // 0 = Sunday, 6 = Saturday
    startTime: string; // HH:MM in tenant's timezone
    endTime: string; // HH:MM in tenant's timezone
  }>;
  overrides: Array<{
    date: string; // YYYY-MM-DD
    closed: boolean;
    startTime?: string; // HH:MM if not closed
    endTime?: string; // HH:MM if not closed
  }>;
  existingBookings: Array<{
    startTime: Date; // UTC
    endTime: Date; // UTC
  }>;
}

export interface GeneratedSlot {
  startTime: Date; // UTC
  endTime: Date; // UTC
  localStart: string; // Display: "2:00 PM" in tenant timezone
  localEnd: string; // Display: "2:30 PM"
}

/**
 * Generate available booking slots
 *
 * Core algorithm:
 * 1. For each day in the search range
 * 2. Get availability rules for that weekday
 * 3. Apply date overrides (closures or custom hours)
 * 4. Generate 15-minute slots within available windows
 * 5. Filter out slots that conflict with existing bookings
 * 6. Filter out slots within buffer periods
 * 7. Convert all times to UTC for storage
 */
export function generateSlots(input: SlotEngineInput): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];

  // Get all days in the search range
  const days = eachDayOfInterval({
    start: startOfDayUTC(input.searchStartDate),
    end: endOfDayUTC(input.searchEndDate),
  });

  for (const day of days) {
    // Convert UTC day to tenant's local date for lookup
    const localDay = toZonedTime(day, input.tenantTimezone);
    const dateStr = localDay.toISOString().split('T')[0]; // YYYY-MM-DD
    const weekday = localDay.getDay();

    // Check for date override (closure or custom hours)
    const override = input.overrides.find((o) => o.date === dateStr);

    if (override?.closed) {
      continue; // Skip this day, it's closed
    }

    // Get availability window for this day
    let startTimeStr: string | undefined;
    let endTimeStr: string | undefined;

    if (override && override.startTime && override.endTime) {
      // Use custom hours from override
      startTimeStr = override.startTime;
      endTimeStr = override.endTime;
    } else {
      // Use recurring rule for this weekday
      const rule = input.availabilityRules.find((r) => r.weekday === weekday);
      if (!rule) {
        continue; // No availability on this weekday
      }
      startTimeStr = rule.startTime;
      endTimeStr = rule.endTime;
    }

    // Generate 15-minute slots within the available window
    const daySlots = generateDaySlots({
      day: localDay,
      startTimeStr,
      endTimeStr,
      serviceDurationMinutes: input.serviceDurationMinutes,
      bufferBeforeMinutes: input.bufferBeforeMinutes,
      bufferAfterMinutes: input.bufferAfterMinutes,
      timezone: input.tenantTimezone,
      existingBookings: input.existingBookings,
    });

    slots.push(...daySlots);
  }

  return slots;
}

/**
 * Generate slots for a single day
 */
function generateDaySlots(params: {
  day: Date; // Local time (result of toZonedTime)
  startTimeStr: string; // HH:MM
  endTimeStr: string; // HH:MM
  serviceDurationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  timezone: string;
  existingBookings: Array<{ startTime: Date; endTime: Date }>;
}): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  const slotDurationMinutes = 15; // Always 15-min slots

  // Parse start and end times from HH:MM strings
  const [startHour, startMin] = params.startTimeStr.split(':').map(Number);
  const [endHour, endMin] = params.endTimeStr.split(':').map(Number);

  // Create start and end times in the local timezone
  const slotStart = new Date(params.day);
  slotStart.setHours(startHour, startMin, 0, 0);

  const slotEnd = new Date(params.day);
  slotEnd.setHours(endHour, endMin, 0, 0);

  // Convert to UTC for comparison
  const utcSlotStart = fromZonedTime(slotStart, params.timezone);
  const utcSlotEnd = fromZonedTime(slotEnd, params.timezone);

  // Generate slots in 15-minute increments
  let currentSlotStart = new Date(utcSlotStart);

  while (isBefore(currentSlotStart, utcSlotEnd)) {
    const currentSlotEnd = addMinutes(currentSlotStart, params.serviceDurationMinutes);

    // Check if slot fits within business hours
    if (isAfter(currentSlotEnd, utcSlotEnd)) {
      break; // Slot extends past closing time
    }

    // Check if slot conflicts with existing bookings (including buffers)
    const bufferStart = addMinutes(currentSlotStart, -params.bufferBeforeMinutes);
    const bufferEnd = addMinutes(currentSlotEnd, params.bufferAfterMinutes);

    const hasConflict = params.existingBookings.some((booking) => {
      return isOverlapping(
        { start: bufferStart, end: bufferEnd },
        { start: booking.startTime, end: booking.endTime }
      );
    });

    if (!hasConflict) {
      // Convert times back to local timezone for display
      const localStart = toZonedTime(currentSlotStart, params.timezone);
      const localEnd = toZonedTime(currentSlotEnd, params.timezone);

      slots.push({
        startTime: currentSlotStart,
        endTime: currentSlotEnd,
        localStart: formatLocalTime(localStart),
        localEnd: formatLocalTime(localEnd),
      });
    }

    // Move to next 15-minute slot
    currentSlotStart = addMinutes(currentSlotStart, slotDurationMinutes);
  }

  return slots;
}

/**
 * Check if two time ranges overlap
 */
function isOverlapping(
  range1: { start: Date; end: Date },
  range2: { start: Date; end: Date }
): boolean {
  return isBefore(range1.start, range2.end) && isAfter(range1.end, range2.start);
}

/**
 * Format a date as local time string (e.g., "2:30 PM")
 */
function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
