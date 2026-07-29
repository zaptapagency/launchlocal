import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { SiteDocument } from '@/lib/adapters/ai';

/**
 * Site service
 *
 * Manages site creation, updates, and publishing
 */
export class SiteService {
  /**
   * Create or update a draft site
   */
  async saveDraft(tenantId: string, siteDoc: SiteDocument, theme: string = 'modern') {
    const existing = await db.query.sites.findFirst({
      where: eq(schema.sites.tenantId, tenantId),
    });

    if (existing) {
      // Update existing
      return db
        .update(schema.sites)
        .set({
          sections: siteDoc.sections,
          seo: {
            title: siteDoc.title,
            description: siteDoc.description,
            ogImage: siteDoc.ogImageUrl,
          },
          theme,
          updatedAt: new Date(),
        })
        .where(eq(schema.sites.tenantId, tenantId))
        .returning();
    } else {
      // Create new
      return db
        .insert(schema.sites)
        .values({
          id: uuid(),
          tenantId,
          sections: siteDoc.sections,
          seo: {
            title: siteDoc.title,
            description: siteDoc.description,
            ogImage: siteDoc.ogImageUrl,
          },
          theme,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
    }
  }

  /**
   * Get site by tenant
   */
  async getSite(tenantId: string) {
    return db.query.sites.findFirst({
      where: eq(schema.sites.tenantId, tenantId),
    });
  }

  /**
   * Publish site (make it live)
   */
  async publish(tenantId: string) {
    const site = await this.getSite(tenantId);
    if (!site) {
      throw new Error('Site not found');
    }

    return db
      .update(schema.sites)
      .set({
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.sites.tenantId, tenantId))
      .returning();
  }

  /**
   * Unpublish site
   */
  async unpublish(tenantId: string) {
    return db
      .update(schema.sites)
      .set({
        publishedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.sites.tenantId, tenantId))
      .returning();
  }

  /**
   * Update site theme
   */
  async updateTheme(tenantId: string, theme: string) {
    return db
      .update(schema.sites)
      .set({
        theme,
        updatedAt: new Date(),
      })
      .where(eq(schema.sites.tenantId, tenantId))
      .returning();
  }
}

/**
 * Get site service instance
 */
export function getSiteService(): SiteService {
  return new SiteService();
}
