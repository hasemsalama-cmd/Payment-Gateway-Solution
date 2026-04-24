import { Router, type IRouter } from "express";
import { db, scoringRulesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateScoringRulesBody } from "@workspace/api-zod";
import { getRulesValues } from "../lib/rules";
import { serializeRules } from "../lib/serializers";

const router: IRouter = Router();

router.get("/scoring/rules", async (_req, res): Promise<void> => {
  const rules = await getRulesValues();
  res.json(rules);
});

router.put("/scoring/rules", async (req, res): Promise<void> => {
  const parsed = UpdateScoringRulesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await getRulesValues();
  const [row] = await db
    .update(scoringRulesTable)
    .set({
      approveThreshold: parsed.data.approveThreshold,
      reviewThreshold: parsed.data.reviewThreshold,
      maxDebtToIncomeRatio: String(parsed.data.maxDebtToIncomeRatio),
      maxPaymentToIncomeRatio: String(parsed.data.maxPaymentToIncomeRatio),
      baseInterestRate: String(parsed.data.baseInterestRate),
      riskPremiumPerBand: String(parsed.data.riskPremiumPerBand),
    })
    .where(eq(scoringRulesTable.id, "default"))
    .returning();
  res.json(serializeRules(row!));
});

export default router;
