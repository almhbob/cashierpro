<div align="center">

# 🖥️ كاشير برو — نسخة Windows المكتبية
# CashierPro Desktop (EXE)

[![Platform](https://img.shields.io/badge/Platform-Windows_10%2F11-0078d4?style=for-the-badge&logo=windows)](https://microsoft.com/windows)
[![Electron](https://img.shields.io/badge/Electron-29-47848f?style=for-the-badge&logo=electron)](https://electronjs.org)
[![Version](https://img.shields.io/badge/Version-1.0.0-16a34a?style=for-the-badge)]()

</div>

---

## 📥 تثبيت التطبيق

### الطريقة الأولى — من ملف ZIP (مستخدم)
1. حمّل `CashierPro-Windows.zip`
2. فك الضغط في أي مجلد (مثلاً `C:\CashierPro\`)
3. شغّل `CashierPro.exe`
4. أدخل كود التفعيل عند الطلب
5. سجّل دخولك بحسابك السحابي

### الطريقة الثانية — بناء من المصدر (مطوّر)
انظر [قسم البناء](#-بناء-exe-من-المصدر) أدناه.

---

## 🔑 كودات التفعيل

### كيف يعمل النظام
- التطبيق يطلب كود تفعيل عند أول تشغيل
- الكود يُتحقق منه **محليًا (offline)** — لا يحتاج إنترنت للتفعيل
- بعد التفعيل، يُحفظ ملف `.cashierpro-license` في مجلد التطبيق
- كل كود صالح للاستخدام مرة واحدة فقط (single-use)

### توليد كودات جديدة (للمطوّر)
```bash
cd desktop-app
node src/generate-codes.js 10
# يولّد 10 كودات جديدة ويحفظها في codes-generated.txt
```

### تنسيق الكود
```
XXXX-XXXX-XXXX-XXXX
مثال: CP25-A8KL-M3NP-7QRT
```

### كودات التجربة (للاختبار)
```
DEMO-TEST-CODE-2025
CASH-IERO-PROO-0001
```
> ⚠️ **للاختبار فقط** — استبدلها بكودات حقيقية من `generate-codes.js` قبل النشر

---

## 🏗️ بناء EXE من المصدر

### المتطلبات
- Windows 10/11 (مُوصى به للبناء)
- Node.js 18+ 
- Git

### الخطوات

```bash
# 1. الانتقال إلى مجلد التطبيق المكتبي
cd desktop-app

# 2. تثبيت التبعيات
npm install

# 3. بناء ملف EXE
npm run build:win

# الناتج في:
# dist-exe/CashierPro-Setup-1.0.0.exe  ← المثبّت الكامل
# dist-exe/win-unpacked/CashierPro.exe ← نسخة محمولة
```

### توليد كودات التفعيل قبل البناء
```bash
# توليد 50 كود للبيع/التوزيع
node src/generate-codes.js 50

# الملف codes-generated.txt يحتوي الكودات
cat codes-generated.txt
```

---

## ⚙️ الإعدادات والتخصيص

### تغيير رابط التطبيق السحابي
في `src/main.js`:
```js
const APP_URL = "https://your-cashierpro-domain.com";
```

### إضافة أيقونة مخصصة
ضع ملف `icon.ico` (256×256 على الأقل) في مجلد `build/`.

---

## 📁 هيكل ملفات desktop-app

```
desktop-app/
├── src/
│   ├── main.js              # العملية الرئيسية لـ Electron
│   ├── preload.js           # جسر IPC آمن
│   ├── activation.js        # نظام التحقق من كودات التفعيل (offline)
│   └── generate-codes.js    # أداة توليد كودات جديدة (للمطوّر)
├── renderer/
│   ├── activate.html        # شاشة إدخال كود التفعيل
│   └── dist/
│       └── index.html       # واجهة POS المدمجة (offline)
├── build/
│   └── icon.ico             # أيقونة التطبيق (ضعها هنا)
├── package.json
└── README.md                # هذا الملف
```

---

## 🔧 متطلبات النظام

| المكوّن | الحد الأدنى |
|---------|------------|
| نظام التشغيل | Windows 10 (64-bit) |
| المعالج | Intel Core i3 أو ما يعادله |
| الذاكرة | 4 GB RAM |
| القرص | 500 MB مساحة حرة |
| الشاشة | 1280×720 أو أعلى |
| الإنترنت | مطلوب لتسجيل الدخول السحابي |

---

## ❓ الدعم الفني

| القناة | التفاصيل |
|--------|---------|
| 📧 البريد | [Almhbob.iii@gmail.com](mailto:Almhbob.iii@gmail.com) |
| 📱 واتساب | [+966530658285](https://wa.me/966530658285) |

---

<div align="center">
  <sub>© 2025 Abdullah Almhbob · CashierPro</sub>
</div>
