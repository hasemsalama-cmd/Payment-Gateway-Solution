import { pgTable, integer, numeric, text } from "drizzle-orm/pg-core";

export const scoringRulesTable = pgTable("scoring_rules", {
  id: text("id").primaryKey().default("default"),
  approveThreshold: integer("approve_threshold").notNull(),
  reviewThreshold: integer("review_threshold").notNull(),
  maxDebtToIncomeRatio: numeric("max_debt_to_income_ratio", { precision: 6, scale: 3 }).notNull(),
  maxPaymentToIncomeRatio: numeric("max_payment_to_income_ratio", { precision: 6, scale: 3 }).notNull(),
  baseInterestRate: numeric("base_interest_rate", { precision: 6, scale: 3 }).notNull(),
  riskPremiumPerBand: numeric("risk_premium_per_band", { precision: 6, scale: 3 }).notNull(),
});

export type ScoringRulesRow = typeof scoringRulesTable.$inferSelect;
export type InsertScoringRulesRow = typeof scoringRulesTable.$inferInsert;
