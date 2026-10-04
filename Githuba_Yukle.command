#!/bin/bash
cd "$(dirname "$0")"

echo "========================================================"
echo "⚡ AKCAN AKDAĞ — GITHUB YÜKLEME ARACI"
echo "Hedef Depo: https://github.com/akcanx/akex.git"
echo "========================================================"
echo ""

# Değişiklik varsa commit al
git add .
if ! git diff --cached --quiet; then
  echo "Yeni değişiklikler kaydediliyor..."
  git commit -m "Site güncellemesi: $(date '+%Y-%m-%d %H:%M')"
fi

echo "GitHub'a yükleniyor (git push)..."
echo "NOT: GitHub şifrenizi sorduğunda lütfen Personal Access Token (ghp_...) giriniz."
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "========================================================"
  echo "✓ SİTE BAŞARIYLA GITHUB'A YÜKLENDİ!"
  echo "Depo: https://github.com/akcanx/akex"
  echo "========================================================"
else
  echo ""
  echo "========================================================"
  echo "❌ Yükleme sırasında bir hata veya kimlik doğrulama sorunu oluştu."
  echo "Lütfen kullanıcı adınızı (akcanx) ve Personal Access Token'ınızı kontrol edin."
  echo "========================================================"
fi

echo ""
read -p "Çıkmak için Enter tuşuna basabilirsiniz..."
