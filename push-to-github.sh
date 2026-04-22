#!/bin/bash
# ─────────────────────────────────────────────────────────
#  CashierPro → GitHub Push Script
#  Run from the Replit Shell: bash push-to-github.sh
# ─────────────────────────────────────────────────────────

set -e

TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}"
GITHUB_USER="almhbob"
REPO_NAME="cashierpro"
REMOTE_URL="https://${GITHUB_USER}:${TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "┌──────────────────────────────────────────────────────┐"
echo "│  🚀  CashierPro → GitHub Push                        │"
echo "└──────────────────────────────────────────────────────┘"
echo ""

# 1. Verify token is available
if [ -z "$TOKEN" ]; then
  echo "❌ خطأ: GITHUB_PERSONAL_ACCESS_TOKEN غير موجود في البيئة"
  exit 1
fi
echo "✅ التوكن موجود"

# 2. Set identity for commit
git config user.email "Almhbob.iii@gmail.com" 2>/dev/null || true
git config user.name "Asim Abdulrahman Mohammed" 2>/dev/null || true

# 3. Add/update origin remote
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
echo "✅ تم ربط المستودع: github.com/${GITHUB_USER}/${REPO_NAME}"

# 4. Stage all changes
git add -A
git status --short

# 5. Commit if there are changes
if ! git diff --cached --quiet; then
  git commit -m "feat: complete offline POS — cashier, products, returns, reports, settings (no internet required)"
  echo "✅ تم إنشاء commit"
else
  echo "ℹ️  لا يوجد تغييرات جديدة للـ commit"
fi

# 6. Push to GitHub
echo ""
echo "⏳ جاري الرفع إلى GitHub..."
git push -u origin main --force
echo ""
echo "┌──────────────────────────────────────────────────────┐"
echo "│  ✅  تم الرفع بنجاح!                                  │"
echo "└──────────────────────────────────────────────────────┘"
echo ""
echo "  🔗  المستودع:  https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo "  ⚙️   Actions:   https://github.com/${GITHUB_USER}/${REPO_NAME}/actions"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  الخطوات التالية لبناء ملف EXE:"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  1️⃣  أضف Secrets في إعدادات المستودع:"
echo "     https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/secrets/actions"
echo ""
echo "     APP_URL                = https://[رابط-تطبيقك].replit.app"
echo "     VITE_CLERK_PUBLISHABLE_KEY = pk_live_..."
echo ""
echo "  2️⃣  شغّل الـ Workflow يدوياً:"
echo "     → اذهب إلى: https://github.com/${GITHUB_USER}/${REPO_NAME}/actions"
echo "     → اختر 'Build Windows EXE'"
echo "     → اضغط 'Run workflow' → أدخل الإصدار (مثلاً 1.0.0)"
echo ""
echo "  3️⃣  رابط التحميل بعد الاكتمال (~5 دقائق):"
echo "     https://github.com/${GITHUB_USER}/${REPO_NAME}/releases"
echo ""
echo "  💡  أو شغّل تلقائياً بـ tag:"
echo "     git tag v1.0.0 && git push origin v1.0.0"
echo ""
