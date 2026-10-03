# Görsel ve Medya Klasör Rehberi — AKCAN AKDAĞ

Bu klasör, web sitesinde kullanacağınız tüm yerel kapak ve blog görsellerini organize etmek için hazırlanmıştır.

---

## 📁 Klasör Yapısı ve Kullanım Alanları

| Klasör Yolu | Açıklama | Önerilen Boyut / Oran | Format |
|---|---|---|---|
| `images/covers/video/` | YouTube videolarının kapak görselleri | 1280x720 veya 1920x1080 (16:9) | WebP / JPG |
| `images/covers/muzik/` | Şarkı & Remix kapak görselleri | 1280x720 (16:9) veya 1000x1000 (1:1) | WebP / JPG |
| `images/covers/podcast/` | Podcast bölümlerinin kare kapakları | 1000x1000 veya 1400x1400 (1:1) | WebP / JPG |
| `images/covers/blog/` | Blog yazılarının ana başlık/hero kapakları | 1200x675 (16:9) veya 1200x800 (3:2) | WebP / JPG |
| `images/blog/` | Blog yazılarının **içine** eklenecek görseller | Genişlik: 800px – 1000px | WebP / JPG / PNG |
| `images/author/` | AKCAN AKDAĞ yazar/profil fotoğrafları | 800x800 kare | WebP / JPG |

---

## 🚀 data.js İçinde Nasıl Kullanılır?

Resmi ilgili klasöre attıktan sonra (örneğin: `images/covers/blog/yapay-zeka.webp`), `data.js` dosyasındaki `"cover"` alanına dosya yolunu doğrudan yazın:

```javascript
{
  "id": "blog-1",
  "slug": "algoritmalarin-golgesinde-ozgun-kalabilmek",
  "title": "Algoritmaların Gölgesinde Özgün Kalabilmek",
  "cover": "images/covers/blog/yapay-zeka.webp",
  // ...
}
```

---

## ✍️ Blog Yazılarının İçine Görsel Nasıl Eklenir?

`data.js` içindeki `"content"` alanında, metnin arasına estetik ve açıklamalı bir görsel eklemek için:

```html
<p>Önceki paragraf metni...</p>

<figure>
  <img src="images/blog/diyagram-1.webp" alt="Yapay Zeka ve İnsan Düşüncesi Karşılaştırması">
  <figcaption>Şekil 1: Algoritma filtre balonu ve insan zihninin karar mekanizmaları.</figcaption>
</figure>

<p>Sonraki paragraf metni...</p>
```

Sitenin derleme motoru (`build.py`), alt sayfalardaki göreceli dosya yollarını (`../../images/...`) ve arama motorları için tam alan adı adreslerini (`https://akcanakdag.com/images/...`) **otomatik** olarak ayarlar.
