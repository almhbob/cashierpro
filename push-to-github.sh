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
echo "┌──────────────────────────────────────────────┐"
echo "│  🚀  CashierPro → GitHub Push                │"
echo "└──────────────────────────────────────────────┘"
echo ""

# 1. Verify token is available
if [ -z "$TOKEN" ]; then
  echo "❌ خطأ: GITHUB_PERSONAL_ACCESS_TOKEN غير موجود في البيئة"
  exit 1
fi
echo "✅ التوكن موجود"

# 2. Set identity for commit (if not already set)
git config user.email "Almhbob.iii@gmail.com" 2>/dev/null || true
git config user.name "Asim Abdulrahman Mohammed" 2>/dev/null || true

# 3. Add/update origin remote
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
echo "✅ تم ربط المستودع: github.com/${GITHUB_USER}/${REPO_NAME}"

# 4. Stage any uncommitted changes
git add -A
git status --short

# 5. Commit if there are changes
if ! git diff --cached --quiet; then
  git commit -m "chore: final project setup — README, .gitignore, .env.example"
  echo "✅ تم إنشاء commit للملفات الجديدة"
else
  echo "ℹ️  لا يوجد تغييرات جديدة للـ commit"
fi

# 6. Push to GitHub
echo ""
echo "⏳ جاري الرفع إلى GitHub..."
git push -u origin main --force
echo ""
echo "┌──────────────────────────────────────────────┐"
echo "│  ✅  تم الرفع بنجاح!                          │"
echo "│  🔗  https://github.com/${GITHUB_USER}/${REPO_NAME}     │"
echo "└──────────────────────────────────────────────┘"
echo ""
