@echo off
chcp 65001 >nul
title AKCAN AKDAĞ — İçerik Yönetim Paneli
cd /d "%~dp0"

echo ========================================================
echo AKCAN AKDAĞ — İÇERİK YÖNETİM PANELİ BAŞLATILIYOR...
echo Tarayıcınız otomatik olarak açılacaktır.
echo Paneli kapatmak istediğinizde bu pencereyi kapatabilirsiniz.
echo ========================================================
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    python admin_server.py
    goto :done
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    py admin_server.py
    goto :done
)

where python3 >nul 2>nul
if %errorlevel% equ 0 (
    python3 admin_server.py
    goto :done
)

echo [HATA] Bilgisayarınızda Python bulunamadı!
echo Lütfen https://www.python.org adresinden Python'ı kurun.
pause

:done
