@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo ⚡ AKCAN AKDAG — GITHUB YUKLEME ARACI
echo Hedef Depo: https://github.com/akcanx/akex.git
echo ========================================================
echo.

echo [1/4] Sayfalar derleniyor (build.py)...
python build.py
echo.

echo [2/4] Dosya degisiklikleri paketleniyor...
git add .
git diff --cached --quiet
if errorlevel 1 (
  echo Yeni degisiklikler kaydediliyor...
  git commit -m "Site guncellemesi: %date% %time%"
) else (
  echo Yeni kaydedilecek degisiklik yok.
)
echo.

echo [3/4] GitHub ile senkronizasyon kontrol ediliyor...
git pull --rebase origin main
echo.

echo [4/4] GitHub'a yukleniyor (git push)...
git push origin main

if errorlevel 0 (
  echo.
  echo ========================================================
  echo ✓ SITE BASARIYLA GITHUB'A YUKLENDI!
  echo Depo: https://github.com/akcanx/akex
  echo Canli: https://akcanx.github.io/akex/
  echo ========================================================
) else (
  echo.
  echo ========================================================
  echo X Yukleme sirasinda bir hata olustu.
  echo ========================================================
)

echo.
pause
