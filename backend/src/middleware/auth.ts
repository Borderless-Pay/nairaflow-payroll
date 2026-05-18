import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
  companyId?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    req.userId = payload.userId;
    req.role = payload.role;
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { companyId: true } });
    req.companyId = user?.companyId ?? undefined;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
