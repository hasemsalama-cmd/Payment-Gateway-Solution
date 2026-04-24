import type { ApplicationRow, LoanRow, PaymentRow, ScoringRulesRow } from "@workspace/db";

const num = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
};

const numOpt = (v: unknown): number | undefined => {
  if (v === null || v === undefined) return undefined;
  return num(v);
};

const isoOpt = (v: Date | null | undefined): string | undefined => {
  if (!v) return undefined;
  return v.toISOString();
};

const strOpt = (v: string | null | undefined): string | undefined => {
  if (v == null) return undefined;
  return v;
};

export function serializeApplication(row: ApplicationRow) {
  return {
    id: row.id,
    referenceCode: row.referenceCode,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    amountRequested: num(row.amountRequested),
    termMonths: row.termMonths,
    purpose: row.purpose,
    employmentStatus: row.employmentStatus,
    monthlyIncome: num(row.monthlyIncome),
    monthlyExpenses: num(row.monthlyExpenses),
    existingDebt: num(row.existingDebt),
    status: row.status,
    score: row.score,
    recommendation: row.recommendation,
    suggestedInterestRate: num(row.suggestedInterestRate),
    debtToIncomeRatio: num(row.debtToIncomeRatio),
    paymentToIncomeRatio: num(row.paymentToIncomeRatio),
    factors: row.factors,
    denialReason: strOpt(row.denialReason),
    decidedAt: isoOpt(row.decidedAt),
    decidedBy: strOpt(row.decidedBy),
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeApplicationStatusView(row: ApplicationRow) {
  return {
    referenceCode: row.referenceCode,
    fullName: row.fullName,
    status: row.status,
    amountRequested: num(row.amountRequested),
    termMonths: row.termMonths,
    approvedAmount: numOpt(row.approvedAmount),
    suggestedInterestRate: num(row.approvedInterestRate ?? row.suggestedInterestRate),
    decidedAt: isoOpt(row.decidedAt),
    denialReason: strOpt(row.denialReason),
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeLoan(
  loan: LoanRow,
  totals: { totalPaid: number; balanceRemaining: number; nextDueDate: string },
) {
  return {
    id: loan.id,
    applicationId: loan.applicationId,
    borrowerName: loan.borrowerName,
    principal: num(loan.principal),
    interestRate: num(loan.interestRate),
    termMonths: loan.termMonths,
    monthlyPayment: num(loan.monthlyPayment),
    startDate: String(loan.startDate),
    status: loan.status,
    totalPaid: totals.totalPaid,
    balanceRemaining: totals.balanceRemaining,
    nextDueDate: totals.nextDueDate,
  };
}

export function serializePayment(row: PaymentRow) {
  return {
    id: row.id,
    loanId: row.loanId,
    amount: num(row.amount),
    paidAt: row.paidAt.toISOString(),
    method: row.method,
    notes: strOpt(row.notes),
  };
}

export function serializeRules(row: ScoringRulesRow) {
  return {
    approveThreshold: row.approveThreshold,
    reviewThreshold: row.reviewThreshold,
    maxDebtToIncomeRatio: num(row.maxDebtToIncomeRatio),
    maxPaymentToIncomeRatio: num(row.maxPaymentToIncomeRatio),
    baseInterestRate: num(row.baseInterestRate),
    riskPremiumPerBand: num(row.riskPremiumPerBand),
  };
}
