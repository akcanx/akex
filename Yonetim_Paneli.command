#!/bin/bash
cd "$(dirname "$0")"

echo "================================================================"
echo "🚀 AKCAN AKDAĞ — İÇERİK YÖNETİM PANELİ BAŞLATILIYOR..."
echo "Tarayıcınız otomatik olarak açılacaktır."
echo "Paneli kapatmak istediğinizde bu Terminal penceresini kapatabilirsiniz."
echo "================================================================"

python3 admin_server.py
