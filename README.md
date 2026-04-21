<div dir="rtl">

# 🏪 كاشير برو — CashierPro

**نظام إدارة نقاط البيع السحابي المتكامل للمتاجر والسوبر ماركت**

نظام SaaS متعدد المستأجرين مبني بأحدث التقنيات، يتيح لأصحاب المتاجر إدارة المبيعات والمخزون والتقارير من أي مكان، مع دعم نسخة سطح المكتب (EXE) للعمل دون إنترنت.

---

## ✨ المميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🛒 **نقطة بيع سريعة** | مسح الباركود وإتمام البيع في ثوانٍ |
| 📦 **إدارة المخزون** | تتبع الكميات والتنبيه عند النقص |
| 📊 **تقارير وتحليلات** | إحصائيات يومية وشهرية تفصيلية |
| 🌐 **متعدد اللغات** | عربي، إنجليزي، هندي، بنغالي (RTL/LTR) |
| 👥 **متعدد المستأجرين** | كل متجر بيانات معزولة تماماً |
| 📱 **PWA** | قابل للتثبيت على الجوال |
| 💻 **نسخة EXE** | تعمل offline على Windows بترخيص مرتبط بالجهاز |
| 🎯 **وضع تجريبي** | للعروض البيعية بكود `DEMO2025` |
| 🔐 **بوابة المطور** | لوحة تحكم كاملة للمطوّر بكلمة سر مستقلة |

---

## 🏗️ البنية التقنية

```
cashierpro/
├── artifacts/
│   ├── supermarket-pos/     # React + Vite (واجهة المستخدم)
│   └── api-server/          # Express 5 + Drizzle ORM (الـ API)
├── lib/
│   └── db/                  # مخطط PostgreSQL + Drizzle
├── desktop-app/             # Electron (نسخة Windows EXE)
└── packages/                # حزم مشتركة
```

### Stack

| الطبقة | التقنية |
|--------|---------|
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui |
| Backend | Express 5, TypeScript, Drizzle ORM |
| Database | PostgreSQL |
| Auth | Clerk (OAuth + Email) |
| Desktop | Electron 29, Better-SQLite3 |
| Monorepo | pnpm workspaces |

---

## 🚀 التشغيل المحلي

### المتطلبات
- Node.js 20+
- pnpm 9+
- PostgreSQL (أو استخدم DATABASE_URL)

### الخطوات

```bash
# 1. نسخ المشروع
git clone https://github.com/<username>/cashierpro.git
cd cashierpro

# 2. تثبيت الحزم
pnpm install

# 3. نسخ متغيرات البيئة
cp .env.example .env
# عدّل الملف وأضف: DATABASE_URL, CLERK_SECRET_KEY, VITE_CLERK_PUBLISHABLE_KEY

# 4. رفع مخطط قاعدة البيانات
pnpm --filter @workspace/db run push

# 5. تشغيل API
pnpm --filter @workspace/api-server run dev

# 6. تشغيل الواجهة (في نافذة ثانية)
pnpm --filter @workspace/supermarket-pos run dev
```

---

## 🔐 متغيرات البيئة المطلوبة

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PUBLISHABLE_KEY=pk_...
DEV_PORTAL_PASSWORD=your-strong-password
SESSION_SECRET=random-32-char-string
```

> ⚠️ لا ترفع ملف `.env` أبداً — هو مُدرَج في `.gitignore`

---

## 🛠️ بوابة المطور

الوصول على: `https://your-domain.com/dev`

- مستقلة عن Clerk تماماً
- محمية بكلمة سر (`DEV_PORTAL_PASSWORD`)
- تتيح: إدارة المتاجر، التراخيص، عزل البيانات، الملف الشخصي

---

## 💻 بناء نسخة Windows EXE

```bash
cd desktop-app

# 1. عدّل رابط خادمك في src/license-validator.js
# 2. أضف أيقونة build/icon.ico
# 3. ابنِ واجهة React وانسخ dist إلى renderer/

npm install
npm run build:win
# الناتج: dist-exe/CashierPro-Setup-1.0.0.exe
```

---

## 📋 خطط الاشتراك

| الخطة | الكاشيرون | المنتجات | السعر |
|-------|-----------|----------|-------|
| أساسي | 1 | 500 | مجاناً |
| محترف | 5 | ∞ | 99 ريال/شهر |
| متميز | ∞ | ∞ | 299 ريال/شهر |

---

## 👨‍💻 المطور

**عاصم عبدالرحمن محمد**

- 📧 Almhbob.iii@gmail.com
- 📱 0530658285
- 🌐 [credly.com/users/asim-abdulrahman](https://www.credly.com/users/asim-abdulrahman)

### الشهادات المهنية
- Google Advanced Data Analytics Professional (2026)
- IBM Cybersecurity Specialist Professional (2026)
- Google Data Analytics Professional (2026)
- Cybersecurity Fundamentals — IBM (2024)
- Introduction to Data Science — Cisco (2025)

---

## 📄 الترخيص

هذا المشروع مملوك لمطوّره. جميع الحقوق محفوظة © 2025

</div>

---

<div dir="ltr">

# 🏪 CashierPro — نظام إدارة المتاجر

**A production-ready, multi-tenant SaaS Point-of-Sale system for retail shops**

Built with modern stack (React + Express + PostgreSQL), featuring cloud sync, offline Windows EXE with machine-bound licensing, Arabic RTL UI, PWA support, and a professional developer admin portal.

## Quick Start

```bash
git clone https://github.com/<username>/cashierpro.git
cd cashierpro && pnpm install
# Add env vars → pnpm --filter @workspace/db run push → pnpm dev
```

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | POS Checkout |
| `/dashboard` | Analytics Dashboard |
| `/inventory` | Inventory Management |
| `/settings` | Store Settings (4 tabs) |
| `/dev` | Developer Admin Portal |
| `/sign-in` | Clerk Authentication |

## Demo Mode

Enter code `DEMO2025` on the sign-in page to explore with realistic mock data.

</div>
