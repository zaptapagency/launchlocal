import { db } from '@/db';
import { bookings, customers, payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

/**
 * Booking Service — Manage booking lifecycle
 *
 * Handles:
 * - Booking creation with hold (15-min expiry for payment)
 * - Confirmation (after payment received)
 * - Cancellation with refunds
 * - Rescheduling
 * - Status tracking
 */

export class BookingService {
  /**
   * Create a new booking with payment hold
   *
   * Booking starts in 'pending' status with a stripe payment intent
   * Customer has 15 minutes to complete payment before hold expires
   */
  async createBooking(data: {
    tenantId: string;
    serviceId: string;
    staffId: string | null;
    customerId: string;
    startTime: Date; // UTC
    endTime: Date; // UTC
    priceCents: number;
    depositCents?: number;
    stripePaymentIntentId?: string;
    source?: string; // 'web', 'phone', 'email', etc.
  }) {
    const cancelToken = randomBytes(32).toString('hex');

    const [booking] = await db
      .insert(bookings)
      .values({
        tenantId: data.tenantId,
        serviceId: data.serviceId,
        staffId: data.staffId,
        customerId: data.customerId,
        startTime: data.startTime,
        endTime: data.endTime,
        priceCents: data.priceCents,
        depositCents: data.depositCents || 0,
        status: 'pending',
        source: data.source || 'web',
        stripePaymentIntentId: data.stripePaymentIntentId,
        cancelToken,
      })
      .returning();

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBooking(tenantId: string, bookingId: string) {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.tenantId, tenantId), eq(bookings.id, bookingId)));

    return booking;
  }

  /**
   * Get booking by cancel token (for public reschedule/cancel links)
   */
  async getBookingByToken(cancelToken: string) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.cancelToken, cancelToken));

    return booking;
  }

  /**
   * Confirm a booking (mark as confirmed after payment)
   */
  async confirmBooking(tenantId: string, bookingId: string) {
    const [booking] = await db
      .update(bookings)
      .set({
        status: 'confirmed',
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.tenantId, tenantId), eq(bookings.id, bookingId)))
      .returning();

    return booking;
  }

  /**
   * Mark booking as completed
   */
  async completeBooking(tenantId: string, bookingId: string) {
    const [booking] = await db
      .update(bookings)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.tenantId, tenantId), eq(bookings.id, bookingId)))
      .returning();

    return booking;
  }

  /**
   * Cancel a booking with optional refund
   */
  async cancelBooking(tenantId: string, bookingId: string, reason?: string, refundCents?: number) {
    const [booking] = await db
      .update(bookings)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason,
        refundedCents: refundCents || 0,
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.tenantId, tenantId), eq(bookings.id, bookingId)))
      .returning();

    return booking;
  }

  /**
   * Mark as no-show
   */
  async markNoShow(tenantId: string, bookingId: string) {
    const [booking] = await db
      .update(bookings)
      .set({
        status: 'no_show',
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.tenantId, tenantId), eq(bookings.id, bookingId)))
      .returning();

    return booking;
  }

  /**
   * Reschedule a booking to new time
   */
  async rescheduleBooking(
    tenantId: string,
    bookingId: string,
    newStartTime: Date,
    newEndTime: Date
  ) {
    const [booking] = await db
      .update(bookings)
      .set({
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.tenantId, tenantId), eq(bookings.id, bookingId)))
      .returning();

    return booking;
  }

  /**
   * Get upcoming bookings for a staff member
   */
  async getUpcomingBookings(tenantId: string, staffId: string) {
    return db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, tenantId),
          eq(bookings.staffId, staffId),
          eq(bookings.status, 'confirmed')
        )
      );
  }

  /**
   * Get customer's bookings
   */
  async getCustomerBookings(tenantId: string, customerId: string) {
    return db
      .select()
      .from(bookings)
      .where(and(eq(bookings.tenantId, tenantId), eq(bookings.customerId, customerId)));
  }

  /**
   * Get or create customer
   */
  async getOrCreateCustomer(data: {
    tenantId: string;
    email: string;
    name: string;
    phone?: string;
  }) {
    // Try to find existing customer
    const [existing] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.tenantId, data.tenantId), eq(customers.email, data.email)));

    if (existing) {
      return existing;
    }

    // Create new customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        tenantId: data.tenantId,
        email: data.email,
        name: data.name,
        phone: data.phone,
      })
      .returning();

    return newCustomer;
  }

  /**
   * Record a payment
   */
  async recordPayment(data: {
    tenantId: string;
    bookingId?: string;
    type: 'deposit' | 'balance' | 'refund' | 'no_show_fee';
    amountCents: number;
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
  }) {
    const [payment] = await db
      .insert(payments)
      .values({
        tenantId: data.tenantId,
        bookingId: data.bookingId,
        type: data.type,
        amountCents: data.amountCents,
        status: 'pending',
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeChargeId: data.stripeChargeId,
      })
      .returning();

    return payment;
  }
}

/**
 * Get or create booking service instance
 */
export function getBookingService(): BookingService {
  return new BookingService();
}
