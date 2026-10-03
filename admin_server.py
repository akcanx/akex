#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AKCAN AKDAĞ — İçerik Yönetim Paneli (Admin CMS Server)
Harici kütüphane gerektirmez (Pure Python 3 Standard Library).
panel.html üzerinden görsel içerik ekleme, düzenleme, görsel yükleme ve otomatik derleme sağlar.
"""

import os
import sys
import json
import base64
import shutil
import socket
import subprocess
import webbrowser
import re
import ssl
import time
import threading
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data.js")
BACKUPS_DIR = os.path.join(BASE_DIR, "backups")
os.makedirs(BACKUPS_DIR, exist_ok=True)
BACKUP_FILE = os.path.join(BACKUPS_DIR, "data.backup.js")

def extract_youtube_id(url):
    if not url:
        return ""
    url = str(url).strip()
    iframe_match = re.search(r'src=["\'](.*?)["\']', url)
    if iframe_match:
        url = iframe_match.group(1)
    v_param = re.search(r'[?&](?:v|vi)=([a-zA-Z0-9_-]{11})', url)
    if v_param:
        return v_param.group(1)
    path_match = re.search(r'(?:youtu\.be\/|youtube\.com\/(?:embed|shorts|live|v)\/)([a-zA-Z0-9_-]{11})', url)
    if path_match:
        return path_match.group(1)
    match = re.search(r'(?:v=|vi=|\/v\/|\/embed\/|\/shorts\/|\/live\/|youtu\.be\/|\/e\/)([a-zA-Z0-9_-]{11})', url)
    if match:
        return match.group(1)
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
    return ""

def clean_youtube_url(url):
    y_id = extract_youtube_id(url)
    if y_id:
        return f"https://www.youtube.com/embed/{y_id}"
    if str(url).strip().startswith("https://www.youtube.com/embed/"):
        return str(url).strip()
    return str(url).strip()

def download_youtube_thumb(video_id, category="videos"):
    if not video_id:
        return False, "Geçersiz video ID", ""
    
    cat_map = {
        "videos": "video",
        "video": "video",
        "music": "muzik",
        "muzik": "muzik"
    }
    sub_folder = cat_map.get(category, "video")
    target_dir = os.path.join(BASE_DIR, "images", "covers", sub_folder)
    os.makedirs(target_dir, exist_ok=True)
    
    resolutions = ["maxresdefault.jpg", "sddefault.jpg", "hqdefault.jpg"]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    ctx = ssl._create_unverified_context() if hasattr(ssl, "_create_unverified_context") else None
    
    for res_name in resolutions:
        for host in ["https://i.ytimg.com/vi", "https://img.youtube.com/vi"]:
            thumb_url = f"{host}/{video_id}/{res_name}"
            try:
                req = urllib.request.Request(thumb_url, headers=headers)
                kwargs = {"context": ctx} if ctx else {}
                with urllib.request.urlopen(req, timeout=6, **kwargs) as resp:
                    if resp.status == 200:
                        data = resp.read()
                        # YouTube bazen bulunamayan çözünürlük için 120x90 (~1KB) gri resim döner
                        if len(data) > 3000 or res_name == "hqdefault.jpg":
                            out_filename = f"yt-{video_id}.jpg"
                            out_path = os.path.join(target_dir, out_filename)
                            with open(out_path, "wb") as f:
                                f.write(data)
                            rel_path = f"images/covers/{sub_folder}/{out_filename}"
                            return True, "Kapak başarıyla indirildi ve kaydedildi", rel_path
            except Exception:
                continue
                
    fallback_url = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
    return False, "Sunucu doğrudan indiremedi, CDN URL kullanılabilir", fallback_url

def find_free_port(start_port=8080):
    for port in range(start_port, start_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                s.bind(('0.0.0.0', port))
                return port
            except OSError:
                continue
    return start_port

def read_site_data():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    start_idx = content.find("{")
    end_idx = content.rfind("}")
    if start_idx == -1 or end_idx == -1:
        return {}
    return json.loads(content[start_idx:end_idx + 1])

def write_site_data(data):
    # YouTube linklerini temizle
    for v in data.get("videos", []):
        if "youtubeUrl" in v:
            v["youtubeUrl"] = clean_youtube_url(v["youtubeUrl"])
    for m in data.get("music", []):
        if "youtubeUrl" in m:
            m["youtubeUrl"] = clean_youtube_url(m["youtubeUrl"])

    # En son videoyu featured ile senkronize et
    videos = data.get("videos", [])
    if videos:
        latest = videos[0]
        data["featured"] = {
            "id": latest.get("id"),
            "slug": latest.get("slug"),
            "url": latest.get("url") or f"video/{latest.get('slug')}/index.html",
            "type": "youtube",
            "eyebrow": f"Son Video · {latest.get('date')}",
            "title": latest.get("title"),
            "description": latest.get("description"),
            "cover": latest.get("cover"),
            "youtubeId": extract_youtube_id(latest.get("youtubeUrl")),
            "date": latest.get("date"),
            "tags": latest.get("tags", [])
        }

    # backups/ klasörüne güvenli yedek al
    if os.path.exists(DATA_FILE):
        shutil.copy2(DATA_FILE, BACKUP_FILE)
    
    header = "// ==========================================================================\n" \
             "// AKCAN AKDAĞ - Web Sitesi İçerik Veritabanı\n" \
             "// Youtube, Podcast, Blog ve Transkript Verileri (SEO & GEO Uyumlu)\n" \
             "// ==========================================================================\n\n"
    
    formatted_json = json.dumps(data, indent=2, ensure_ascii=False)
    js_content = f"{header}const siteData = {formatted_json};\n"
    
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)
    
    # build.py'yi çalıştır
    result = subprocess.run([sys.executable, "build.py"], cwd=BASE_DIR, capture_output=True, text=True)
    return result.returncode == 0, result.stdout + result.stderr

class AdminHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/" or self.path == "/panel":
            self.send_response(302)
            self.send_header("Location", "/panel.html")
            self.end_headers()
            return

        if self.path == "/api/data":
            try:
                data = read_site_data()
                response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(response_bytes)))
                self.end_headers()
                self.wfile.write(response_bytes)
            except Exception as e:
                self.send_error_response(500, str(e))
            return

        super().do_GET()

    def do_POST(self):
        if self.path == "/api/save":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                payload = json.loads(body)

                success, build_log = write_site_data(payload)
                resp = {
                    "success": success,
                    "message": "İçerik kaydedildi ve tüm sayfalar başarıyla derlendi!" if success else "Kayıt yapıldı ancak derlemede hata oluştu.",
                    "error": None if success else f"Derleme hatası: {build_log[-300:] if build_log else 'Bilinmeyen hata'}",
                    "build_log": build_log
                }
                self.send_json_response(200 if success else 500, resp)
            except Exception as e:
                self.send_error_response(500, str(e))
            return

        elif self.path == "/api/fetch-youtube-thumb":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                payload = json.loads(body)

                video_id = payload.get("videoId", "").strip()
                category = payload.get("category", "videos").strip()

                success, msg, path_or_url = download_youtube_thumb(video_id, category)
                if success:
                    self.send_json_response(200, {
                        "success": True,
                        "path": path_or_url,
                        "message": msg
                    })
                else:
                    self.send_json_response(200, {
                        "success": False,
                        "fallbackUrl": path_or_url,
                        "error": msg,
                        "message": msg
                    })
            except Exception as e:
                self.send_error_response(500, str(e))
            return

        elif self.path == "/api/upload-image":
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                payload = json.loads(body)

                filename = payload.get("filename", "upload.webp")
                category = payload.get("category", "blog")  # video, muzik, podcast, blog, author
                base64_data = payload.get("data", "")

                # base64 başlığını temizle
                if "," in base64_data:
                    base64_data = base64_data.split(",", 1)[1]

                img_bytes = base64.b64decode(base64_data)

                # Güvenli dosya adı
                safe_name = "".join(c for c in filename if c.isalnum() or c in ".-_").strip()
                if not safe_name:
                    safe_name = "image.webp"

                cat_map = {
                    "videos": "video",
                    "video": "video",
                    "music": "muzik",
                    "muzik": "muzik",
                    "podcasts": "podcast",
                    "podcast": "podcast",
                    "articles": "blog",
                    "blog": "blog",
                    "author": "author"
                }
                sub_folder = cat_map.get(category, "blog")

                if sub_folder == "author":
                    target_dir = os.path.join(BASE_DIR, "images", "author")
                    rel_path = f"images/author/{safe_name}"
                else:
                    target_dir = os.path.join(BASE_DIR, "images", "covers", sub_folder)
                    rel_path = f"images/covers/{sub_folder}/{safe_name}"

                os.makedirs(target_dir, exist_ok=True)
                full_path = os.path.join(target_dir, safe_name)

                with open(full_path, "wb") as f:
                    f.write(img_bytes)

                self.send_json_response(200, {
                    "success": True,
                    "path": rel_path,
                    "message": f"Görsel başarıyla kaydedildi: {rel_path}"
                })
            except Exception as e:
                self.send_error_response(500, str(e))
            return

        elif self.path == "/api/build":
            try:
                result = subprocess.run([sys.executable, "build.py"], cwd=BASE_DIR, capture_output=True, text=True)
                self.send_json_response(200, {
                    "success": result.returncode == 0,
                    "output": result.stdout + result.stderr,
                    "message": "Sayfalar derlendi" if result.returncode == 0 else "Derleme hatası",
                    "error": None if result.returncode == 0 else "Derleme işlemi başarısız oldu."
                })
            except Exception as e:
                self.send_error_response(500, str(e))
            return

        self.send_error_response(404, "Endpoint bulunamadı.")

    def send_json_response(self, code, data):
        resp_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(resp_bytes)))
        self.end_headers()
        self.wfile.write(resp_bytes)

    def send_error_response(self, code, message):
        msg_str = str(message)
        self.send_json_response(code, {
            "success": False,
            "error": msg_str,
            "message": msg_str
        })

def run():
    port = find_free_port(8080)
    server_address = ("0.0.0.0", port)
    HTTPServer.allow_reuse_address = True
    httpd = HTTPServer(server_address, AdminHandler)
    
    url = f"http://localhost:{port}/panel.html"
    ip_url = f"http://127.0.0.1:{port}/panel.html"
    
    print("\n" + "=" * 62)
    print("🚀 AKCAN AKDAĞ — İÇERİK YÖNETİM PANELİ (CMS)")
    print("=" * 62)
    print("Sunucu başarıyla başlatıldı ve dinleniyor.")
    print("Tarayıcınızda açmak için aşağıdaki bağlantılara tıklayabilirsiniz:")
    print(f"👉 {url}")
    print(f"👉 {ip_url}")
    print("=" * 62)
    print("Paneli kapatmak için klavyeden CTRL + C tuşlarına basabilirsiniz.\n")
    sys.stdout.flush()
    
    # Tarayıcıyı arka planda güvenilir komutlarla aç
    def open_browser():
        time.sleep(0.6)
        if sys.platform == "darwin":
            subprocess.run(["open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif sys.platform == "win32":
            try:
                os.startfile(url)
            except Exception:
                subprocess.run(["cmd", "/c", "start", "", url], shell=True)
        else:
            try:
                webbrowser.open(url)
            except Exception:
                pass

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nPanel sunucusu durduruldu.")
        httpd.server_close()

if __name__ == "__main__":
    run()
