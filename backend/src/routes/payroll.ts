import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { executeStellarPayroll } from "../services/stellar";

const router = Router();
router.use(authenticate);

// Create payroll run for all employees in a company
router.post("/", async (req: AuthRequest, res) => {
  const { companyId, scheduledAt } = req.body;

  const employees = await prisma.employee.findMany({ where: { companyId } });
  if (!employees.length) return res.status(400).json({ error: "No employees found" });

  const totalAmount = employees.reduce((sum, e) => sum + e.salary, 0);

  const payroll = await prisma.payroll.create({
    data: {
      companyId,
      totalAmount,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      payments: {
        create: employees.map((e) => ({
          employeeId: e.id,
          amount: e.salary,
          currency: e.currency,
        })),
      },
    },
    include: { payments: true },
  });

  res.status(201).json(payroll);
});

// Execute a payroll run via Stellar
router.post("/:id/execute", async (req, res) => {
  const payroll = await prisma.payroll.findUnique({
    where: { id: req.params.id },
    include: { payments: { include: { employee: true } } },
  });
  if (!payroll) return res.status(404).json({ error: "Payroll not found" });

  await prisma.payroll.update({ where: { id: payroll.id }, data: { status: "PROCESSING" } });

  const results = await executeStellarPayroll(payroll.payments);

  await prisma.payroll.update({
    where: { id: payroll.id },
    data: { status: "COMPLETED", executedAt: new Date() },
  });

  res.json({ payrollId: payroll.id, results });
});

router.get("/", async (req: AuthRequest, res) => {
  const payrolls = await prisma.payroll.findMany({
    where: { companyId: req.body.companyId },
    include: { payments: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(payrolls);
});

export default router;
