import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-brand text-white flex flex-col p-6 gap-4">
        <h2 className="text-xl font-bold mb-4">NairaFlow</h2>
        <Link href="/dashboard" className="hover:text-accent">Overview</Link>
        <Link href="/dashboard/employees" className="hover:text-accent">Employees</Link>
        <Link href="/dashboard/payroll" className="hover:text-accent">Payroll</Link>
        <Link href="/dashboard/payments" className="hover:text-accent">Payments</Link>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
