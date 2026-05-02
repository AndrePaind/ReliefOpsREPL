import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hubsRouter from "./hubs";
import itemsRouter from "./items";
import requestsRouter from "./requests";
import transfersRouter from "./transfers";
import volunteersRouter from "./volunteers";
import tasksRouter from "./tasks";
import activityRouter from "./activity";
import dashboardRouter from "./dashboard";
import csvRouter from "./csv";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/hubs", hubsRouter);
router.use("/items", itemsRouter);
router.use("/requests", requestsRouter);
router.use("/transfers", transfersRouter);
router.use("/volunteers", volunteersRouter);
router.use("/tasks", tasksRouter);
router.use("/activity", activityRouter);
router.use("/dashboard", dashboardRouter);
router.use("/stock", csvRouter);

export default router;
