"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get("/employees").then((r) => r.data),
  });

  const { data: payrolls } = useQuery({
    queryKey: ["payrolls"],
    queryFn: () => api.get("/payroll").then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Employees" value={employees?.length ?? 0} />
        <StatCard label="Payroll Runs" value={payrolls?.length ?? 0} />
        <StatCard
          label="Total Disbursed"
          value={`$${(payrolls ?? []).filter((p: { status: string }) => p.status === "COMPLETED").reduce((s: number, p: { totalAmount: number }) => s + p.totalAmount, 0).toLocaleString()}`}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-brand mt-1">{value}</p>
    </div>
  );
}
