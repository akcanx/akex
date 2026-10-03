@echo off
chcp 65001 >nul
title AKCAN AKDAĞ — Site Güncelleme Aracı
cd /d "%~dp0"

echo ========================================================
echo AKCAN AKDAĞ WEB SİTESİ DERLENİYOR...
echo ========================================================
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    python build.py
    goto :done
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    py build.py
    goto :done
)

where python3 >nul 2>nul
if %errorlevel% equ 0 (
    python3 build.py
    goto :done
)

echo [HATA] Bilgisayarınızda Python kurulu bulunamadı!
echo Lütfen https://www.python.org adresinden Python'ı indirin.
echo (Kurulum sırasında 'Add Python to PATH' kutucuğunu işaretlemeyi unutmayın.)
echo.

:done
echo.
echo ========================================================
echo ✓ İŞLEM TAMAMLANDI! Çıkmak için bir tuşa basabilirsiniz.
echo ========================================================
pause >nul
