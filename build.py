#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AKCAN AKDAĞ — SEO & GEO Uyumlu Statik Sayfa Üreticisi (Build Script)
data.js dosyasındaki tüm video, müzik, podcast ve blog yazılarını okur.
Her içerik için:
- Schema.org (JSON-LD) Knowledge Graph (@graph: Primary Entity + BreadcrumbList + FAQPage)
- Meta Keywords & Zengin Meta Description
- OpenGraph (og:site_name, og:locale) & Twitter Cards
- Tam metin transkriptler, şarkı liner notları ve erişilebilir alt etiketleri
içeren bağımsız fiziksel HTML sayfaları üretir.
"""

import os
import json
import re
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data.js")

# data.js dosyasını dinamik olarak oku
with open(DATA_FILE, "r", encoding="utf-8") as f:
    js_text = f.read()

start_idx = js_text.find("{")
end_idx = js_text.rfind("}")
if start_idx == -1 or end_idx == -1:
    raise ValueError("data.js içinde geçerli bir veri nesnesi bulunamadı.")

SITE_DATA = json.loads(js_text[start_idx:end_idx + 1])

def sanitize_youtube_url(url):
    if not url:
        return ""
    url = str(url).strip()
    iframe_match = re.search(r'src=["\'](.*?)["\']', url)
    if iframe_match:
        url = iframe_match.group(1)
    match = re.search(r'(?:v=|vi=|\/v\/|\/embed\/|\/shorts\/|youtu\.be\/|\/e\/)([a-zA-Z0-9_-]{11})', url)
    if match:
        return f"https://www.youtube.com/embed/{match.group(1)}"
    if url.startswith("https://www.youtube.com/embed/"):
        return url
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return f"https://www.youtube.com/embed/{url}"
    return url

def make_keywords(title, tags, category_label):
    base = ["AKCAN AKDAĞ", title]
    base.extend(tags)
    base.extend([
        f"Akcan Akdağ {category_label}",
        f"{category_label} izle dinle oku",
        "dijital düşünür",
        "teknoloji felsefesi",
        "barış özcan tarzı kanal"
    ])
    seen = set()
    cleaned = []
    for k in base:
        s = str(k).strip()
        if s and s.lower() not in seen:
            seen.add(s.lower())
            cleaned.append(s)
    return ", ".join(cleaned)

def make_about_entities(tags):
    return [{"@type": "Thing", "name": t} for t in tags]

def make_author_schema():
    about = SITE_DATA.get("about", {})
    author = SITE_DATA.get("author", {})
    name = about.get("name") or author.get("name") or "AKCAN AKDAĞ"
    settings = SITE_DATA.get("settings", {})
    social_urls = [s.get("url") for s in settings.get("socialLinks", []) if s.get("url")]
    if not social_urls:
        social_urls = [
            "https://www.youtube.com/akcanakdag",
            "https://www.instagram.com/akcanakdag",
            "https://www.tiktok.com/@akcanakdag"
        ]
    return {
        "@type": "Person",
        "@id": "https://akcanakdag.com/#person",
        "name": name,
        "url": "https://akcanakdag.com/",
        "sameAs": social_urls
    }

def resolve_img(url, depth=2):
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://") or url.startswith("//") or url.startswith("data:"):
        return url
    prefix = "../../../" if depth == 3 else ("../../" if depth == 2 else ("../" if depth == 1 else ""))
    cleaned = url.lstrip("/")
    return f"{prefix}{cleaned}"

def resolve_schema_img(url):
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://") or url.startswith("//"):
        return url
    cleaned = url.lstrip("/")
    return f"https://akcanakdag.com/{cleaned}"

def fix_content_images(content_html, depth=2):
    if not content_html:
        return ""
    prefix = "../../../" if depth == 3 else ("../../" if depth == 2 else ("../" if depth == 1 else ""))
    fixed = content_html.replace('src="images/', f'src="{prefix}images/')
    fixed = fixed.replace("src='images/", f"src='{prefix}images/")
    fixed = fixed.replace('src="/images/', f'src="{prefix}images/')
    fixed = fixed.replace("src='/images/", f"src='{prefix}images/")
    return fixed

def render_nav(depth=2):
    prefix = "../../../" if depth == 3 else ("../../" if depth == 2 else "../")
    settings = SITE_DATA.get("settings", {})
    brand_name = settings.get("brandName", "AKCAN AKDAĞ")
    nav_labels = settings.get("navLabels", {})
    l_home = nav_labels.get("home", "Anasayfa")
    l_youtube = nav_labels.get("youtube", "Youtube")
    l_podcast = nav_labels.get("podcast", "Podcast")
    l_blog = nav_labels.get("blog", "Blog")
    l_music = nav_labels.get("music", "Şarkılar & Remixler")
    l_about = nav_labels.get("about", "Hakkında")

    custom_nav_items = ""
    custom_drawer_items = ""
    for cat in SITE_DATA.get("categories", []):
        if cat.get("showInNav") is not False:
            c_title = cat.get("title", "")
            c_id = cat.get("id", "")
            c_icon = cat.get("icon", "")
            icon_str = f"{c_icon} " if c_icon else ""
            custom_nav_items += f'          <li><a href="{prefix}index.html#{c_id}" class="nav-link">{icon_str}{c_title}</a></li>\n'
            custom_drawer_items += f'      <a href="{prefix}index.html#{c_id}" class="mobile-link">{icon_str}{c_title}</a>\n'

    return f"""
  <nav class="site-nav scrolled" id="siteNav">
    <div class="wrap">
      <a href="{prefix}index.html" class="brand">
        {brand_name} <span class="dot"></span>
      </a>
      <div class="nav-right">
        <ul class="nav-links">
          <li><a href="{prefix}index.html#anasayfa" class="nav-link">{l_home}</a></li>
          <li><a href="{prefix}index.html#youtube" class="nav-link">{l_youtube}</a></li>
          <li><a href="{prefix}index.html#podcast" class="nav-link">{l_podcast}</a></li>
          <li><a href="{prefix}index.html#blog" class="nav-link">{l_blog}</a></li>
          <li><a href="{prefix}index.html#sarkilar-remixler" class="nav-link">{l_music}</a></li>
{custom_nav_items}          <li><a href="{prefix}index.html#hakkinda" class="nav-link">{l_about}</a></li>
        </ul>
        <a href="{prefix}index.html" class="search-trigger" style="text-decoration:none;" title="Anasayfaya Dön">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Geri Dön</span>
        </a>
        <button class="mobile-toggle" onclick="document.getElementById('subMobileDrawer').classList.toggle('active')" aria-label="Menüyü Aç">
          ☰
        </button>
      </div>
    </div>
  </nav>

  <div class="mobile-drawer" id="subMobileDrawer">
    <div class="mobile-drawer-content">
      <a href="{prefix}index.html#anasayfa" class="mobile-link">{l_home}</a>
      <a href="{prefix}index.html#youtube" class="mobile-link">{l_youtube}</a>
      <a href="{prefix}index.html#podcast" class="mobile-link">{l_podcast}</a>
      <a href="{prefix}index.html#blog" class="mobile-link">{l_blog}</a>
      <a href="{prefix}index.html#sarkilar-remixler" class="mobile-link">{l_music}</a>
{custom_drawer_items}      <a href="{prefix}index.html#hakkinda" class="mobile-link">{l_about}</a>
    </div>
  </div>
    """

def render_footer():
    settings = SITE_DATA.get("settings", {})
    brand_name = settings.get("brandName", "AKCAN AKDAĞ")
    footer_settings = settings.get("footer", {})
    footer_brand = footer_settings.get("brand", brand_name)
    footer_copy = footer_settings.get("copy", "© 2026 AKCAN AKDAĞ · Kültür, teknoloji ve zihin haritaları.")
    social_links = settings.get("socialLinks", [
        {"platform": "YouTube", "url": "https://youtube.com/akcanakdag"},
        {"platform": "Instagram", "url": "https://instagram.com/akcanakdag"},
        {"platform": "TikTok", "url": "https://www.tiktok.com/@akcanakdag"}
    ])
    social_links_html = "\n".join([
        f'          <a href="{s.get("url", "#")}" target="_blank" rel="noopener" class="social-link">{s.get("platform", "")}</a>'
        for s in social_links if s.get("url") and s.get("platform")
    ])

    return f"""
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-inner">
        <div class="footer-left">
          <span class="footer-brand">{footer_brand}</span>
          <p class="footer-copy">{footer_copy}</p>
        </div>
        <div class="footer-social">
{social_links_html}
        </div>
      </div>
    </div>
  </footer>
    """

COPY_SCRIPT = """
  <script>
    const copyBtn = document.getElementById('btnCopyPageTranscript');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        const texts = Array.from(document.querySelectorAll('.transcript-sec-text')).map(el => el.innerText).join('\\n\\n');
        navigator.clipboard.writeText(texts).then(() => {
          copyBtn.innerText = 'Kopyalandı!';
          setTimeout(() => { copyBtn.innerText = 'Transkripti Kopyala'; }, 2000);
        });
      });
    }
  </script>
