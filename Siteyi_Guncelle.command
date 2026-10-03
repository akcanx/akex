#!/bin/bash
cd "$(dirname "$0")"
python3 build.py
echo ""
echo "========================================================"
echo "✓ TÜM SAYFALAR BAŞARIYLA DERLENDİ VE GÜNCELLENDİ!"
echo "========================================================"
echo ""
read -p "Çıkmak için Enter tuşuna basabilirsiniz..."
