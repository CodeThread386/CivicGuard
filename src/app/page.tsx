import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-primary">CivicGuard</h1>
          <p className="mt-2 text-slate-600">
            Secure civic identity wallet. Zero-knowledge document verification.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/volunteer"
            className="block w-full py-3 px-6 rounded-lg bg-primary text-white font-medium hover:bg-slate-800 transition"
          >
            Volunteer Portal
          </Link>
          <Link
            href="/verifier"
            className="block w-full py-3 px-6 rounded-lg border-2 border-primary text-primary font-medium hover:bg-slate-100 transition"
          >
            Verifier
          </Link>
        </div>

        <p className="text-sm text-slate-500">
          Install to home screen for app-like experience
        </p>
      </div>
    </main>
  );
}