"""

# =========================================================================
# 1. YOUTUBE VİDEOLARINI ÜRET (video/<slug>/index.html)
# =========================================================================
videos_count = 0
for v in SITE_DATA.get("videos", []):
    slug = v.get("slug")
    if not slug:
        continue
    out_dir = os.path.join(BASE_DIR, "video", slug)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "index.html")

    transcript_html = ""
    transcript_plain = ""
    for sec in v.get("transcript", []):
        if isinstance(sec, str):
            transcript_plain += sec + "\n\n"
            transcript_html += f'<div class="transcript-item"><p class="transcript-sec-text">{sec}</p></div>\n'
        else:
            title = sec.get("title", "")
            text = sec.get("text", "")
            transcript_plain += f"{title}\n{text}\n\n"
            title_html = f'<h3 class="transcript-sec-title">{title}</h3>' if title else ""
            transcript_html += f'<div class="transcript-item">{title_html}<p class="transcript-sec-text">{text}</p></div>\n'

    tags_html = "".join([f'<span class="tag-pill">{t}</span>' for t in v.get("tags", [])])
    keywords_str = make_keywords(v.get("title", ""), v.get("tags", []), "YouTube Videosu")

    video_entity = {
        "@type": "VideoObject",
        "@id": f"https://akcanakdag.com/video/{slug}/#video",
        "name": v.get("title", ""),
        "description": v.get("description", ""),
        "thumbnailUrl": resolve_schema_img(v.get("cover", "")),
        "uploadDate": "2026-10-01",
        "embedUrl": sanitize_youtube_url(v.get("youtubeUrl", "")),
        "inLanguage": "tr-TR",
        "keywords": keywords_str,
        "about": make_about_entities(v.get("tags", [])),
        "author": make_author_schema(),
        "publisher": make_author_schema(),
        "transcript": transcript_plain.strip()
    }
    breadcrumb_entity = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://akcanakdag.com/"},
            {"@type": "ListItem", "position": 2, "name": "Youtube", "item": "https://akcanakdag.com/#youtube"},
            {"@type": "ListItem", "position": 3, "name": v.get("title", ""), "item": f"https://akcanakdag.com/video/{slug}/"}
        ]
    }
    faq_entity = {
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": f"'{v.get('title', '')}' videosunda hangi konular inceleniyor?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"{v.get('description', '')} Videoda ayrıca tam metin transkript ile derinlemesine argümanlar ele alınmaktadır."
                }
            },
            {
                "@type": "Question",
                "name": f"'{v.get('title', '')}' videosunun anlatıcısı kimdir?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bu video AKCAN AKDAĞ tarafından hazırlanmış, seslendirilmiş ve akcanakdag.com üzerinde tam transkriptiyle yayınlanmıştır."
                }
            }
        ]
    }

    schema_json = json.dumps({
        "@context": "https://schema.org",
        "@graph": [video_entity, breadcrumb_entity, faq_entity]
    }, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{v.get('title', '')} — AKCAN AKDAĞ</title>
  <meta name="description" content="{v.get('description', '')}">
  <meta name="author" content="AKCAN AKDAĞ">
  <meta name="keywords" content="{keywords_str}">
  <link rel="canonical" href="https://akcanakdag.com/video/{slug}/">

  <!-- Open Graph -->
  <meta property="og:type" content="video.other">
  <meta property="og:site_name" content="AKCAN AKDAĞ">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="{v.get('title', '')} — AKCAN AKDAĞ">
  <meta property="og:description" content="{v.get('description', '')}">
  <meta property="og:image" content="{resolve_schema_img(v.get('cover', ''))}">
  <meta property="og:url" content="https://akcanakdag.com/video/{slug}/">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{v.get('title', '')}">
  <meta name="twitter:description" content="{v.get('description', '')}">
  <meta name="twitter:image" content="{resolve_schema_img(v.get('cover', ''))}">

  <!-- SEO & GEO Schema.org Graph -->
  <script type="application/ld+json">
  {schema_json}
  </script>

  <link rel="stylesheet" href="../../style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22><text y=%2226%22 font-size=%2224%22>⚡</text></svg>">
</head>
<body>
  {render_nav(depth=2)}

  <main style="margin-top: calc(var(--nav-height) + 2rem); margin-bottom: 5rem;">
    <article class="wrap" style="max-width: 880px;">
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">
        <a href="../../index.html" style="color: var(--text-secondary);">Anasayfa</a> / 
        <a href="../../index.html#youtube" style="color: var(--text-secondary);">Youtube</a> / 
        <span style="color: var(--accent-amber);">{v.get('title', '')}</span>
      </nav>

      <!-- Başlık ve Meta -->
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <span class="tag-pill type-yt">Youtube</span>
          <span class="row-date">{v.get('date', '')}</span>
          {tags_html}
        </div>
        <h1 style="font-family: var(--font-serif); font-size: 2.8rem; line-height: 1.2; font-weight: 600; color: var(--text-main); margin-bottom: 1.2rem;">
          {v.get('title', '')}
        </h1>
        <p style="font-size: 1.15rem; color: var(--text-secondary); line-height: 1.7; font-weight: 300;">
          {v.get('description', '')}
        </p>
      </div>

      <!-- Video Oynatıcı -->
      <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 3rem; border: 1px solid var(--border-light); box-shadow: 0 15px 40px rgba(0,0,0,0.6);">
        <iframe width="100%" height="100%" src="{sanitize_youtube_url(v.get('youtubeUrl', ''))}" title="{v.get('title', '')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>

      <!-- Transkript -->
      <section style="margin-top: 3rem; padding-top: 2.5rem; border-top: 1px solid var(--border);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.8rem;">
          <div>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-amber); text-transform: uppercase; letter-spacing: 0.05em;">TAM METİN DÖKÜMÜ</span>
            <h2 style="font-family: var(--font-serif); font-size: 2rem; color: var(--text-main); margin-top: 0.2rem;">Video Transkripti</h2>
          </div>
          <button id="btnCopyPageTranscript" class="btn-transcript-trigger" style="padding: 0.5rem 1rem;">
            Transkripti Kopyala
          </button>
        </div>

        <div class="transcript-full-body" style="display: flex; flex-direction: column; gap: 1.5rem;">
          {transcript_html}
        </div>
      </section>

      <!-- Alt Yönlendirme -->
      <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <a href="../../index.html#youtube" class="btn-secondary">← Tüm Videolar</a>
        <a href="../../index.html" class="btn-primary">Anasayfaya Dön</a>
      </div>
    </article>
  </main>

  {render_footer()}
  {COPY_SCRIPT}
</body>
</html>
"""
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(html.strip())
    videos_count += 1
    print(f"✓ Video sayfası üretildi: video/{slug}/index.html")

