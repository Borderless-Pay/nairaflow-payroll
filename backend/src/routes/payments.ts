import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/:payrollId", async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { payrollId: req.params.payrollId },
    include: { employee: true },
  });
  res.json(payments);
});

export default router;
