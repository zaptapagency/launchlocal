/**
 * Public site renderer
 * Accessed at: {slug}.lvh.me, {slug}.APP_DOMAIN, or custom domain
 *
 * TODO: Implement full site renderer (M1+)
 */

export default async function PublicSitePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Tenant Site</h1>
        <p className="mb-4 text-xl text-slate-600">Tenant: {tenant}</p>
        <p className="text-slate-500">
          Site renderer implementation coming in M1 (Import & Generate)
        </p>
      </div>
    </div>
  );
}