# =========================================================================
# 2. PODCAST BÖLÜMLERİNİ ÜRET (bolum/<ep>/index.html)
# =========================================================================
podcasts_count = 0
for p in SITE_DATA.get("podcasts", []):
    ep = p.get("episodeNumber")
    if not ep:
        continue
    out_dir = os.path.join(BASE_DIR, "bolum", str(ep))
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "index.html")

    transcript_html = ""
    transcript_plain = ""
    for sec in p.get("transcript", []):
        if isinstance(sec, str):
            transcript_plain += sec + "\n\n"
            transcript_html += f'<div class="transcript-item"><p class="transcript-sec-text">{sec}</p></div>\n'
        else:
            title = sec.get("title", "")
            text = sec.get("text", "")
            transcript_plain += f"{title}\n{text}\n\n"
            title_html = f'<h3 class="transcript-sec-title">{title}</h3>' if title else ""
            transcript_html += f'<div class="transcript-item">{title_html}<p class="transcript-sec-text">{text}</p></div>\n'

    tags_html = "".join([f'<span class="tag-pill">{t}</span>' for t in p.get("tags", [])])
    keywords_str = make_keywords(p.get("title", ""), p.get("tags", []), "Derin Odak Podcast")

    podcast_entity = {
        "@type": "PodcastEpisode",
        "@id": f"https://akcanakdag.com/bolum/{ep}/#episode",
        "name": p.get('title', ''),
        "description": p.get("description", ""),
        "episodeNumber": ep,
        "datePublished": "2026-09-29",
        "image": resolve_schema_img(p.get("cover", "")),
        "audio": p.get("audioUrl", ""),
        "inLanguage": "tr-TR",
        "keywords": keywords_str,
        "about": make_about_entities(p.get("tags", [])),
        "author": make_author_schema(),
        "partOfSeries": {
            "@type": "PodcastSeries",
            "name": "Derin Odak Podcast",
            "author": make_author_schema()
        },
        "transcript": transcript_plain.strip()
    }
    breadcrumb_entity = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://akcanakdag.com/"},
            {"@type": "ListItem", "position": 2, "name": "Podcast", "item": "https://akcanakdag.com/#podcast"},
            {"@type": "ListItem", "position": 3, "name": p.get('title', ''), "item": f"https://akcanakdag.com/bolum/{ep}/"}
        ]
    }
    faq_entity = {
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": f"'{p.get('title', '')}' ne anlatıyor?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"{p.get('description', '')} Bölümün tam metin dökümü akcanakdag.com sayfasında mevcuttur."
                }
            },
            {
                "@type": "Question",
                "name": f"'{p.get('title', '')}' kim tarafından hazırlandı?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Derin Odak podcast serisi AKCAN AKDAĞ tarafından hazırlanmakta ve seslendirilmektedir."
                }
            }
        ]
    }

    schema_json = json.dumps({
        "@context": "https://schema.org",
        "@graph": [podcast_entity, breadcrumb_entity, faq_entity]
    }, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{p.get('title', '')} — AKCAN AKDAĞ</title>
  <meta name="description" content="{p.get('description', '')}">
  <meta name="author" content="AKCAN AKDAĞ">
  <meta name="keywords" content="{keywords_str}">
  <link rel="canonical" href="https://akcanakdag.com/bolum/{ep}/">

  <!-- Open Graph -->
  <meta property="og:type" content="music.song">
  <meta property="og:site_name" content="AKCAN AKDAĞ">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="{p.get('title', '')} — AKCAN AKDAĞ">
  <meta property="og:description" content="{p.get('description', '')}">
  <meta property="og:image" content="{resolve_schema_img(p.get('cover', ''))}">
  <meta property="og:url" content="https://akcanakdag.com/bolum/{ep}/">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{p.get('title', '')}">
  <meta name="twitter:description" content="{p.get('description', '')}">
  <meta name="twitter:image" content="{resolve_schema_img(p.get('cover', ''))}">

  <!-- SEO & GEO Schema.org Graph -->
  <script type="application/ld+json">
  {schema_json}
  </script>

  <link rel="stylesheet" href="../../style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22><text y=%2226%22 font-size=%2224%22>⚡</text></svg>">
</head>
<body>
  {render_nav(depth=2)}

  <main style="margin-top: calc(var(--nav-height) + 2rem); margin-bottom: 5rem;">
    <article class="wrap" style="max-width: 880px;">
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">
        <a href="../../index.html" style="color: var(--text-secondary);">Anasayfa</a> / 
        <a href="../../index.html#podcast" style="color: var(--text-secondary);">Podcast</a> / 
        <span style="color: var(--accent-amber);">{p.get('title', '')}</span>
      </nav>

      <!-- Başlık ve Meta -->
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <span class="tag-pill type-pod">Podcast</span>
          <span class="row-date">{p.get('date', '')}</span>
          {tags_html}
        </div>
        <h1 style="font-family: var(--font-serif); font-size: 2.8rem; line-height: 1.2; font-weight: 600; color: var(--text-main); margin-bottom: 1.2rem;">
          {p.get('title', '')}
        </h1>
        <p style="font-size: 1.15rem; color: var(--text-secondary); line-height: 1.7; font-weight: 300;">
          {p.get('description', '')}
        </p>
      </div>

      <!-- Podcast Oynatıcı Kartı -->
      <div class="subpage-podcast-player" style="display: flex; align-items: center; gap: 2rem; background: var(--bg-card); padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--border-light); margin-bottom: 3rem; flex-wrap: wrap;">
        <img src="{resolve_img(p.get('cover', ''))}" class="subpage-podcast-cover" alt="AKCAN AKDAĞ — {p.get('title', '')}" style="width: 140px; height: 140px; border-radius: var(--radius-md); object-fit: cover;">
        <div class="subpage-podcast-body" style="flex-grow: 1; min-width: min(100%, 240px);">
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-amber);">DERİN ODAK PODCAST</span>
          <h3 style="font-family: var(--font-serif); font-size: 1.3rem; color: var(--text-main); margin: 0.3rem 0 1rem;">{p.get('title', '')}</h3>
          <audio controls style="width: 100%;">
            <source src="{p.get('audioUrl', '')}" type="audio/mpeg">
            Tarayıcınız ses öğesini desteklemiyor.
          </audio>
        </div>
      </div>

      <!-- Transkript -->
      <section style="margin-top: 3rem; padding-top: 2.5rem; border-top: 1px solid var(--border);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.8rem;">
          <div>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-amber); text-transform: uppercase; letter-spacing: 0.05em;">BÖLÜM TRANSKRİPTİ</span>
            <h2 style="font-family: var(--font-serif); font-size: 2rem; color: var(--text-main); margin-top: 0.2rem;">Metin Dökümü</h2>
          </div>
          <button id="btnCopyPageTranscript" class="btn-transcript-trigger" style="padding: 0.5rem 1rem;">
            Transkripti Kopyala
          </button>
        </div>

        <div class="transcript-full-body" style="display: flex; flex-direction: column; gap: 1.5rem;">
          {transcript_html}
        </div>
      </section>

      <!-- Alt Yönlendirme -->
      <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <a href="../../index.html#podcast" class="btn-secondary">← Tüm Podcastler</a>
        <a href="../../index.html" class="btn-primary">Anasayfaya Dön</a>
      </div>
    </article>
  </main>

  {render_footer()}
  {COPY_SCRIPT}
