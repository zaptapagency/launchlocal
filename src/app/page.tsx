import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl text-center">
        <h1 className="mb-6 text-5xl font-bold text-white">LaunchLocal</h1>
        <p className="mb-8 text-xl text-slate-200">
          Get online in 5 minutes. AI-powered website with booking and payments.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/signin"
            className="rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Get Started
          </Link>
          <Link
            href="/demo"
            className="rounded-lg border border-slate-400 px-8 py-3 font-semibold text-white transition hover:bg-slate-700"
          >
            See Demo
          </Link>
        </div>
        <p className="mt-12 text-sm text-slate-400">M0 Scaffolding — Welcome to LaunchLocal!</p>
      </div>
    </main>
  );
}
