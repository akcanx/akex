# 📖 AKCAN AKDAĞ WEB SİTESİ & CMS KULLANICI KILAVUZU

Bu kılavuz, **AKCAN AKDAĞ** resmi web sitesinin mimarisini, İçerik Yönetim Paneli'nin (CMS) kullanımını ve sitenin nasıl güncellenip yayınlanacağını adım adım açıklamaktadır.

---

## 🏛️ 1. Sistemin Çalışma Mantığı (Mimari Özet)

Siteniz modern bir **Jamstack / SSG (Statik Site Üretimi)** mimarisine sahiptir:
1. **Veri tabanı (`data.js`):** Sitedeki tüm videolar, şarkılar/remixler, podcastler, blog yazıları ve yazar bilgileri bu tek dosyada saklanır.
2. **Yönetim Paneli (`panel.html` & `admin_server.py`):** Kodlarla uğraşmadan tüm içerikleri kolayca eklemenizi, düzenlemenizi, YouTube linklerini çözmenizi ve kapak yüklemenizi sağlayan arayüzdür.
3. **Statik Üretici (`build.py`):** `data.js` dosyasını okuyarak her içerik için SEO ve yapay zeka (GEO) uyumlu fiziksel HTML sayfaları üretir (`video/.../index.html`, `muzik/.../index.html` vb.) ve anasayfa vitrinini günceller.
4. **Anasayfa (`index.html` & `app.js`):** En son eklenen içeriği otomatik olarak en üstteki **Manşet Vitrini (Hero)** alanına taşır ve akışta kronolojik olarak sıralar.

---

## 🚀 2. Yönetim Panelini Başlatma

