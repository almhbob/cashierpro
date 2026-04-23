import { Router, Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { employeesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin + "pos_salt_2025").digest("hex");
}

const router = Router();
router.use(requireAuth);

/* ─── Employee Statistics (must come before /:id) ─── */
router.get("/employees/stats", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const employees = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.tenantId, tenantId));

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    inactive: employees.filter((e) => e.status === "inactive").length,
    suspended: employees.filter((e) => e.status === "suspended").length,
    byRole: {
      owner: employees.filter((e) => e.role === "owner").length,
      manager: employees.filter((e) => e.role === "manager").length,
      cashier: employees.filter((e) => e.role === "cashier").length,
      accountant: employees.filter((e) => e.role === "accountant").length,
      warehouse: employees.filter((e) => e.role === "warehouse").length,
    },
    totalSalary: employees
      .filter((e) => e.status === "active" && e.salary)
      .reduce((sum, e) => sum + (e.salary || 0), 0),
  };

  res.json(stats);
});

/* ─── Verify Supervisor PIN (must come before /:id) ─── */
router.post("/employees/verify-supervisor", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const { pin } = req.body;

  if (!pin) {
    res.status(400).json({ error: "PIN required" });
    return;
  }

  const hashed = hashPin(String(pin));
  const supervisors = await db
    .select()
    .from(employeesTable)
    .where(
      and(
        eq(employeesTable.tenantId, tenantId),
        eq(employeesTable.status, "active")
      )
    );

  const match = supervisors.find(
    (e) => e.pin === hashed && (e.role === "owner" || e.role === "manager")
  );

  if (match) {
    res.json({ verified: true, employee: { id: match.id, name: match.name, role: match.role } });
  } else {
    res.status(401).json({ verified: false, error: "Invalid supervisor PIN" });
  }
});

/* ─── List Employees ─── */
router.get("/employees", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const employees = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.tenantId, tenantId))
    .orderBy(employeesTable.createdAt);

  const sanitized = employees.map((e) => ({ ...e, pin: e.pin ? "****" : null }));
  res.json(sanitized);
});

/* ─── Create Employee ─── */
router.post("/employees", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const {
    name, nameEn, role, pin, phone, email, salary, salaryType,
    startDate, nationalId, notes, status,
    canManageProducts, canManageSales, canViewReports,
    canManageEmployees, canManageSettings, canApplyDiscount,
    maxDiscountPercent,
  } = req.body;

  if (!name || !role) {
    res.status(400).json({ error: "Name and role are required" });
    return;
  }

  const hashedPin = pin ? hashPin(String(pin)) : null;

  const [employee] = await db
    .insert(employeesTable)
    .values({
      tenantId,
      name,
      nameEn: nameEn || "",
      role,
      pin: hashedPin,
      phone: phone || "",
      email: email || "",
      salary: salary ? Number(salary) : null,
      salaryType: salaryType || "monthly",
      startDate: startDate || null,
      nationalId: nationalId || "",
      notes: notes || "",
      status: status || "active",
      canManageProducts: Boolean(canManageProducts),
      canManageSales: canManageSales !== false,
      canViewReports: Boolean(canViewReports),
      canManageEmployees: Boolean(canManageEmployees),
      canManageSettings: Boolean(canManageSettings),
      canApplyDiscount: Boolean(canApplyDiscount),
      maxDiscountPercent: Number(maxDiscountPercent) || 0,
    })
    .returning();

  res.status(201).json({ ...employee, pin: employee.pin ? "****" : null });
});

/* ─── Get Single Employee ─── */
router.get("/employees/:id", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const { id } = req.params;
  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.tenantId, tenantId)));

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json({ ...employee, pin: employee.pin ? "****" : null });
});

/* ─── Update Employee ─── */
router.put("/employees/:id", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const { id } = req.params;

  const existing = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.tenantId, tenantId)));

  if (!existing.length) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  const {
    name, nameEn, role, pin, phone, email, salary, salaryType,
    startDate, nationalId, notes, status,
    canManageProducts, canManageSales, canViewReports,
    canManageEmployees, canManageSettings, canApplyDiscount,
    maxDiscountPercent,
  } = req.body;

  const updateData: Partial<typeof employeesTable.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (nameEn !== undefined) updateData.nameEn = nameEn;
  if (role !== undefined) updateData.role = role;
  if (pin !== undefined && pin !== "****") updateData.pin = pin ? hashPin(String(pin)) : null;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (salary !== undefined) updateData.salary = salary ? Number(salary) : null;
  if (salaryType !== undefined) updateData.salaryType = salaryType;
  if (startDate !== undefined) updateData.startDate = startDate;
  if (nationalId !== undefined) updateData.nationalId = nationalId;
  if (notes !== undefined) updateData.notes = notes;
  if (status !== undefined) updateData.status = status;
  if (canManageProducts !== undefined) updateData.canManageProducts = Boolean(canManageProducts);
  if (canManageSales !== undefined) updateData.canManageSales = Boolean(canManageSales);
  if (canViewReports !== undefined) updateData.canViewReports = Boolean(canViewReports);
  if (canManageEmployees !== undefined) updateData.canManageEmployees = Boolean(canManageEmployees);
  if (canManageSettings !== undefined) updateData.canManageSettings = Boolean(canManageSettings);
  if (canApplyDiscount !== undefined) updateData.canApplyDiscount = Boolean(canApplyDiscount);
  if (maxDiscountPercent !== undefined) updateData.maxDiscountPercent = Number(maxDiscountPercent) || 0;

  const [updated] = await db
    .update(employeesTable)
    .set(updateData)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.tenantId, tenantId)))
    .returning();

  res.json({ ...updated, pin: updated.pin ? "****" : null });
});

/* ─── Delete / Deactivate Employee ─── */
router.delete("/employees/:id", async (req, res): Promise<void> => {
  const tenantId = (req as any).tenantId as string;
  const { id } = req.params;
  const { permanent } = req.query;

  const existing = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.tenantId, tenantId)));

  if (!existing.length) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  if (permanent === "true") {
    await db.delete(employeesTable).where(and(eq(employeesTable.id, id), eq(employeesTable.tenantId, tenantId)));
    res.json({ success: true, deleted: true });
  } else {
    await db
      .update(employeesTable)
      .set({ status: "inactive" })
      .where(and(eq(employeesTable.id, id), eq(employeesTable.tenantId, tenantId)));
    res.json({ success: true, deactivated: true });
  }
});

export default router;
