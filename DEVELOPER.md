# 👨‍💻 بيانات المطوّر والدعم الفني
# Developer Information & Support

---

## 🧑‍💼 المطوّر / Developer

| | |
|---|---|
| **الاسم / Name** | Abdullah Almhbob |
| **التخصص / Specialty** | Full-Stack Developer · Data Analytics · Cybersecurity |
| **الدولة / Country** | المملكة العربية السعودية 🇸🇦 |

---

## 📞 التواصل / Contact

| القناة / Channel | التفاصيل / Details |
|---|---|
| 📱 **واتساب / WhatsApp** | [+966530658285](https://wa.me/966530658285) |
| 📧 **البريد / Email** | [Almhbob.iii@gmail.com](mailto:Almhbob.iii@gmail.com) |

---

## 🎓 الشهادات المهنية / Professional Certifications

| الشهادة | الجهة | السنة |
|---------|-------|-------|
| Google Advanced Data Analytics Professional | Google | 2026 |
| IBM Cybersecurity Specialist Professional | IBM | 2026 |
| Google Data Analytics Professional | Google | 2026 |
| Introduction to Data Science | Cisco | 2025 |
| Cybersecurity Fundamentals | IBM | 2024 |

---

## 🛠️ للمطوّرين / For Developers

### بنية API
- Base URL: `https://supermarket-pos.replit.app/api`
- المصادقة: Clerk JWT (Bearer token)
- Content-Type: `application/json`

### إعداد البيئة المحلية
```bash
git clone https://github.com/almhbob/cashierpro.git
cd cashierpro
pnpm install
cp .env.example .env
# أضف متغيرات البيئة
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/supermarket-pos run dev
```

### إعداد سطح المكتب بعد الاستنساخ / Desktop app setup after cloning
```bash
cd desktop-app
# الخطوة المطلوبة: ولّد المفتاح السري المحلي (hmac-config.js غير مرفوع على git)
# Required step: generate local HMAC secret (hmac-config.js is gitignored)
node scripts/rotate-secret.js
# يطبع كودات تجريبية جاهزة للاختبار / Prints test codes ready to use
```

### توليد كودات تفعيل EXE
```bash
cd desktop-app
node src/generate-codes.js 20          # 20 كود عشوائي
node src/generate-codes.js 5 CP25      # 5 كود ببادئة CP25
```

### بناء ملف EXE (يتطلب Windows أو Wine)
```bash
cd desktop-app
npm install
npm run build:win
# dist-exe/CashierPro-Setup-1.0.0.exe
```

---

## 🔑 نظام التفعيل / Activation System

### آلية العمل
- كودات التفعيل تُتحقق منها **محليًا** (offline) بدون خادم
- الخوارزمية: HMAC-SHA256
- تنسيق الكود: `XXXX-XXXX-XXXX-XXXX`
- بعد التفعيل: يُحفظ ملف `.cashierpro-license` في مجلد بيانات التطبيق

### كودات التطوير / Development Codes

لا توجد كودات تجاوز مُضمَّنة في الكود. للحصول على كودات صالحة للاختبار:

There are no hardcoded bypass codes in the source. To get valid codes for testing:
```bash
cd desktop-app
node scripts/rotate-secret.js   # يطبع كودات DEV1/DEV2/TEST الجاهزة للاختبار
```

أو لتوليد كمية أكبر / Or to generate more:
```bash
node src/generate-codes.js 5 TEST
```

### تدوير المفتاح السري / Rotating the HMAC Secret

المفتاح السري **لا يُخزَّن في الكود المصدري** بعد الآن. يُقرأ من ملف `desktop-app/src/hmac-config.js` المحلي الذي لا يُرفع على git.

The HMAC secret is **no longer stored in source code**. It lives in the local file `desktop-app/src/hmac-config.js` which is excluded from git.

**لتدوير المفتاح قبل النشر / To rotate the secret before release:**
```bash
cd desktop-app

# الخطوة 1: ولّد مفتاحًا سريًا جديدًا وحدّث hmac-config.js
# Step 1: Generate a new secret and update hmac-config.js
node scripts/rotate-secret.js

# الخطوة 2: أعِد توليد جميع كودات التفعيل بالمفتاح الجديد
# Step 2: Regenerate all activation codes with the new secret
node src/generate-codes.js 20

# الخطوة 3: ابنِ ملف EXE الجديد
# Step 3: Build the new EXE
npm run build:win
```

**قواعد المفتاح السري / Secret rules:**
- `desktop-app/src/hmac-config.js` — **لا تُرفع على git** (مُستثنى في .gitignore)
- `desktop-app/.env` — **لا تُرفع على git**
- `desktop-app/codes-generated.txt` — **لا تُرفع على git**
- انظر `desktop-app/.env.example` لتوثيق المتغيرات المطلوبة
- See `desktop-app/.env.example` for required variable documentation

**تعيين المفتاح عبر متغير البيئة (للبناء الآلي فقط) / Env var (build pipelines only):**
```bash
# HMAC_SECRET env var مدعوم في generate-codes.js فقط — لتوليد الكودات في CI
# HMAC_SECRET env var is supported ONLY in generate-codes.js — for CI code generation
HMAC_SECRET=your-ci-secret node src/generate-codes.js 20
```

> **ملاحظة أمنية:** `activation.js` (المُدمَج في EXE) يتعمّد تجاهل متغيرات البيئة.
> يقرأ المفتاح من `hmac-config.js` المُدمَج وقت البناء فقط — لمنع المستخدم من تجاوز التحقق
> بتعيين متغير بيئة مخصص.
>
> **Security note:** `activation.js` (bundled in the EXE) intentionally ignores environment variables.
> It reads the secret only from the build-time bundled `hmac-config.js` — preventing users from
> bypassing verification by setting a custom environment variable.

---

## 📦 خطط الاشتراك / Subscription Plans

| الخطة | الكاشيرون | المنتجات | السعر |
|-------|-----------|----------|-------|
| Starter | 1 | 500 | مجاني |
| Professional | 5 | ∞ | 99 ريال/شهر |
| Enterprise | ∞ | ∞ | 299 ريال/شهر |

---

## 🔐 أمان المشروع / Security Notes

- ❌ **لا ترفع** ملف `.env` أو `codes-generated.txt` على GitHub
- ✅ **غيّر** `HMAC_SECRET` قبل النشر
- ✅ **استخدم** Clerk Production Keys عند النشر الفعلي
- ✅ **فعّل** 2FA على حساب GitHub وClerk

---

## ⚖️ الترخيص / License

هذا المشروع محمي بحقوق الملكية الفكرية.  
**جميع الحقوق محفوظة © 2025 Abdullah Almhbob / CashierPro**

This project is proprietary software.  
**All rights reserved © 2025 Abdullah Almhbob / CashierPro**

---

<div align="center">
  <sub>📧 <a href="mailto:Almhbob.iii@gmail.com">Almhbob.iii@gmail.com</a> · 📱 <a href="https://wa.me/966530658285">+966530658285</a></sub>
</div>
