import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const EmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  walletAddress: z.string().min(1),
  country: z.string().min(1),
  salary: z.number().positive(),
  currency: z.string().default("USDC"),
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const employees = await prisma.employee.findMany({ where: { companyId: req.companyId } });
    res.json(employees);
  } catch {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const parsed = EmployeeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const employee = await prisma.employee.create({
      data: { ...parsed.data, companyId: req.companyId! },
    });
    res.status(201).json(employee);
  } catch {
    res.status(500).json({ error: "Failed to create employee" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.companyId !== req.companyId) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const employee = await prisma.employee.update({ where: { id: req.params.id }, data: req.body });
    res.json(employee);
  } catch {
    res.status(500).json({ error: "Failed to update employee" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.companyId !== req.companyId) {
      return res.status(404).json({ error: "Employee not found" });
    }
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

export default router;