</body>
</html>
"""
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(html.strip())
    podcasts_count += 1
    print(f"✓ Podcast sayfası üretildi: bolum/{ep}/index.html")

# =========================================================================
# 3. BLOG YAZILARINI ÜRET (yazi/<slug>/index.html)
# =========================================================================
articles_count = 0
for a in SITE_DATA.get("articles", []):
    slug = a.get("slug")
    if not slug:
        continue
    out_dir = os.path.join(BASE_DIR, "yazi", slug)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "index.html")

    tags_html = "".join([f'<span class="tag-pill">{t}</span>' for t in a.get("tags", [])])
    keywords_str = make_keywords(a.get("title", ""), a.get("tags", []), "Haftalık Blog Yazısı")

    blog_entity = {
        "@type": "BlogPosting",
        "@id": f"https://akcanakdag.com/yazi/{slug}/#article",
        "headline": a.get("title", ""),
        "description": a.get("summary", ""),
        "image": resolve_schema_img(a.get("cover", "")),
        "datePublished": "2026-09-28",
        "inLanguage": "tr-TR",
        "keywords": keywords_str,
        "about": make_about_entities(a.get("tags", [])),
        "author": make_author_schema(),
        "publisher": make_author_schema(),
        "articleSection": "Haftalık Denemeler"
    }
    breadcrumb_entity = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://akcanakdag.com/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://akcanakdag.com/#blog"},
            {"@type": "ListItem", "position": 3, "name": a.get("title", ""), "item": f"https://akcanakdag.com/yazi/{slug}/"}
        ]
    }
    faq_entity = {
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": f"'{a.get('title', '')}' blog yazısının ana fikri nedir?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"{a.get('summary', '')}"
                }
            },
            {
                "@type": "Question",
                "name": f"Bu yazının yazarı kimdir?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bu yazı AKCAN AKDAĞ tarafından kaleme alınmış haftalık editoryal bir denemedir."
                }
            }
        ]
    }

    schema_json = json.dumps({
        "@context": "https://schema.org",
        "@graph": [blog_entity, breadcrumb_entity, faq_entity]
    }, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{a.get('title', '')} — AKCAN AKDAĞ</title>
  <meta name="description" content="{a.get('summary', '')}">
  <meta name="author" content="AKCAN AKDAĞ">
  <meta name="keywords" content="{keywords_str}">
  <link rel="canonical" href="https://akcanakdag.com/yazi/{slug}/">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="AKCAN AKDAĞ">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="{a.get('title', '')} — AKCAN AKDAĞ">
  <meta property="og:description" content="{a.get('summary', '')}">
  <meta property="og:image" content="{resolve_schema_img(a.get('cover', ''))}">
  <meta property="og:url" content="https://akcanakdag.com/yazi/{slug}/">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{a.get('title', '')}">
  <meta name="twitter:description" content="{a.get('summary', '')}">
  <meta name="twitter:image" content="{resolve_schema_img(a.get('cover', ''))}">

  <!-- SEO & GEO Schema.org Graph -->
  <script type="application/ld+json">
  {schema_json}
  </script>

  <link rel="stylesheet" href="../../style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22><text y=%2226%22 font-size=%2224%22>⚡</text></svg>">
</head>
<body>
  {render_nav(depth=2)}

  <main style="margin-top: calc(var(--nav-height) + 2rem); margin-bottom: 5rem;">
    <article class="wrap" style="max-width: 780px;">
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">
        <a href="../../index.html" style="color: var(--text-secondary);">Anasayfa</a> / 
        <a href="../../index.html#blog" style="color: var(--text-secondary);">Blog</a> / 
        <span style="color: var(--accent-amber);">{a.get('title', '')}</span>
      </nav>

      <!-- Başlık ve Meta -->
      <header style="margin-bottom: 2.5rem;">
        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <span class="tag-pill type-blog">Blog</span>
          <span class="row-date">{a.get('date', '')}</span>
          {tags_html}
        </div>
        <h1 style="font-family: var(--font-serif); font-size: 3rem; line-height: 1.18; font-weight: 600; color: var(--text-main); margin-bottom: 1.5rem;">
          {a.get('title', '')}
        </h1>
        <div style="display: flex; align-items: center; gap: 1rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted); padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
          <span>Yazar: <b style="color: var(--text-main);">AKCAN AKDAĞ</b></span>
          <span>·</span>
          <span>{a.get('date', '')}</span>
        </div>
      </header>

      <!-- Kapak Görseli -->
      <div style="border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 3rem; border: 1px solid var(--border-light);">
        <img src="{resolve_img(a.get('cover', ''))}" alt="AKCAN AKDAĞ — {a.get('title', '')} (Blog Kapak Görseli)" style="width: 100%; max-height: 480px; object-fit: cover;">
      </div>

      <!-- Makale Gövdesi -->
      <div class="article-body">
        {fix_content_images(a.get('content', ''))}
      </div>

      <!-- Yazar Kutusu -->
      <div style="margin-top: 4rem; padding: 2rem; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
        <h3 style="font-family: var(--font-serif); font-size: 1.3rem; color: var(--text-main); margin-bottom: 0.5rem;">AKCAN AKDAĞ Hakkında</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6;">
          Teknoloji, yapay zeka, felsefe ve evrenin derin soruları üzerine haftalık denemeler ve belgesel tadında hikâyeler üreten bir yazar ve anlatıcı.
        </p>
      </div>

      <!-- Alt Yönlendirme -->
      <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <a href="../../index.html#blog" class="btn-secondary">← Tüm Yazılar</a>
        <a href="../../index.html" class="btn-primary">Anasayfaya Dön</a>
      </div>
    </article>
  </main>

  {render_footer()}
</body>
</html>
"""
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(html.strip())
    articles_count += 1
    print(f"✓ Blog sayfası üretildi: yazi/{slug}/index.html")

# =========================================================================
# 4. ŞARKILAR & REMİXLER SAYFALARINI ÜRET (muzik/<slug>/index.html)
# =========================================================================
music_count = 0
for m in SITE_DATA.get("music", []):
    slug = m.get("slug")
    if not slug:
        continue
    out_dir = os.path.join(BASE_DIR, "muzik", slug)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "index.html")

    lyrics_html = ""
    for line in m.get("lyrics", []):
        lyrics_html += f'<p class="transcript-sec-text" style="margin-bottom: 0.6rem;">{line}</p>\n'

    tags_html = "".join([f'<span class="tag-pill">{t}</span>' for t in m.get("tags", [])])
    keywords_str = make_keywords(m.get("title", ""), m.get("tags", []), "Şarkı & Remix")

    music_entity = {
        "@type": "MusicRecording",
        "@id": f"https://akcanakdag.com/muzik/{slug}/#song",
        "name": m.get("title", ""),
        "description": m.get("description", ""),
        "image": resolve_schema_img(m.get("cover", "")),
        "datePublished": "2026-10-01",
        "duration": m.get("duration", ""),
        "genre": m.get("type", "Remix"),
        "inLanguage": "tr-TR",
        "keywords": keywords_str,
        "about": make_about_entities(m.get("tags", [])),
        "byArtist": make_author_schema(),
        "url": f"https://akcanakdag.com/muzik/{slug}/"
    }
    breadcrumb_entity = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://akcanakdag.com/"},
            {"@type": "ListItem", "position": 2, "name": "Şarkılar & Remixler", "item": "https://akcanakdag.com/#sarkilar-remixler"},
            {"@type": "ListItem", "position": 3, "name": m.get("title", ""), "item": f"https://akcanakdag.com/muzik/{slug}/"}
        ]
    }
    faq_entity = {
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": f"'{m.get('title', '')}' parçası hangi türdedir ve nerede dinlenebilir?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"{m.get('description', '')} Parça AKCAN AKDAĞ'ın YouTube kanalında ve YouTube Müzik'te yayınlanmaktadır."
                }
            },
            {
                "@type": "Question",
                "name": f"'{m.get('title', '')}' parçasının prodüksiyonu kime aittir?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"{m.get('credits', 'Prodüksiyon ve düzenleme AKCAN AKDAĞ tarafından yapılmıştır.')}"
                }
            }
        ]
    }

    schema_json = json.dumps({
        "@context": "https://schema.org",
        "@graph": [music_entity, breadcrumb_entity, faq_entity]
    }, ensure_ascii=False)

    yt_music_btn = ""
    if m.get("youtubeMusicUrl"):
        yt_music_btn = f"""
        <a href="{m.get('youtubeMusicUrl')}" target="_blank" rel="noopener" class="btn-primary" style="background: #f43f5e; color: #fff;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="#fff"/></svg>
          <span>YouTube Music'te Dinle</span>
        </a>
        """

    credits_html = ""
    if m.get("credits"):
        credits_html = f"""
        <div style="margin-top: 2rem; padding: 1.2rem 1.5rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: var(--radius-md);">
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber); text-transform: uppercase;">KÜNYE & BİLGİ</span>
          <p style="font-size: 0.92rem; color: var(--text-secondary); margin-top: 0.4rem;">{m.get('credits')}</p>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{m.get('title', '')} — AKCAN AKDAĞ</title>
  <meta name="description" content="{m.get('description', '')}">
  <meta name="author" content="AKCAN AKDAĞ">
  <meta name="keywords" content="{keywords_str}">
  <link rel="canonical" href="https://akcanakdag.com/muzik/{slug}/">

  <!-- Open Graph -->
  <meta property="og:type" content="music.song">
  <meta property="og:site_name" content="AKCAN AKDAĞ">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="{m.get('title', '')} — AKCAN AKDAĞ">
  <meta property="og:description" content="{m.get('description', '')}">
  <meta property="og:image" content="{resolve_schema_img(m.get('cover', ''))}">
  <meta property="og:url" content="https://akcanakdag.com/muzik/{slug}/">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{m.get('title', '')}">
  <meta name="twitter:description" content="{m.get('description', '')}">
  <meta name="twitter:image" content="{resolve_schema_img(m.get('cover', ''))}">

  <!-- SEO & GEO Schema.org Graph -->
  <script type="application/ld+json">
  {schema_json}
  </script>

  <link rel="stylesheet" href="../../style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22><text y=%2226%22 font-size=%2224%22>⚡</text></svg>">
</head>
<body>
  {render_nav(depth=2)}

  <main style="margin-top: calc(var(--nav-height) + 2rem); margin-bottom: 5rem;">
    <article class="wrap" style="max-width: 880px;">
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">
        <a href="../../index.html" style="color: var(--text-secondary);">Anasayfa</a> / 
        <a href="../../index.html#sarkilar-remixler" style="color: var(--text-secondary);">Şarkılar & Remixler</a> / 
        <span style="color: #e879f9;">{m.get('title', '')}</span>
      </nav>

      <!-- Başlık ve Meta -->
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <span class="tag-pill type-music">{m.get('type', 'Remix')}</span>
          <span class="row-date">{m.get('date', '')}</span>
          {tags_html}
        </div>
        <h1 style="font-family: var(--font-serif); font-size: 2.8rem; line-height: 1.2; font-weight: 600; color: var(--text-main); margin-bottom: 1.2rem;">
          {m.get('title', '')}
        </h1>
        <p style="font-size: 1.15rem; color: var(--text-secondary); line-height: 1.7; font-weight: 300;">
          {m.get('description', '')}
        </p>
      </div>

      <!-- Video / Müzik Oynatıcı -->
      <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 2rem; border: 1px solid var(--border-light); box-shadow: 0 15px 40px rgba(0,0,0,0.6);">
        <iframe width="100%" height="100%" src="{sanitize_youtube_url(m.get('youtubeUrl', ''))}" title="{m.get('title', '')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>

      <!-- Aksiyon Barı -->
      <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 3rem;">
        {yt_music_btn}
        <a href="https://youtube.com/akcanakdag" target="_blank" rel="noopener" class="btn-secondary">
          <span>YouTube Kanalına Abone Ol</span>
        </a>
      </div>

      <!-- Şarkı Sözleri & Notlar -->
      <section style="margin-top: 3rem; padding-top: 2.5rem; border-top: 1px solid var(--border);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.8rem;">
          <div>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; color: #e879f9; text-transform: uppercase; letter-spacing: 0.05em;">LİNER NOTLARI & SÖZLER</span>
            <h2 style="font-family: var(--font-serif); font-size: 2rem; color: var(--text-main); margin-top: 0.2rem;">Şarkı Detayları</h2>
          </div>
        </div>

        <div class="transcript-item" style="padding: 1.8rem; border-color: rgba(232, 121, 249, 0.2);">
          {lyrics_html}
        </div>

        {credits_html}
      </section>

      <!-- Alt Yönlendirme -->
      <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <a href="../../index.html#sarkilar-remixler" class="btn-secondary">← Tüm Şarkılar & Remixler</a>
        <a href="../../index.html" class="btn-primary">Anasayfaya Dön</a>
      </div>
    </article>
  </main>

  {render_footer()}
</body>
</html>
"""
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(html.strip())
    music_count += 1
    print(f"✓ Müzik sayfası üretildi: muzik/{slug}/index.html")

