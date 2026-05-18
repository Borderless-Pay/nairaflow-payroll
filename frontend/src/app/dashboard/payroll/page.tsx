"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

export default function PayrollPage() {
  const qc = useQueryClient();
  const [error, setError] = useState("");

  const { data: payrolls = [] } = useQuery({
    queryKey: ["payrolls"],
    queryFn: () => api.get("/payroll").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () => {
      const companyId = localStorage.getItem("companyId");
      return api.post("/payroll", { companyId });
    },
    onSuccess: () => { setError(""); qc.invalidateQueries({ queryKey: ["payrolls"] }); },
    onError: () => setError("Failed to create payroll run"),
  });

  const execute = useMutation({
    mutationFn: (id: string) => api.post(`/payroll/${id}/execute`),
    onSuccess: () => { setError(""); qc.invalidateQueries({ queryKey: ["payrolls"] }); },
    onError: () => setError("Stellar disbursement failed — check wallet balance"),
  });

  const statusColor: Record<string, string> = {
    PENDING: "text-yellow-600",
    PROCESSING: "text-blue-600",
    COMPLETED: "text-green-600",
    FAILED: "text-red-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <button onClick={() => create.mutate()} disabled={create.isPending} className="bg-brand text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50">
          {create.isPending ? "Creating…" : "Create Payroll Run"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>{["ID", "Total (USDC)", "Status", "Created", "Action"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {payrolls.map((p: { id: string; totalAmount: number; status: string; createdAt: string }) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{p.id.slice(0, 8)}…</td>
                <td className="px-4 py-3">{p.totalAmount}</td>
                <td className={`px-4 py-3 font-medium ${statusColor[p.status]}`}>{p.status}</td>
                <td className="px-4 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {p.status === "PENDING" && (
                    <button onClick={() => execute.mutate(p.id)} disabled={execute.isPending} className="text-brand underline text-xs disabled:opacity-50">
                      Execute
                    </button>
                  )}
                  {p.status === "FAILED" && (
                    <button onClick={() => execute.mutate(p.id)} disabled={execute.isPending} className="text-red-500 underline text-xs disabled:opacity-50">
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
