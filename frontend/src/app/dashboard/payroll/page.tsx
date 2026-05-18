"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function PayrollPage() {
  const qc = useQueryClient();
  const { data: payrolls = [] } = useQuery({
    queryKey: ["payrolls"],
    queryFn: () => api.get("/payroll").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () => api.post("/payroll", { companyId: localStorage.getItem("companyId") }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payrolls"] }),
  });

  const execute = useMutation({
    mutationFn: (id: string) => api.post(`/payroll/${id}/execute`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payrolls"] }),
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
        <button onClick={() => create.mutate()} className="bg-brand text-white px-4 py-2 rounded-lg font-medium">
          Create Payroll Run
        </button>
      </div>

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
                    <button onClick={() => execute.mutate(p.id)} className="text-brand underline text-xs">
                      Execute
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
