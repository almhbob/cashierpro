import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import salesRouter from "./sales";
import inventoryRouter from "./inventory";
import adminRouter from "./admin";
import tenantsRouter from "./tenants";
import superadminRouter from "./superadmin";
import employeesRouter from "./employees";
import zatcaRouter from "./zatca";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(salesRouter);
router.use(inventoryRouter);
router.use("/admin", adminRouter);
router.use("/tenants", tenantsRouter);
router.use("/superadmin", superadminRouter);
router.use(employeesRouter);
router.use(zatcaRouter);

export default router;
