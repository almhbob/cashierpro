/**
 * Local Express + SQLite server for CashierPro Desktop
 * Mirrors the cloud API but stores data locally.
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");
const { app } = require("electron");

const DB_PATH = path.join(app.getPath("userData"), "cashierpro.db");
let server = null;

function initDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode     TEXT NOT NULL,
      name        TEXT NOT NULL,
      name_ar     TEXT NOT NULL,
      price       REAL NOT NULL,
      stock       INTEGER NOT NULL DEFAULT 0,
      category    TEXT NOT NULL,
      unit        TEXT NOT NULL DEFAULT 'قطعة',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      total        REAL NOT NULL,
      amount_paid  REAL NOT NULL,
      change       REAL NOT NULL,
      cashier_name TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      discount     REAL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id         INTEGER NOT NULL REFERENCES sales(id),
      product_id      INTEGER NOT NULL,
      product_name    TEXT NOT NULL,
      product_name_ar TEXT NOT NULL,
      barcode         TEXT NOT NULL,
      quantity        INTEGER NOT NULL,
      unit_price      REAL NOT NULL,
      subtotal        REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS returns (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id         INTEGER NOT NULL REFERENCES sales(id),
      cashier_name    TEXT NOT NULL,
      reason          TEXT,
      total_refunded  REAL NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS return_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id       INTEGER NOT NULL REFERENCES returns(id),
      product_id      INTEGER NOT NULL,
      product_name    TEXT NOT NULL,
      product_name_ar TEXT NOT NULL,
      barcode         TEXT NOT NULL,
      quantity        INTEGER NOT NULL,
      unit_price      REAL NOT NULL,
      subtotal        REAL NOT NULL
    );

    INSERT OR IGNORE INTO settings VALUES
      ('storeName', 'متجري', datetime('now')),
      ('storePhone', '', datetime('now')),
      ('storeAddress', '', datetime('now')),
      ('vatNumber', '', datetime('now')),
      ('vatRate', '15', datetime('now')),
      ('currency', 'SAR', datetime('now')),
      ('invoicePrefix', 'INV', datetime('now')),
      ('cashierName', 'الكاشير', datetime('now')),
      ('receiptHeader', '', datetime('now')),
      ('receiptFooter', 'شكراً لزيارتكم', datetime('now'));
  `);

  return db;
}

function startServer(port = 7777) {
  const db = initDb();
  const expressApp = express();
  expressApp.use(cors());
  expressApp.use(express.json());

  /* ── Static frontend (React build) ─ */
  const distPath = path.join(__dirname, "../renderer/dist");
  const fs = require("fs");
  if (fs.existsSync(distPath)) {
    expressApp.use(express.static(distPath));
  }

  /* ── Products ─────────────────────── */
  expressApp.get("/api/products", (req, res) => {
    const { q, barcode } = req.query;
    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];
    if (barcode) { sql += " AND barcode LIKE ?"; params.push(`%${barcode}%`); }
    if (q) { sql += " AND (name_ar LIKE ? OR name LIKE ? OR barcode LIKE ?)"; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    sql += " ORDER BY name_ar";
    res.json(db.prepare(sql).all(...params).map(mapProduct));
  });

  expressApp.post("/api/products", (req, res) => {
    const { barcode, name, nameAr, price, stock, category, unit } = req.body;
    const existing = db.prepare("SELECT id FROM products WHERE barcode = ?").get(barcode);
    if (existing) { res.status(409).json({ error: "الباركود موجود مسبقاً" }); return; }
    const result = db.prepare(
      "INSERT INTO products (barcode, name, name_ar, price, stock, category, unit) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(barcode, name, nameAr, price, stock ?? 0, category, unit ?? "قطعة");
    res.json(db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid));
  });

  expressApp.patch("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { name, nameAr, price, stock, category, unit, barcode } = req.body;
    db.prepare("UPDATE products SET name=?, name_ar=?, price=?, stock=?, category=?, unit=?, barcode=?, updated_at=datetime('now') WHERE id=?")
      .run(name, nameAr, price, stock, category, unit, barcode, id);
    res.json(db.prepare("SELECT * FROM products WHERE id=?").get(id));
  });

  expressApp.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
    res.json({ ok: true });
  });

  /* ── Sales ────────────────────────── */
  expressApp.get("/api/sales", (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const sales = db.prepare("SELECT * FROM sales ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset);
    const total = db.prepare("SELECT count(*) as c FROM sales").get().c;
    res.json({ sales: sales.map(mapSale), total });
  });

  expressApp.get("/api/sales/:id", (req, res) => {
    const sale = db.prepare("SELECT * FROM sales WHERE id=?").get(req.params.id);
    if (!sale) { res.status(404).json({ error: "not found" }); return; }
    const items = db.prepare("SELECT * FROM sale_items WHERE sale_id=?").all(sale.id);
    res.json({ ...mapSale(sale), items });
  });

  expressApp.post("/api/sales", (req, res) => {
    const { total, amountPaid, change, cashierName, customerName, customerPhone, discount, items } = req.body;
    const saleResult = db.prepare(
      "INSERT INTO sales (total, amount_paid, change, cashier_name, customer_name, customer_phone, discount) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(total, amountPaid, change, cashierName, customerName ?? null, customerPhone ?? null, discount ?? 0);
    const saleId = saleResult.lastInsertRowid;
    const stmt = db.prepare(
      "INSERT INTO sale_items (sale_id, product_id, product_name, product_name_ar, barcode, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const item of (items ?? [])) {
      stmt.run(saleId, item.productId, item.productName, item.productNameAr, item.barcode, item.quantity, item.unitPrice, item.subtotal);
      db.prepare("UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?").run(item.quantity, item.productId);
    }
    res.json(db.prepare("SELECT * FROM sales WHERE id=?").get(saleId));
  });

  /* ── Returns ──────────────────────── */
  expressApp.get("/api/returns", (req, res) => {
    const returns = db.prepare("SELECT r.*, s.id as saleRef FROM returns r JOIN sales s ON r.sale_id=s.id ORDER BY r.created_at DESC LIMIT 100").all();
    res.json(returns);
  });

  expressApp.get("/api/returns/:id", (req, res) => {
    const ret = db.prepare("SELECT * FROM returns WHERE id=?").get(req.params.id);
    if (!ret) { res.status(404).json({ error: "not found" }); return; }
    const items = db.prepare("SELECT * FROM return_items WHERE return_id=?").all(ret.id);
    res.json({ ...ret, items });
  });

  expressApp.post("/api/returns", (req, res) => {
    const { saleId, cashierName, reason, items } = req.body;
    if (!saleId || !items || items.length === 0) {
      res.status(400).json({ error: "بيانات الإرجاع غير مكتملة" }); return;
    }
    const totalRefunded = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    const retResult = db.prepare(
      "INSERT INTO returns (sale_id, cashier_name, reason, total_refunded) VALUES (?, ?, ?, ?)"
    ).run(saleId, cashierName ?? "الكاشير", reason ?? "", totalRefunded);
    const retId = retResult.lastInsertRowid;
    const stmt = db.prepare(
      "INSERT INTO return_items (return_id, product_id, product_name, product_name_ar, barcode, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const item of items) {
      stmt.run(retId, item.productId, item.productName, item.productNameAr, item.barcode, item.quantity, item.unitPrice, item.quantity * item.unitPrice);
      db.prepare("UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?").run(item.quantity, item.productId);
    }
    res.json({ id: retId, saleId, totalRefunded, items });
  });

  /* ── Reports ───────────────────────── */
  expressApp.get("/api/reports/daily", (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const rows = db.prepare(`
      SELECT date(created_at) as day,
             count(*) as transactions,
             coalesce(sum(total),0) as revenue,
             coalesce(sum(discount),0) as discounts
      FROM sales
      WHERE created_at >= date('now', '-' || ? || ' days')
      GROUP BY day ORDER BY day ASC
    `).all(days);
    res.json(rows);
  });

  expressApp.get("/api/reports/top-products", (req, res) => {
    const rows = db.prepare(`
      SELECT si.product_name_ar as name, si.barcode,
             sum(si.quantity) as totalQty, sum(si.subtotal) as totalRevenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= date('now', '-30 days')
      GROUP BY si.product_id ORDER BY totalQty DESC LIMIT 10
    `).all();
    res.json(rows);
  });

  expressApp.get("/api/reports/summary", (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);
    const todayData  = db.prepare("SELECT count(*) c, coalesce(sum(total),0) t, coalesce(sum(discount),0) d FROM sales WHERE date(created_at)=?").get(today);
    const monthData  = db.prepare("SELECT count(*) c, coalesce(sum(total),0) t FROM sales WHERE strftime('%Y-%m',created_at)=?").get(thisMonth);
    const returnData = db.prepare("SELECT count(*) c, coalesce(sum(total_refunded),0) t FROM returns WHERE date(created_at)=?").get(today);
    const totalProds = db.prepare("SELECT count(*) c FROM products").get().c;
    const lowStock   = db.prepare("SELECT count(*) c FROM products WHERE stock<=5").get().c;
    res.json({
      todayTransactions: todayData.c, todayRevenue: todayData.t, todayDiscounts: todayData.d,
      monthTransactions: monthData.c, monthRevenue: monthData.t,
      todayReturns: returnData.c, todayRefunded: returnData.t,
      totalProducts: totalProds, lowStockProducts: lowStock
    });
  });

  /* ── Inventory ────────────────────── */
  expressApp.get("/api/inventory/low-stock", (req, res) => {
    res.json(db.prepare("SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC").all().map(mapProduct));
  });

  expressApp.post("/api/inventory/receive", (req, res) => {
    const { productId, quantity } = req.body;
    db.prepare("UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?").run(quantity, productId);
    res.json({ ok: true });
  });

  /* ── Settings ─────────────────────── */
  expressApp.get("/api/settings", (_req, res) => {
    const rows = db.prepare("SELECT key, value FROM settings").all();
    res.json(rows);
  });

  expressApp.post("/api/settings", (req, res) => {
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) upsert.run(key, String(value));
    res.json({ ok: true });
  });

  /* ── Tenant (stub) ────────────────── */
  expressApp.get("/api/tenants/me", (_req, res) => {
    const settings = db.prepare("SELECT key, value FROM settings").all();
    const s = Object.fromEntries(settings.map(r => [r.key, r.value]));
    res.json({
      id: "local", name: s.storeName ?? "متجري", nameEn: "My Store", slug: "local",
      plan: "professional", status: "active", needsOnboarding: false,
      trialEndsAt: null, trialDaysLeft: null, memberCount: 1,
      limits: { cashiers: 999, products: 999999, price: 0 }, createdAt: new Date().toISOString(),
    });
  });

  /* ── Dashboard ────────────────────── */
  expressApp.get("/api/dashboard", (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = db.prepare("SELECT count(*) as c, coalesce(sum(total),0) as t FROM sales WHERE date(created_at) = ?").get(today);
    const totalProducts = db.prepare("SELECT count(*) as c FROM products").get().c;
    const lowStock = db.prepare("SELECT count(*) as c FROM products WHERE stock <= 5").get().c;
    res.json({ todayTransactions: todaySales.c, todaySales: todaySales.t, totalProducts, lowStockCount: lowStock, monthlySales: 0, monthlyTransactions: 0 });
  });

  /* ── SPA fallback: serve index.html for non-API routes ─ */
  if (fs.existsSync(distPath)) {
    expressApp.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server = expressApp.listen(port, "127.0.0.1", () => {
    console.log(`[LocalServer] Listening on port ${port}`);
  });

  return port;
}

function stopServer() {
  if (server) { server.close(); server = null; }
}

function mapProduct(r) {
  return { id: r.id, barcode: r.barcode, name: r.name, nameAr: r.name_ar, price: r.price, stock: r.stock, category: r.category, unit: r.unit, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapSale(r) {
  return { id: r.id, total: r.total, amountPaid: r.amount_paid, change: r.change, cashierName: r.cashier_name, customerName: r.customer_name, customerPhone: r.customer_phone, discount: r.discount ?? 0, createdAt: r.created_at };
}

module.exports = { startServer, stopServer };
