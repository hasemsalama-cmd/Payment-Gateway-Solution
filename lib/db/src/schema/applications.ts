import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const applicationsTable = pgTable("loan_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceCode: text("reference_code").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  amountRequested: numeric("amount_requested", { precision: 12, scale: 2 }).notNull(),
  termMonths: integer("term_months").notNull(),
  purpose: text("purpose").notNull(),
  employmentStatus: text("employment_status").notNull(),
  monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2 }).notNull(),
  monthlyExpenses: numeric("monthly_expenses", { precision: 12, scale: 2 }).notNull(),
  existingDebt: numeric("existing_debt", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  score: integer("score").notNull(),
  recommendation: text("recommendation").notNull(),
  suggestedInterestRate: numeric("suggested_interest_rate", { precision: 6, scale: 3 }).notNull(),
  debtToIncomeRatio: numeric("debt_to_income_ratio", { precision: 6, scale: 3 }).notNull(),
  paymentToIncomeRatio: numeric("payment_to_income_ratio", { precision: 6, scale: 3 }).notNull(),
  factors: jsonb("factors").notNull(),
  approvedAmount: numeric("approved_amount", { precision: 12, scale: 2 }),
  approvedInterestRate: numeric("approved_interest_rate", { precision: 6, scale: 3 }),
  denialReason: text("denial_reason"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: text("decided_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ApplicationRow = typeof applicationsTable.$inferSelect;
export type InsertApplicationRow = typeof applicationsTable.$inferInsert;
