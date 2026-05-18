import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const EmployeeSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  walletAddress: z.string(),
  country: z.string(),
  salary: z.number().positive(),
  currency: z.string().default("USDC"),
});

router.get("/", async (req: AuthRequest, res) => {
  const employees = await prisma.employee.findMany({ where: { companyId: req.body.companyId } });
  res.json(employees);
});

router.post("/", async (req: AuthRequest, res) => {
  const parsed = EmployeeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const employee = await prisma.employee.create({
    data: { ...parsed.data, companyId: req.body.companyId },
  });
  res.status(201).json(employee);
});

router.put("/:id", async (req, res) => {
  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(employee);
});

router.delete("/:id", async (req, res) => {
  await prisma.employee.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