# =========================================================================
# 5. HAKKINDA SAYFASINI ÜRET (hakkinda/index.html)
# =========================================================================
about_dir = os.path.join(BASE_DIR, "hakkinda")
os.makedirs(about_dir, exist_ok=True)
about_file = os.path.join(about_dir, "index.html")

about_schema = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "ProfilePage",
            "@id": "https://akcanakdag.com/hakkinda/#webpage",
            "url": "https://akcanakdag.com/hakkinda/",
            "name": "Hakkımda — AKCAN AKDAĞ",
            "description": "AKCAN AKDAĞ; teknoloji, yapay zeka, evren ve felsefe hikâyeleri anlatan yazar, dijital düşünür ve müzisyendir.",
            "isPartOf": {
                "@type": "WebSite",
                "@id": "https://akcanakdag.com/#website",
                "name": "AKCAN AKDAĞ",
                "url": "https://akcanakdag.com/"
            },
            "about": {
                "@id": "https://akcanakdag.com/#person"
            },
            "mainEntity": make_author_schema()
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://akcanakdag.com/"},
                {"@type": "ListItem", "position": 2, "name": "Hakkında", "item": "https://akcanakdag.com/hakkinda/"}
            ]
        }
    ]
}

def render_about_container(depth=0):
    about = SITE_DATA.get("about", {})
    author = SITE_DATA.get("author", {})
    settings = SITE_DATA.get("settings", {})

    raw_avatar = about.get("avatar") or "images/author/akcan-akdag.svg"
    avatar = resolve_img(raw_avatar, depth=depth)

    name = about.get("name") or author.get("name") or "AKCAN AKDAĞ"
    badge = about.get("badge") or author.get("title") or "YAZAR · ANLATICI · DİJİTAL DÜŞÜNÜR"
    lead = about.get("lead") or author.get("bio") or '"Sanat, teknoloji ve felsefenin kesişim noktasında insan zihnini, evreni ve geleceği anlamaya çalışan hikâyeler anlatıyorum."'

    who_title = about.get("whoTitle") or "Ben Kimim?"
    who_text = about.get("whoText") or "Gürültülü dijital çağda, yüzeysel bilgi tüketiminin hızına inat; yavaşlamanın, derinleşmenin ve zihinsel berraklığın değerine inanan bir içerik üreticisi ve anlatıcıyım.\n\nYapay zekanın ve algoritmaların gündelik hayatımızı kökten değiştirdiği bu dönemde; teknolojinin getirdiği teknik yeniliklerden ziyade, insana ve felsefeye yansıyan derin etkilerini inceliyorum. Barış Özcan tarzı belgesel hikâye anlatıcılığını kendi düşünce ve müzik dünyamla harmanlayarak paylaşıyorum."

    paragraphs = [p.strip() for p in who_text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [p.strip() for p in who_text.split("\n") if p.strip()]
    who_html = "\n".join([f"              <p>{p}</p>" for p in paragraphs])

    pillars_title = about.get("pillarsTitle") or "Neler Üretiyorum?"
    pillars = about.get("pillars", [
        {"icon": "🎥", "title": "YouTube Videoları", "description": "Yapay zeka modelleri, Turing Testi, Fermi Paradoksu, zamanın oku ve bilişsel psikoloji üzerine belgesel tadında görsel denemeler."},
        {"icon": "🎙️", "title": "Derin Odak Podcast", "description": "Dikkat ekonomisinin tuzaklarından sıyrılmak, sessizliği geri kazanmak ve üretken zihinsel odaklanma ritüelleri üzerine sesli denemeler."},
        {"icon": "✍️", "title": "Haftalık Blog & Notlar", "description": "Kitaplar, yavaş okuma sanatı, algoritmik filtre balonları ve insani kusurların güzelliği üzerine kaleme alınmış editoryal yazılar."},
        {"icon": "🎹", "title": "Şarkılar & Remixler", "description": "Gece sürüşleri ve derin çalışma saatleri için özel olarak düzenlediğim synthwave, cyberpunk ve lo-fi elektronik müzik prodüksiyonları."}
    ])
    pillars_html = "\n".join([
        f"""                <div class="about-pillar-card">
                  <span class="pillar-icon">{p.get('icon', '✨')}</span>
                  <h4>{p.get('title', '')}</h4>
                  <p>{p.get('description', '')}</p>
                </div>"""
        for p in pillars if p.get('title')
    ])

    principles_title = about.get("principlesTitle") or "Üretim İlkelerim"
    principles = about.get("principles", [
        {"title": "Merak Odaklı Sorgulama", "text": "Kesin cevaplardan çok, doğru ve derin sorular sormanın değerine inanırım."},
        {"title": "Hıza Karşı Derinlik", "text": "Günde onlarca kısa video yerine, aylar sonra bile dönüp izlenebilecek kalıcı içerikler üretmeyi hedeflerim."},
        {"title": "Kusurlu İnsani Özgünlük", "text": "Kusursuz yapay zeka çıktılarının ortasında, insanı insan yapan duygu ve kırılganlığı korumak esastır."}
    ])
    principles_html = "\n".join([
        f"                <li><strong>{pr.get('title', '')}:</strong> {pr.get('text', '')}</li>"
        for pr in principles if pr.get('title')
    ])

    contact_title = about.get("contactTitle") or "İletişim & İş Birlikleri"
    contact_text = about.get("contactText") or "Projeler, konuşma davetleri, iş birlikleri veya sadece fikir alışverişinde bulunmak için sosyal medya hesaplarımdan ulaşabilirsiniz."
    contact_email = (about.get("contactEmail") or "").strip()

    social_links = settings.get("socialLinks", [
        {"platform": "YouTube", "url": "https://youtube.com/akcanakdag"},
        {"platform": "Instagram", "url": "https://instagram.com/akcanakdag"},
        {"platform": "TikTok", "url": "https://www.tiktok.com/@akcanakdag"}
    ])

    hero_social_buttons = []
    for idx, s in enumerate(social_links):
        url = s.get("url")
        platform = s.get("platform")
        if url and platform:
            btn_class = "btn-primary" if idx == 0 else "btn-secondary"
            hero_social_buttons.append(
                f'<a href="{url}" target="_blank" rel="noopener" class="{btn_class} btn-sm"><span>{platform}</span></a>'
            )
    hero_social_html = "\n                ".join(hero_social_buttons)

    contact_buttons = []
    for idx, s in enumerate(social_links[:2]):
        url = s.get("url")
        platform = s.get("platform")
        if url and platform:
            btn_class = "btn-primary" if idx == 0 else "btn-secondary"
            contact_buttons.append(
                f'<a href="{url}" target="_blank" rel="noopener" class="{btn_class}">{platform}\'da Takip Et</a>'
            )
    if contact_email:
        contact_buttons.append(
            f'<a href="mailto:{contact_email}" class="btn-secondary">E-posta Gönder</a>'
        )
    contact_buttons_html = "\n                ".join(contact_buttons)

    fallback_avatar = '../images/author/akcan-akdag.svg' if depth == 1 else 'images/author/akcan-akdag.svg'

    return f"""<div class="about-container">
          <!-- Giriş & Profil Kartı -->
          <div class="about-hero-card">
            <div class="about-avatar-wrap">
              <img src="{avatar}" alt="{name}" class="about-avatar-img" onerror="this.onerror=null; this.src='{fallback_avatar}';">
            </div>
            <div class="about-hero-info">
              <span class="about-badge">{badge}</span>
              <h1 class="about-name">{name}</h1>
              <p class="about-lead">
                {lead}
              </p>
              <div class="about-social-links">
                {hero_social_html}
              </div>
            </div>
          </div>

          <!-- Biyografi / Hikaye -->
          <div class="about-body">
            <div class="about-text-block">
              <h3 class="about-sec-title">{who_title}</h3>
{who_html}
            </div>

            <!-- Neler Üretiyorum? -->
            <div class="about-text-block">
              <h3 class="about-sec-title">{pillars_title}</h3>
              <div class="about-pillars-grid">
{pillars_html}
              </div>
            </div>

            <!-- Felsefe & İlkeler -->
            <div class="about-manifesto-box">
              <h3 class="about-card-title">{principles_title}</h3>
              <ul class="about-principles-list">
{principles_html}
              </ul>
            </div>

            <!-- İletişim Notu -->
            <div class="about-contact-card">
              <h3 class="about-card-title">{contact_title}</h3>
              <p class="about-contact-desc">
                {contact_text}
              </p>
              <div class="about-contact-btns">
                {contact_buttons_html}
              </div>
            </div>
          </div>
        </div>"""

about_data = SITE_DATA.get("about", {})
author_data = SITE_DATA.get("author", {})
a_name = about_data.get("name") or author_data.get("name") or "AKCAN AKDAĞ"
a_badge = about_data.get("badge") or author_data.get("title") or "YAZAR · ANLATICI · DİJİTAL DÜŞÜNÜR"
a_lead_clean = (about_data.get("lead") or author_data.get("bio") or "Sanat, teknoloji ve felsefe kesişiminde hikayeler.").replace('"', '')

about_keywords = f"{a_name} kimdir, {a_name} hakkında, dijital düşünür, teknoloji felsefesi, barış özcan tarzı kanal, derin odak podcast, {a_name} biyografi"

about_html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hakkımda — {a_name}</title>
  <meta name="description" content="{a_name}; {a_lead_clean}">
  <meta name="author" content="{a_name}">
  <meta name="keywords" content="{about_keywords}">
  <link rel="canonical" href="https://akcanakdag.com/hakkinda/">

  <!-- Open Graph -->
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="{a_name}">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="Hakkımda — {a_name}">
  <meta property="og:description" content="{a_lead_clean}">
  <meta property="og:image" content="https://akcanakdag.com/images/author/akcan-akdag.webp">
  <meta property="og:url" content="https://akcanakdag.com/hakkinda/">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Hakkımda — {a_name}">
  <meta name="twitter:description" content="{a_lead_clean}">
  <meta name="twitter:image" content="https://akcanakdag.com/images/author/akcan-akdag.webp">

  <!-- Schema.org Graph -->
  <script type="application/ld+json">
  {json.dumps(about_schema, ensure_ascii=False)}
  </script>

  <link rel="stylesheet" href="../style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22><text y=%2226%22 font-size=%2224%22>⚡</text></svg>">
</head>
<body>
  {render_nav(depth=1)}

  <main style="margin-top: calc(var(--nav-height) + 2rem); margin-bottom: 5rem;">
    <div class="wrap wrap-narrow">
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">
        <a href="../index.html" style="color: var(--text-secondary);">Anasayfa</a> / 
        <span style="color: var(--accent-amber);">Hakkında</span>
      </nav>

      {render_about_container(depth=1)}
    </div>
  </main>

  {render_footer()}
</body>
</html>
"""
with open(about_file, "w", encoding="utf-8") as f:
    f.write(about_html.strip())
print("✓ Hakkında sayfası üretildi: hakkinda/index.html")

# =========================================================================
# 6. DİNAMİK KATEGORİLER VE ALT İÇERİKLERİ ÜRET (kategori/<cat>/<slug>/index.html)
# =========================================================================
custom_items_count = 0
for cat in SITE_DATA.get("categories", []):
    cat_id = cat.get("id")
    if not cat_id:
        continue
    cat_title = cat.get("title", cat_id)
    cat_type = cat.get("type", "article")
    cat_icon = cat.get("icon", "📁")
    items = SITE_DATA.get(cat_id, [])

    for item in items:
        slug = item.get("slug") or str(item.get("episodeNumber") or item.get("id"))
        if not slug:
            continue
        out_dir = os.path.join(BASE_DIR, "kategori", cat_id, str(slug))
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, "index.html")

        title = item.get("title", "")
        desc = item.get("description") or item.get("summary") or ""
        date = item.get("date", "")
        tags = item.get("tags", [])
        cover = item.get("cover", "")
        tags_html = "".join([f'<span class="tag-pill">{t}</span>' for t in tags])
        keywords_str = make_keywords(title, tags, cat_title)

        media_html = ""
        extra_content_html = ""

        if cat_type == "video" or item.get("youtubeUrl"):
            yt_url = sanitize_youtube_url(item.get("youtubeUrl", ""))
            if yt_url:
                media_html = f"""
        <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 2.5rem; border: 1px solid var(--border-light); box-shadow: 0 15px 40px rgba(0,0,0,0.6);">
          <iframe width="100%" height="100%" src="{yt_url}" title="{title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        """
        elif cat_type == "podcast" and item.get("audioUrl"):
            media_html = f"""
        <div style="margin-bottom: 2.5rem; background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem;">
          <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent-blue); display: block; margin-bottom: 0.8rem;">🎙️ SESLİ YAYIN</span>
          <audio controls style="width: 100%;" src="{item.get('audioUrl')}"></audio>
        </div>
        """
        elif cover:
            media_html = f"""
        <div style="margin-bottom: 2.5rem; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border-light); max-height: 480px;">
          <img src="{resolve_img(cover, depth=3)}" alt="{title}" style="width: 100%; height: auto; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900';">
        </div>
        """

        content_body = item.get("content", "")
        if content_body:
            content_fixed = fix_content_images(content_body, depth=3)
            extra_content_html = f"""
        <section class="blog-body" style="margin-top: 2rem; font-size: 1.12rem; line-height: 1.85; color: var(--text-main);">
          {content_fixed}
        </section>
        """
        elif desc:
            extra_content_html = f"""
        <section style="margin-top: 2rem; font-size: 1.15rem; line-height: 1.8; color: var(--text-secondary);">
          <p>{desc}</p>
        </section>
        """

        if item.get("transcript"):
            tr_html = ""
            for sec in item.get("transcript"):
                if isinstance(sec, str):
                    tr_html += f'<div class="transcript-item"><p class="transcript-sec-text">{sec}</p></div>\n'
                else:
                    t_title = sec.get("title", "")
                    t_text = sec.get("text", "")
                    t_title_html = f'<h3 class="transcript-sec-title">{t_title}</h3>' if t_title else ""
                    tr_html += f'<div class="transcript-item">{t_title_html}<p class="transcript-sec-text">{t_text}</p></div>\n'
            extra_content_html += f"""
        <section style="margin-top: 3.5rem; padding-top: 2.5rem; border-top: 1px solid var(--border);">
          <h2 style="font-family: var(--font-serif); font-size: 1.8rem; margin-bottom: 1.5rem; color: var(--text-main);">Transkript & Döküm</h2>
          {tr_html}
        </section>
        """

        schema_entity = {
            "@type": "Article",
            "@id": f"https://akcanakdag.com/kategori/{cat_id}/{slug}/#content",
            "headline": title,
            "description": desc,
            "image": resolve_schema_img(cover),
            "datePublished": "2026-10-01",
            "inLanguage": "tr-TR",
            "keywords": keywords_str,
            "author": make_author_schema(),
            "publisher": make_author_schema()
        }
        breadcrumb_entity = {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://akcanakdag.com/"},
                {"@type": "ListItem", "position": 2, "name": cat_title, "item": f"https://akcanakdag.com/#{cat_id}"},
                {"@type": "ListItem", "position": 3, "name": title, "item": f"https://akcanakdag.com/kategori/{cat_id}/{slug}/"}
            ]
        }
        schema_json = json.dumps({
            "@context": "https://schema.org",
            "@graph": [schema_entity, breadcrumb_entity]
        }, ensure_ascii=False)

        html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — {cat_title} — AKCAN AKDAĞ</title>
  <meta name="description" content="{desc}">
  <meta name="author" content="AKCAN AKDAĞ">
  <meta name="keywords" content="{keywords_str}">
  <link rel="canonical" href="https://akcanakdag.com/kategori/{cat_id}/{slug}/">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="AKCAN AKDAĞ">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="{title} — AKCAN AKDAĞ">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{resolve_schema_img(cover)}">
  <meta property="og:url" content="https://akcanakdag.com/kategori/{cat_id}/{slug}/">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{resolve_schema_img(cover)}">

  <!-- SEO & GEO Schema.org Graph -->
  <script type="application/ld+json">
  {schema_json}
  </script>

  <link rel="stylesheet" href="../../../style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22><text y=%2226%22 font-size=%2224%22>⚡</text></svg>">
