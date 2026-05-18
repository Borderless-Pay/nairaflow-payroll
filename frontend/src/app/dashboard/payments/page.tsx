"use client";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function PaymentsList() {
  const params = useSearchParams();
  const payrollId = params.get("payrollId") ?? "";

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", payrollId],
    queryFn: () => api.get(`/payments/${payrollId}`).then((r) => r.data),
    enabled: !!payrollId,
  });

  if (!payrollId) return <p className="text-gray-500">Select a payroll run to view payments.</p>;
  if (isLoading) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>{["Employee", "Amount", "Currency", "Status", "Tx Hash"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
        </thead>
        <tbody>
          {payments.map((p: { id: string; employee: { name: string }; amount: number; currency: string; status: string; txHash?: string }) => (
            <tr key={p.id} className="border-t">
              <td className="px-4 py-3">{p.employee.name}</td>
              <td className="px-4 py-3">{p.amount}</td>
              <td className="px-4 py-3">{p.currency}</td>
              <td className="px-4 py-3">{p.status}</td>
              <td className="px-4 py-3 font-mono text-xs">
                {p.txHash ? (
                  <a href={`https://stellar.expert/explorer/testnet/tx/${p.txHash}`} target="_blank" rel="noreferrer" className="text-brand underline">
                    {p.txHash.slice(0, 12)}…
                  </a>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
        <PaymentsList />
      </Suspense>
    </div>
  );
}
