"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      const res = await api.post("/auth/login", data);
      localStorage.setItem("token", res.data.token);
      if (res.data.companyId) localStorage.setItem("companyId", res.data.companyId);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-brand">Sign In</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <input {...register("email")} placeholder="Email" className="w-full border rounded-lg px-3 py-2" />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <input {...register("password")} type="password" placeholder="Password" className="w-full border rounded-lg px-3 py-2" />
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-brand text-white py-2 rounded-lg font-medium disabled:opacity-50">
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
