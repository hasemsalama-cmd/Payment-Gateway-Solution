import {
  db,
  applicationsTable,
  loansTable,
  paymentsTable,
  scoringRulesTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

import {
  scoreApplication,
  generateReferenceCode,
  monthlyPayment,
  DEFAULT_RULES,
  type ApplicationInputs,
  type EmploymentStatus,
} from "./lib/scoring";

type SeedApplicant = ApplicationInputs & {
  fullName: string;
  email: string;
  phone: string;
  purpose: string;
  status: "pending" | "approved" | "denied" | "disbursed";
  daysAgo: number;
  paymentsMade?: number;
};

const APPLICANTS: SeedApplicant[] = [
  {
    fullName: "Maya Okafor",
    email: "maya.okafor@example.com",
    phone: "+1 415 555 0142",
    amountRequested: 6000,
    termMonths: 18,
    purpose: "Replace pizza oven at small bakery",
    employmentStatus: "self_employed" as EmploymentStatus,
    monthlyIncome: 5400,
    monthlyExpenses: 2900,
    existingDebt: 3200,
    status: "disbursed",
    daysAgo: 92,
    paymentsMade: 3,
  },
  {
    fullName: "Daniel Petrov",
    email: "daniel.petrov@example.com",
    phone: "+1 312 555 0188",
    amountRequested: 12000,
    termMonths: 36,
    purpose: "Used delivery van for catering business",
    employmentStatus: "self_employed" as EmploymentStatus,
    monthlyIncome: 7200,
    monthlyExpenses: 4100,
    existingDebt: 8800,
    status: "disbursed",
    daysAgo: 47,
    paymentsMade: 2,
  },
  {
    fullName: "Aisha Rahman",
    email: "aisha.rahman@example.com",
    phone: "+1 206 555 0119",
    amountRequested: 3500,
    termMonths: 12,
    purpose: "Computer and certification program",
    employmentStatus: "employed" as EmploymentStatus,
    monthlyIncome: 4800,
    monthlyExpenses: 2300,
    existingDebt: 1100,
    status: "approved",
    daysAgo: 5,
  },
  {
    fullName: "Henry Kallio",
    email: "henry.kallio@example.com",
    phone: "+1 503 555 0167",
    amountRequested: 9500,
    termMonths: 24,
    purpose: "Inventory expansion for online shop",
    employmentStatus: "employed" as EmploymentStatus,
    monthlyIncome: 6800,
    monthlyExpenses: 3500,
    existingDebt: 4400,
    status: "pending",
    daysAgo: 1,
  },
  {
    fullName: "Sofia Marchetti",
    email: "sofia.marchetti@example.com",
    phone: "+1 718 555 0173",
    amountRequested: 4200,
    termMonths: 18,
    purpose: "Wedding photography equipment",
    employmentStatus: "self_employed" as EmploymentStatus,
    monthlyIncome: 4100,
    monthlyExpenses: 2700,
    existingDebt: 2200,
    status: "pending",
    daysAgo: 2,
  },
  {
    fullName: "Theo Bishara",
    email: "theo.bishara@example.com",
    phone: "+1 213 555 0151",
    amountRequested: 18000,
    termMonths: 48,
    purpose: "Open coffee shop second location",
    employmentStatus: "self_employed" as EmploymentStatus,
    monthlyIncome: 5200,
    monthlyExpenses: 3800,
    existingDebt: 14500,
    status: "denied",
    daysAgo: 11,
  },
  {
    fullName: "Priya Anand",
    email: "priya.anand@example.com",
    phone: "+1 408 555 0193",
    amountRequested: 2200,
    termMonths: 12,
    purpose: "Emergency dental work",
    employmentStatus: "employed" as EmploymentStatus,
    monthlyIncome: 5600,
    monthlyExpenses: 3000,
    existingDebt: 900,
    status: "disbursed",
    daysAgo: 64,
    paymentsMade: 2,
  },
  {
    fullName: "Marcus Lee",
    email: "marcus.lee@example.com",
    phone: "+1 646 555 0124",
    amountRequested: 7500,
    termMonths: 24,
    purpose: "Consolidate higher-rate credit card debt",
    employmentStatus: "employed" as EmploymentStatus,
    monthlyIncome: 8100,
    monthlyExpenses: 3900,
    existingDebt: 7200,
    status: "pending",
    daysAgo: 3,
  },
  {
    fullName: "Nina Brennan",
    email: "nina.brennan@example.com",
    phone: "+1 617 555 0102",
    amountRequested: 1500,
    termMonths: 6,
    purpose: "Apartment moving costs",
    employmentStatus: "student" as EmploymentStatus,
    monthlyIncome: 1800,
    monthlyExpenses: 1500,
    existingDebt: 600,
    status: "denied",
    daysAgo: 25,
  },
  {
    fullName: "Rafael Tovar",
    email: "rafael.tovar@example.com",
    phone: "+1 305 555 0146",
    amountRequested: 5500,
    termMonths: 24,
    purpose: "Auto repair shop tooling",
    employmentStatus: "self_employed" as EmploymentStatus,
    monthlyIncome: 6500,
    monthlyExpenses: 3500,
    existingDebt: 2400,
    status: "disbursed",
    daysAgo: 130,
    paymentsMade: 4,
  },
];

async function main() {
  console.log("Resetting lending portal data...");
  await db.execute(
    sql`TRUNCATE TABLE loan_payments, loans, loan_applications RESTART IDENTITY CASCADE`,
  );
  await db
    .insert(scoringRulesTable)
    .values({
      id: "default",
      approveThreshold: DEFAULT_RULES.approveThreshold,
      reviewThreshold: DEFAULT_RULES.reviewThreshold,
      maxDebtToIncomeRatio: String(DEFAULT_RULES.maxDebtToIncomeRatio),
      maxPaymentToIncomeRatio: String(DEFAULT_RULES.maxPaymentToIncomeRatio),
      baseInterestRate: String(DEFAULT_RULES.baseInterestRate),
      riskPremiumPerBand: String(DEFAULT_RULES.riskPremiumPerBand),
    })
    .onConflictDoNothing();

  for (const a of APPLICANTS) {
    const score = scoreApplication(
      {
        amountRequested: a.amountRequested,
        termMonths: a.termMonths,
        employmentStatus: a.employmentStatus,
        monthlyIncome: a.monthlyIncome,
        monthlyExpenses: a.monthlyExpenses,
        existingDebt: a.existingDebt,
      },
      DEFAULT_RULES,
    );
    const createdAt = new Date(Date.now() - a.daysAgo * 86400000);
    let decidedAt: Date | null = null;
    let approvedAmount: string | null = null;
    let approvedRate: string | null = null;
    let denialReason: string | null = null;
    if (a.status !== "pending") {
      decidedAt = new Date(createdAt.getTime() + 86400000 * 2);
    }
    if (a.status === "approved" || a.status === "disbursed") {
      approvedAmount = String(a.amountRequested);
      approvedRate = String(score.suggestedInterestRate);
    }
    if (a.status === "denied") {
      denialReason =
        score.recommendation === "deny"
          ? "Risk score below acceptable threshold"
          : "Loan size relative to income above policy";
    }
    const [appRow] = await db
      .insert(applicationsTable)
      .values({
        referenceCode: generateReferenceCode(),
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        amountRequested: String(a.amountRequested),
        termMonths: a.termMonths,
        purpose: a.purpose,
        employmentStatus: a.employmentStatus,
        monthlyIncome: String(a.monthlyIncome),
        monthlyExpenses: String(a.monthlyExpenses),
        existingDebt: String(a.existingDebt),
        status: a.status,
        score: score.score,
        recommendation: score.recommendation,
        suggestedInterestRate: String(score.suggestedInterestRate),
        debtToIncomeRatio: String(score.debtToIncomeRatio),
        paymentToIncomeRatio: String(score.paymentToIncomeRatio),
        factors: score.factors,
        approvedAmount,
        approvedInterestRate: approvedRate,
        denialReason,
        decidedAt,
        decidedBy: a.status !== "pending" ? "Lender" : null,
        createdAt,
      })
      .returning();

    if (a.status === "disbursed") {
      const principal = a.amountRequested;
      const rate = score.suggestedInterestRate;
      const payment = monthlyPayment(principal, rate, a.termMonths);
      const startDate = new Date(decidedAt!.getTime() + 86400000);
      const [loan] = await db
        .insert(loansTable)
        .values({
          applicationId: appRow!.id,
          borrowerName: a.fullName,
          principal: String(principal),
          interestRate: String(rate),
          termMonths: a.termMonths,
          monthlyPayment: String(Math.round(payment * 100) / 100),
          startDate: startDate.toISOString().slice(0, 10),
          status: "active",
          createdAt: startDate,
        })
        .returning();
      const installments = a.paymentsMade ?? 0;
      for (let i = 0; i < installments; i++) {
        const paidAt = new Date(startDate);
        paidAt.setMonth(paidAt.getMonth() + i + 1);
        await db.insert(paymentsTable).values({
          loanId: loan!.id,
          amount: String(Math.round(payment * 100) / 100),
          method: "bank_transfer",
          notes: null,
          paidAt,
        });
      }
    }
  }
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
