import { db, scoringRulesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { DEFAULT_RULES, type ScoringRulesValues } from "./scoring";

export async function getRulesValues(): Promise<ScoringRulesValues> {
  const [row] = await db
    .select()
    .from(scoringRulesTable)
    .where(eq(scoringRulesTable.id, "default"));
  if (!row) {
    await db.insert(scoringRulesTable).values({
      id: "default",
      approveThreshold: DEFAULT_RULES.approveThreshold,
      reviewThreshold: DEFAULT_RULES.reviewThreshold,
      maxDebtToIncomeRatio: String(DEFAULT_RULES.maxDebtToIncomeRatio),
      maxPaymentToIncomeRatio: String(DEFAULT_RULES.maxPaymentToIncomeRatio),
      baseInterestRate: String(DEFAULT_RULES.baseInterestRate),
      riskPremiumPerBand: String(DEFAULT_RULES.riskPremiumPerBand),
    });
    return DEFAULT_RULES;
  }
  return {
    approveThreshold: row.approveThreshold,
    reviewThreshold: row.reviewThreshold,
    maxDebtToIncomeRatio: Number(row.maxDebtToIncomeRatio),
    maxPaymentToIncomeRatio: Number(row.maxPaymentToIncomeRatio),
    baseInterestRate: Number(row.baseInterestRate),
    riskPremiumPerBand: Number(row.riskPremiumPerBand),
  };
}
