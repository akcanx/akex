#!/bin/bash
# ==============================================================================
# AKCAN AKDAĞ — GİTHUB YÜKLEME ARACI (MANUEL ÇALIŞTIRICI)
# Bu dosya sitenizi derler (build.py), değişiklikleri kaydeder ve
# otomatik olarak GitHub deponuza (akcanx/akex) gönderir.
# ==============================================================================

# Betiğin bulunduğu dizine git (Masaüstü / Test Site)
cd "$(dirname "$0")"

# Renk kodları
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${BOLD}⚡ AKCAN AKDAĞ — GITHUB YÜKLEME ARACI${NC}"
echo -e "Hedef Depo: ${YELLOW}https://github.com/akcanx/akex.git${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

# 1. ADIM: SİTE SAYFALARINI DERLEME (BUILD)
echo -e "${CYAN}[1/4]${NC} Web sitesi sayfaları güncelleniyor ve derleniyor..."
if command -v python3 &>/dev/null; then
  python3 build.py
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Sayfalar başarıyla derlendi.${NC}"
  else
    echo -e "${YELLOW}⚠️ build.py derlenirken bir uyarı oluştu, yüklemeye devam ediliyor...${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ python3 bulunamadı, mevcut dosyalar doğrudan yüklenecek.${NC}"
fi
echo ""

# 2. ADIM: DEĞİŞİKLİKLERİ PAKETLEME (GIT ADD & COMMIT)
echo -e "${CYAN}[2/4]${NC} Dosya değişiklikleri kontrol ediliyor..."
git add .

# Değişiklik var mı kontrolü
if ! git diff --cached --quiet; then
  COMMIT_TIME=$(date '+%d.%m.%Y %H:%M')
  echo -e "${CYAN}→${NC} Yeni değişiklikler kaydediliyor (${COMMIT_TIME})..."
  git commit -m "Site güncellemesi: ${COMMIT_TIME}"
  echo -e "${GREEN}✓ Değişiklikler commit olarak paketlendi.${NC}"
else
  echo -e "${GREEN}✓ Yeni kaydedilecek dosya değişikliği yok (yerel depo güncel).${NC}"
fi
echo ""

# 3. ADIM: UZAK DEPODAN SENKRONİZASYON (PULL REBASE)
echo -e "${CYAN}[3/4]${NC} GitHub ile senkronizasyon kontrolü yapılıyor..."
git pull --rebase origin main 2>/dev/null
echo ""

# 4. ADIM: GITHUB'A GÖNDERME (GIT PUSH)
echo -e "${CYAN}[4/4]${NC} GitHub'a yükleniyor (git push origin main)..."
echo ""

git push origin main

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}================================================================${NC}"
  echo -e "${GREEN}${BOLD}✓ SİTE BAŞARIYLA GITHUB'A YÜKLENDİ!${NC}"
  echo -e "Depo Adresi: ${CYAN}https://github.com/akcanx/akex${NC}"
  echo -e "Canlı Yayın:  ${CYAN}https://akcanx.github.io/akex/${NC}"
  echo -e "${GREEN}================================================================${NC}"
else
  echo -e "${RED}================================================================${NC}"
  echo -e "${RED}${BOLD}❌ YÜKLEME BAŞARISIZ OLDU (Hata Kodu: $EXIT_CODE)${NC}"
  echo -e "${YELLOW}Olası Sebepler ve Çözümler:${NC}"
  echo -e "1. İnternet bağlantınızı kontrol ediniz."
  echo -e "2. GitHub Personal Access Token süresi dolmuş olabilir."
  echo -e "3. Kullanıcı adınızın (akcanx) doğru olduğundan emin olunuz."
  echo -e "${RED}================================================================${NC}"
fi

echo ""
read -p "Kapatmak için Enter tuşuna basabilirsiniz..."
