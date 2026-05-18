import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import employeeRoutes from "./routes/employees";
import payrollRoutes from "./routes/payroll";
import paymentRoutes from "./routes/payments";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
