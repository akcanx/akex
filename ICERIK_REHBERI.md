# AKCAN AKDAĞ — İçerik Üretim ve Yönetim Kılavuzu

Bu kılavuz, web sitenizdeki 4 ana kategoriye (**YouTube**, **Podcast**, **Blog**, **Şarkılar & Remixler**) ve **Hakkında** sayfasına yeni içerik eklerken izlemeniz gereken tüm adımları, hazır şablonları ve SEO/GEO ipuçlarını içerir.

---

## ⚡ Genel İş Akışı (Özet)

Hangi kategoriye içerik eklerseniz ekleyin, süreç her zaman şu 3 adımdan ibarettir:

1. **Görselinizi Ekleyin:** Kapak veya blog içi görselinizi `images/` altındaki ilgili klasöre kopyalayın.
2. **data.js'e Ekleyin:** Aşağıdaki ilgili kategori şablonunu kopyalayıp [`data.js`](file:///Users/akcan/Desktop/Test%20Site/data.js) dosyasındaki listenin en üstüne yapıştırın ve bilgilerinizi yazın.
3. **Derleyin:**
   - **Mac kullanıcıları:** `Siteyi_Guncelle.command` dosyasına çift tıklayın (veya `python3 build.py`).
   - **Windows kullanıcıları:** `Siteyi_Guncelle.bat` dosyasına çift tıklayın (veya `python build.py`).
   *Bu komut; anasayfadaki akışı, sayaçları, manşet vitrinini günceller ve içeriğinizin SEO/GEO uyumlu bağımsız web sayfasını otomatik olarak üretir.*

---

## 1. 🎥 Kategori: YouTube Videoları

### 📁 Görsel Hazırlığı
- **Kayıt Yeri:** `images/covers/video/`
- **Format & Boyut:** WebP veya JPG, `1280x720` veya `1920x1080` (16:9 yatay).
- **Örnek Dosya Adı:** `images/covers/video/yapay-zeka-bilinc.webp`

