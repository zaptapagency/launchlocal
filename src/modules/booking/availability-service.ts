import { db } from '@/db';
import {
  availabilityRules,
  availabilityOverrides,
  insertAvailabilityRuleSchema,
  insertAvailabilityOverrideSchema,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Availability Service — Manage staff availability rules and date overrides
 *
 * Rules define weekly recurring availability (e.g., "Monday 9am-5pm")
 * Overrides define date-specific exceptions (closures or custom hours)
 *
 * Works with slot engine to generate available booking slots
 */

export class AvailabilityService {
  /**
   * Get all availability rules for a staff member
   */
  async getRules(tenantId: string, staffId: string) {
    return db
      .select()
      .from(availabilityRules)
      .where(and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.staffId, staffId)))
      .orderBy(availabilityRules.weekday);
  }

  /**
   * Get availability rule by ID
   */
  async getRule(tenantId: string, ruleId: string) {
    const [rule] = await db
      .select()
      .from(availabilityRules)
      .where(and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.id, ruleId)));

    return rule;
  }

  /**
   * Create a new availability rule
   */
  async createRule(data: {
    tenantId: string;
    staffId: string;
    weekday: number; // 0=Sunday, 6=Saturday
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  }) {
    const parsed = insertAvailabilityRuleSchema.parse(data);

    const [rule] = await db.insert(availabilityRules).values(parsed).returning();

    return rule;
  }

  /**
   * Update an availability rule
   */
  async updateRule(
    tenantId: string,
    ruleId: string,
    data: {
      startTime?: string;
      endTime?: string;
    }
  ) {
    const [rule] = await db
      .update(availabilityRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.id, ruleId)))
      .returning();

    return rule;
  }

  /**
   * Delete an availability rule
   */
  async deleteRule(tenantId: string, ruleId: string) {
    const [rule] = await db
      .delete(availabilityRules)
      .where(and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.id, ruleId)))
      .returning();

    return rule;
  }

  /**
   * Get all overrides for a staff member
   */
  async getOverrides(tenantId: string, staffId: string) {
    return db
      .select()
      .from(availabilityOverrides)
      .where(
        and(
          eq(availabilityOverrides.tenantId, tenantId),
          eq(availabilityOverrides.staffId, staffId)
        )
      )
      .orderBy(availabilityOverrides.date);
  }

  /**
   * Get override by date
   */
  async getOverrideByDate(tenantId: string, staffId: string, date: string) {
    // date should be in YYYY-MM-DD format
    const [override] = await db
      .select()
      .from(availabilityOverrides)
      .where(
        and(
          eq(availabilityOverrides.tenantId, tenantId),
          eq(availabilityOverrides.staffId, staffId),
          eq(availabilityOverrides.date, date)
        )
      );

    return override;
  }

  /**
   * Create a new override (closure or custom hours)
   */
  async createOverride(data: {
    tenantId: string;
    staffId: string;
    date: string; // YYYY-MM-DD
    closed: boolean;
    startTime?: string; // HH:MM, only if not closed
    endTime?: string; // HH:MM, only if not closed
  }) {
    const parsed = insertAvailabilityOverrideSchema.parse(data);

    const [override] = await db.insert(availabilityOverrides).values(parsed).returning();

    return override;
  }

  /**
   * Update an override
   */
  async updateOverride(
    tenantId: string,
    overrideId: string,
    data: {
      closed?: boolean;
      startTime?: string | null;
      endTime?: string | null;
    }
  ) {
    const [override] = await db
      .update(availabilityOverrides)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(eq(availabilityOverrides.tenantId, tenantId), eq(availabilityOverrides.id, overrideId))
      )
      .returning();

    return override;
  }

  /**
   * Delete an override
   */
  async deleteOverride(tenantId: string, overrideId: string) {
    const [override] = await db
      .delete(availabilityOverrides)
      .where(
        and(eq(availabilityOverrides.tenantId, tenantId), eq(availabilityOverrides.id, overrideId))
      )
      .returning();

    return override;
  }

  /**
   * Check if a staff member is available on a given date/time
   * Note: This is a simplified helper. Slot engine handles full timezone-aware availability.
   */
  async isAvailable(
    tenantId: string,
    staffId: string,
    checkDate: Date
  ): Promise<{
    available: boolean;
    rules?: Array<{ startTime: string; endTime: string }>;
  }> {
    // Get the local date in tenant's timezone
    const localDateStr = new Date(checkDate).toISOString().split('T')[0]; // YYYY-MM-DD
    const weekday = checkDate.getDay();

    // Check for override first
    const override = await this.getOverrideByDate(tenantId, staffId, localDateStr);
    if (override) {
      return {
        available: !override.closed,
        rules: override.closed
          ? undefined
          : [{ startTime: override.startTime!, endTime: override.endTime! }],
      };
    }

    // Fall back to recurring rules
    const rules = await this.getRules(tenantId, staffId);
    const applicableRules = rules.filter((r) => r.weekday === weekday);

    return {
      available: applicableRules.length > 0,
      rules: applicableRules.map((r) => ({
        startTime: r.startTime,
        endTime: r.endTime,
      })),
    };
  }
}

/**
 * Get or create availability service instance
 */
export function getAvailabilityService(): AvailabilityService {
  return new AvailabilityService();
}
