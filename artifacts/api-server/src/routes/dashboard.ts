import { Router, type IRouter } from "express";
import { db, applicationsTable, loansTable, paymentsTable } from "@workspace/db";
import { desc, eq, gte } from "drizzle-orm";
import { loanTotals } from "../lib/loanMath";

const router: IRouter = Router();

const num = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
};

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const allApps = await db.select().from(applicationsTable);
  const allLoans = await db.select().from(loansTable);
  const allPayments = await db.select().from(paymentsTable);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const pendingApplications = allApps.filter((a) => a.status === "pending").length;
  const approvedThisMonth = allApps.filter(
    (a) =>
      (a.status === "approved" || a.status === "disbursed") &&
      a.decidedAt &&
      a.decidedAt >= startOfMonth,
  ).length;
  const activeLoans = allLoans.filter((l) => l.status === "active").length;
  const totalDisbursed = allLoans.reduce((s, l) => s + num(l.principal), 0);
  const totalCollected = allPayments.reduce((s, p) => s + num(p.amount), 0);

  let outstandingPrincipal = 0;
  for (const loan of allLoans.filter((l) => l.status === "active")) {
    const payments = allPayments.filter((p) => p.loanId === loan.id);
    const totals = loanTotals(loan, payments);
    outstandingPrincipal += totals.balanceRemaining;
  }

  const decided = allApps.filter((a) => a.status !== "pending");
  const approved = decided.filter((a) => a.status === "approved" || a.status === "disbursed");
  const approvalRate = decided.length === 0 ? 0 : approved.length / decided.length;

  const defaulted = allLoans.filter((l) => l.status === "defaulted").length;
  const finalizedLoans = allLoans.filter((l) => l.status !== "active").length;
  const defaultRate = finalizedLoans === 0 ? 0 : defaulted / finalizedLoans;

  const averageLoanSize =
    allLoans.length === 0
      ? 0
      : Math.round((totalDisbursed / allLoans.length) * 100) / 100;

  res.json({
    pendingApplications,
    approvedThisMonth,
    activeLoans,
    totalDisbursed: Math.round(totalDisbursed * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    outstandingPrincipal: Math.round(outstandingPrincipal * 100) / 100,
    defaultRate: Math.round(defaultRate * 1000) / 1000,
    averageLoanSize,
    approvalRate: Math.round(approvalRate * 1000) / 1000,
  });
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const apps = await db
    .select()
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.createdAt))
    .limit(40);
  const loans = await db
    .select()
    .from(loansTable)
    .orderBy(desc(loansTable.createdAt))
    .limit(40);
  const payments = await db
    .select()
    .from(paymentsTable)
    .orderBy(desc(paymentsTable.paidAt))
    .limit(40);

  type Event = {
    id: string;
    type:
      | "application_submitted"
      | "application_approved"
      | "application_denied"
      | "loan_disbursed"
      | "payment_received";
    message: string;
    amount?: number;
    applicationId?: string;
    loanId?: string;
    occurredAt: string;
  };
  const events: Event[] = [];
  for (const a of apps) {
    events.push({
      id: `app-sub-${a.id}`,
      type: "application_submitted",
      message: `${a.fullName} submitted an application for $${num(a.amountRequested).toLocaleString()}`,
      amount: num(a.amountRequested),
      applicationId: a.id,
      occurredAt: a.createdAt.toISOString(),
    });
    if (a.decidedAt && a.status === "approved") {
      events.push({
        id: `app-app-${a.id}`,
        type: "application_approved",
        message: `${a.fullName}'s application was approved`,
        amount: num(a.approvedAmount ?? a.amountRequested),
        applicationId: a.id,
        occurredAt: a.decidedAt.toISOString(),
      });
    }
    if (a.decidedAt && a.status === "denied") {
      events.push({
        id: `app-deny-${a.id}`,
        type: "application_denied",
        message: `${a.fullName}'s application was denied`,
        applicationId: a.id,
        occurredAt: a.decidedAt.toISOString(),
      });
    }
  }
  for (const l of loans) {
    events.push({
      id: `loan-${l.id}`,
      type: "loan_disbursed",
      message: `Disbursed $${num(l.principal).toLocaleString()} to ${l.borrowerName}`,
      amount: num(l.principal),
      loanId: l.id,
      applicationId: l.applicationId,
      occurredAt: l.createdAt.toISOString(),
    });
  }
  for (const p of payments) {
    const loan = loans.find((l) => l.id === p.loanId);
    events.push({
      id: `pay-${p.id}`,
      type: "payment_received",
      message: `Payment of $${num(p.amount).toLocaleString()} received${
        loan ? ` from ${loan.borrowerName}` : ""
      }`,
      amount: num(p.amount),
      loanId: p.loanId,
      occurredAt: p.paidAt.toISOString(),
    });
  }
  events.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  res.json(events.slice(0, 20));
});

router.get("/dashboard/risk-distribution", async (_req, res): Promise<void> => {
  const apps = await db.select().from(applicationsTable);
  const buckets = [
    { band: "low" as const, label: "Low risk", minScore: 80, maxScore: 100, count: 0 },
    { band: "medium" as const, label: "Medium risk", minScore: 65, maxScore: 79, count: 0 },
    { band: "high" as const, label: "High risk", minScore: 45, maxScore: 64, count: 0 },
    { band: "very_high" as const, label: "Very high risk", minScore: 0, maxScore: 44, count: 0 },
  ];
  for (const a of apps) {
    const b = buckets.find((x) => a.score >= x.minScore && a.score <= x.maxScore);
    if (b) b.count += 1;
  }
  res.json(buckets);
});

router.get("/dashboard/monthly-volume", async (_req, res): Promise<void> => {
  const monthsBack = 6;
  const now = new Date();
  const startBoundary = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

  const loans = await db
    .select()
    .from(loansTable)
    .where(gte(loansTable.createdAt, startBoundary));
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(gte(paymentsTable.paidAt, startBoundary));

  const points: Array<{ month: string; disbursed: number; collected: number }> = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    points.push({ month: key, disbursed: 0, collected: 0 });
  }
  for (const l of loans) {
    const key = `${l.createdAt.getFullYear()}-${String(l.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const point = points.find((p) => p.month === key);
    if (point) point.disbursed += num(l.principal);
  }
  for (const p of payments) {
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
    const point = points.find((pt) => pt.month === key);
    if (point) point.collected += num(p.amount);
  }
  res.json(
    points.map((p) => ({
      month: p.month,
      disbursed: Math.round(p.disbursed * 100) / 100,
      collected: Math.round(p.collected * 100) / 100,
    })),
  );
});

void eq;

export default router;
