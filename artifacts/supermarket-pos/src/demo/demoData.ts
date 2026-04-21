export const DEMO_TENANT = {
  id: "demo",
  name: "سوبر ماركت البركة",
  nameEn: "Al-Baraka Supermarket",
  slug: "demo",
  plan: "professional" as const,
  status: "active" as const,
  needsOnboarding: false,
  trialEndsAt: null,
  trialDaysLeft: null,
  memberCount: 3,
  limits: { cashiers: 5, products: 500, price: 99 },
  createdAt: new Date().toISOString(),
};

export const DEMO_PRODUCTS = [
  { id: 1, tenantId: "demo", barcode: "6281234567890", name: "Basmati Rice 5kg", nameAr: "أرز بسمتي ٥ كجم", price: 28.50, stock: 42, category: "حبوب وبقوليات", unit: "كيس", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, tenantId: "demo", barcode: "6289876543210", name: "Sunflower Oil 1.8L", nameAr: "زيت عباد الشمس ١.٨ لتر", price: 14.75, stock: 35, category: "زيوت وسمن", unit: "قارورة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, tenantId: "demo", barcode: "6283456789012", name: "White Sugar 2kg", nameAr: "سكر أبيض ٢ كجم", price: 8.25, stock: 60, category: "مواد أساسية", unit: "كيس", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, tenantId: "demo", barcode: "6284567890123", name: "Full Fat Milk 1L", nameAr: "حليب كامل الدسم ١ لتر", price: 4.50, stock: 8, category: "ألبان وأجبان", unit: "علبة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 5, tenantId: "demo", barcode: "6285678901234", name: "Tomato Paste 400g", nameAr: "معجون طماطم ٤٠٠ غرام", price: 3.75, stock: 55, category: "معلبات", unit: "علبة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 6, tenantId: "demo", barcode: "6286789012345", name: "Dates Mejdool 1kg", nameAr: "تمر مجدول ١ كجم", price: 45.00, stock: 20, category: "فواكه جافة", unit: "علبة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 7, tenantId: "demo", barcode: "6287890123456", name: "Laundry Detergent 2kg", nameAr: "مسحوق غسيل ٢ كجم", price: 18.00, stock: 3, category: "منظفات", unit: "كيس", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 8, tenantId: "demo", barcode: "6288901234567", name: "Canned Tuna 185g", nameAr: "تونة معلبة ١٨٥ غرام", price: 6.25, stock: 70, category: "معلبات", unit: "علبة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 9, tenantId: "demo", barcode: "6289012345678", name: "Tea Bags 100pc", nameAr: "أكياس شاي ١٠٠ حبة", price: 12.50, stock: 40, category: "مشروبات", unit: "علبة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 10, tenantId: "demo", barcode: "6280123456789", name: "Instant Coffee 200g", nameAr: "قهوة نسكافيه ٢٠٠ غرام", price: 32.00, stock: 15, category: "مشروبات", unit: "جرة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 11, tenantId: "demo", barcode: "6281098765432", name: "Flour 5kg", nameAr: "طحين ٥ كجم", price: 11.00, stock: 50, category: "حبوب وبقوليات", unit: "كيس", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 12, tenantId: "demo", barcode: "6282109876543", name: "Butter 200g", nameAr: "زبدة ٢٠٠ غرام", price: 9.50, stock: 4, category: "ألبان وأجبان", unit: "علبة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 13, tenantId: "demo", barcode: "6283210987654", name: "Yogurt 500g", nameAr: "لبن زبادي ٥٠٠ غرام", price: 5.25, stock: 22, category: "ألبان وأجبان", unit: "كوب", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 14, tenantId: "demo", barcode: "6284321098765", name: "Macaroni 500g", nameAr: "مكرونة ٥٠٠ غرام", price: 4.00, stock: 80, category: "حبوب وبقوليات", unit: "كيس", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 15, tenantId: "demo", barcode: "6285432109876", name: "Toilet Paper 10 rolls", nameAr: "ورق تواليت ١٠ لفافات", price: 16.00, stock: 30, category: "منظفات", unit: "عبوة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 16, tenantId: "demo", barcode: "6286543210987", name: "Orange Juice 1L", nameAr: "عصير برتقال ١ لتر", price: 7.50, stock: 6, category: "مشروبات", unit: "قارورة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 17, tenantId: "demo", barcode: "6287654321098", name: "Black Pepper 100g", nameAr: "فلفل أسود ١٠٠ غرام", price: 5.75, stock: 25, category: "بهارات وتوابل", unit: "علبة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 18, tenantId: "demo", barcode: "6288765432109", name: "Canned Chickpeas 400g", nameAr: "حمص معلب ٤٠٠ غرام", price: 3.50, stock: 45, category: "معلبات", unit: "علبة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 19, tenantId: "demo", barcode: "6289876543201", name: "Shampoo 400ml", nameAr: "شامبو ٤٠٠ مل", price: 22.00, stock: 18, category: "عناية شخصية", unit: "قارورة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 20, tenantId: "demo", barcode: "6280987654312", name: "Dishwasher Soap 750ml", nameAr: "سائل جلي ٧٥٠ مل", price: 8.75, stock: 2, category: "منظفات", unit: "قارورة", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

function daysAgo(days: number, hour = 10, minute = 30) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const DEMO_SALES = [
  {
    id: 1001, tenantId: "demo", total: 89.75, amountPaid: 100.00, change: 10.25,
    cashierName: "أحمد السالم", createdAt: daysAgo(0, 9, 15),
    items: [
      { id: 1, saleId: 1001, productId: 1, productName: "Basmati Rice 5kg", productNameAr: "أرز بسمتي ٥ كجم", barcode: "6281234567890", quantity: 2, unitPrice: 28.50, subtotal: 57.00 },
      { id: 2, saleId: 1001, productId: 3, productName: "White Sugar 2kg", productNameAr: "سكر أبيض ٢ كجم", barcode: "6283456789012", quantity: 2, unitPrice: 8.25, subtotal: 16.50 },
      { id: 3, saleId: 1001, productId: 9, productName: "Tea Bags 100pc", productNameAr: "أكياس شاي ١٠٠ حبة", barcode: "6289012345678", quantity: 1, unitPrice: 12.50, subtotal: 12.50 },
      { id: 4, saleId: 1001, productId: 17, productName: "Black Pepper 100g", productNameAr: "فلفل أسود ١٠٠ غرام", barcode: "6287654321098", quantity: 1, unitPrice: 5.75, subtotal: 5.75 },
    ],
  },
  {
    id: 1002, tenantId: "demo", total: 47.50, amountPaid: 50.00, change: 2.50,
    cashierName: "فاطمة العتيبي", createdAt: daysAgo(0, 10, 45),
    items: [
      { id: 5, saleId: 1002, productId: 2, productName: "Sunflower Oil 1.8L", productNameAr: "زيت عباد الشمس ١.٨ لتر", barcode: "6289876543210", quantity: 2, unitPrice: 14.75, subtotal: 29.50 },
      { id: 6, saleId: 1002, productId: 5, productName: "Tomato Paste 400g", productNameAr: "معجون طماطم ٤٠٠ غرام", barcode: "6285678901234", quantity: 3, unitPrice: 3.75, subtotal: 11.25 },
      { id: 7, saleId: 1002, productId: 18, productName: "Canned Chickpeas 400g", productNameAr: "حمص معلب ٤٠٠ غرام", barcode: "6288765432109", quantity: 2, unitPrice: 3.50, subtotal: 7.00 },
    ],
  },
  {
    id: 1003, tenantId: "demo", total: 132.00, amountPaid: 150.00, change: 18.00,
    cashierName: "أحمد السالم", createdAt: daysAgo(0, 11, 20),
    items: [
      { id: 8, saleId: 1003, productId: 6, productName: "Dates Mejdool 1kg", productNameAr: "تمر مجدول ١ كجم", barcode: "6286789012345", quantity: 2, unitPrice: 45.00, subtotal: 90.00 },
      { id: 9, saleId: 1003, productId: 10, productName: "Instant Coffee 200g", productNameAr: "قهوة نسكافيه ٢٠٠ غرام", barcode: "6280123456789", quantity: 1, unitPrice: 32.00, subtotal: 32.00 },
      { id: 10, saleId: 1003, productId: 19, productName: "Shampoo 400ml", productNameAr: "شامبو ٤٠٠ مل", barcode: "6289876543201", quantity: 1, unitPrice: 22.00, subtotal: 22.00 },
    ],
  },
  {
    id: 1004, tenantId: "demo", total: 23.75, amountPaid: 25.00, change: 1.25,
    cashierName: "محمد الزهراني", createdAt: daysAgo(0, 13, 5),
    items: [
      { id: 11, saleId: 1004, productId: 4, productName: "Full Fat Milk 1L", productNameAr: "حليب كامل الدسم ١ لتر", barcode: "6284567890123", quantity: 3, unitPrice: 4.50, subtotal: 13.50 },
      { id: 12, saleId: 1004, productId: 8, productName: "Canned Tuna 185g", productNameAr: "تونة معلبة ١٨٥ غرام", barcode: "6288901234567", quantity: 2, unitPrice: 6.25, subtotal: 12.50 },
    ],
  },
  {
    id: 1005, tenantId: "demo", total: 67.25, amountPaid: 70.00, change: 2.75,
    cashierName: "فاطمة العتيبي", createdAt: daysAgo(0, 14, 30),
    items: [
      { id: 13, saleId: 1005, productId: 11, productName: "Flour 5kg", productNameAr: "طحين ٥ كجم", barcode: "6281098765432", quantity: 2, unitPrice: 11.00, subtotal: 22.00 },
      { id: 14, saleId: 1005, productId: 14, productName: "Macaroni 500g", productNameAr: "مكرونة ٥٠٠ غرام", barcode: "6284321098765", quantity: 5, unitPrice: 4.00, subtotal: 20.00 },
      { id: 15, saleId: 1005, productId: 15, productName: "Toilet Paper 10 rolls", productNameAr: "ورق تواليت ١٠ لفافات", barcode: "6285432109876", quantity: 1, unitPrice: 16.00, subtotal: 16.00 },
      { id: 16, saleId: 1005, productId: 17, productName: "Black Pepper 100g", productNameAr: "فلفل أسود ١٠٠ غرام", barcode: "6287654321098", quantity: 1, unitPrice: 5.75, subtotal: 5.75 },
    ],
  },
  {
    id: 1006, tenantId: "demo", total: 156.50, amountPaid: 160.00, change: 3.50,
    cashierName: "أحمد السالم", createdAt: daysAgo(1, 9, 0),
    items: [
      { id: 17, saleId: 1006, productId: 1, productName: "Basmati Rice 5kg", productNameAr: "أرز بسمتي ٥ كجم", barcode: "6281234567890", quantity: 3, unitPrice: 28.50, subtotal: 85.50 },
      { id: 18, saleId: 1006, productId: 2, productName: "Sunflower Oil 1.8L", productNameAr: "زيت عباد الشمس ١.٨ لتر", barcode: "6289876543210", quantity: 3, unitPrice: 14.75, subtotal: 44.25 },
      { id: 19, saleId: 1006, productId: 3, productName: "White Sugar 2kg", productNameAr: "سكر أبيض ٢ كجم", barcode: "6283456789012", quantity: 2, unitPrice: 8.25, subtotal: 16.50 },
      { id: 20, saleId: 1006, productId: 13, productName: "Yogurt 500g", productNameAr: "لبن زبادي ٥٠٠ غرام", barcode: "6283210987654", quantity: 2, unitPrice: 5.25, subtotal: 10.50 },
    ],
  },
  {
    id: 1007, tenantId: "demo", total: 74.00, amountPaid: 80.00, change: 6.00,
    cashierName: "محمد الزهراني", createdAt: daysAgo(1, 12, 15),
    items: [
      { id: 21, saleId: 1007, productId: 6, productName: "Dates Mejdool 1kg", productNameAr: "تمر مجدول ١ كجم", barcode: "6286789012345", quantity: 1, unitPrice: 45.00, subtotal: 45.00 },
      { id: 22, saleId: 1007, productId: 7, productName: "Laundry Detergent 2kg", productNameAr: "مسحوق غسيل ٢ كجم", barcode: "6287890123456", quantity: 1, unitPrice: 18.00, subtotal: 18.00 },
      { id: 23, saleId: 1007, productId: 20, productName: "Dishwasher Soap 750ml", productNameAr: "سائل جلي ٧٥٠ مل", barcode: "6280987654312", quantity: 1, unitPrice: 8.75, subtotal: 8.75 },
    ],
  },
  {
    id: 1008, tenantId: "demo", total: 42.75, amountPaid: 45.00, change: 2.25,
    cashierName: "فاطمة العتيبي", createdAt: daysAgo(2, 10, 0),
    items: [
      { id: 24, saleId: 1008, productId: 16, productName: "Orange Juice 1L", productNameAr: "عصير برتقال ١ لتر", barcode: "6286543210987", quantity: 3, unitPrice: 7.50, subtotal: 22.50 },
      { id: 25, saleId: 1008, productId: 12, productName: "Butter 200g", productNameAr: "زبدة ٢٠٠ غرام", barcode: "6282109876543", quantity: 2, unitPrice: 9.50, subtotal: 19.00 },
    ],
  },
];

export const DEMO_LOW_STOCK = DEMO_PRODUCTS.filter(p => p.stock <= 8);

export const DEMO_DASHBOARD_STATS = {
  todaySales: DEMO_SALES.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.total, 0),
  todayTransactions: DEMO_SALES.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length,
  totalProducts: DEMO_PRODUCTS.length,
  lowStockCount: DEMO_LOW_STOCK.length,
  monthlySales: 14820.50,
  monthlyTransactions: 247,
};

export const DEMO_ANALYTICS = {
  dailySales: [
    { date: "السبت", sales: 920.50, transactions: 18 },
    { date: "الأحد", sales: 1340.25, transactions: 24 },
    { date: "الاثنين", sales: 785.00, transactions: 15 },
    { date: "الثلاثاء", sales: 1120.75, transactions: 21 },
    { date: "الأربعاء", sales: 1560.00, transactions: 29 },
    { date: "الخميس", sales: 2240.25, transactions: 38 },
    { date: "الجمعة", sales: 420.00, transactions: 8 },
  ],
  topProducts: [
    { name: "أرز بسمتي ٥ كجم", quantity: 85, revenue: 2422.50 },
    { name: "زيت عباد الشمس", quantity: 72, revenue: 1062.00 },
    { name: "تمر مجدول ١ كجم", quantity: 45, revenue: 2025.00 },
    { name: "قهوة نسكافيه", quantity: 38, revenue: 1216.00 },
    { name: "سكر أبيض ٢ كجم", quantity: 120, revenue: 990.00 },
  ],
  categoryBreakdown: [
    { category: "حبوب وبقوليات", percentage: 28 },
    { category: "زيوت وسمن", percentage: 18 },
    { category: "ألبان وأجبان", percentage: 15 },
    { category: "مشروبات", percentage: 14 },
    { category: "معلبات", percentage: 12 },
    { category: "منظفات", percentage: 8 },
    { category: "أخرى", percentage: 5 },
  ],
};
