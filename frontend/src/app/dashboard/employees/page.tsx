"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  walletAddress: z.string().min(1),
  country: z.string().min(1),
  salary: z.coerce.number().positive(),
});
type FormData = z.infer<typeof schema>;

export default function EmployeesPage() {
  const qc = useQueryClient();
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get("/employees").then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const add = useMutation({
    mutationFn: (data: FormData) => api.post("/employees", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); reset(); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employees</h1>

      <form onSubmit={handleSubmit((d) => add.mutate(d))} className="bg-white p-6 rounded-xl shadow grid grid-cols-2 gap-4">
        <h2 className="col-span-2 font-semibold">Add Employee</h2>
        {(["name", "email", "walletAddress", "country"] as const).map((f) => (
          <div key={f}>
            <input {...register(f)} placeholder={f} className="w-full border rounded-lg px-3 py-2" />
            {errors[f] && <p className="text-red-500 text-xs">{errors[f]?.message}</p>}
          </div>
        ))}
        <div>
          <input {...register("salary")} placeholder="Salary (USDC)" type="number" className="w-full border rounded-lg px-3 py-2" />
          {errors.salary && <p className="text-red-500 text-xs">{errors.salary.message}</p>}
        </div>
        <button type="submit" className="col-span-2 bg-brand text-white py-2 rounded-lg font-medium">Add</button>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>{["Name", "Email", "Country", "Wallet", "Salary (USDC)"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {employees.map((e: { id: string; name: string; email: string; country: string; walletAddress: string; salary: number }) => (
              <tr key={e.id} className="border-t">
                <td className="px-4 py-3">{e.name}</td>
                <td className="px-4 py-3">{e.email}</td>
                <td className="px-4 py-3">{e.country}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.walletAddress.slice(0, 12)}…</td>
                <td className="px-4 py-3">{e.salary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
