# كاشير برو — ملف التفاصيل المهمة
> آخر تحديث: أبريل 2025 | المطور: عاصم عبد الرحمن محمد

---

## 1. بيانات الدخول والمفاتيح

| العنصر | القيمة |
|--------|--------|
| كلمة مرور بوابة المطور | `DevAdmin2025!` |
| رابط بوابة المطور | `/dev` (في أسفل صفحة تسجيل الدخول) |
| كود الديمو | `DEMO2025` |
| صيغة مفتاح الترخيص | `XXXXXX-XXXXXX-XXXXXX-XXXXXX` (24 حرف hex) |

---

## 2. معلومات GitHub

| العنصر | القيمة |
|--------|--------|
| المستخدم | `almhbob` |
| المستودع | `almhbob/cashierpro` (خاص) |
| رابط Actions | `https://github.com/almhbob/cashierpro/actions` |
| رابط Releases | `https://github.com/almhbob/cashierpro/releases` |
| سكريبت الرفع | `bash push-to-github.sh` |

### Secrets المطلوبة في GitHub:
```
APP_URL                   = https://[رابطك].replit.app
VITE_CLERK_PUBLISHABLE_KEY = pk_live_...
```
أضفها هنا: `https://github.com/almhbob/cashierpro/settings/secrets/actions`

---

## 3. بناء ملف EXE

### طريقة 1 — يدوي:
1. ارفع الكود: `bash push-to-github.sh`
2. اذهب إلى GitHub Actions → **Build Windows EXE** → **Run workflow**
3. أدخل رقم الإصدار (مثلاً `1.0.0`)
4. انتظر ~5 دقائق
5. رابط التحميل: `https://github.com/almhbob/cashierpro/releases`

### طريقة 2 — تلقائي بـ Tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 4. هيكل المشروع

```
/
├── artifacts/
│   ├── supermarket-pos/        ← واجهة React (Vite + Tailwind + Clerk)
│   └── api-server/             ← API (Express + PostgreSQL + Drizzle)
├── desktop-app/
│   ├── src/
│   │   ├── main.js             ← Electron main process
│   │   ├── license-validator.js← التحقق من الترخيص (offline بعد أول تفعيل)
│   │   ├── local-server.js     ← Express + SQLite (للوضع المحلي)
│   │   └── preload.js          ← Electron bridge
│   ├── renderer/               ← ملفات HTML (license.html + dist/ إن وُجد)
│   └── package.json
├── .github/
│   └── workflows/
│       └── build-desktop.yml   ← CI/CD لبناء EXE على Windows
├── push-to-github.sh           ← سكريبت الرفع إلى GitHub
└── .env.example                ← مثال متغيرات البيئة
```

---

## 5. الجداول الرئيسية في قاعدة البيانات

| الجدول | الوصف |
|--------|-------|
| `tenants` | المتاجر المشتركة |
| `users` | المستخدمون مع أدوارهم |
| `products` | المنتجات والأسعار |
| `sales` + `sale_items` | المبيعات والفواتير |
| `licenses` | تراخيص الـ EXE المكتبي |
| `system_config` | إعدادات النظام (key/value) |

---

## 6. المسارات المهمة في الـ API

| المسار | الوظيفة |
|--------|---------|
| `POST /api/auth/demo` | دخول الديمو بكود DEMO2025 |
| `GET /api/superadmin/tenants` | إدارة المتاجر (SuperAdmin) |
| `GET /api/superadmin/licenses` | إدارة التراخيص |
| `POST /api/superadmin/licenses/activate` | تفعيل ترخيص EXE |
| `POST /api/dev/login` | دخول بوابة المطور |
| `GET /api/dev/system-config` | إعدادات بوابة المطور |

---

## 7. معلومات المطور (تظهر في تبويب Developer)

| العنصر | القيمة |
|--------|--------|
| الاسم | Asim Abdulrahman Mohammed |
| الإيميل | Almhbob.iii@gmail.com |
| الجوال | 0530658285 |
| GitHub | @almhbob |
| الشهادات | 8 شهادات (Google / IBM / Cisco / Fortinet / Intel) |

---

## 8. آلية عمل الترخيص (EXE)

```
تثبيت EXE
    ↓
أول تشغيل: إدخال مفتاح الترخيص
    ↓
إرسال (key + machine_id) إلى السيرفر
    ↓
السيرفر يتحقق ويُنشئ machine_token
    ↓
حفظ license.json محلياً على الجهاز
    ↓
التشغيلات التالية: تحقق محلي (offline) ✅
    ↓
(اختياري) تحقق دوري من السيرفر كل N يوم
```

**ملاحظة:** الترخيص مرتبط بالجهاز — مفتاح واحد = جهاز واحد.

---

## 9. متغيرات البيئة (Replit Secrets)

| المتغير | الوصف |
|---------|-------|
| `DATABASE_URL` | رابط PostgreSQL |
| `CLERK_SECRET_KEY` | مفتاح Clerk السري |
| `CLERK_PUBLISHABLE_KEY` | مفتاح Clerk العلني |
| `DEV_PORTAL_PASSWORD` | `DevAdmin2025!` |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | توكن GitHub للرفع |

---

## 10. الخطوات التالية الموصى بها

- [ ] نشر التطبيق (Deploy) للحصول على رابط ثابت `.replit.app`
- [ ] تحديث `APP_URL` في GitHub Secrets بالرابط الجديد
- [ ] بناء أول إصدار EXE ورفعه للـ Releases
- [ ] إنشاء أول ترخيص للبيع من بوابة SuperAdmin
- [ ] إضافة أيقونة مخصصة (`desktop-app/build/icon.ico`)
