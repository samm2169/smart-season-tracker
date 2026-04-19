import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import fieldsRouter from "./fields";
import fieldUpdatesRouter from "./field-updates";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(fieldsRouter);
router.use(fieldUpdatesRouter);
router.use(dashboardRouter);

export default router;
