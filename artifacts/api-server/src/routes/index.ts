import { Router, type IRouter } from "express";
import healthRouter from "./health";
import applicationsRouter from "./applications";
import loansRouter from "./loans";
import dashboardRouter from "./dashboard";
import scoringRulesRouter from "./scoringRules";

const router: IRouter = Router();

router.use(healthRouter);
router.use(applicationsRouter);
router.use(loansRouter);
router.use(dashboardRouter);
router.use(scoringRulesRouter);

export default router;
