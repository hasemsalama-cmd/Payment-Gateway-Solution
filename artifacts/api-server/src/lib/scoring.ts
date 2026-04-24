export type EmploymentStatus =
  | "employed"
  | "self_employed"
  | "unemployed"
  | "retired"
  | "student";

export type Recommendation = "approve" | "review" | "deny";

export interface ScoreFactor {
  label: string;
  impact: number;
  detail: string;
}

export interface ScoringRulesValues {
  approveThreshold: number;
  reviewThreshold: number;
  maxDebtToIncomeRatio: number;
  maxPaymentToIncomeRatio: number;
  baseInterestRate: number;
  riskPremiumPerBand: number;
}

export interface ApplicationInputs {
  amountRequested: number;
  termMonths: number;
  employmentStatus: EmploymentStatus;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebt: number;
}

export interface ScoreResult {
  score: number;
  recommendation: Recommendation;
  suggestedInterestRate: number;
  factors: ScoreFactor[];
  debtToIncomeRatio: number;
  paymentToIncomeRatio: number;
}

export const DEFAULT_RULES: ScoringRulesValues = {
  approveThreshold: 70,
  reviewThreshold: 50,
  maxDebtToIncomeRatio: 0.4,
  maxPaymentToIncomeRatio: 0.35,
  baseInterestRate: 8.5,
  riskPremiumPerBand: 2.5,
};

export function monthlyPayment(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function scoreApplication(
  inputs: ApplicationInputs,
  rules: ScoringRulesValues,
): ScoreResult {
  const factors: ScoreFactor[] = [];
  let score = 50;

  const monthlyIncome = Math.max(1, inputs.monthlyIncome);
  const disposable = inputs.monthlyIncome - inputs.monthlyExpenses;
  const dti = inputs.existingDebt / Math.max(1, inputs.monthlyIncome * 12);
  const estPayment = monthlyPayment(
    inputs.amountRequested,
    rules.baseInterestRate,
    inputs.termMonths,
  );
  const pti = estPayment / monthlyIncome;

  // Employment
  const employmentImpact: Record<EmploymentStatus, { impact: number; detail: string }> = {
    employed: { impact: 18, detail: "Stable W-2 employment" },
    self_employed: { impact: 8, detail: "Self-employed income" },
    retired: { impact: 6, detail: "Retired with stable income" },
    student: { impact: -8, detail: "Student status reduces stability" },
    unemployed: { impact: -25, detail: "Currently unemployed" },
  };
  const emp = employmentImpact[inputs.employmentStatus];
  score += emp.impact;
  factors.push({ label: "Employment", impact: emp.impact, detail: emp.detail });

  // Disposable income coverage
  if (disposable >= estPayment * 3) {
    score += 16;
    factors.push({
      label: "Disposable income",
      impact: 16,
      detail: "Disposable income exceeds 3x estimated payment",
    });
  } else if (disposable >= estPayment * 1.8) {
    score += 8;
    factors.push({
      label: "Disposable income",
      impact: 8,
      detail: "Healthy buffer over estimated payment",
    });
  } else if (disposable >= estPayment) {
    score += 0;
    factors.push({
      label: "Disposable income",
      impact: 0,
      detail: "Disposable income just covers estimated payment",
    });
  } else {
    const impact = -22;
    score += impact;
    factors.push({
      label: "Disposable income",
      impact,
      detail: "Disposable income below estimated payment",
    });
  }

  // Payment-to-income
  if (pti <= rules.maxPaymentToIncomeRatio * 0.5) {
    score += 12;
    factors.push({
      label: "Payment burden",
      impact: 12,
      detail: `Payment is ${(pti * 100).toFixed(1)}% of monthly income`,
    });
  } else if (pti <= rules.maxPaymentToIncomeRatio) {
    score += 4;
    factors.push({
      label: "Payment burden",
      impact: 4,
      detail: `Payment is ${(pti * 100).toFixed(1)}% of monthly income`,
    });
  } else {
    const overage = pti - rules.maxPaymentToIncomeRatio;
    const impact = -Math.round(20 + overage * 100);
    score += impact;
    factors.push({
      label: "Payment burden",
      impact,
      detail: `Payment is ${(pti * 100).toFixed(1)}% of income (above ${(rules.maxPaymentToIncomeRatio * 100).toFixed(0)}% limit)`,
    });
  }

  // Debt-to-income
  if (dti <= rules.maxDebtToIncomeRatio * 0.5) {
    score += 10;
    factors.push({
      label: "Existing debt",
      impact: 10,
      detail: `Annual debt is ${(dti * 100).toFixed(1)}% of annual income`,
    });
  } else if (dti <= rules.maxDebtToIncomeRatio) {
    score += 2;
    factors.push({
      label: "Existing debt",
      impact: 2,
      detail: `Annual debt is ${(dti * 100).toFixed(1)}% of annual income`,
    });
  } else {
    const impact = -15;
    score += impact;
    factors.push({
      label: "Existing debt",
      impact,
      detail: `Annual debt is ${(dti * 100).toFixed(1)}% of annual income (above ${(rules.maxDebtToIncomeRatio * 100).toFixed(0)}% limit)`,
    });
  }

  // Loan size sanity
  if (inputs.amountRequested > monthlyIncome * 24) {
    const impact = -10;
    score += impact;
    factors.push({
      label: "Loan size",
      impact,
      detail: "Requested amount exceeds 24x monthly income",
    });
  } else if (inputs.amountRequested <= monthlyIncome * 6) {
    score += 4;
    factors.push({
      label: "Loan size",
      impact: 4,
      detail: "Conservative loan size relative to income",
    });
  }

  score = Math.round(clamp(score, 0, 100));

  let recommendation: Recommendation;
  if (score >= rules.approveThreshold) recommendation = "approve";
  else if (score >= rules.reviewThreshold) recommendation = "review";
  else recommendation = "deny";

  // Tier the rate by how far above approve threshold the applicant sits
  let band = 3;
  if (score >= rules.approveThreshold + 15) band = 0;
  else if (score >= rules.approveThreshold) band = 1;
  else if (score >= rules.reviewThreshold) band = 2;
  const suggestedInterestRate =
    Math.round((rules.baseInterestRate + band * rules.riskPremiumPerBand) * 100) / 100;

  return {
    score,
    recommendation,
    suggestedInterestRate,
    factors,
    debtToIncomeRatio: Math.round(dti * 1000) / 1000,
    paymentToIncomeRatio: Math.round(pti * 1000) / 1000,
  };
}

export function generateReferenceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "LP-";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function buildAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  startDate: Date,
): Array<{
  installment: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  const r = annualRatePct / 100 / 12;
  const payment = monthlyPayment(principal, annualRatePct, termMonths);
  const schedule = [];
  let balance = principal;
  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * r;
    let principalPart = payment - interest;
    if (i === termMonths) principalPart = balance;
    balance = Math.max(0, balance - principalPart);
    const due = new Date(startDate);
    due.setMonth(due.getMonth() + i);
    schedule.push({
      installment: i,
      dueDate: due.toISOString().slice(0, 10),
      amount: Math.round(payment * 100) / 100,
      principal: Math.round(principalPart * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }
  return schedule;
}