### Mac Kullanıcıları İçin:
* Proje klasöründeki [**`Yonetim_Paneli.command`**](file:///Users/akcan/Desktop/Test%20Site/Yonetim_Paneli.command) dosyasına **çift tıklayın**.
* Terminal açılacak, sunucuyu güvenli **8080** portunda başlatacak ve tarayıcınızda yönetim panelini otomatik açacaktır:  
  👉 `http://localhost:8080/panel.html`

### Windows Kullanıcıları İçin:
* [**`Yonetim_Paneli.bat`**](file:///Users/akcan/Desktop/Test%20Site/Yonetim_Paneli.bat) dosyasına **çift tıklayın**.

> **İpucu:** Panelle işiniz bittiğinde açık olan Terminal veya Komut İstemi penceresini kapatmanız yeterlidir.

---

## ✍️ 3. Yeni İçerik Ekleme ve Düzenleme

### Adım 1: Kategori Seçimi
Panel açıldığında sol menüden veya üstteki 4 butonluk kategori seçiciden eklemek istediğiniz türü seçin:
* 🎥 **YouTube Videosu** (Belgesel, Felsefe, Teknoloji)
* 🎹 **Şarkılar & Remixler** (Synthwave, Lo-Fi, Orijinal Parça)
* 🎙️ **Podcast Bölümü** (Derin Odak Serisi)
* ✍️ **Blog Yazısı** (Haftalık Deneme)

---

### Adım 2: YouTube Video Linki ve Kapak Resmi Sistemi
* **YouTube Linki:** YouTube'dan linki nasıl kopyalarsanız kopyalayın (`watch?v=...`, `youtu.be/...`, `shorts/...` veya YouTube'un embed/iframe kodunun tamamı dahi olsa) forma yapıştırın. Sistem bunu anında standart video formatına çevirir.
* **Canlı Oynatıcı:** Linki yapıştırdığınız anda formun altında **16:9 Canlı YouTube Önizleme Oynatıcısı** açılır. Videonun doğru olduğunu formdan çıkmadan izleyebilirsiniz.
* **Akıllı Kapak Resmi Çekme:**
  * Link yapıştırıldığında sistem videonun kapak resmini otomatik olarak YouTube'dan çekip sitenizin kendi `images/covers/video/` klasörüne kaydeder.
  * İsterseniz **"🖼️ Kapak Resmini YouTube'dan Al"** butonuna basarak manuel olarak da çekebilirsiniz.
  * İsterseniz bilgisayarınızdan özel bir görseli kutuya sürükleyip bırakabilirsiniz.

---

### Adım 3: Transkript ve Bölüm Dökümleri
* Videolar ve podcastler için **"+ Yeni Konuşma Bölümü Ekle"** butonuna basarak bölüm başlıklarını ve konuşma metinlerini blok blok ekleyebilirsiniz.
* Bu transkriptler Google ve yapay zeka arama motorları (Perplexity, ChatGPT) tarafından sitenizin en üst sıralara çıkması için otomatik indekslenir.

---

### Adım 4: Kaydetme & Otomatik Yayınlama
* Formun altındaki **"💾 Kaydet & Siteyi Güncelle"** (veya üst sağdaki **"💾 Kaydet & Yayınla"**) butonuna tıklayın.
* **Ne Olur?**
  1. Veriler `data.js` dosyasına güvenle yazılır.
  2. Eski dosyanız `backups/data.backup.js` klasörüne otomatik yedeklenir.
  3. Arka planda `build.py` çalışarak yeni içeriğin bağımsız web sayfasını üretir ve anasayfayı günceller.
  4. Ekranda yeşil bildirim çıktığında işleminiz tamamlanmıştır!

---

## ⚙️ 4. Site, Marka, Menü ve Sosyal Medya Ayarlarını Özelleştirme

Yönetim Panelinin sol menüsündeki **"SAYFALAR & AYARLAR"** altındaki **"⚙️ Site & Marka Ayarları"** sekmesine tıklayarak tüm siteyi kendinize göre özelleştirebilirsiniz:

1. **Marka & Başlık:**
   * **Üst Bant Marka Yazısı:** Sitenin sol üst köşesindeki logo ve marka ismini (örn. "AKCAN AKDAĞ") dilediğiniz gibi değiştirebilirsiniz. Değişiklik anında hem anasayfaya hem de tüm alt sayfalara yansır.
2. **Kategori & Menü Sekme İsimleri:**
   * Navigasyon çubuğunda ve anasayfa filtrelerinde yer alan sekme isimlerini dilediğiniz gibi güncelleyebilirsiniz:
     * *Anasayfa*
     * *YouTube* (örn: Videolar, Belgeseller)
     * *Podcast* (örn: Sesli Denemeler, Yayınlar)
     * *Blog* (örn: Yazılar, Notlar)
     * *Şarkılar & Remixler* (örn: Müzik, Parçalar)
     * *Hakkında* (örn: Biyografi, Kimdir)
3. **Alt Bant (Footer) Metinleri:**
   * **Footer Marka İsmi:** Sayfa altındaki isim/marka yazısı.
   * **Telif & Slogan:** En altta görünen telif ve manifesto metnini (örn. `© 2026 AKCAN AKDAĞ · Kültür, teknoloji ve zihin haritaları.`) tek tıkla değiştirebilirsiniz.
4. **Sosyal Medya Bağlantıları:**
   * Alt bantta yer alan sosyal medya butonlarını yönetebilirsiniz.
   * YouTube, Instagram, TikTok, X (Twitter), Spotify, LinkedIn vb. platform isimlerini ve profil linklerinizi düzenleyebilir, istemediklerinizi silebilir veya **"+ Yeni Hesap Ekle"** butonuyla yenilerini ekleyebilirsiniz.
5. **Kaydetme:**
   * Formun altındaki **"💾 Site Ayarlarını Kaydet & Yayınla"** butonuna tıkladığınızda tüm sayfalar ve anasayfa otomatik olarak yeni ayarlarınızla baştan derlenir.

---

## 👤 5. "Hakkında" Sekmesini ve Sayfasını Özelleştirme

Yönetim Panelinin sol menüsündeki **"SAYFALAR & AYARLAR"** altındaki **"👤 Hakkında & Profil"** sekmesine tıklayarak hem anasayfadaki "Hakkımda" sekmesini hem de bağımsız `hakkinda/index.html` sayfasını A'dan Z'ye değiştirebilirsiniz:

1. **Profil & Giriş Kartı:**
   * **Profil Fotoğrafı / Avatar:** Yeni profil fotoğrafınızı bilgisayarınızdan sürükleyip bırakabilir veya görsel dosya yolu girebilirsiniz.
   * **Yazar Adı:** Adınız ve imzanız.
   * **Unvan / Rozet:** İsmin hemen üzerinde yer alan büyük harfli etiket (örn. `YAZAR · ANLATICI · DİJİTAL DÜŞÜNÜR`).
   * **Manifesto & Slogan:** Profil kartında tırnak içinde yer alan vurucu giriş cümleniz.
2. **Hikâye & "Ben Kimim?" Bloğu:**
   * **Bölüm Başlığı:** Dilediğiniz başlığı yazabilirsiniz (örn. *Ben Kimim?*, *Hikâyem*, *Yolculuk*).
   * **Biyografi Metni:** Dilediğiniz uzunlukta paragraflar halinde kendi hikâyenizi, felsefenizi ve vizyonunuzu yazabilirsiniz.
3. **"Neler Üretiyorum?" (Üretim Alanları):**
   * Ürettiğiniz içerik türlerini tanıtan kart bloklarıdır.
   * Her kart için dilediğiniz **ikonu** (🎥, 🎙️, ✍️, 🎹), **başlığı** ve **açıklamayı** düzenleyebilir; istemediklerinizi silebilir veya **"+ Yeni Alan Ekle"** ile yenilerini ekleyebilirsiniz.
4. **"Üretim İlkelerim & Felsefe":**
   * Üretim yaparken benimsediğiniz değer ve prensipleri maddeler halinde listeler.
   * İstediğiniz ilkeleri silebilir, değiştirebilir veya **"+ Yeni İlke Ekle"** butonuyla yenilerini ekleyebilirsiniz.
5. **İletişim & İş Birlikleri:**
   * Sayfa altındaki iş birliği daveti kutusunun başlığını, açıklamasını ve isteğe bağlı e-posta adresinizi belirleyebilirsiniz.
6. **Kaydetme:**
   * Formun altındaki **"💾 Hakkında Bilgilerini Kaydet & Yayınla"** butonuna bastığınızda hem anasayfadaki sekme hem de bağımsız `hakkinda/index.html` sayfası otomatik güncellenir.

---

## ⚡ 6. Manuel Olarak Siteyi Derleme

Eğer yönetim paneline girmeden elinizdeki dosyaları veya şablonları doğrudan derlemek isterseniz:
* **Mac'te:** [**`Siteyi_Guncelle.command`**](file:///Users/akcan/Desktop/Test%20Site/Siteyi_Guncelle.command) dosyasına çift tıklayın.
* **Windows'ta:** [**`Siteyi_Guncelle.bat`**](file:///Users/akcan/Desktop/Test%20Site/Siteyi_Guncelle.bat) dosyasına çift tıklayın.

Bu işlem saniyeler içinde tüm HTML sayfalarını baştan üretir ve anasayfa vitrinini en son içeriğinizle senkronize eder.

---

## 🌟 7. Anasayfa ve Manşet Vitrini (Hero) Nasıl Çalışır?

1. **Öne Çıkan Manşet Vitrini (Hero):**  
   Anasayfanın en üstünde yer alan büyük karşılama alanıdır. Hangi kategoriden olursa olsun eklediğiniz **en yeni içerik** buraya yerleşir:
   * Sol tarafta: Başlık, yayın tarihi, kısa özet ve "İzle ve Oku" butonu.
   * Sağ tarafta: Videonun yüksek kaliteli **kapak görseli**, üzerine gelindiğinde parlayan **oynatma butonu (▶)** ve **video süresi rozeti**.
   * Tıklandığında doğrudan ilgili içeriğin detay sayfasına gider.

2. **Birleşik Akış (Feed):**  
   Manşetin altındaki akışta tüm içerikleriniz tarihe göre en yeniden eskiye sıralanır. Ziyaretçiler "Hepsi", "Youtube", "Podcast", "Blog", "Şarkılar & Remixler" hap filtre butonlarına tıklayarak istedikleri kategoriyi süzebilir.

3. **Kırık Görsel Koruması:**  
   Sitedeki tüm görsel öğeleri akıllı hata yakalayıcı (`onerror`) ile korunmaktadır. İnternet kesintisi veya harici link sorunlarında dahi hiçbir görsel kırık/boş görünmez.

---

## 🌐 8. Canlıya Alma (Hosting & Yayınlama)

Siteniz tamamen statik dosyalardan (HTML, CSS, JS, Görseller) oluştuğu için dilediğiniz sunucuda 0 maliyetle veya kendi alan adınızla barındırılabilir:
* **GitHub Pages:** Proje klasörünü bir Git reposuna yükleyip Ayarlar -> Pages sekmesinden yayınlayabilirsiniz.
* **Netlify / Vercel / Cloudflare Pages:** Proje klasörünü sürükleyip bırakarak saniyeler içinde SSL sertifikalı olarak yayına alabilirsiniz.
* **Klasik cPanel / FTP:** Proje klasöründeki tüm dosyaları sunucunuzun `public_html/` dizinine yüklemeniz yeterlidir.

---

## 🗂️ 9. Yeni Kategori Ekleme ve Özel Kategori Yönetimi

Sitenizi varsayılan kategorilerle (YouTube, Podcast, Blog, Şarkılar) sınırlı kalmadan dilediğiniz gibi genişletebilirsiniz:

1. **Yeni Kategori Oluşturma:**
   * Yönetim Panelinin sol menüsünde **KATEGORİLER** başlığı altındaki **"＋ Yeni Kategori Ekle"** butonuna tıklayın.
   * **Kategori Adı:** Kategorinize bir isim verin (Örn: *Kitap İncelemeleri*, *Projeler*, *Fotoğraf Notları*, *Teknoloji Rehberleri*).
   * **Kategori Kodu (Slug):** URL adresinde kullanılacak benzersiz kod siz yazdıkça otomatik oluşur (Örn: `kitaplar`).
   * **Kategori İkonu:** Hızlı emoji seçiciden bir emoji seçin veya klavyenizden dilediğiniz simgeyi girin (📚, 💡, 🎬, 📸 vb.).
   * **Kısa Tanıtım / Alt Başlık:** Menülerde ve kartlarda görünecek kısa açıklama.
   * **İçerik Şablonu / Formatı:** Bu kategorideki içeriklerin türünü seçin:
     * *Makale / Yazı Formatı* (Zengin metin, özet, okuma süresi)
     * *Video Formatı* (YouTube video linki & transkript)
     * *Podcast / Ses Formatı* (Ses dosyası linki & bölüm süresi)
     * *Müzik / Parça Formatı* (Şarkı & liner notları)
     * *Standart İçerik* (Kapak görseli, editoryal açıklama ve metin)
   * **Görünürlük Tercihleri:**
     * Üst Menüde Göster (Navbar ve Mobil Çekmece)
     * Ana Sayfa Akış Filtrelerinde Göster (Kategori Butonları)
   * **"💾 Kategoriyi Kaydet"** butonuna tıkladığınızda yeni kategoriniz anında sisteme eklenir ve siteye yansır.

2. **Özel Kategori İçeriklerini Yönetme:**
   * Sol menüde oluşturduğunuz özel kategorinin adına tıklayarak o kategoriye ait içerik listesini görebilirsiniz.
   * Sağdaki **"Düzenle (✏️)"** butonuyla kategori adını veya ikonunu güncelleyebilir, **"Sil (🗑️)"** butonuyla kaldırabilirsiniz.
   * Yeni içerik eklerken kategori butonlarından oluşturduğunuz özel kategoriyi seçerek içeriklerinizi yayınlayabilirsiniz.
   * Eklediğiniz içerikler için otomatik olarak `kategori/<kategori-kodu>/<icerik-kodu>/index.html` şeklinde bağımsız sayfalar üretilir.

---

## 📱 10. Mobil Önizleme & Cihaz Simülatörü

Web sitenizin cep telefonlarında ve tabletlerde nasıl göründüğünü panelden çıkmadan canlı olarak test edebilirsiniz:

1. **Önizlemeyi Başlatma:**
   * Yönetim panelinin üst sağ çubuğundaki veya sol menü altındaki **"📱 Mobil Önizleme"** butonuna tıklayın.
   * Gerçekçi bir akıllı telefon çerçevesi ve Dynamic Island çentiği ile önizleme ekranı açılacaktır.

2. **Cihaz Boyutları ve Ekranlar:**
   * **iPhone (390px):** Standart iPhone 14/15/16 Pro görünümü.
   * **Kompakt (375px):** iPhone SE ve küçük ekranlı Android cihazlar.
   * **Büyük (430px):** iPhone Pro Max ve büyük ekranlı Android telefonlar.
   * **Tablet (768px):** iPad ve tablet yatay/dikey geniş ekran görünümü.

3. **Ekranı Döndürme (🔄 Döndür):**
   * Üst araç çubuğundaki **"🔄 Döndür"** butonuna tıklayarak cihazı anında **Dikey (Portrait)** ve **Yatay (Landscape)** modlar arasında çevirebilirsiniz.

4. **Sayfa Seçici (Dropdown):**
   * Önizleme çubuğundaki sayfa menüsünden anasayfayı, bölümleri (YouTube, Podcast, Blog, Şarkılar, Özel Kategoriler), Hakkında sayfasını veya en son yayınladığınız içeriklerin detay sayfalarını seçerek doğrudan simülatör içinde gezinebilirsiniz.

5. **Yenileme & Kapatma:**
   * **"⚡ Yenile"** butonuyla sayfayı anında tazeleyebilirsiniz.
   * **"↗ Yeni Sekme"** ile sayfayı tam boyutta tarayıcıda açabilirsiniz.
   * Sağ üstteki **"✕"** butonu veya klavyenizdeki **`ESC`** tuşu ile önizlemeyi istediğiniz an kapatabilirsiniz.

