import { NextRequest, NextResponse } from 'next/server';

/**
 * Multi-tenancy middleware
 *
 * Handles hostname routing:
 * - {slug}.lvh.me (local dev)
 * - {slug}.APP_DOMAIN (production)
 * - custom domains
 *
 * Rewrites to: /app/(sites)/[tenant]/...
 */

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Extract tenant slug from hostname
  const tenantSlug = extractTenantSlug(hostname);

  if (tenantSlug) {
    // Customer-facing site: rewrite to public site renderer
    // Example: fadefactory.lvh.me/services → /app/(sites)/fade-factory/services
    url.pathname = `/app/sites/${tenantSlug}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // No tenant detected; continue normally (marketing site, dashboard, etc.)
  return NextResponse.next();
}

/**
 * Extract tenant slug from hostname
 * Examples:
 * - "fade-factory.lvh.me:3000" → "fade-factory"
 * - "fade-factory.launchlocal.com" → "fade-factory"
 * - "localhost:3000" → null
 * - "demo.example.com" → null (no subdomain)
 */
function extractTenantSlug(hostname: string): string | null {
  // Remove port
  const host = hostname.split(':')[0];

  // List of known domains that don't represent tenant subdomains
  const knownDomains = ['localhost', 'launchlocal.com', 'launchlocal.test'];

  // Check if it's a localhost variant or known domain
  if (host === 'localhost' || knownDomains.some((d) => host.endsWith(d))) {
    return null;
  }

  // Check for lvh.me (local development)
  if (host.endsWith('.lvh.me')) {
    const parts = host.replace('.lvh.me', '').split('.');
    if (parts.length === 1) {
      return parts[0];
    }
  }

  // Check for APP_DOMAIN (production)
  const appDomain = process.env.APP_DOMAIN || '';
  if (appDomain && host.endsWith(`.${appDomain}`)) {
    const slug = host.substring(0, host.length - appDomain.length - 1);
    if (slug && !slug.includes('.')) {
      return slug;
    }
  }

  // Could also check custom domains here (fetch from DB)
  // For now, return null
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth routes, don't rewrite)
     * - api/ (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
