import { Router, type IRouter } from "express";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";
import { db, applicationsTable, loansTable } from "@workspace/db";
import {
  CreateApplicationBody,
  ListApplicationsQueryParams,
  GetApplicationParams,
  GetApplicationByReferenceParams,
  DecideApplicationBody,
  DecideApplicationParams,
  DisburseApplicationParams,
  PreviewScoreBody,
} from "@workspace/api-zod";
import {
  generateReferenceCode,
  monthlyPayment,
  scoreApplication,
} from "../lib/scoring";
import { getRulesValues } from "../lib/rules";
import {
  serializeApplication,
  serializeApplicationStatusView,
  serializeLoan,
} from "../lib/serializers";
import { loanTotals } from "../lib/loanMath";

const router: IRouter = Router();

router.get("/applications", async (req, res): Promise<void> => {
  const params = ListApplicationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions = [];
  if (params.data.status && params.data.status !== "all") {
    conditions.push(eq(applicationsTable.status, params.data.status));
  }
  if (params.data.search) {
    const term = `%${params.data.search}%`;
    conditions.push(
      or(
        ilike(applicationsTable.fullName, term),
        ilike(applicationsTable.email, term),
        ilike(applicationsTable.referenceCode, term),
      )!,
    );
  }
  const rows = await db
    .select()
    .from(applicationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applicationsTable.createdAt));
  res.json(rows.map(serializeApplication));
});

router.post("/applications", async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rules = await getRulesValues();
  const score = scoreApplication(parsed.data, rules);
  const referenceCode = generateReferenceCode();
  const [row] = await db
    .insert(applicationsTable)
    .values({
      referenceCode,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      amountRequested: String(parsed.data.amountRequested),
      termMonths: parsed.data.termMonths,
      purpose: parsed.data.purpose,
      employmentStatus: parsed.data.employmentStatus,
      monthlyIncome: String(parsed.data.monthlyIncome),
      monthlyExpenses: String(parsed.data.monthlyExpenses),
      existingDebt: String(parsed.data.existingDebt),
      status: "pending",
      score: score.score,
      recommendation: score.recommendation,
      suggestedInterestRate: String(score.suggestedInterestRate),
      debtToIncomeRatio: String(score.debtToIncomeRatio),
      paymentToIncomeRatio: String(score.paymentToIncomeRatio),
      factors: score.factors,
    })
    .returning();
  res.status(201).json(serializeApplication(row!));
});

router.get(
  "/applications/by-reference/:referenceCode",
  async (req, res): Promise<void> => {
    const params = GetApplicationByReferenceParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [row] = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.referenceCode, params.data.referenceCode));
    if (!row) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(serializeApplicationStatusView(row));
  },
);

router.get("/applications/:id", async (req, res): Promise<void> => {
  const params = GetApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(serializeApplication(row));
});

router.post("/applications/:id/decision", async (req, res): Promise<void> => {
  const params = DecideApplicationParams.safeParse(req.params);
  const body = DecideApplicationBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (existing.status !== "pending") {
    res
      .status(400)
      .json({ error: `Application is already ${existing.status}` });
    return;
  }

  const updates: Record<string, unknown> = {
    status: body.data.decision === "approve" ? "approved" : "denied",
    decidedAt: new Date(),
    decidedBy: body.data.decidedBy ?? "Lender",
  };
  if (body.data.decision === "approve") {
    updates.approvedAmount = String(
      body.data.approvedAmount ?? Number(existing.amountRequested),
    );
    updates.approvedInterestRate = String(
      body.data.interestRate ?? Number(existing.suggestedInterestRate),
    );
    updates.denialReason = null;
  } else {
    updates.denialReason = body.data.denialReason ?? "Application denied";
    updates.approvedAmount = null;
    updates.approvedInterestRate = null;
  }
  const [row] = await db
    .update(applicationsTable)
    .set(updates)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();
  res.json(serializeApplication(row!));
});

router.post("/applications/:id/disburse", async (req, res): Promise<void> => {
  const params = DisburseApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (app.status !== "approved") {
    res
      .status(400)
      .json({ error: "Only approved applications can be disbursed" });
    return;
  }
  const principal = Number(app.approvedAmount ?? app.amountRequested);
  const rate = Number(app.approvedInterestRate ?? app.suggestedInterestRate);
  const payment = monthlyPayment(principal, rate, app.termMonths);
  const startDate = new Date();
  const [loan] = await db
    .insert(loansTable)
    .values({
      applicationId: app.id,
      borrowerName: app.fullName,
      principal: String(principal),
      interestRate: String(rate),
      termMonths: app.termMonths,
      monthlyPayment: String(Math.round(payment * 100) / 100),
      startDate: startDate.toISOString().slice(0, 10),
      status: "active",
    })
    .returning();
  await db
    .update(applicationsTable)
    .set({ status: "disbursed" })
    .where(eq(applicationsTable.id, app.id));
  const totals = loanTotals(loan!, []);
  res.json(serializeLoan(loan!, totals));
});

router.post("/scoring/preview", async (req, res): Promise<void> => {
  const parsed = PreviewScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });aprove
    return;
  }
  const rules = await getRulesValues();
  const result = scoreApplication(parsed.data, rules);
  res.json(result);
});

// Suppress unused import warning for sql
void sql;

export default router;
