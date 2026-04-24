import type { LoanRow, PaymentRow } from "@workspace/db";
import { buildAmortizationSchedule } from "./scoring";

const toNum = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
};

export function loanTotals(loan: LoanRow, payments: PaymentRow[]) {
  const principal = toNum(loan.principal);
  const rate = toNum(loan.interestRate);
  const startDate = new Date(String(loan.startDate));
  const schedule = buildAmortizationSchedule(principal, rate, loan.termMonths, startDate);
  const totalDue = schedule.reduce((s, r) => s + r.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + toNum(p.amount), 0);
  const balanceRemaining = Math.max(0, Math.round((totalDue - totalPaid) * 100) / 100);

  // Allocate payments to installments in order
  let remaining = totalPaid;
  const enrichedSchedule = schedule.map((row) => {
    let paid = false;
    if (remaining >= row.amount - 0.01) {
      paid = true;
      remaining -= row.amount;
    }
    return { ...row, paid };
  });

  const nextUnpaid = enrichedSchedule.find((r) => !r.paid);
  const nextDueDate = nextUnpaid
    ? nextUnpaid.dueDate
    : enrichedSchedule[enrichedSchedule.length - 1]!.dueDate;

  return {
    totalDue: Math.round(totalDue * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    balanceRemaining,
    nextDueDate,
    schedule: enrichedSchedule,
  };
}
