import { z } from 'zod';
import { env } from '@/lib/config';

/**
 * Business profile imported from Google Places or manual entry
 */
export const BusinessProfileSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  categories: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().default(0),
  photoUrls: z.array(z.string().url()).default([]),
  topReviews: z
    .array(
      z.object({
        author: z.string(),
        rating: z.number(),
        text: z.string(),
        date: z.string().optional(),
      })
    )
    .default([]),
  hours: z
    .object({
      monday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      tuesday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      wednesday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      thursday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      friday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      saturday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      sunday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    })
    .optional(),
  geo: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;

/**
 * Places autocomplete result
 */
export const PlacesAutocompleteResultSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export type PlacesAutocompleteResult = z.infer<typeof PlacesAutocompleteResultSchema>;

/**
 * Places adapter interface
 */
export interface PlacesAdapter {
  autocomplete(query: string): Promise<PlacesAutocompleteResult[]>;
  getBusinessProfile(placeId: string): Promise<BusinessProfile>;
}

/**
 * Real Google Places adapter (requires API key)
 */
export const googlePlacesAdapter: PlacesAdapter = {
  async autocomplete(query: string): Promise<PlacesAutocompleteResult[]> {
    if (!env.GOOGLE_PLACES_API_KEY) {
      console.warn('GOOGLE_PLACES_API_KEY not set; returning empty results');
      return [];
    }

    // TODO: Implement Google Places Text Search Autocomplete (New)
    // For now, return empty to prevent build errors
    console.log('REAL Places autocomplete:', query);
    return [];
  },

  async getBusinessProfile(placeId: string): Promise<BusinessProfile> {
    if (!env.GOOGLE_PLACES_API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY required for real Places API');
    }

    // TODO: Implement Google Places Details API
    console.log('REAL Places details:', placeId);
    throw new Error('Not implemented');
  },
};

/**
 * Mock Places adapter (deterministic for testing)
 */
export const mockPlacesAdapter: PlacesAdapter = {
  async autocomplete(query: string): Promise<PlacesAutocompleteResult[]> {
    console.log('MOCK: Places autocomplete for:', query);

    // Return demo results matching the query
    const demos = [
      {
        placeId: 'fade-factory',
        name: 'Fade Factory Barbershop',
        description: 'Barbershop in Riyadh, Saudi Arabia',
      },
      {
        placeId: 'shine-salon',
        name: 'Shine Hair Salon',
        description: 'Hair salon in Dubai, UAE',
      },
      {
        placeId: 'clean-clinic',
        name: 'Clean Dental Clinic',
        description: 'Dental clinic in Jeddah, Saudi Arabia',
      },
    ];

    return demos.filter(
      (d) =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.description.toLowerCase().includes(query.toLowerCase())
    );
  },

  async getBusinessProfile(placeId: string): Promise<BusinessProfile> {
    console.log('MOCK: Places details for:', placeId);

    if (placeId === 'fade-factory') {
      return {
        name: 'Fade Factory Barbershop',
        description: "Premium men's grooming and haircuts",
        address: 'Al Nakheel, Riyadh, Saudi Arabia',
        phone: '+966123456789',
        website: 'https://fadefactory.example.com',
        email: 'info@fadefactory.example.com',
        categories: ['Barbershop', 'Hair Care'],
        rating: 4.8,
        reviewCount: 127,
        photoUrls: [
          'https://via.placeholder.com/800x600?text=Barbershop+1',
          'https://via.placeholder.com/800x600?text=Barbershop+2',
          'https://via.placeholder.com/800x600?text=Barbershop+3',
        ],
        topReviews: [
          {
            author: 'Ahmed Al-Dosari',
            rating: 5,
            text: 'Best barbershop in Riyadh. Professional and clean.',
            date: '2024-06-15',
          },
          {
            author: 'Saud Al-Shehri',
            rating: 5,
            text: 'Excellent service and friendly staff.',
            date: '2024-06-10',
          },
        ],
        hours: {
          monday: [{ start: '09:00', end: '18:00' }],
          tuesday: [{ start: '09:00', end: '18:00' }],
          wednesday: [{ start: '09:00', end: '18:00' }],
          thursday: [{ start: '09:00', end: '18:00' }],
          friday: [], // Closed
          saturday: [{ start: '09:00', end: '18:00' }],
          sunday: [{ start: '09:00', end: '18:00' }],
        },
        geo: {
          lat: 24.7136,
          lng: 46.6753,
        },
      };
    }

    throw new Error(`Unknown placeId in mock: ${placeId}`);
  },
};

/**
 * Get Places adapter based on environment
 */
export function getPlacesAdapter(): PlacesAdapter {
  return env.MOCK_MODE ? mockPlacesAdapter : googlePlacesAdapter;
}
