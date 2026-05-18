import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-brand">NairaFlow</h1>
      <p className="text-lg text-gray-600 text-center max-w-md">
        Instant stablecoin payroll for Africa&apos;s remote workforce. Pay teams across borders with USDC on Stellar.
      </p>
      <div className="flex gap-4">
        <Link href="/dashboard" className="px-6 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand-light transition">
          Dashboard
        </Link>
        <Link href="/auth/login" className="px-6 py-3 border border-brand text-brand rounded-lg font-medium hover:bg-brand hover:text-white transition">
          Sign In
        </Link>
      </div>
    </main>
  );
}
