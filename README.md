<div align="center">

# 🏪 كاشير برو — CashierPro

[![Version](https://img.shields.io/badge/الإصدار-1.0.0-16a34a?style=for-the-badge)]()
[![License](https://img.shields.io/badge/الترخيص-Proprietary-ef4444?style=for-the-badge)]()
[![Node](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

**نظام إدارة المتاجر والسوبر ماركت السحابي الأول**
**#1 Cloud-Based Supermarket Management SaaS**

[العربية](#-نظرة-عامة) · [English](#english-overview) · [বাংলা](#বাংলা-সংক্ষিপ্ত-বিবরণ)

</div>

---

## 📋 نظرة عامة

**كاشير برو** منصة SaaS سحابية متعددة المستأجرين (Multi-Tenant) لإدارة المتاجر والسوبر ماركت بشكل احترافي. تشمل نقطة بيع سريعة، إدارة مخزون متكاملة، إدارة موظفين بصلاحيات دقيقة، تقارير وتحليلات متقدمة، ودعم أربع لغات.

---

## ✨ المميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🛒 **نقطة بيع سريعة** | مسح باركود + إتمام البيع في ثوانٍ مع طباعة فاتورة |
| 📦 **إدارة المخزون** | تتبع المستودع، تنبيهات نقص المخزون، تقرير جرد |
| 👥 **إدارة الموظفين** | أدوار (مالك/مدير/كاشير/محاسب)، PIN مشرف، صلاحيات دقيقة |
| 📊 **تقارير وتحليلات** | إحصاءات يومية وشهرية، تحليل المنتجات الأكثر مبيعًا |
| 🌍 **4 لغات** | العربية 🇸🇦، الإنجليزية 🇺🇸، الهندية 🇮🇳، البنغالية 🇧🇩 |
| 🏢 **متعدد المتاجر** | كل متجر بياناته معزولة تمامًا، إدارة من لوحة واحدة |
| 🔒 **أمان متقدم** | Clerk Auth + PIN مشرف + صلاحيات الوصول |
| 🖥️ **نسخة مكتبية** | EXE لـ Windows مع كود تفعيل وعمل offline |
| 🎯 **وضع تجريبي** | استعراض الميزات بكود `DEMO2025` |
| 📱 **PWA** | قابل للتثبيت على الجوال والتابلت |

---

## 🏗️ هيكل المشروع

```
cashierpro/
├── artifacts/
│   ├── supermarket-pos/          # واجهة المستخدم (React + Vite + TailwindCSS)
│   │   └── src/
│   │       ├── pages/            # POS, Products, Inventory, Employees, Settings...
│   │       ├── components/       # UI Components (shadcn/ui)
│   │       ├── context/          # TenantContext, DemoContext
│   │       └── i18n/locales/     # ar.json, en.json, hi.json, bn.json
│   └── api-server/               # خادم API (Express 5 + Drizzle ORM)
│       └── src/
│           ├── routes/           # tenants, products, sales, employees, superadmin...
│           └── middleware/       # auth, tenant isolation
├── lib/db/src/schema/            # مخطط قاعدة البيانات (Drizzle + PostgreSQL)
├── desktop-app/                  # تطبيق Windows (Electron 29)
│   ├── src/main.js               # العملية الرئيسية
│   ├── src/activation.js         # نظام كود التفعيل (offline)
│   └── renderer/                 # واجهة HTML
└── pnpm-workspace.yaml
```

---

## 🗄️ مخطط قاعدة البيانات

| الجدول | الوصف |
|--------|-------|
| `tenants` | المتاجر (id, name, plan, status, trialEndsAt) |
| `tenant_members` | أعضاء المتجر (role: owner/cashier/viewer) |
| `tenant_settings` | إعدادات المتجر (key-value pairs) |
| `products` | المنتجات (barcode, nameAr, price, stock, category) |
| `sales` | المبيعات (total, cashierName, items JSON) |
| `employees` | الموظفون (role, pin, permissions, salary) |
| `desktop_licenses` | تراخيص نسخة EXE |

---

## 📱 الصفحات والمسارات

| المسار | الصفحة | الوصول |
|--------|--------|--------|
| `/` | لوحة القيادة | مسجّل الدخول |
| `/pos` | نقطة البيع | مسجّل الدخول |
| `/products` | إدارة المنتجات | مسجّل الدخول |
| `/inventory` | إدارة المخزون | مسجّل الدخول |
| `/sales` | سجل المبيعات | مسجّل الدخول |
| `/analytics` | التحليلات | مسجّل الدخول |
| `/employees` | إدارة الموظفين | **مشرف فقط (PIN)** |
| `/settings` | الإعدادات | **مالك فقط** |
| `/superadmin` | لوحة التحكم العامة | **سوبر أدمن فقط** |

---

## 🚀 البدء السريع

### المتطلبات
- Node.js 24+
- pnpm 9+
- PostgreSQL 16+
- حساب [Clerk](https://clerk.com) للمصادقة

### خطوات التثبيت

```bash
# 1. استنساخ المستودع
git clone https://github.com/almhbob/cashierpro.git
cd cashierpro

# 2. تثبيت التبعيات
pnpm install

# 3. إعداد متغيرات البيئة
cp .env.example .env
# عدّل .env بمعلومات قاعدة البيانات و Clerk

# 4. رفع مخطط قاعدة البيانات
pnpm --filter @workspace/db run push

# 5. تشغيل الخادم
pnpm --filter @workspace/api-server run dev

# 6. تشغيل الواجهة (في نافذة أخرى)
pnpm --filter @workspace/supermarket-pos run dev
```

### متغيرات البيئة

```env
# قاعدة البيانات
DATABASE_URL=postgresql://user:pass@host:5432/cashierpro

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# الخادم
PORT=8080
NODE_ENV=production
```

---

## 💳 خطط الاشتراك

| الخطة | الكاشيرون | المنتجات | السعر الشهري |
|-------|-----------|----------|-------------|
| 🟢 **Starter** | 1 | 500 | مجاني |
| 🔵 **Professional** | 5 | غير محدود | 99 ريال |
| 🟣 **Enterprise** | ∞ | ∞ | 299 ريال |

---

## 🌐 API الرئيسية

```
GET/PUT  /api/tenants/me                  → معلومات المتجر
GET/PUT  /api/tenants/me/settings         → إعدادات المتجر
GET/POST /api/products                    → إدارة المنتجات
GET/POST /api/sales                       → المبيعات
GET/POST /api/employees                   → إدارة الموظفين
POST     /api/employees/verify-supervisor → التحقق من PIN
GET      /api/superadmin/overview         → إحصاءات المنصة
```

---

## 🖥️ النسخة المكتبية (EXE)

انظر [`desktop-app/README.md`](desktop-app/README.md) لتفاصيل:
- تثبيت التطبيق على Windows
- كودات التفعيل
- بناء الـ EXE من المصدر

---

## 🛠️ أوامر التطوير

```bash
pnpm run typecheck          # فحص TypeScript الكامل
pnpm run build              # بناء كامل
pnpm --filter @workspace/api-server run dev    # تشغيل API
pnpm --filter @workspace/supermarket-pos run dev  # تشغيل الواجهة
```

---

## 📞 الدعم الفني والتواصل

| القناة | التفاصيل |
|--------|---------|
| 📧 **البريد الإلكتروني** | [Almhbob.iii@gmail.com](mailto:Almhbob.iii@gmail.com) |
| 📱 **واتساب** | [+966530658285](https://wa.me/966530658285) |
| 👨‍💻 **المطوّر** | Abdullah Almhbob |

---

## 📄 الترخيص

محمي بحقوق الملكية الفكرية. جميع الحقوق محفوظة © 2025 **Abdullah Almhbob / CashierPro**

---

<a id="english-overview"></a>

## 🇺🇸 English Overview

**CashierPro** is a production-ready, multi-tenant SaaS platform for supermarket and retail management.

**Features:** Fast POS · Inventory Management · Employee Management with PIN Access · Advanced Reports · 4 Languages (Arabic, English, Hindi, Bengali) · Multi-store isolation · Windows Desktop EXE with offline activation codes · Demo Mode

**Tech Stack:** React 18 · Vite · TailwindCSS · shadcn/ui · Express 5 · Drizzle ORM · PostgreSQL · Clerk Auth · Electron 29 · pnpm Workspaces · TypeScript 5.9

**Support:** [Almhbob.iii@gmail.com](mailto:Almhbob.iii@gmail.com) | WhatsApp: [+966530658285](https://wa.me/966530658285)

---

<a id="বাংলা-সংক্ষিপ্ত-বিবরণ"></a>

## 🇧🇩 বাংলা সংক্ষিপ্ত বিবরণ

**CashierPro** হল একটি প্রফেশনাল মাল্টি-টেন্যান্ট SaaS সিস্টেম যা সুপারমার্কেট ও রিটেইল ব্যবস্থাপনার জন্য তৈরি।

**বৈশিষ্ট্যসমূহ:** দ্রুত POS · ইনভেন্টরি · কর্মী ব্যবস্থাপনা · ৪টি ভাষা (আরবি, ইংরেজি, হিন্দি, বাংলা) · Windows EXE অ্যাক্টিভেশন কোড সহ

**সাপোর্ট:** [Almhbob.iii@gmail.com](mailto:Almhbob.iii@gmail.com) | WhatsApp: [+966530658285](https://wa.me/966530658285)

---

<div align="center">
  <sub>Developed with ❤️ by <strong>Abdullah Almhbob</strong> · <a href="mailto:Almhbob.iii@gmail.com">Almhbob.iii@gmail.com</a> · <a href="https://wa.me/966530658285">+966530658285</a></sub>
</div>
