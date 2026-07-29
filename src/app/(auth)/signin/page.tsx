/**
 * Sign-in page
 * TODO: Implement auth UI (M0+)
 */

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold">Sign In</h1>
        <p className="mb-6 text-slate-600">Auth UI implementation coming soon</p>
        <div className="space-y-4">
          <button className="w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Sign in with Email
          </button>
          <button className="w-full rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