### 📋 `data.js` -> `videos: [...]` Şablonu
[`data.js`](file:///Users/akcan/Desktop/Test%20Site/data.js) içinde `"videos": [` satırının hemen altına yeni video nesnenizi ekleyin:

```javascript
{
  "id": "yt-5",
  "slug": "yeni-video-basligi-slug",
  "url": "video/yeni-video-basligi-slug/index.html",
  "title": "Videonuzun Tam Başlığı",
  "date": "5 Ekim 2026",
  "duration": "16:40",
  "tags": ["Yapay Zeka", "Bilim", "Felsefe"],
  "cover": "images/covers/video/yeni-video.webp",
  "youtubeUrl": "https://www.youtube.com/embed/YOUTUBE_VIDEO_ID",
  "description": "Videonun YouTube açıklamasındaki 2-3 cümlelik editoryal özeti.",
  "transcript": [
    {
      "title": "1. Giriş: Konunun Temeli",
      "text": "Bu bölümde videoda konuştuğunuz giriş metninin dökümü yer alır."
    },
    {
      "title": "2. Gelişme: Ana Fikirler",
      "text": "Videonun detaylı argümanları ve anlatımları."
    },
    {
      "title": "3. Sonuç",
      "text": "Kapanış ve özet düşünceler."
    }
  ]
},
```

### 🔍 YouTube İçin SEO & GEO İpuçları
- **Transkript Bölümleri:** Videonuzun YouTube altyazısını veya metnini transkript dizisine eklemeniz, Google ve Yapay Zeka Arama Motorlarının (ChatGPT, Perplexity, Gemini) videonuzu kelime kelime indekslemesini sağlar.
- **Slug Belirleme:** Türkçe karakter içermeyen, küçük harfli ve tireli yazın (Örn: `turing-testi-ve-bilinc`).

---

## 2. 🎙️ Kategori: Podcast (Derin Odak)

### 📁 Görsel ve Ses Hazırlığı
- **Kapak Görseli:** `images/covers/podcast/`
- **Format & Boyut:** WebP veya JPG, `1000x1000` veya `1400x1400` (1:1 Kare).
- **Ses Dosyası:** Podcast hosting servisinizdeki doğrudan MP3 bağlantısı (Spotify, Apple Podcast, Anchor/RSS veya kendi sunucunuz).

### 📋 `data.js` -> `podcasts: [...]` Şablonu
[`data.js`](file:///Users/akcan/Desktop/Test%20Site/data.js) içinde `"podcasts": [` satırının altına ekleyin:

```javascript
{
  "id": "pod-49",
  "episodeNumber": 49,
  "slug": "49",
  "url": "bolum/49/index.html",
  "title": "Zihinsel Detoks ve Sessizlik Arayışı",
  "date": "3 Ekim 2026",
  "duration": "32 dk",
  "tags": ["Zihin", "Odaklanma", "Psikoloji"],
  "cover": "images/covers/podcast/bolum-49.webp",
  "audioUrl": "https://podcast-servisiniz.com/audio/bolum-49.mp3",
  "description": "Bölümün dinleyicilere ne vaat ettiğini anlatan vurucu açıklama paragrafı.",
  "transcript": [
    {
      "title": "Giriş: Sessizliğin Eksikliği",
      "text": "Podcast bölümünüzün ilk dakikalarındaki konuşma metni..."
    },
    {
      "title": "Modern Çağda Zihin Karmaşası",
      "text": "Bölümün gövde metni ve paylaşılan fikirler..."
    }
  ]
},
```

### 🔍 Podcast İçin SEO & GEO İpuçları
- Sitenin dahili HTML5 ses oynatıcısı doğrudan `audioUrl` dosyasını çalar.
- Sayfadaki "Transkripti Kopyala" butonu sayesinde araştırmacılar ve dinleyiciler bölüm metnini tek tıkla kopyalayabilir.

---

## 3. ✍️ Kategori: Blog (Haftalık Denemeler)

### 📁 Görsel Hazırlığı
- **Kapak Görseli:** `images/covers/blog/` (Boyut: `1200x675` veya `1200x800`).
- **Yazı İçi Görseller (İsteğe Bağlı):** `images/blog/` (Genişlik: `800px` - `1000px`).

### 📋 `data.js` -> `articles: [...]` Şablonu
[`data.js`](file:///Users/akcan/Desktop/Test%20Site/data.js) içinde `"articles": [` satırının altına ekleyin:

```javascript
{
  "id": "blog-53",
  "slug": "yavas-dusunmenin-gucu",
  "url": "yazi/yavas-dusunmenin-gucu/index.html",
  "weekNumber": 53,
  "title": "Yavaş Düşünmenin Gücü: Hıza Karşı Zihinsel Derinlik",
  "date": "4 Ekim 2026",
  "readTime": "6 dk okuma",
  "tags": ["Felsefe", "Öğrenme", "Üretkenlik"],
  "cover": "images/covers/blog/yavas-dusunmek.webp",
  "summary": "Anasayfa kartında ve arama motoru önizlemelerinde görünecek 1-2 cümlelik özet.",
  "content": "<p class=\"lead\">Yazının ilk vurgulu giriş paragrafı...</p><p>Gelişme paragrafı metinleri...</p><blockquote>\"Önemli bir alıntı cümlesi.\"</blockquote><h3>Ara Başlık</h3><p>Konunun detayları...</p><figure><img src=\"images/blog/sematik-cizim.webp\" alt=\"Açıklayıcı Görsel Metni\"><figcaption>Şekil 1: Düşünce haritası ve karar modelleri.</figcaption></figure><p>Kapanış ve sonuç paragrafı.</p>"
},
```

### 🔍 Blog İçin Tipografi ve Biçimlendirme Kuralları
- **İlk Paragraf:** `<p class="lead">...</p>` kullanarak editoryal büyük fontla başlatabilirsiniz.
- **Vurgulu Alıntılar:** `<blockquote>"..."</blockquote>` bloğu şık bir kenar çizgisiyle öne çıkar.
- **Yazı İçi Görseller:** `<figure><img src="images/blog/resim.webp" alt="..."><figcaption>Açıklama</figcaption></figure>` yapısını kullanın. `build.py` dosya yolunu alt sayfalara göre otomatik olarak `../../images/...` şeklinde düzeltir.

---

## 4. 🎹 Kategori: Şarkılar & Remixler

### 📁 Görsel ve YouTube Müzik Hazırlığı
- **Kapak Görseli:** `images/covers/muzik/`
- **Format & Boyut:** WebP veya JPG, `1280x720` (16:9) veya `1000x1000` (1:1 Kare).
- **YouTube Linkleri:** YouTube video oynatıcısı için Embed linki ve dinleyicileri yönlendirmek için YouTube Music URL'si.

### 📋 `data.js` -> `music: [...]` Şablonu
[`data.js`](file:///Users/akcan/Desktop/Test%20Site/data.js) içinde `"music": [` satırının altına ekleyin:

```javascript
{
  "id": "music-5",
  "slug": "gece-gezgini-synth-remix",
  "url": "muzik/gece-gezgini-synth-remix/index.html",
  "title": "Gece Gezgini (Retro Synthwave Remix)",
  "artist": "AKCAN AKDAĞ",
  "type": "Remix",
  "date": "2 Ekim 2026",
  "duration": "04:05",
  "tags": ["Synthwave", "Cyberpunk", "Elektronik"],
  "cover": "images/covers/muzik/gece-gezgini.webp",
  "youtubeUrl": "https://www.youtube.com/embed/YOUTUBE_VIDEO_ID",
  "youtubeMusicUrl": "https://music.youtube.com/watch?v=YOUTUBE_VIDEO_ID",
  "description": "Parçanın temasını, kullanılan enstrümanları ve hissettirdiği atmosferi anlatan açıklama.",
  "lyrics": [
    "Gece ışıkları altında analog basların yankısı",
    "Kayıp frekanslar ve retro melodiler",
    "Şehrin siluetinde kaybolan bir synth yolculuğu..."
  ],
  "credits": "Beste & Prodüksiyon: AKCAN AKDAĞ · YouTube Müzik Kanalı Özel Yayın"
},
```

### 🔍 Şarkılar & Remixler İçin SEO & GEO İpuçları
- `lyrics` dizisine parçanın sözlerini veya müzikal notlarını eklediğinizde, `build.py` bunu arama motorları için **`MusicRecording`** Schema.org etiketine doğrudan işler.
- Kullanıcılar tek tıkla hem YouTube videosunu izleyebilir hem de pembe renkli **YouTube Music** butonuyla parçayı mobil cihazlarında dinlemeye devam edebilir.

---

## 5. 👤 "Hakkında" Bölümünü Güncelleme

- **Fotoğrafınızı Değiştirmek İçin:** Portre fotoğrafınızı `images/author/akcan-akdag.webp` (veya `.jpg`) olarak kaydedin.
- **Metinleri Değiştirmek İçin:** 
  1. [`index.html`](file:///Users/akcan/Desktop/Test%20Site/index.html) içerisindeki `<section id="section-hakkinda">` bloğunda biyografi, ilkeler ve sosyal medya linklerinizi düzenleyin.
  2. [`build.py`](file:///Users/akcan/Desktop/Test%20Site/build.py) içindeki `about_html` şablonunu güncelleyip `python3 build.py` çalıştırın.

---

## ⚙️ Hızlı Kontrol Listesi (Yayın Öncesi)

- [ ] Görseller `images/` klasörüne yerleştirildi mi?
- [ ] `data.js` içinde JSON virgül hatası veya tırnak eksikliği var mı?
- [ ] `python3 build.py` komutu hatasız tamamlandı mı?
- [ ] `python3 -m http.server 8000` ile yerelde açıp kontrol ettiniz mi?
