import { getPlacesAdapter } from '@/lib/adapters/places';
import { getAIAdapter } from '@/lib/adapters/ai';
import type { BusinessProfile } from '@/lib/adapters/places';
import type { SiteDocument } from '@/lib/adapters/ai';

/**
 * Business import service
 *
 * Orchestrates the import flow:
 * 1. Search for business via Places autocomplete
 * 2. Get full business profile from Places
 * 3. Generate site content via AI
 */
export class ImportService {
  private placesAdapter = getPlacesAdapter();
  private aiAdapter = getAIAdapter();

  /**
   * Search for businesses by name
   */
  async searchBusinesses(query: string) {
    const results = await this.placesAdapter.autocomplete(query);
    return results;
  }

  /**
   * Get full business profile
   */
  async getBusinessProfile(placeId: string): Promise<BusinessProfile> {
    const profile = await this.placesAdapter.getBusinessProfile(placeId);
    return profile;
  }

  /**
   * Import and generate site document
   *
   * Full pipeline: search → get profile → generate content
   */
  async importAndGenerate(placeId: string): Promise<{
    business: BusinessProfile;
    site: SiteDocument;
  }> {
    // Step 1: Get business profile from Places
    const business = await this.placesAdapter.getBusinessProfile(placeId);

    // Step 2: Generate site document via AI
    const site = await this.aiAdapter.generateSiteDocument(business);

    return { business, site };
  }
}

/**
 * Get import service instance
 */
export function getImportService(): ImportService {
  return new ImportService();
}
