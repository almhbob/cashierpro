# كاشير برو — دليل بناء نسخة EXE

## المتطلبات
- Windows 10/11 (للبناء المباشر) أو macOS/Linux مع Wine
- Node.js 18 أو أحدث
- Git

## خطوات البناء

### 1. تحضير ملفات الواجهة
```bash
# من مجلد supermarket-pos
pnpm run build
# انسخ مجلد dist إلى desktop-app/renderer/dist
cp -r artifacts/supermarket-pos/dist/* desktop-app/renderer/
```

### 2. تثبيت التبعيات
```bash
cd desktop-app
npm install
```

### 3. تعديل الإعدادات
عدّل الملفات التالية:
- `src/license-validator.js` → غيّر `ACTIVATION_SERVER` إلى رابط API الإنتاج
- `src/main.js` → عدّل اسم التطبيق حسب الحاجة
- `renderer/license.html` → عدّل رقم الواتساب في `contactSupport()`

### 4. إضافة الأيقونة
ضع ملف `icon.ico` (256×256 على الأقل) في مجلد `build/`

### 5. بناء EXE لـ Windows
```bash
# نسخة 64-bit
npm run build:win

# أو نسخة 32-bit (للأجهزة القديمة)
npm run build:win32
```

الملف الناتج سيكون في: `dist-exe/CashierPro-Setup-1.0.0.exe`

---

## آلية عمل الترخيص

### دورة حياة الترخيص:
1. **العميل يشتري** → تعطيه مفتاح ترخيص من لوحة إدارة المنصة
2. **أول تشغيل** → يظهر شاشة التفعيل
3. **يدخل المفتاح** → التطبيق يتصل بالخادم لتفعيله ويربطه بالجهاز
4. **عمليات لاحقة** → يعمل offline إذا كان ملف الترخيص موجوداً

### أنواع التراخيص:
| النوع | المدة | الاستخدام |
|-------|-------|-----------|
| تجريبي | 30 يوم (قابل للتعديل) | تجربة العميل قبل الشراء |
| سنوي | 365 يوم | اشتراك سنوي |
| مدى الحياة | لا نهائي | دفعة واحدة |

### إلغاء ترخيص:
من لوحة الإدارة → تبويب التراخيص → زر "إلغاء"
سيمنع التطبيق من العمل في الاتصال التالي بالخادم.

---

## هيكل التطبيق المكتبي

```
desktop-app/
├── src/
│   ├── main.js              # العملية الرئيسية (Electron)
│   ├── preload.js           # جسر بين العملية الرئيسية والمتصفح
│   ├── license-validator.js  # نظام التراخيص
│   └── local-server.js      # خادم Express + SQLite محلي
├── renderer/
│   ├── license.html         # شاشة تفعيل الترخيص
│   └── dist/                # ملفات الواجهة المبنية (من supermarket-pos)
├── build/
│   ├── icon.ico             # أيقونة التطبيق
│   └── installer.nsh        # إعدادات المُثبِّت
├── package.json
└── README-BUILD.md
```

## قاعدة البيانات المحلية
تُخزَّن في: `%APPDATA%\cashierpro-desktop\cashierpro.db`
(SQLite — لا تحتاج إلى إنترنت)

## الدعم والتحديثات
لإضافة ميزة التحديث التلقائي، استخدم `electron-updater`:
```bash
npm install electron-updater
```
ثم اضبط `publish` في `electron-builder.yml`.