</head>
<body>
  {render_nav(depth=3)}

  <main style="margin-top: calc(var(--nav-height) + 2rem); margin-bottom: 5rem;">
    <article class="wrap" style="max-width: 840px;">
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">
        <a href="../../../index.html" style="color: var(--text-secondary);">Anasayfa</a> / 
        <a href="../../../index.html#{cat_id}" style="color: var(--accent-amber);">{cat_icon} {cat_title}</a> / 
        <span style="color: var(--text-main);">{title}</span>
      </nav>

      <!-- Başlık ve Meta -->
      <header style="margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <span class="tag-pill" style="background: rgba(217,119,6,0.15); color: #d97706; border-color: rgba(217,119,6,0.3);">{cat_icon} {cat_title}</span>
          <span class="row-date">{date}</span>
          {tags_html}
        </div>
        <h1 style="font-family: var(--font-serif); font-size: 2.8rem; line-height: 1.25; font-weight: 600; color: var(--text-main); margin-bottom: 1.2rem;">
          {title}
        </h1>
        {f'<p style="font-size: 1.2rem; color: var(--text-secondary); line-height: 1.7; font-weight: 300;">{desc}</p>' if (content_body and desc) else ''}
      </header>

      {media_html}
      {extra_content_html}

      <!-- Alt Yönlendirme -->
      <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <a href="../../../index.html#{cat_id}" class="btn-secondary">← {cat_title} Akışına Dön</a>
        <a href="../../../index.html" class="btn-primary">Anasayfaya Dön</a>
      </div>
    </article>
  </main>

  {render_footer()}
