import { NextRequest, NextResponse } from 'next/server';
import { getImportService } from '@/modules/import/service';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1),
});

/**
 * Search for businesses by name via Places API
 * GET /api/import/search?q=business+name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const validated = searchSchema.parse({ q: query });

    const importService = getImportService();
    const results = await importService.searchBusinesses(validated.q);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search query',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
