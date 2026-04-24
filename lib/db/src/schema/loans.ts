import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { applicationsTable } from "./applications";

export const loansTable = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id),
  borrowerName: text("borrower_name").notNull(),
  principal: numeric("principal", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 3 }).notNull(),
  termMonths: integer("term_months").notNull(),
  monthlyPayment: numeric("monthly_payment", { precision: 12, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentsTable = pgTable("loan_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id")
    .notNull()
    .references(() => loansTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  method: text("method").notNull(),
  notes: text("notes"),
});

export type LoanRow = typeof loansTable.$inferSelect;
export type InsertLoanRow = typeof loansTable.$inferInsert;
export type PaymentRow = typeof paymentsTable.$inferSelect;
export type InsertPaymentRow = typeof paymentsTable.$inferInsert;
