import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma";

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { email, password, companyName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const company = await prisma.company.create({ data: { name: companyName, email } });
    const user = await prisma.user.create({ data: { email, passwordHash, companyId: company.id } });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.json({ token, companyId: company.id });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.json({ token, companyId: user.companyId });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
