# AKCAN AKDAĞ — Kişisel Web Sitesi (SEO & GEO Uyumlu)

Barış Özcan (`barisozcan.com`) web sitesinin editoryal tasarım dili, koyu teması, Fraunces tipografisi ve bilgi mimarisi referans alınarak **AKCAN AKDAĞ** için geliştirilmiş web sitesi.

---

## 🚀 SEO & GEO (Generative Engine Optimization) Mimarisi

Sitedeki hiçbir içerik geçici açılır pencere (popup/modal) arkasına hapsedilmemiştir. Her içeriğin kendine ait bağımsız bir URL'si, kalıcı sayfası ve arama motoru kimliği vardır:

1. **Benzersiz & Temiz URL Yapısı (Barış Özcan Formatı)**:
   * **Videolar:** `video/<slug>/index.html` (Örn: `video/yapay-zeka-gercekten-dusunebilir-mi/`)
   * **Şarkılar & Remixler:** `muzik/<slug>/index.html` (Örn: `muzik/gece-surusu-synthwave-remix/`)
   * **Podcast Bölümleri:** `bolum/<no>/index.html` (Örn: `bolum/48/`)
   * **Haftalık Blog Yazıları:** `yazi/<slug>/index.html` (Örn: `yazi/algoritmalarin-golgesinde-ozgun-kalabilmek/`)

2. **Arama Motorları ve Yapay Zeka İçin Tam Uyum (GEO & Knowledge Graph)**:
   * **Google, Bing & Yandex:** Her sayfa için özel `<title>`, zengin `<meta description>`, hedefli `<meta name="keywords">`, `canonical` ve OpenGraph/Twitter Cards etiketleri.
   * **Yapay Zeka Arama Motorları (ChatGPT Search, Perplexity, Gemini):**
     * **Schema.org JSON-LD `@graph`**: `WebSite`, `Person` (bilgi ve uzmanlık alanları `knowsAbout`), `VideoObject`, `MusicRecording`, `PodcastEpisode`, `BlogPosting` ve `BreadcrumbList`.
     * **Görünmez FAQPage Şeması**: Sitede görsel karmaşa yaratmadan, yapay zekaların soru-cevap sorgularında doğrudan sizi referans göstermesini sağlayan semantik SSS veri mimarisi.
     * **Tam Metin Dökümler & Transkriptler**: Botlar içeriğinizi eksiksiz indeksler.

3. **Otomatik Kronolojik Anasayfa Akışı**:
   * Hangi türde içerik eklerseniz ekleyin (video, şarkı/remix, podcast, blog), en son yayınlanan içerik otomatik olarak anasayfanın en tepesindeki **Manşet Vitrinine (Hero)** ve **Akış'ın 1. sırasına** yerleşir.

---

## 📂 Dosya ve Klasör Düzeni

```text
Test Site/
├── index.html                               # Anasayfa (Akış, 6 Sekme & Arama)
├── style.css                                # Fraunces tipografisi & koyu tema
├── data.js                                  # Merkezi içerik veri tabanı (Video, Müzik, Podcast, Blog)
├── app.js                                   # Akıllı sıralama, sekme ve arama motoru
├── build.py                                 # Sayfa üreticisi (SEO / GEO Builder)
│
├── hakkinda/                                # Hakkında sayfası (ProfilePage / Person Graph)
│   └── index.html
│
├── images/                                  # Yerel görseller ve kapak dizinleri
│   ├── author/                              # Profil / Yazar fotoğrafları
│   ├── covers/                              # Video, müzik, podcast, blog kapakları
│   └── blog/                                # Blog yazısı içi görseller
│
├── video/                                   # YouTube video sayfaları
│   ├── yapay-zeka-gercekten-dusunebilir-mi/
│   ├── kozmik-sessizlik-fermi-paradoksu/
│   ├── zaman-neden-tek-yone-akar/
│   └── bos-bir-oda-neden-hepimizi-korkutur/
│
├── muzik/                                   # Şarkılar & Remixler sayfaları
│   ├── gece-surusu-synthwave-remix/
│   ├── kozmik-yanki-lofi-remix/
│   ├── yildiz-tozu-original-mix/
│   └── zaman-kirilmasi-cinematic-remix/
│
├── bolum/                                   # Podcast bölümleri
│   ├── 48/
│   ├── 47/
│   └── 46/
│
└── yazi/                                    # Haftalık blog yazıları
    ├── algoritmalarin-golgesinde-ozgun-kalabilmek/
    ├── kitap-okuma-hizi-degil-dusunme-derinligi/
    └── yapay-zeka-caginda-kusurlarimiz/
```

---

## 🎨 İçerik Yönetim Paneli (Görsel CMS Uygulaması)

`data.js` dosyasıyla elle uğraşmak istemiyorsanız, projenize entegre edilmiş şık ve modern web yönetim panelini kullanabilirsiniz:

* **Mac'te Başlatmak İçin:** `Yonetim_Paneli.command` dosyasına çift tıklayın.
* **Windows'ta Başlatmak İçin:** `Yonetim_Paneli.bat` dosyasına çift tıklayın.
* **Terminalden Başlatmak İçin:** `python3 admin_server.py` çalıştırın.

Tarayıcınızda açılan panel üzerinden:
- YouTube videoları, podcastler, blog yazıları ve şarkı/remixler ekleyebilir/düzenleyebilirsiniz.
- Görselleri sürükleyip bırakarak yükleyebilirsiniz.
- Transkript ve şarkı sözlerini blok blok yönetebilirsiniz.
- **"Kaydet & Yayınla"** butonuna bastığınız anda hem veriler kaydedilir hem de tüm sayfalar otomatik olarak derlenir!

---

## ⚡ Manuel Olarak Sayfaları Derlemek İsterseniz:
* **Mac'te:** `Siteyi_Guncelle.command` dosyasına çift tıklayın.
* **Windows'ta:** `Siteyi_Guncelle.bat` dosyasına çift tıklayın.
* **Terminalden:** `python3 build.py` çalıştırın.

---

## 📱 Sosyal Medya Bağlantıları

Sitede aktif olarak yer alan resmi profiller:
* **YouTube:** [youtube.com/akcanakdag](https://www.youtube.com/akcanakdag)
* **Instagram:** [instagram.com/akcanakdag](https://www.instagram.com/akcanakdag)
* **TikTok:** [tiktok.com/@akcanakdag](https://www.tiktok.com/@akcanakdag)

---

## 🌐 Yerel Sunucuyu Başlatmak

Terminalde:
```bash
python3 -m http.server 8000
```
Tarayıcınızdan: `http://localhost:8000`

