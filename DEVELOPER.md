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

### كودات التجربة (للاختبار فقط)
```
DEMO-TEST-CODE-2025
CASH-IERO-PROO-0001
```

### تغيير المفتاح السري (مهم قبل النشر!)
في `desktop-app/src/activation.js`:
```js
const HMAC_SECRET = "CashierPro-Secret-2025-AlMhbob";
// غيّره إلى قيمة سرية قوية خاصة بك
```
وفي `desktop-app/src/generate-codes.js` بنفس القيمة.

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
