import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, loansTable, paymentsTable } from "@workspace/db";
import {
  ListLoansQueryParams,
  GetLoanParams,
  RecordPaymentParams,
  RecordPaymentBody,
} from "@workspace/api-zod";
import { serializeLoan, serializePayment } from "../lib/serializers";
import { loanTotals } from "../lib/loanMath";

const router: IRouter = Router();

router.get("/loans", async (req, res): Promise<void> => {
  const params = ListLoansQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions =
    params.data.status && params.data.status !== "all"
      ? [eq(loansTable.status, params.data.status)]
      : [];
  const loans = await db
    .select()
    .from(loansTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(loansTable.createdAt));
  // For each loan, compute totals
  const out = [];
  for (const loan of loans) {
    const payments = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.loanId, loan.id));
    const totals = loanTotals(loan, payments);
    out.push(serializeLoan(loan, totals));
  }
  res.json(out);
});

router.get("/loans/:id", async (req, res): Promise<void> => {
  const params = GetLoanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [loan] = await db.select().from(loansTable).where(eq(loansTable.id, params.data.id));
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.loanId, loan.id))
    .orderBy(desc(paymentsTable.paidAt));
  const totals = loanTotals(loan, payments);
  res.json({
    loan: serializeLoan(loan, totals),
    payments: payments.map(serializePayment),
    schedule: totals.schedule,
  });
});

router.post("/loans/:id/payments", async (req, res): Promise<void> => {
  const params = RecordPaymentParams.safeParse(req.params);
  const body = RecordPaymentBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [loan] = await db.select().from(loansTable).where(eq(loansTable.id, params.data.id));
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  const [payment] = await db
    .insert(paymentsTable)
    .values({
      loanId: loan.id,
      amount: String(body.data.amount),
      method: body.data.method,
      notes: body.data.notes ?? null,
      paidAt: body.data.paidAt ? new Date(body.data.paidAt) : new Date(),
    })
    .returning();

  // Update loan status if fully paid
  const allPayments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.loanId, loan.id));
  const totals = loanTotals(loan, allPayments);
  if (totals.balanceRemaining <= 0.01 && loan.status !== "paid") {
    await db.update(loansTable).set({ status: "paid" }).where(eq(loansTable.id, loan.id));
  }
  res.status(201).json(serializePayment(payment!));
});

export default router;
