@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo ⚡ AKCAN AKDAG — GITHUB YUKLEME ARACI
echo Hedef Depo: https://github.com/akcanx/akex.git
echo ========================================================
echo.

git add .
git diff --cached --quiet
if errorlevel 1 (
  echo Yeni degisiklikler kaydediliyor...
  git commit -m "Site guncellemesi"
)

echo GitHub'a yukleniyor (git push)...
echo NOT: Sifre soruldugunda GitHub Personal Access Token giriniz.
echo.

git push -u origin main

if errorlevel 0 (
  echo.
  echo ========================================================
  echo ✓ SITE BASARIYLA GITHUB'A YUKLENDI!
  echo Depo: https://github.com/akcanx/akex
  echo ========================================================
) else (
  echo.
  echo ========================================================
  echo X Yukleme sirasinda hata olustu.
  echo ========================================================
)

echo.
pause