</body>
</html>
"""
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(html.strip())
        custom_items_count += 1
        print(f"✓ Özel kategori sayfası üretildi: kategori/{cat_id}/{slug}/index.html")

def prune_orphans():
    # video
    valid_videos = {v.get("slug") for v in SITE_DATA.get("videos", []) if v.get("slug")}
    v_dir = os.path.join(BASE_DIR, "video")
    if os.path.exists(v_dir):
        for entry in os.listdir(v_dir):
            p = os.path.join(v_dir, entry)
            if os.path.isdir(p) and entry not in valid_videos:
                shutil.rmtree(p, ignore_errors=True)
                print(f"🗑 Silinen video klasörü temizlendi: video/{entry}")

    # muzik
    valid_music = {m.get("slug") for m in SITE_DATA.get("music", []) if m.get("slug")}
    m_dir = os.path.join(BASE_DIR, "muzik")
    if os.path.exists(m_dir):
        for entry in os.listdir(m_dir):
            p = os.path.join(m_dir, entry)
            if os.path.isdir(p) and entry not in valid_music:
                shutil.rmtree(p, ignore_errors=True)
                print(f"🗑 Silinen müzik klasörü temizlendi: muzik/{entry}")

    # podcast
    valid_pods = {str(p.get("episodeNumber")) for p in SITE_DATA.get("podcasts", []) if p.get("episodeNumber")}
    valid_pods.update({p.get("slug") for p in SITE_DATA.get("podcasts", []) if p.get("slug")})
    p_dir = os.path.join(BASE_DIR, "bolum")
    if os.path.exists(p_dir):
        for entry in os.listdir(p_dir):
            p = os.path.join(p_dir, entry)
            if os.path.isdir(p) and entry not in valid_pods:
                shutil.rmtree(p, ignore_errors=True)
                print(f"🗑 Silinen podcast klasörü temizlendi: bolum/{entry}")

    # blog
    valid_blogs = {a.get("slug") for a in SITE_DATA.get("articles", []) if a.get("slug")}
    b_dir = os.path.join(BASE_DIR, "yazi")
    if os.path.exists(b_dir):
        for entry in os.listdir(b_dir):
            p = os.path.join(b_dir, entry)
            if os.path.isdir(p) and entry not in valid_blogs:
                shutil.rmtree(p, ignore_errors=True)
                print(f"🗑 Silinen blog klasörü temizlendi: yazi/{entry}")

    # kategori
    k_dir = os.path.join(BASE_DIR, "kategori")
    if os.path.exists(k_dir):
        valid_cats = {c.get("id") for c in SITE_DATA.get("categories", []) if c.get("id")}
        for cat_folder in os.listdir(k_dir):
            cat_path = os.path.join(k_dir, cat_folder)
            if os.path.isdir(cat_path):
                if cat_folder not in valid_cats:
                    shutil.rmtree(cat_path, ignore_errors=True)
                    print(f"🗑 Silinen kategori klasörü temizlendi: kategori/{cat_folder}")
                else:
                    valid_slugs = {str(item.get("slug") or item.get("episodeNumber", "") or item.get("id", "")) for item in SITE_DATA.get(cat_folder, [])}
                    for item_folder in os.listdir(cat_path):
                        item_path = os.path.join(cat_path, item_folder)
                        if os.path.isdir(item_path) and item_folder not in valid_slugs:
                            shutil.rmtree(item_path, ignore_errors=True)
                            print(f"🗑 Silinen kategori içerik klasörü temizlendi: kategori/{cat_folder}/{item_folder}")

def update_homepage_hero():
    index_file = os.path.join(BASE_DIR, "index.html")
    if not os.path.exists(index_file):
        return
    
    videos = SITE_DATA.get("videos", [])
    if not videos:
        return
    
    latest = videos[0]
    title = latest.get("title", "")
    slug = latest.get("slug", "")
    date = latest.get("date", "")
    desc = latest.get("description", "")
    cover = latest.get("cover", "")
    duration = latest.get("duration", "")
    target_url = latest.get("url", f"video/{slug}/index.html")
    
    with open(index_file, "r", encoding="utf-8") as f:
        html = f.read()

    hero_pattern = re.compile(r'(<header class="hero" id="heroSection">.*?</header>)', re.DOTALL)
    
    new_hero = f"""<header class="hero" id="heroSection">
      <div class="hero-bg-glow"></div>
      <div class="wrap">
        <div class="hero-grid">
          <div class="hero-content">
            <div class="hero-eyebrow" id="heroEyebrow">Son Video · {date}</div>
            <h1 class="hero-title" id="heroTitle">
              <a href="{target_url}" id="heroTitleLink">{title}</a>
            </h1>
            <p class="hero-desc" id="heroDesc">
              {desc}
            </p>
            <div class="hero-actions">
              <a href="{target_url}" class="btn-primary" id="btnHeroWatch">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>İzle ve Oku</span>
              </a>
            </div>
          </div>
          <div class="hero-media-wrap">
            <a href="{target_url}" class="hero-media-card" id="heroMediaLink">
              <img src="{cover}" alt="{title}" id="heroCoverImg" loading="eager" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900';">
              <div class="hero-media-overlay">
                <div class="hero-play-badge">▶</div>
              </div>
              <span class="hero-duration-badge" id="heroDuration">{duration}</span>
            </a>
          </div>
        </div>
      </div>
    </header>"""

    if hero_pattern.search(html):
        html = hero_pattern.sub(new_hero, html, count=1)
        with open(index_file, "w", encoding="utf-8") as f:
            f.write(html)
        print("✓ Anasayfa vitrini güncellendi: index.html")

def update_homepage_settings():
    index_file = os.path.join(BASE_DIR, "index.html")
    if not os.path.exists(index_file):
        return
    with open(index_file, "r", encoding="utf-8") as f:
        html = f.read()

    settings = SITE_DATA.get("settings", {})
    brand_name = settings.get("brandName", "AKCAN AKDAĞ")
    nav_labels = settings.get("navLabels", {})
    l_home = nav_labels.get("home", "Anasayfa")
    l_youtube = nav_labels.get("youtube", "Youtube")
    l_podcast = nav_labels.get("podcast", "Podcast")
    l_blog = nav_labels.get("blog", "Blog")
    l_music = nav_labels.get("music", "Şarkılar & Remixler")
    l_about = nav_labels.get("about", "Hakkında")

    custom_nav_links = ""
    custom_drawer_links = ""
    custom_filter_pills = ""
    for cat in SITE_DATA.get("categories", []):
        c_title = cat.get("title", "")
        c_id = cat.get("id", "")
        c_icon = cat.get("icon", "")
        icon_str = f"{c_icon} " if c_icon else ""
        c_count = len(SITE_DATA.get(c_id, []))
        if cat.get("showInNav") is not False:
            custom_nav_links += f'          <li><a href="#{c_id}" class="nav-link" data-nav="{c_id}">{icon_str}{c_title}</a></li>\n'
            custom_drawer_links += f'      <a href="#{c_id}" class="mobile-link" data-nav="{c_id}">{icon_str}{c_title}</a>\n'
        if cat.get("showInFeed") is not False:
            custom_filter_pills += f'            <button class="filter-pill" data-filter="{c_id}">{icon_str}{c_title} <span class="count">{c_count}</span></button>\n'

    footer_settings = settings.get("footer", {})
    footer_brand = footer_settings.get("brand", brand_name)
    footer_copy = footer_settings.get("copy", "© 2026 AKCAN AKDAĞ · Kültür, teknoloji ve zihin haritaları.")
    social_links = settings.get("socialLinks", [
        {"platform": "YouTube", "url": "https://youtube.com/akcanakdag"},
        {"platform": "Instagram", "url": "https://instagram.com/akcanakdag"},
        {"platform": "TikTok", "url": "https://www.tiktok.com/@akcanakdag"}
    ])

    brand_pattern = re.compile(r'(<a href="#anasayfa" class="brand" data-nav="anasayfa">)\s*.*?\s*(<span class="dot"></span>\s*</a>)', re.DOTALL)
    html = brand_pattern.sub(rf'\1\n        {brand_name} \2', html)

    nav_links_pattern = re.compile(r'(<ul class="nav-links">).*?(</ul>)', re.DOTALL)
    new_nav_links = f"""<ul class="nav-links">
          <li><a href="#anasayfa" class="nav-link active" data-nav="anasayfa">{l_home}</a></li>
          <li><a href="#youtube" class="nav-link" data-nav="youtube">{l_youtube}</a></li>
          <li><a href="#podcast" class="nav-link" data-nav="podcast">{l_podcast}</a></li>
          <li><a href="#blog" class="nav-link" data-nav="blog">{l_blog}</a></li>
          <li><a href="#sarkilar-remixler" class="nav-link" data-nav="sarkilar-remixler">{l_music}</a></li>
{custom_nav_links}          <li><a href="#hakkinda" class="nav-link" data-nav="hakkinda">{l_about}</a></li>
        </ul>"""
    html = nav_links_pattern.sub(new_nav_links, html)

    drawer_pattern = re.compile(r'(<div class="mobile-drawer-content">).*?(</div>)', re.DOTALL)
    new_drawer = f"""<div class="mobile-drawer-content">
      <a href="#anasayfa" class="mobile-link" data-nav="anasayfa">{l_home}</a>
      <a href="#youtube" class="mobile-link" data-nav="youtube">{l_youtube}</a>
      <a href="#podcast" class="mobile-link" data-nav="podcast">{l_podcast}</a>
      <a href="#blog" class="mobile-link" data-nav="blog">{l_blog}</a>
      <a href="#sarkilar-remixler" class="mobile-link" data-nav="sarkilar-remixler">{l_music}</a>
{custom_drawer_links}      <a href="#hakkinda" class="mobile-link" data-nav="hakkinda">{l_about}</a>
    </div>"""
    html = drawer_pattern.sub(new_drawer, html)

    filter_pattern = re.compile(r'(<div class="filter-pills" id="feedFilterPills">).*?(</div>)', re.DOTALL)
    new_filter = f"""<div class="filter-pills" id="feedFilterPills">
            <button class="filter-pill active" data-filter="all">Hepsi <span class="count" id="countAll">0</span></button>
            <button class="filter-pill" data-filter="youtube">{l_youtube} <span class="count" id="countYt">0</span></button>
            <button class="filter-pill" data-filter="podcast">{l_podcast} <span class="count" id="countPod">0</span></button>
            <button class="filter-pill" data-filter="blog">{l_blog} <span class="count" id="countBlog">0</span></button>
            <button class="filter-pill" data-filter="music">{l_music} <span class="count" id="countMusic">0</span></button>
{custom_filter_pills}          </div>"""
    html = filter_pattern.sub(new_filter, html)

    social_links_html = "\n".join([
        f'          <a href="{s.get("url", "#")}" target="_blank" rel="noopener" class="social-link">{s.get("platform", "")}</a>'
        for s in social_links if s.get("url") and s.get("platform")
    ])
    footer_pattern = re.compile(r'(<footer class="site-footer">).*?(</footer>)', re.DOTALL)
    new_footer = f"""<footer class="site-footer">
    <div class="wrap">
      <div class="footer-inner">
        <div class="footer-left">
          <span class="footer-brand">{footer_brand}</span>
          <p class="footer-copy">{footer_copy}</p>
        </div>

        <div class="footer-social">
{social_links_html}
        </div>
      </div>
    </div>
  </footer>"""
    html = footer_pattern.sub(new_footer, html)

    with open(index_file, "w", encoding="utf-8") as f:
        f.write(html)
    print("✓ Anasayfa ayarları güncellendi: index.html")

def update_homepage_about():
    index_file = os.path.join(BASE_DIR, "index.html")
    if not os.path.exists(index_file):
        return
    with open(index_file, "r", encoding="utf-8") as f:
        html = f.read()

    about_pattern = re.compile(r'(<div class="about-container">).*?(</div>\s*</div>\s*</section>)', re.DOTALL)
    new_about = render_about_container(depth=0)
    
    if about_pattern.search(html):
        html = about_pattern.sub(rf'{new_about}\n      </div>\n    </section>', html, count=1)
        with open(index_file, "w", encoding="utf-8") as f:
            f.write(html)
        print("✓ Anasayfa hakkında bölümü güncellendi: index.html")

prune_orphans()
update_homepage_hero()
update_homepage_settings()
update_homepage_about()

print(f"\nİşlem Tamamlandı! ({videos_count} video, {music_count} şarkı & remix, {podcasts_count} podcast, {articles_count} blog, {custom_items_count} özel kategori içeriği, 1 hakkında sayfası üretildi).")


