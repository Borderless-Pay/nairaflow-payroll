import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { executeStellarPayroll } from "../services/stellar";

const router = Router();
router.use(authenticate);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const companyId = req.companyId!;
    const { scheduledAt } = req.body;

    const employees = await prisma.employee.findMany({ where: { companyId } });
    if (!employees.length) return res.status(400).json({ error: "No employees found" });

    const totalAmount = employees.reduce((sum, e) => sum + e.salary, 0);
    const payroll = await prisma.payroll.create({
      data: {
        companyId,
        totalAmount,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        payments: {
          create: employees.map((e) => ({ employeeId: e.id, amount: e.salary, currency: e.currency })),
        },
      },
      include: { payments: true },
    });
    res.status(201).json(payroll);
  } catch {
    res.status(500).json({ error: "Failed to create payroll" });
  }
});

router.post("/:id/execute", async (req: AuthRequest, res) => {
  const payroll = await prisma.payroll.findUnique({
    where: { id: req.params.id },
    include: { payments: { include: { employee: true } } },
  });
  if (!payroll) return res.status(404).json({ error: "Payroll not found" });
  if (payroll.companyId !== req.companyId) return res.status(403).json({ error: "Forbidden" });
  if (payroll.status !== "PENDING") return res.status(400).json({ error: "Payroll already processed" });

  await prisma.payroll.update({ where: { id: payroll.id }, data: { status: "PROCESSING" } });

  try {
    const results = await executeStellarPayroll(payroll.payments);
    await prisma.payroll.update({ where: { id: payroll.id }, data: { status: "COMPLETED", executedAt: new Date() } });
    res.json({ payrollId: payroll.id, results });
  } catch (err) {
    // Roll back to FAILED so it can be retried
    await prisma.payroll.update({ where: { id: payroll.id }, data: { status: "FAILED" } });
    res.status(502).json({ error: "Stellar disbursement failed", detail: String(err) });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const payrolls = await prisma.payroll.findMany({
      where: { companyId: req.companyId },
      include: { payments: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(payrolls);
  } catch {
    res.status(500).json({ error: "Failed to fetch payrolls" });
  }
});

export default router;
