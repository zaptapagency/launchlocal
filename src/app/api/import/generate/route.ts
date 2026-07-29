import { NextRequest, NextResponse } from 'next/server';
import { getImportService } from '@/modules/import/service';
import { getSiteService } from '@/modules/sites/service';
import { z } from 'zod';

const generateSchema = z.object({
  placeId: z.string().min(1),
  tenantId: z.string().uuid(),
  theme: z.enum(['modern', 'warm', 'bold']).default('modern'),
});

/**
 * Import business and generate site content
 * POST /api/import/generate
 *
 * Body:
 * {
 *   "placeId": "fade-factory",
 *   "tenantId": "uuid",
 *   "theme": "modern"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generateSchema.parse(body);

    const importService = getImportService();
    const siteService = getSiteService();

    console.info('Starting import + generate', {
      placeId: validated.placeId,
      tenantId: validated.tenantId,
    });

    // Step 1: Import business profile
    const { business, site } = await importService.importAndGenerate(validated.placeId);

    // Step 2: Save site draft
    const [savedSite] = await siteService.saveDraft(validated.tenantId, site, validated.theme);

    console.info('Import + generate complete', {
      tenantId: validated.tenantId,
      sections: site.sections.length,
    });

    return NextResponse.json({
      success: true,
      business,
      site: savedSite,
    });
  } catch (error) {
    console.error('Generate error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
      },
      { status: 500 }
    );
  }
}
