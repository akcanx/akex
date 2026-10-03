// ==========================================================================
// AKCAN AKDAĞ — CMS PANEL İSTEMCİ MOTORU (panel.js)
// Hatasız Form Doğrulama, Akıllı YouTube Kapak Çekici & Canlı Medya Oynatıcıları
// ==========================================================================

let appData = null;
let currentView = 'form';
let currentCategory = 'videos';
let editingId = null;
let deleteTarget = null;
let isSlugManual = false;

const trMonths = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

function getTodayFormatted() {
  const now = new Date();
  return `${now.getDate()} ${trMonths[now.getMonth()]} ${now.getFullYear()}`;
}

function turkishSlugify(text) {
  if (!text) return '';
  const trMap = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
  };
  let str = text.trim();
  for (const [key, val] of Object.entries(trMap)) {
    str = str.replace(new RegExp(key, 'g'), val);
  }
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// --------------------------------------------------------------------------
// YOUTUBE & MEDYA AYRIŞTIRICILARI (HER TÜRLÜ LİNK VE IFRAME DESTEĞİ)
// --------------------------------------------------------------------------
function extractYoutubeId(input) {
  if (!input) return '';
  let str = String(input).trim();
  
  // 1. Iframe kodundan src ayıkla
  const iframeMatch = str.match(/src=["'](.*?)["']/i);
  if (iframeMatch) {
    str = iframeMatch[1];
  }
  
  // 2. URL parametrelerinden v= veya vi= yakala
  const vParamMatch = str.match(/[?&](?:v|vi)=([a-zA-Z0-9_-]{11})/i);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }

  // 3. youtu.be, embed, shorts, live yollarını yakala
  const pathMatch = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed|shorts|live|v)\/)([a-zA-Z0-9_-]{11})/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // 4. Genel standart desen
  const generalMatch = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (generalMatch && generalMatch[1]) {
    return generalMatch[1];
  }
  
  // 5. Doğrudan 11 karakterli ID girilmişse
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  return '';
}

function cleanYoutubeUrl(input) {
  const id = extractYoutubeId(input);
  if (id) {
    return `https://www.youtube.com/embed/${id}`;
  }
  if (String(input).trim().startsWith('https://www.youtube.com/embed/')) {
    return String(input).trim();
  }
  return String(input).trim();
}

function cleanYoutubeMusicUrl(input) {
  const id = extractYoutubeId(input);
  if (id) {
    return `https://music.youtube.com/watch?v=${id}`;
  }
  return String(input).trim();
}

// --------------------------------------------------------------------------
// YOUTUBE KAPAK RESMİ BULUCU (ÇOK KADEMELİ AKILLI ÇÖZÜCÜ)
// --------------------------------------------------------------------------
function detectBestYoutubeThumbnail(videoId, callback) {
  if (!videoId) return;
  const qualities = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  ];
  let idx = 0;

  function checkNext() {
    if (idx >= qualities.length) {
      callback(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
      return;
    }
    const testUrl = qualities[idx];
    const testImg = new Image();
    testImg.onload = function() {
      // YouTube maxresdefault yoksa 120x90 piksel döner
      if (testImg.naturalWidth && testImg.naturalWidth > 120) {
        callback(testUrl);
      } else {
        idx++;
        checkNext();
      }
    };
    testImg.onerror = function() {
      idx++;
      checkNext();
    };
    testImg.src = testUrl;
  }

  checkNext();
}

async function fetchAndSetYoutubeThumbnail(videoId, category = 'videos', force = false) {
  if (!videoId) return;
  const coverInput = document.getElementById('inpCover');
  
  // Eğer kullanıcı zaten özel bir yerel görsel yüklemişse ve zorla çekilmiyorsa ezme
  if (!force && coverInput.value.trim() && 
      !coverInput.value.includes('youtube') && 
      !coverInput.value.includes('ytimg') && 
      !coverInput.value.startsWith('images/covers/video/yt-') &&
      !coverInput.value.startsWith('images/covers/muzik/yt-')) {
    return;
  }

  const btnId = (category === 'music') ? 'btnFetchMusicThumb' : 'btnFetchYtThumb';
  const thumbBtn = document.getElementById(btnId);
  const originalText = thumbBtn ? thumbBtn.textContent : '';
  if (thumbBtn) {
    thumbBtn.textContent = '⏳ İndiriliyor...';
    thumbBtn.disabled = true;
  }

  // 1. Önce sunucu üzerinden projeye doğrudan indirmeyi dene
  try {
    if (window.location.protocol !== 'file:') {
      const res = await fetch('/api/fetch-youtube-thumb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, category })
      });
      const result = await res.json();
      if (result.success && result.path) {
        coverInput.value = result.path;
        updateCoverPreview(result.path);
        showToast('✓ Kapak görseli YouTube\'dan indirildi ve projeye kaydedildi!', 'success');
        if (thumbBtn) {
          thumbBtn.textContent = originalText;
          thumbBtn.disabled = false;
        }
        return;
      }
    }
  } catch (err) {
    console.warn('Sunucu üzerinden kapak indirilemedi, tarayıcıdan deneniyor:', err);
  }

  // 2. Sunucu indiremediyse veya file:// modundaysa tarayıcıdan en yüksek çözünürlüğü tespit et
  detectBestYoutubeThumbnail(videoId, (workingUrl) => {
    coverInput.value = workingUrl;
    updateCoverPreview(workingUrl);
    showToast('✓ Kapak resmi YouTube küçük resmi olarak ayarlandı!', 'success');
    if (thumbBtn) {
      thumbBtn.textContent = originalText;
      thumbBtn.disabled = false;
    }
  });
}

// --------------------------------------------------------------------------
// 1. VERİLERİ YÜKLE
// --------------------------------------------------------------------------
async function loadData() {
  if (window.location.protocol === 'file:') {
    showToast('⚠️ Panel "file://" olarak açıldı. Kayıt ve derleme yapabilmek için lütfen "Yonetim_Paneli.command" (Mac) veya "Yonetim_Paneli.bat" (Windows) ile açın!', 'error');
    if (typeof siteData !== 'undefined') {
      appData = JSON.parse(JSON.stringify(siteData));
      updateCounters();
      if (currentView === 'list') renderList();
    }
    return;
  }
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Veri çekilemedi');
    appData = await res.json();
    updateCounters();
    if (currentView === 'list') renderList();
  } catch (err) {
    const errMsg = err.message || 'Sunucuya bağlanılamadı';
    showToast('Sunucuya bağlanılamadı: ' + errMsg, 'error');
  }
}

function updateCounters() {
  if (!appData) return;
  if (!appData.categories) appData.categories = [];
  document.getElementById('countNavYt').textContent = appData.videos?.length || 0;
  document.getElementById('countNavMusic').textContent = appData.music?.length || 0;
  document.getElementById('countNavPod').textContent = appData.podcasts?.length || 0;
  document.getElementById('countNavBlog').textContent = appData.articles?.length || 0;

  renderCategoriesInPanel();
}

function renderCategoriesInPanel() {
  if (!appData) return;
  if (!appData.categories) appData.categories = [];

  const container = document.getElementById('customNavCategories');
  if (container) {
    container.innerHTML = '';
    appData.categories.forEach(cat => {
      const count = appData[cat.id]?.length || 0;
      const navItem = document.createElement('div');
      navItem.className = 'custom-nav-item-wrap';
      const isActive = currentCategory === cat.id && currentView === 'list';
      navItem.innerHTML = `
        <a class="nav-item ${isActive ? 'active' : ''}" data-cat-id="${cat.id}">
          <div class="nav-item-left">
            <span class="nav-icon">${cat.icon || '📁'}</span>
            <span>${escapeHtml(cat.title)}</span>
          </div>
          <span class="nav-counter">${count}</span>
        </a>
        <div class="custom-cat-actions">
          <button type="button" class="btn-cat-action" title="Kategoriyi Düzenle" data-edit-cat="${cat.id}">✏️</button>
          <button type="button" class="btn-cat-action text-danger" title="Kategoriyi Sil" data-del-cat="${cat.id}">🗑️</button>
        </div>
      `;
      navItem.querySelector('.nav-item').addEventListener('click', () => {
        switchView('list', cat.id);
      });
      navItem.querySelector('[data-edit-cat]').addEventListener('click', (e) => {
        e.stopPropagation();
        editCategory(cat.id);
      });
      navItem.querySelector('[data-del-cat]').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCategoryPrompt(cat.id);
      });
      container.appendChild(navItem);
    });
  }

  renderCatPickerButtons();
}

function renderCatPickerButtons() {
  const catPicker = document.getElementById('catPicker');
  if (!catPicker) return;

  catPicker.querySelectorAll('.cat-picker-btn.custom-picker-btn').forEach(el => el.remove());

  (appData?.categories || []).forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cat-picker-btn custom-picker-btn ${currentCategory === cat.id ? 'active' : ''}`;
    btn.dataset.cat = cat.id;
    btn.innerHTML = `
      <span class="cat-picker-icon">${cat.icon || '📁'}</span>
      <div class="cat-picker-text">
        <h4>${escapeHtml(cat.title)}</h4>
        <p>${escapeHtml(cat.subtitle || 'Özel Kategori')}</p>
      </div>
    `;
    btn.addEventListener('click', () => {
      setFormCategory(cat.id);
    });
    catPicker.appendChild(btn);
  });
}

// --------------------------------------------------------------------------
// 2. GÖRÜNÜM YÖNETİMİ (VIEWS)
// --------------------------------------------------------------------------
function switchView(view, category = null, mode = 'new') {
  currentView = view;
  
  // Mobil sidebar açıksa kapat
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && sidebar.classList.contains('mobile-expanded')) {
    sidebar.classList.remove('mobile-expanded');
  }

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  
  const viewForm = document.getElementById('viewForm');
  const viewList = document.getElementById('viewList');
  const viewAbout = document.getElementById('viewAbout');
  const viewSettings = document.getElementById('viewSettings');
  const pageTitle = document.getElementById('pageTitle');

  viewForm.style.display = 'none';
  viewList.style.display = 'none';
  viewAbout.style.display = 'none';
  if (viewSettings) viewSettings.style.display = 'none';

  if (view === 'form') {
    viewForm.style.display = 'block';
    if (category) setFormCategory(category);
    if (mode === 'new') {
      resetForm();
      pageTitle.textContent = 'Yeni İçerik Ekle';
      document.getElementById('navNew').classList.add('active');
    }
  } else if (view === 'list') {
    viewList.style.display = 'block';
    currentCategory = category || 'videos';
    const catLabels = {
      videos: 'YouTube Videoları',
      music: 'Şarkılar & Remixler',
      podcasts: 'Podcast Bölümleri',
      articles: 'Blog Yazıları'
    };
    
    const customCat = (appData?.categories || []).find(c => c.id === currentCategory);
    if (customCat) {
      pageTitle.textContent = `${customCat.icon || '📁'} ${customCat.title}`;
    } else {
      pageTitle.textContent = catLabels[currentCategory] || 'İçerikler';
    }

    const activeNavId = {
      videos: 'navYt',
      music: 'navMusic',
      podcasts: 'navPod',
      articles: 'navBlog'
    }[currentCategory];
    if (activeNavId) {
      const el = document.getElementById(activeNavId);
      if (el) el.classList.add('active');
    } else {
      const customEl = document.querySelector(`.nav-item[data-cat-id="${currentCategory}"]`);
      if (customEl) customEl.classList.add('active');
    }

    renderList();
  } else if (view === 'about') {
    viewAbout.style.display = 'block';
    pageTitle.textContent = 'Hakkında & Profil Düzenleyici';
    document.getElementById('navAbout').classList.add('active');
    populateAboutForm();
  } else if (view === 'settings') {
    if (viewSettings) viewSettings.style.display = 'block';
    pageTitle.textContent = 'Site & Marka Ayarları';
    const navSettings = document.getElementById('navSettings');
    if (navSettings) navSettings.classList.add('active');
    populateSettingsForm();
  }
}

// --------------------------------------------------------------------------
// 3. KATEGORİ FORM ALANLARI
// --------------------------------------------------------------------------
function setFormCategory(cat) {
  currentCategory = cat;
  document.getElementById('currentCategory').value = cat;

  document.querySelectorAll('.cat-picker-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });

  const customCat = (appData?.categories || []).find(c => c.id === cat);
  const catType = customCat ? customCat.type : (
    cat === 'videos' ? 'video' :
    cat === 'music' ? 'music' :
    cat === 'podcasts' ? 'podcast' :
    cat === 'articles' ? 'article' : 'standard'
  );

  document.getElementById('fieldYoutube').style.display = (catType === 'video') ? 'grid' : 'none';
  document.getElementById('fieldMusic').style.display = (catType === 'music') ? 'grid' : 'none';
  document.getElementById('fieldPodcast').style.display = (catType === 'podcast') ? 'grid' : 'none';
  document.getElementById('fieldBlog').style.display = (catType === 'article') ? 'grid' : 'none';

  document.getElementById('fieldCommonDesc').style.display = (catType === 'article') ? 'none' : 'block';
  document.getElementById('fieldTranscriptArea').style.display = (catType === 'video' || catType === 'podcast') ? 'block' : 'none';
}

// --------------------------------------------------------------------------
// 4. CANLI MEDYA ÖNİZLEMELERİ (YOUTUBE & SES OYNATICI)
// --------------------------------------------------------------------------
function updateYoutubeLivePreview(url, wrapId, badgeId, thumbBtnId) {
  const wrap = document.getElementById(wrapId);
  const badge = document.getElementById(badgeId);
  const thumbBtn = document.getElementById(thumbBtnId);
  const videoId = extractYoutubeId(url);

  if (videoId) {
    wrap.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border:none;"></iframe>`;
    if (badge) badge.textContent = `✓ YOUTUBE VİDEOSU BAĞLANDI (ID: ${videoId})`;
    
    if (thumbBtn) {
      thumbBtn.style.display = 'inline-flex';
      thumbBtn.onclick = () => {
        fetchAndSetYoutubeThumbnail(videoId, currentCategory, true);
      };
    }

    // Eğer kapak görseli boşsa otomatik YouTube kapak resmini ata
    const coverInput = document.getElementById('inpCover');
    if (!coverInput.value.trim()) {
      fetchAndSetYoutubeThumbnail(videoId, currentCategory, false);
    }
  } else {
    wrap.innerHTML = `<span style="padding:1rem; text-align:center;">Geçerli bir YouTube linki veya iframe kodu yapıştırdığınızda burada canlı oynatılacaktır.</span>`;
    if (badge) {
      badge.textContent = (wrapId === 'musicYtLivePlayerWrap') ? `🎵 MÜZİK VİDEOSU CANLI ÖNİZLEME` : `📺 YOUTUBE CANLI ÖNİZLEME`;
    }
    if (thumbBtn) thumbBtn.style.display = 'none';
  }
}

function updatePodcastAudioPreview(audioUrl) {
  const wrap = document.getElementById('podAudioPreviewWrap');
  const player = document.getElementById('podAudioPlayer');
  if (audioUrl && audioUrl.trim()) {
    wrap.style.display = 'block';
    player.src = audioUrl.trim();
  } else {
    wrap.style.display = 'none';
    player.src = '';
  }
}

// --------------------------------------------------------------------------
// 5. TRANSKRİPT BÖLÜM EKLEME / ÇIKARMA
// --------------------------------------------------------------------------
function addTranscriptItem(title = '', text = '') {
  const container = document.getElementById('transcriptContainer');
  const div = document.createElement('div');
  div.className = 'repeater-item';
  div.innerHTML = `
    <div class="repeater-item-header">
      <input type="text" class="form-input transcript-item-title" placeholder="Bölüm Başlığı (Örn: 1. Giriş: Zihin Felsefesi)" value="${escapeHtml(title)}" style="font-weight:600; padding:0.45rem 0.7rem; font-size:0.85rem;">
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.repeater-item').remove()">Sil</button>
    </div>
    <textarea class="form-textarea transcript-item-text" rows="3" placeholder="Bölümün tam konuşma metni...">${escapeHtml(text)}</textarea>
  `;
  container.appendChild(div);
}

function getTranscriptData() {
  const items = [];
  document.querySelectorAll('#transcriptContainer .repeater-item').forEach(el => {
    const t = el.querySelector('.transcript-item-title').value.trim();
    const txt = el.querySelector('.transcript-item-text').value.trim();
    if (txt) {
      items.push({ title: t, text: txt });
    }
  });
  return items;
}

// --------------------------------------------------------------------------
// 6. GÖRSEL ÖNİZLEME & YÜKLEME
// --------------------------------------------------------------------------
function updateCoverPreview(url) {
  const preview = document.getElementById('coverPreview');
  if (!url) {
    preview.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted);">Önizleme</span>`;
    return;
  }

  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Kapak Önizleme';
  img.onerror = function() {
    // YouTube görseli maxresdefault olarak 404 verdiyse hqdefault'a düş
    if (this.src.includes('maxresdefault.jpg')) {
      this.src = this.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
    } else if (this.src.includes('sddefault.jpg')) {
      this.src = this.src.replace('sddefault.jpg', 'hqdefault.jpg');
    } else {
      this.onerror = null;
      this.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';
    }
  };

  preview.innerHTML = '';
  preview.appendChild(img);
}

async function uploadImageFile(file, category) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      showToast('Görsel yükleniyor...', 'info');
      const payload = {
        filename: file.name,
        category: category,
        data: e.target.result
      };
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('inpCover').value = data.path;
        updateCoverPreview(data.path);
        showToast('✓ Görsel başarıyla kaydedildi!', 'success');
      } else {
        const errText = data.error || data.message || 'Görsel yüklenemedi';
        showToast('Görsel yükleme hatası: ' + errText, 'error');
      }
    } catch (err) {
      const errText = err.message || 'Yükleme sırasında hata oluştu';
      showToast('Hata: ' + errText, 'error');
    }
  };
  reader.readAsDataURL(file);
}

// --------------------------------------------------------------------------
// 7. FORM TEMİZLEME & DOLDURMA
// --------------------------------------------------------------------------
function resetForm() {
  editingId = null;
  isSlugManual = false;
  document.getElementById('editId').value = '';
  document.getElementById('contentForm').reset();
  document.getElementById('inpDate').value = getTodayFormatted();
  document.getElementById('transcriptContainer').innerHTML = '';
  updateCoverPreview('');
  updateYoutubeLivePreview('', 'ytLivePlayerWrap', 'ytPreviewBadge', 'btnFetchYtThumb');
  updateYoutubeLivePreview('', 'musicYtLivePlayerWrap', 'musicYtPreviewBadge', 'btnFetchMusicThumb');
  updatePodcastAudioPreview('');
  setFormCategory('videos');
}

function populateForm(item, category) {
  editingId = item.id;
  isSlugManual = true;
  document.getElementById('editId').value = item.id;
  setFormCategory(category);

  document.getElementById('inpTitle').value = item.title || '';
  document.getElementById('inpSlug').value = item.slug || '';
  document.getElementById('inpDate').value = item.date || getTodayFormatted();
  document.getElementById('inpTags').value = (item.tags || []).join(', ');
  document.getElementById('inpCover').value = item.cover || '';
  updateCoverPreview(item.cover || '');

  const customCat = (appData?.categories || []).find(c => c.id === category);
  const catType = customCat ? customCat.type : (
    category === 'videos' ? 'video' :
    category === 'music' ? 'music' :
    category === 'podcasts' ? 'podcast' :
    category === 'articles' ? 'article' : 'standard'
  );

  if (category === 'videos' || catType === 'video') {
    document.getElementById('inpYtDuration').value = item.duration || '';
    const cleanYt = cleanYoutubeUrl(item.youtubeUrl || '');
    document.getElementById('inpYtEmbed').value = cleanYt;
    document.getElementById('inpDescription').value = item.description || '';
    updateYoutubeLivePreview(cleanYt, 'ytLivePlayerWrap', 'ytPreviewBadge', 'btnFetchYtThumb');
  } else if (category === 'music' || catType === 'music') {
    document.getElementById('inpMusicType').value = item.type || 'Remix';
    document.getElementById('inpMusicDuration').value = item.duration || '';
    const cleanYt = cleanYoutubeUrl(item.youtubeUrl || '');
    document.getElementById('inpMusicYt').value = cleanYt;
    document.getElementById('inpMusicYtMusic').value = item.youtubeMusicUrl || '';
    document.getElementById('inpMusicCredits').value = item.credits || '';
    document.getElementById('inpMusicLyrics').value = (item.lyrics || []).join('\n');
    document.getElementById('inpDescription').value = item.description || '';
    updateYoutubeLivePreview(cleanYt, 'musicYtLivePlayerWrap', 'musicYtPreviewBadge', 'btnFetchMusicThumb');
  } else if (category === 'podcasts' || catType === 'podcast') {
    document.getElementById('inpPodEpisode').value = item.episodeNumber || '';
    document.getElementById('inpPodDuration').value = item.duration || '';
    document.getElementById('inpPodAudio').value = item.audioUrl || '';
    document.getElementById('inpDescription').value = item.description || '';
    updatePodcastAudioPreview(item.audioUrl || '');
  } else if (category === 'articles' || catType === 'article') {
    document.getElementById('inpBlogWeek').value = item.weekNumber || '';
    document.getElementById('inpBlogReadTime').value = item.readTime || '';
    document.getElementById('inpBlogSummary').value = item.summary || item.description || '';
    document.getElementById('inpBlogContent').value = item.content || '';
  } else {
    document.getElementById('inpDescription').value = item.description || item.summary || '';
    document.getElementById('inpBlogContent').value = item.content || '';
  }

  // Transkript
  const container = document.getElementById('transcriptContainer');
  container.innerHTML = '';
  if (item.transcript && Array.isArray(item.transcript)) {
    item.transcript.forEach(t => {
      if (typeof t === 'string') {
        addTranscriptItem('', t);
      } else {
        addTranscriptItem(t.title, t.text);
      }
    });
  }
}

// --------------------------------------------------------------------------
// 8. İÇERİĞİ KAYDET & DERLE
// --------------------------------------------------------------------------
async function saveContent() {
  if (!appData) return;

  const title = document.getElementById('inpTitle').value.trim();
  const slug = document.getElementById('inpSlug').value.trim();
  const date = document.getElementById('inpDate').value.trim();
  const tags = document.getElementById('inpTags').value.split(',').map(s => s.trim()).filter(Boolean);
  const cover = document.getElementById('inpCover').value.trim();
  const cat = document.getElementById('currentCategory').value;

  if (!title || !slug || !date) {
    showToast('Lütfen başlık, slug ve tarih alanlarını doldurun.', 'error');
    return;
  }

  const customCat = (appData?.categories || []).find(c => c.id === cat);
  const catType = customCat ? customCat.type : (
    cat === 'videos' ? 'video' :
    cat === 'music' ? 'music' :
    cat === 'podcasts' ? 'podcast' :
    cat === 'articles' ? 'article' : 'standard'
  );

  let item = {};
  if (editingId) {
    item.id = editingId;
  } else {
    const prefix = { videos: 'yt', music: 'music', podcasts: 'pod', articles: 'blog' }[cat] || cat;
    item.id = `${prefix}-${Date.now().toString().slice(-4)}`;
  }

  item.slug = slug;
  item.title = title;
  item.date = date;
  item.tags = tags;
  item.cover = cover;
  if (customCat) {
    item.category = cat;
  }

  if (cat === 'videos' || catType === 'video') {
    item.url = customCat ? `kategori/${cat}/${slug}/index.html` : `video/${slug}/index.html`;
    item.duration = document.getElementById('inpYtDuration').value.trim();
    item.youtubeUrl = cleanYoutubeUrl(document.getElementById('inpYtEmbed').value.trim());
    item.description = document.getElementById('inpDescription').value.trim();
    item.transcript = getTranscriptData();
  } else if (cat === 'music' || catType === 'music') {
    item.url = customCat ? `kategori/${cat}/${slug}/index.html` : `muzik/${slug}/index.html`;
    item.artist = "AKCAN AKDAĞ";
    item.type = document.getElementById('inpMusicType').value;
    item.duration = document.getElementById('inpMusicDuration').value.trim();
    item.youtubeUrl = cleanYoutubeUrl(document.getElementById('inpMusicYt').value.trim());
    item.youtubeMusicUrl = cleanYoutubeMusicUrl(document.getElementById('inpMusicYtMusic').value.trim());
    item.credits = document.getElementById('inpMusicCredits').value.trim();
    item.description = document.getElementById('inpDescription').value.trim();
    item.lyrics = document.getElementById('inpMusicLyrics').value.split('\n').map(s => s.trim()).filter(Boolean);
  } else if (cat === 'podcasts' || catType === 'podcast') {
    const epNum = parseInt(document.getElementById('inpPodEpisode').value.trim(), 10) || 1;
    item.episodeNumber = epNum;
    item.slug = String(epNum);
    item.url = customCat ? `kategori/${cat}/${epNum}/index.html` : `bolum/${epNum}/index.html`;
    item.duration = document.getElementById('inpPodDuration').value.trim();
    item.audioUrl = document.getElementById('inpPodAudio').value.trim();
    item.description = document.getElementById('inpDescription').value.trim();
    item.transcript = getTranscriptData();
  } else if (cat === 'articles' || catType === 'article') {
    item.url = customCat ? `kategori/${cat}/${slug}/index.html` : `yazi/${slug}/index.html`;
    item.weekNumber = parseInt(document.getElementById('inpBlogWeek').value.trim(), 10) || 1;
    item.readTime = document.getElementById('inpBlogReadTime').value.trim();
    item.summary = document.getElementById('inpBlogSummary').value.trim() || document.getElementById('inpDescription').value.trim();
    item.content = document.getElementById('inpBlogContent').value.trim();
  } else {
    item.url = `kategori/${cat}/${slug}/index.html`;
    item.description = document.getElementById('inpDescription').value.trim();
    item.content = document.getElementById('inpBlogContent').value.trim();
  }

  if (!appData[cat]) appData[cat] = [];

  if (editingId) {
    const idx = appData[cat].findIndex(x => x.id === editingId);
    if (idx !== -1) {
      appData[cat][idx] = item;
    } else {
      appData[cat].unshift(item);
    }
  } else {
    appData[cat].unshift(item);
  }

  // En son videoyu vitrin ile senkronize et
  if (appData.videos && appData.videos.length > 0) {
    const latestVid = appData.videos[0];
    appData.featured = {
      id: latestVid.id,
      slug: latestVid.slug,
      url: latestVid.url || `video/${latestVid.slug}/index.html`,
      type: "youtube",
      eyebrow: `Son Video · ${latestVid.date}`,
      title: latestVid.title,
      description: latestVid.description,
      cover: latestVid.cover,
      youtubeId: extractYoutubeId(latestVid.youtubeUrl || ''),
      date: latestVid.date,
      tags: latestVid.tags || []
    };
  }

  await submitDataToServer();
}

async function submitDataToServer() {
  const saveBtn = document.getElementById('btnSaveContent');
  const topSaveBtn = document.getElementById('btnTopSave');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Derleniyor...';
  }
  if (topSaveBtn) {
    topSaveBtn.disabled = true;
    topSaveBtn.textContent = '⏳ Derleniyor...';
  }

  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });
    const result = await res.json();
    if (result.success) {
      showToast('✓ ' + (result.message || 'İçerik kaydedildi ve sayfalar derlendi!'), 'success');
      updateCounters();
      switchView('list', currentCategory);
    } else {
      const errText = result.error || result.message || 'Kayıt sırasında bir hata oluştu.';
      showToast('Hata: ' + errText, 'error');
      if (result.build_log) {
        console.error('Derleme Günlüğü:', result.build_log);
      }
    }
  } catch (err) {
    const errText = err.message || 'Sunucu ile bağlantı kurulamadı.';
    showToast('Sunucu hatası: ' + errText, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Kaydet & Siteyi Güncelle';
    }
    if (topSaveBtn) {
      topSaveBtn.disabled = false;
      topSaveBtn.textContent = '💾 Kaydet & Yayınla';
    }
  }
}

// --------------------------------------------------------------------------
// 9. LİSTE GÖRÜNÜMÜ RENDER
// --------------------------------------------------------------------------
function renderList() {
  const grid = document.getElementById('listGrid');
  grid.innerHTML = '';
  if (!appData || !appData[currentCategory]) {
    grid.innerHTML = '<div style="color:var(--text-muted); padding:2rem;">İçerik bulunamadı.</div>';
    return;
  }

  const query = document.getElementById('inpListSearch').value.toLowerCase().trim();
  const items = appData[currentCategory].filter(item => {
    if (!query) return true;
    return (item.title && item.title.toLowerCase().includes(query)) ||
           (item.tags && item.tags.some(t => t.toLowerCase().includes(query)));
  });

  if (items.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-muted); padding:2rem;">Aramanızla eşleşen içerik bulunamadı.</div>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const desc = item.description || item.summary || '';
    const badgeText = item.duration || item.readTime || (item.episodeNumber ? `Bölüm ${item.episodeNumber}` : '');

    card.innerHTML = `
      <div class="item-card-cover">
        <img src="${item.cover}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'">
        ${badgeText ? `<span class="item-card-badge">${badgeText}</span>` : ''}
      </div>
      <div class="item-card-body">
        <span class="item-card-date">${item.date}</span>
        <h3 class="item-card-title">${escapeHtml(item.title)}</h3>
        ${desc ? `<p class="item-card-desc">${escapeHtml(desc)}</p>` : ''}
      </div>
      <div class="item-card-footer">
        <a href="${item.url}" target="_blank" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">Görüntüle ↗</a>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-secondary btn-sm btn-edit" data-id="${item.id}">Düzenle</button>
          <button class="btn btn-danger btn-sm btn-delete" data-id="${item.id}">Sil</button>
        </div>
      </div>
    `;

    card.querySelector('.btn-edit').addEventListener('click', () => {
      populateForm(item, currentCategory);
      switchView('form', currentCategory, 'edit');
      document.getElementById('pageTitle').textContent = `Düzenle: ${item.title}`;
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
      openDeleteModal(currentCategory, item.id, item.title);
    });

    grid.appendChild(card);
  });
}

// --------------------------------------------------------------------------
// 10. SİLME MODALI
// --------------------------------------------------------------------------
function openDeleteModal(category, id, title) {
  deleteTarget = { category, id };
  document.getElementById('deleteConfirmText').textContent = `"${title}" başlıklı içerik ve tüm alt sayfaları silinecektir. Onaylıyor musunuz?`;
  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
  deleteTarget = null;
  const modal = document.getElementById('deleteModal');
  if (modal) modal.classList.remove('active');
}

// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// 11. HAKKINDA & PROFİL BİLGİLERİ DÜZENLEME
// --------------------------------------------------------------------------
function populateAboutForm() {
  if (!appData) return;
  const a = appData.about || {};
  const author = appData.author || {};

  const avatar = a.avatar || 'images/author/akcan-akdag.svg';
  const inpAvatar = document.getElementById('inpAboutAvatar');
  if (inpAvatar) inpAvatar.value = avatar;
  updateAvatarPreview(avatar);

  const inpName = document.getElementById('inpAboutName');
  if (inpName) inpName.value = a.name || author.name || 'AKCAN AKDAĞ';

  const inpBadge = document.getElementById('inpAboutBadge');
  if (inpBadge) inpBadge.value = a.badge || author.title || 'YAZAR · ANLATICI · DİJİTAL DÜŞÜNÜR';

  const inpLead = document.getElementById('inpAboutLead');
  if (inpLead) inpLead.value = a.lead || author.bio || '"Sanat, teknoloji ve felsefenin kesişim noktasında insan zihnini, evreni ve geleceği anlamaya çalışan hikâyeler anlatıyorum."';

  const inpWhoTitle = document.getElementById('inpAboutWhoTitle');
  if (inpWhoTitle) inpWhoTitle.value = a.whoTitle || 'Ben Kimim?';

  const inpWhoText = document.getElementById('inpAboutWhoText');
  if (inpWhoText) inpWhoText.value = a.whoText || 'Gürültülü dijital çağda, yüzeysel bilgi tüketiminin hızına inat; yavaşlamanın, derinleşmenin ve zihinsel berraklığın değerine inanan bir içerik üreticisi ve anlatıcıyım.\n\nYapay zekanın ve algoritmaların gündelik hayatımızı kökten değiştirdiği bu dönemde; teknolojinin getirdiği teknik yeniliklerden ziyade, insana ve felsefeye yansıyan derin etkilerini inceliyorum. Barış Özcan tarzı belgesel hikâye anlatıcılığını kendi düşünce ve müzik dünyamla harmanlayarak paylaşıyorum.';

  const inpPillarsTitle = document.getElementById('inpAboutPillarsTitle');
  if (inpPillarsTitle) inpPillarsTitle.value = a.pillarsTitle || 'Neler Üretiyorum?';

  const defaultPillars = [
    { icon: '🎥', title: 'YouTube Videoları', description: 'Yapay zeka modelleri, Turing Testi, Fermi Paradoksu, zamanın oku ve bilişsel psikoloji üzerine belgesel tadında görsel denemeler.' },
    { icon: '🎙️', title: 'Derin Odak Podcast', description: 'Dikkat ekonomisinin tuzaklarından sıyrılmak, sessizliği geri kazanmak ve üretken zihinsel odaklanma ritüelleri üzerine sesli denemeler.' },
    { icon: '✍️', title: 'Haftalık Blog & Notlar', description: 'Kitaplar, yavaş okuma sanatı, algoritmik filtre balonları ve insani kusurların güzelliği üzerine kaleme alınmış editoryal yazılar.' },
    { icon: '🎹', title: 'Şarkılar & Remixler', description: 'Gece sürüşleri ve derin çalışma saatleri için özel olarak düzenlediğim synthwave, cyberpunk ve lo-fi elektronik müzik prodüksiyonları.' }
  ];
  renderPillarsRepeater(a.pillars && a.pillars.length ? a.pillars : defaultPillars);

  const inpPrinciplesTitle = document.getElementById('inpAboutPrinciplesTitle');
  if (inpPrinciplesTitle) inpPrinciplesTitle.value = a.principlesTitle || 'Üretim İlkelerim';

  const defaultPrinciples = [
    { title: 'Merak Odaklı Sorgulama', text: 'Kesin cevaplardan çok, doğru ve derin sorular sormanın değerine inanırım.' },
    { title: 'Hıza Karşı Derinlik', text: 'Günde onlarca kısa video yerine, aylar sonra bile dönüp izlenebilecek kalıcı içerikler üretmeyi hedeflerim.' },
    { title: 'Kusurlu İnsani Özgünlük', text: 'Kusursuz yapay zeka çıktılarının ortasında, insanı insan yapan duygu ve kırılganlığı korumak esastır.' }
  ];
  renderPrinciplesRepeater(a.principles && a.principles.length ? a.principles : defaultPrinciples);

  const inpContactTitle = document.getElementById('inpAboutContactTitle');
  if (inpContactTitle) inpContactTitle.value = a.contactTitle || 'İletişim & İş Birlikleri';

  const inpContactText = document.getElementById('inpAboutContactText');
  if (inpContactText) inpContactText.value = a.contactText || 'Projeler, konuşma davetleri, iş birlikleri veya sadece fikir alışverişinde bulunmak için sosyal medya hesaplarımdan ulaşabilirsiniz.';

  const inpContactEmail = document.getElementById('inpAboutContactEmail');
  if (inpContactEmail) inpContactEmail.value = a.contactEmail || '';
}

function updateAvatarPreview(url) {
  const img = document.getElementById('avatarPreviewImg');
  if (!img) return;
  if (!url) {
    img.src = 'images/author/akcan-akdag.svg';
  } else {
    img.src = url;
    img.onerror = function() {
      this.onerror = null;
      this.src = 'images/author/akcan-akdag.svg';
    };
  }
}

function renderPillarsRepeater(pillars) {
  const container = document.getElementById('pillarsContainer');
  if (!container) return;
  container.innerHTML = '';
  pillars.forEach(item => {
    addPillarRow(item.icon, item.title, item.description);
  });
}

function addPillarRow(icon = '✨', title = '', description = '') {
  const container = document.getElementById('pillarsContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'repeater-item';
  div.style.padding = '0.9rem';
  div.innerHTML = `
    <div style="display:flex; gap:0.6rem; align-items:center; margin-bottom:0.5rem;">
      <input type="text" class="form-input pillar-item-icon" placeholder="İkon (🎥)" value="${escapeHtml(icon)}" style="width: 70px; text-align:center; font-size:1.1rem;">
      <input type="text" class="form-input pillar-item-title" placeholder="Başlık (Örn: YouTube Videoları)" value="${escapeHtml(title)}" style="flex:1; font-weight:600;">
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.repeater-item').remove()">Sil</button>
    </div>
    <textarea class="form-textarea pillar-item-desc" rows="2" placeholder="Açıklama metni...">${escapeHtml(description)}</textarea>
  `;
  container.appendChild(div);
}

function getPillarsData() {
  const list = [];
  document.querySelectorAll('#pillarsContainer .repeater-item').forEach(el => {
    const icon = el.querySelector('.pillar-item-icon')?.value.trim() || '✨';
    const title = el.querySelector('.pillar-item-title')?.value.trim() || '';
    const description = el.querySelector('.pillar-item-desc')?.value.trim() || '';
    if (title) {
      list.push({ icon, title, description });
    }
  });
  return list;
}

function renderPrinciplesRepeater(principles) {
  const container = document.getElementById('principlesContainer');
  if (!container) return;
  container.innerHTML = '';
  principles.forEach(item => {
    addPrincipleRow(item.title, item.text);
  });
}

function addPrincipleRow(title = '', text = '') {
  const container = document.getElementById('principlesContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'repeater-item';
  div.style.padding = '0.9rem';
  div.innerHTML = `
    <div style="display:flex; gap:0.6rem; align-items:center; margin-bottom:0.5rem;">
      <input type="text" class="form-input principle-item-title" placeholder="İlke Başlığı (Örn: Merak Odaklı Sorgulama)" value="${escapeHtml(title)}" style="flex:1; font-weight:600;">
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.repeater-item').remove()">Sil</button>
    </div>
    <textarea class="form-textarea principle-item-text" rows="2" placeholder="İlke açıklaması...">${escapeHtml(text)}</textarea>
  `;
  container.appendChild(div);
}

function getPrinciplesData() {
  const list = [];
  document.querySelectorAll('#principlesContainer .repeater-item').forEach(el => {
    const title = el.querySelector('.principle-item-title')?.value.trim() || '';
    const text = el.querySelector('.principle-item-text')?.value.trim() || '';
    if (title) {
      list.push({ title, text });
    }
  });
  return list;
}

async function saveAbout() {
  if (!appData) return;

  const name = document.getElementById('inpAboutName').value.trim();
  const badge = document.getElementById('inpAboutBadge').value.trim();
  const lead = document.getElementById('inpAboutLead').value.trim();
  const avatar = document.getElementById('inpAboutAvatar').value.trim();

  const whoTitle = document.getElementById('inpAboutWhoTitle').value.trim();
  const whoText = document.getElementById('inpAboutWhoText').value.trim();

  const pillarsTitle = document.getElementById('inpAboutPillarsTitle').value.trim();
  const pillars = getPillarsData();

  const principlesTitle = document.getElementById('inpAboutPrinciplesTitle').value.trim();
  const principles = getPrinciplesData();

  const contactTitle = document.getElementById('inpAboutContactTitle').value.trim();
  const contactText = document.getElementById('inpAboutContactText').value.trim();
  const contactEmail = document.getElementById('inpAboutContactEmail').value.trim();

  if (!name) {
    showToast('Lütfen yazar adını doldurun.', 'error');
    return;
  }

  appData.about = {
    avatar: avatar || 'images/author/akcan-akdag.svg',
    badge: badge || 'YAZAR · ANLATICI · DİJİTAL DÜŞÜNÜR',
    name,
    lead,
    whoTitle: whoTitle || 'Ben Kimim?',
    whoText,
    pillarsTitle: pillarsTitle || 'Neler Üretiyorum?',
    pillars,
    principlesTitle: principlesTitle || 'Üretim İlkelerim',
    principles,
    contactTitle: contactTitle || 'İletişim & İş Birlikleri',
    contactText,
    contactEmail
  };

  // Eski author alanı ile senkronize et (geriye dönük uyumluluk)
  if (!appData.author) appData.author = {};
  appData.author.name = name;
  appData.author.title = badge;
  appData.author.bio = lead;

  await submitDataToServer();
}


// --------------------------------------------------------------------------
// 11.1 SİTE & MARKA AYARLARI
// --------------------------------------------------------------------------
function populateSettingsForm() {
  if (!appData) return;
  const s = appData.settings || {};
  const nav = s.navLabels || {};
  const f = s.footer || {};

  const brandEl = document.getElementById('inpSettingBrandName');
  if (brandEl) brandEl.value = s.brandName || appData.author?.name || 'AKCAN AKDAĞ';

  const navHomeEl = document.getElementById('inpSettingNavHome');
  if (navHomeEl) navHomeEl.value = nav.home || 'Anasayfa';

  const navYtEl = document.getElementById('inpSettingNavYt');
  if (navYtEl) navYtEl.value = nav.youtube || 'Youtube';

  const navPodEl = document.getElementById('inpSettingNavPod');
  if (navPodEl) navPodEl.value = nav.podcast || 'Podcast';

  const navBlogEl = document.getElementById('inpSettingNavBlog');
  if (navBlogEl) navBlogEl.value = nav.blog || 'Blog';

  const navMusicEl = document.getElementById('inpSettingNavMusic');
  if (navMusicEl) navMusicEl.value = nav.music || 'Şarkılar & Remixler';

  const navAboutEl = document.getElementById('inpSettingNavAbout');
  if (navAboutEl) navAboutEl.value = nav.about || 'Hakkında';

  const footerBrandEl = document.getElementById('inpSettingFooterBrand');
  if (footerBrandEl) footerBrandEl.value = f.brand || s.brandName || appData.author?.name || 'AKCAN AKDAĞ';

  const footerCopyEl = document.getElementById('inpSettingFooterCopy');
  if (footerCopyEl) footerCopyEl.value = f.copy || '© 2026 AKCAN AKDAĞ · Kültür, teknoloji ve zihin haritaları.';

  const defaultSocial = [
    { platform: 'YouTube', url: 'https://youtube.com/akcanakdag' },
    { platform: 'Instagram', url: 'https://instagram.com/akcanakdag' },
    { platform: 'TikTok', url: 'https://www.tiktok.com/@akcanakdag' }
  ];
  renderSocialLinksRepeater(s.socialLinks && s.socialLinks.length ? s.socialLinks : defaultSocial);
}

function renderSocialLinksRepeater(links) {
  const container = document.getElementById('socialLinksContainer');
  if (!container) return;
  container.innerHTML = '';
  links.forEach(item => {
    addSocialLinkRow(item.platform, item.url);
  });
}

function addSocialLinkRow(platform = '', url = '') {
  const container = document.getElementById('socialLinksContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'repeater-item';
  div.style.padding = '0.75rem';
  div.innerHTML = `
    <div style="display:flex; gap:0.8rem; align-items:center;">
      <input type="text" class="form-input social-item-platform" placeholder="Platform (Örn: YouTube, Instagram, X, Spotify)" value="${escapeHtml(platform)}" style="width: 220px; font-weight:600;">
      <input type="text" class="form-input social-item-url" placeholder="Profil Linki (https://...)" value="${escapeHtml(url)}" style="flex:1;">
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.repeater-item').remove()">Sil</button>
    </div>
  `;
  container.appendChild(div);
}

function getSocialLinksData() {
  const list = [];
  document.querySelectorAll('#socialLinksContainer .repeater-item').forEach(el => {
    const pInput = el.querySelector('.social-item-platform');
    const uInput = el.querySelector('.social-item-url');
    const platform = pInput ? pInput.value.trim() : '';
    const url = uInput ? uInput.value.trim() : '';
    if (platform && url) {
      list.push({ platform, url });
    }
  });
  return list;
}

async function saveSettings() {
  if (!appData) return;

  const brandName = document.getElementById('inpSettingBrandName').value.trim();
  const navHome = document.getElementById('inpSettingNavHome').value.trim();
  const navYt = document.getElementById('inpSettingNavYt').value.trim();
  const navPod = document.getElementById('inpSettingNavPod').value.trim();
  const navBlog = document.getElementById('inpSettingNavBlog').value.trim();
  const navMusic = document.getElementById('inpSettingNavMusic').value.trim();
  const navAbout = document.getElementById('inpSettingNavAbout').value.trim();

  const footerBrand = document.getElementById('inpSettingFooterBrand').value.trim();
  const footerCopy = document.getElementById('inpSettingFooterCopy').value.trim();

  const socialLinks = getSocialLinksData();

  if (!brandName) {
    showToast('Lütfen marka adını doldurun.', 'error');
    return;
  }

  appData.settings = {
    brandName,
    navLabels: {
      home: navHome || 'Anasayfa',
      youtube: navYt || 'Youtube',
      podcast: navPod || 'Podcast',
      blog: navBlog || 'Blog',
      music: navMusic || 'Şarkılar & Remixler',
      about: navAbout || 'Hakkında'
    },
    footer: {
      brand: footerBrand || brandName,
      copy: footerCopy || '© 2026 AKCAN AKDAĞ · Kültür, teknoloji ve zihin haritaları.'
    },
    socialLinks
  };

  if (appData.seo) {
    appData.seo.siteName = brandName;
    appData.seo.socialLinks = socialLinks.map(s => s.url);
  }

  await submitDataToServer();
}


// --------------------------------------------------------------------------
// 12. ZENGİN METİN / HTML ETİKET EKLEME
// --------------------------------------------------------------------------
function insertTag(type) {
  const textarea = document.getElementById('inpBlogContent');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);

  let tagSnippet = '';
  if (type === 'lead') {
    tagSnippet = `<p class="lead">${selected || 'İlk büyük vurgulu giriş paragrafı...'}</p>\n`;
  } else if (type === 'h3') {
    tagSnippet = `<h3>${selected || 'Ara Başlık'}</h3>\n`;
  } else if (type === 'quote') {
    tagSnippet = `<blockquote>"${selected || 'Önemli alıntı cümlesi.'}"</blockquote>\n`;
  } else if (type === 'figure') {
    tagSnippet = `<figure>\n  <img src="images/blog/gorsel.webp" alt="Görsel Açıklaması">\n  <figcaption>Şekil: Açıklama metni.</figcaption>\n</figure>\n`;
  }

  textarea.setRangeText(tagSnippet, start, end, 'end');
  textarea.focus();
}

// --------------------------------------------------------------------------
// 13. BİLDİRİMLER (TOAST) & YARDIMCILAR
// --------------------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
}

// --------------------------------------------------------------------------
// 12. DİNAMİK KATEGORİ YÖNETİMİ (EKLE, DÜZENLE, SİL)
// --------------------------------------------------------------------------
function getCategoryEditIdInput() {
  return document.getElementById('categoryEditId');
}

function openNewCategoryModal() {
  const modal = document.getElementById('categoryModal');
  if (!modal) return;
  const titleEl = document.getElementById('categoryModalTitle');
  if (titleEl) titleEl.textContent = '✨ Yeni Kategori Ekle';
  const editIdInput = getCategoryEditIdInput();
  if (editIdInput) editIdInput.value = '';
  const inpTitle = document.getElementById('inpCatTitle');
  if (inpTitle) inpTitle.value = '';
  const inpSlug = document.getElementById('inpCatSlug');
  if (inpSlug) inpSlug.value = '';
  const inpIcon = document.getElementById('inpCatIcon');
  if (inpIcon) inpIcon.value = '📚';
  const inpSub = document.getElementById('inpCatSubtitle');
  if (inpSub) inpSub.value = '';
  const inpType = document.getElementById('inpCatType');
  if (inpType) inpType.value = 'article';
  const chkNav = document.getElementById('chkCatShowNav');
  if (chkNav) chkNav.checked = true;
  const chkFeed = document.getElementById('chkCatShowFeed');
  if (chkFeed) chkFeed.checked = true;
  modal.classList.add('active');
  setTimeout(() => document.getElementById('inpCatTitle')?.focus(), 100);
}

function editCategory(catId) {
  if (!appData) {
    if (typeof siteData !== 'undefined') appData = JSON.parse(JSON.stringify(siteData));
  }
  if (!appData || !appData.categories) return;
  const cat = appData.categories.find(c => c.id === catId);
  if (!cat) return;
  const modal = document.getElementById('categoryModal');
  if (!modal) return;
  const titleEl = document.getElementById('categoryModalTitle');
  if (titleEl) titleEl.textContent = `"${cat.title}" Kategorisini Düzenle`;
  const editIdInput = getCategoryEditIdInput();
  if (editIdInput) editIdInput.value = cat.id;
  const inpTitle = document.getElementById('inpCatTitle');
  if (inpTitle) inpTitle.value = cat.title || '';
  const inpSlug = document.getElementById('inpCatSlug');
  if (inpSlug) inpSlug.value = cat.id || '';
  const inpIcon = document.getElementById('inpCatIcon');
  if (inpIcon) inpIcon.value = cat.icon || '📁';
  const inpSub = document.getElementById('inpCatSubtitle');
  if (inpSub) inpSub.value = cat.subtitle || '';
  const inpType = document.getElementById('inpCatType');
  if (inpType) inpType.value = cat.type || 'article';
  const chkNav = document.getElementById('chkCatShowNav');
  if (chkNav) chkNav.checked = cat.showInNav !== false;
  const chkFeed = document.getElementById('chkCatShowFeed');
  if (chkFeed) chkFeed.checked = cat.showInFeed !== false;
  modal.classList.add('active');
  setTimeout(() => document.getElementById('inpCatTitle')?.focus(), 100);
}

function closeCategoryModal() {
  const modal = document.getElementById('categoryModal');
  if (modal) modal.classList.remove('active');
}

function deleteCategoryPrompt(catId) {
  if (!appData || !appData.categories) return;
  const cat = appData.categories.find(c => c.id === catId);
  if (!cat) return;
  const count = appData[catId]?.length || 0;
  deleteTarget = { isCategory: true, catId };
  const confirmText = document.getElementById('deleteConfirmText');
  if (confirmText) {
    confirmText.textContent = `"${cat.title}" kategorisi ve içerisindeki ${count} adet içerik tamamen silinecektir. Bu işlem geri alınamaz. Onaylıyor musunuz?`;
  }
  const modal = document.getElementById('deleteModal');
  if (modal) modal.classList.add('active');
}

async function saveCategory() {
  if (!appData) {
    if (typeof siteData !== 'undefined') appData = JSON.parse(JSON.stringify(siteData));
  }
  if (!appData) {
    showToast('Veriler henüz yüklenemedi, lütfen tekrar deneyin.', 'error');
    return;
  }
  if (!appData.categories) appData.categories = [];

  const editIdInput = getCategoryEditIdInput();
  const editId = editIdInput ? editIdInput.value.trim() : '';
  const title = document.getElementById('inpCatTitle')?.value.trim() || '';
  let slug = document.getElementById('inpCatSlug')?.value.trim() || '';
  const icon = document.getElementById('inpCatIcon')?.value.trim() || '📁';
  const subtitle = document.getElementById('inpCatSubtitle')?.value.trim() || '';
  const type = document.getElementById('inpCatType')?.value || 'article';
  const showInNav = document.getElementById('chkCatShowNav')?.checked ?? true;
  const showInFeed = document.getElementById('chkCatShowFeed')?.checked ?? true;

  if (!title) {
    showToast('Lütfen kategori adını girin.', 'error');
    document.getElementById('inpCatTitle')?.focus();
    return;
  }

  if (!slug) {
    slug = turkishSlugify(title);
  } else {
    slug = turkishSlugify(slug);
  }

  if (!slug) {
    showToast('Geçerli bir kategori kodu (slug) oluşturulamadı.', 'error');
    return;
  }

  const reservedKeys = ['videos', 'music', 'podcasts', 'articles', 'categories', 'settings', 'about', 'author', 'featured', 'siteSettings', 'stats'];
  if (reservedKeys.includes(slug)) {
    showToast(`'${slug}' ismi sistem kategorileri tarafından kullanılıyor, lütfen başka bir ad seçin.`, 'error');
    return;
  }

  const btnSave = document.getElementById('btnSaveCategory');
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.textContent = '⏳ Kaydediliyor...';
  }

  try {
    if (editId) {
      const idx = appData.categories.findIndex(c => c.id === editId);
      if (idx !== -1) {
        if (editId !== slug) {
          if (appData[slug] && appData[slug] !== appData[editId]) {
            showToast(`'${slug}' kodlu bir kategori zaten mevcut.`, 'error');
            return;
          }
          appData[slug] = appData[editId] || [];
          delete appData[editId];
          appData[slug].forEach(item => {
            item.category = slug;
            if (item.url && item.url.startsWith(`kategori/${editId}/`)) {
              item.url = item.url.replace(`kategori/${editId}/`, `kategori/${slug}/`);
            }
          });
          if (currentCategory === editId) {
            currentCategory = slug;
          }
        }
        appData.categories[idx] = {
          id: slug,
          title,
          icon,
          subtitle,
          type,
          showInNav,
          showInFeed
        };
      }
    } else {
      if (appData.categories.some(c => c.id === slug)) {
        showToast(`'${slug}' kodlu bir kategori zaten mevcut.`, 'error');
        return;
      }
      appData.categories.push({
        id: slug,
        title,
        icon,
        subtitle,
        type,
        showInNav,
        showInFeed
      });
      if (!appData[slug]) appData[slug] = [];
      currentCategory = slug;
    }

    closeCategoryModal();
    updateCounters();
    switchView('list', currentCategory);
    showToast('Kategori kaydediliyor ve sistem güncelleniyor...', 'info');
    await submitDataToServer();
    showToast('✓ Kategori başarıyla kaydedildi!', 'success');
  } catch (err) {
    showToast('Kategori kaydedilirken hata oluştu: ' + err.message, 'error');
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.textContent = '💾 Kategoriyi Kaydet';
    }
  }
}

// --------------------------------------------------------------------------
// 13. MOBİL ÖNİZLEME & CİHAZ SİMÜLATÖRÜ
// --------------------------------------------------------------------------
let currentPreviewOrientation = 'portrait';
let currentDeviceWidth = 390;
let currentDeviceHeight = 844;

function openMobilePreview(targetPage = null) {
  const modal = document.getElementById('mobilePreviewModal');
  if (!modal) return;
  updatePreviewPageSelect();

  const iframe = document.getElementById('previewIframe');
  const pageSelect = document.getElementById('previewPageSelect');
  const extLink = document.getElementById('previewExternalLink');

  let pageToLoad = targetPage;
  if (!pageToLoad) {
    pageToLoad = pageSelect ? pageSelect.value : 'index.html';
  }

  if (iframe) iframe.src = pageToLoad;
  if (pageSelect) pageSelect.value = pageToLoad;
  if (extLink) extLink.href = pageToLoad;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobilePreview() {
  const modal = document.getElementById('mobilePreviewModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function updatePreviewPageSelect() {
  const sel = document.getElementById('previewPageSelect');
  if (!sel || !appData) return;

  const currentVal = sel.value;
  let html = `
    <optgroup label="Temel Sayfalar">
      <option value="index.html">Anasayfa (Tüm Akış)</option>
      <option value="index.html#youtube">YouTube Bölümü</option>
      <option value="index.html#podcast">Podcast Bölümü</option>
      <option value="index.html#blog">Blog Bölümü</option>
      <option value="index.html#sarkilar-remixler">Şarkılar & Remixler</option>
      <option value="hakkinda/index.html">Hakkında Sayfası</option>
    </optgroup>
  `;

  if (appData.categories && appData.categories.length > 0) {
    html += `<optgroup label="Özel Kategoriler">`;
    appData.categories.forEach(cat => {
      html += `<option value="index.html#${cat.id}">${cat.icon || '📁'} ${escapeHtml(cat.title)}</option>`;
    });
    html += `</optgroup>`;
  }

  const recentItems = [];
  if (appData.videos && appData.videos[0]) recentItems.push({ label: 'Son Video: ' + appData.videos[0].title, url: appData.videos[0].url || `video/${appData.videos[0].slug}/index.html` });
  if (appData.articles && appData.articles[0]) recentItems.push({ label: 'Son Blog: ' + appData.articles[0].title, url: appData.articles[0].url || `yazi/${appData.articles[0].slug}/index.html` });
  if (appData.podcasts && appData.podcasts[0]) recentItems.push({ label: 'Son Podcast: ' + appData.podcasts[0].title, url: appData.podcasts[0].url || `bolum/${appData.podcasts[0].episodeNumber}/index.html` });
  if (appData.music && appData.music[0]) recentItems.push({ label: 'Son Müzik: ' + appData.music[0].title, url: appData.music[0].url || `muzik/${appData.music[0].slug}/index.html` });

  (appData.categories || []).forEach(cat => {
    const catItems = appData[cat.id];
    if (catItems && catItems.length > 0) {
      recentItems.push({ label: `${cat.icon || '📁'} ${catItems[0].title}`, url: catItems[0].url || `kategori/${cat.id}/${catItems[0].slug}/index.html` });
    }
  });

  if (recentItems.length > 0) {
    html += `<optgroup label="İçerik Detay Sayfaları">`;
    recentItems.forEach(item => {
      html += `<option value="${escapeHtml(item.url)}">${escapeHtml(item.label)}</option>`;
    });
    html += `</optgroup>`;
  }

  sel.innerHTML = html;
  if (currentVal && sel.querySelector(`option[value="${currentVal}"]`)) {
    sel.value = currentVal;
  }
}

function applyDeviceDimensions(width, height) {
  currentDeviceWidth = width;
  currentDeviceHeight = height;
  const frame = document.getElementById('smartphoneFrame');
  const notch = document.getElementById('smartphoneNotch');
  if (!frame) return;

  const w = currentPreviewOrientation === 'portrait' ? width : height;
  const h = currentPreviewOrientation === 'portrait' ? height : width;

  frame.style.width = `${w}px`;
  frame.style.height = `${h}px`;

  if (width >= 768) {
    frame.classList.add('tablet-frame');
    if (notch) notch.style.display = 'none';
  } else {
    frame.classList.remove('tablet-frame');
    if (notch) notch.style.display = 'flex';
  }
}

function togglePreviewOrientation() {
  currentPreviewOrientation = currentPreviewOrientation === 'portrait' ? 'landscape' : 'portrait';
  applyDeviceDimensions(currentDeviceWidth, currentDeviceHeight);
  const btn = document.getElementById('btnRotatePreview');
  if (btn) {
    btn.innerHTML = currentPreviewOrientation === 'portrait' ? '🔄 Döndür' : '🔄 Dikey';
  }
}

// --------------------------------------------------------------------------
// 14. TÜM OLAY DİNLEYİCİLERİ (EVENT LISTENERS)
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  // Menü Tıklamaları
  document.getElementById('navNew').addEventListener('click', () => switchView('form', null, 'new'));
  document.getElementById('navYt').addEventListener('click', () => switchView('list', 'videos'));
  document.getElementById('navMusic').addEventListener('click', () => switchView('list', 'music'));
  document.getElementById('navPod').addEventListener('click', () => switchView('list', 'podcasts'));
  document.getElementById('navBlog').addEventListener('click', () => switchView('list', 'articles'));
  document.getElementById('navAbout').addEventListener('click', () => switchView('about'));
  const navSettings = document.getElementById('navSettings');
  if (navSettings) navSettings.addEventListener('click', () => switchView('settings'));

  // Mobil Menü Aç/Kapat Butonu
  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  const sidebarEl = document.querySelector('.sidebar');
  if (btnToggleSidebar && sidebarEl) {
    btnToggleSidebar.addEventListener('click', () => {
      sidebarEl.classList.toggle('mobile-expanded');
    });
  }


  // Kategori Seçici Butonları
  document.querySelectorAll('.cat-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setFormCategory(btn.dataset.cat);
    });
  });

  // Otomatik Slug
  const inpTitle = document.getElementById('inpTitle');
  const inpSlug = document.getElementById('inpSlug');
  inpTitle.addEventListener('input', () => {
    if (!isSlugManual) {
      inpSlug.value = turkishSlugify(inpTitle.value);
    }
  });
  inpSlug.addEventListener('input', () => {
    isSlugManual = true;
  });

  // Kapak URL Değişimi
  const inpCoverEl = document.getElementById('inpCover');
  inpCoverEl.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    const ytId = extractYoutubeId(val);
    if (ytId && !val.includes('img.youtube.com') && !val.includes('i.ytimg.com')) {
      fetchAndSetYoutubeThumbnail(ytId, currentCategory, true);
    } else {
      updateCoverPreview(val);
    }
  });

  // Görsel Yükleme (Drag & Drop + Input)
  const dropZone = document.getElementById('dropZoneCover');
  const fileInput = document.getElementById('fileCoverInput');

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadImageFile(e.target.files[0], currentCategory);
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-amber)';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border)';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadImageFile(e.dataTransfer.files[0], currentCategory);
    }
  });

  // YouTube Video Linki Girişi & Canlı Önizleme
  const inpYtEmbed = document.getElementById('inpYtEmbed');
  function handleYtInput() {
    const rawVal = inpYtEmbed.value;
    const clean = cleanYoutubeUrl(rawVal);
    if (clean !== rawVal && extractYoutubeId(rawVal)) {
      inpYtEmbed.value = clean;
    }
    updateYoutubeLivePreview(inpYtEmbed.value, 'ytLivePlayerWrap', 'ytPreviewBadge', 'btnFetchYtThumb');
  }
  inpYtEmbed.addEventListener('input', handleYtInput);
  inpYtEmbed.addEventListener('paste', () => setTimeout(handleYtInput, 60));
  inpYtEmbed.addEventListener('blur', handleYtInput);

  // Müzik Video Linki Girişi & Canlı Önizleme
  const inpMusicYt = document.getElementById('inpMusicYt');
  function handleMusicYtInput() {
    const rawVal = inpMusicYt.value;
    const clean = cleanYoutubeUrl(rawVal);
    if (clean !== rawVal && extractYoutubeId(rawVal)) {
      inpMusicYt.value = clean;
    }
    updateYoutubeLivePreview(inpMusicYt.value, 'musicYtLivePlayerWrap', 'musicYtPreviewBadge', 'btnFetchMusicThumb');
  }
  inpMusicYt.addEventListener('input', handleMusicYtInput);
  inpMusicYt.addEventListener('paste', () => setTimeout(handleMusicYtInput, 60));
  inpMusicYt.addEventListener('blur', handleMusicYtInput);

  // YouTube Music Dinleme Linki Temizleyici
  const inpMusicYtMusic = document.getElementById('inpMusicYtMusic');
  inpMusicYtMusic.addEventListener('blur', () => {
    inpMusicYtMusic.value = cleanYoutubeMusicUrl(inpMusicYtMusic.value);
  });

  // Podcast Ses Dosyası Önizlemesi
  const inpPodAudio = document.getElementById('inpPodAudio');
  inpPodAudio.addEventListener('input', () => {
    updatePodcastAudioPreview(inpPodAudio.value);
  });

  // Transkript Ekle Butonu
  document.getElementById('btnAddTranscriptItem').addEventListener('click', () => {
    addTranscriptItem();
  });

  // Form Kaydet
  document.getElementById('contentForm').addEventListener('submit', saveContent);
  document.getElementById('btnTopSave').addEventListener('click', () => {
    if (currentView === 'form') {
      saveContent();
    } else if (currentView === 'about') {
      document.getElementById('btnSaveAbout').click();
    } else if (currentView === 'settings') {
      saveSettings();
    } else {
      switchView('form', currentCategory, 'new');
    }
  });

  // Sosyal Medya Satırı Ekle
  const btnAddSocialLink = document.getElementById('btnAddSocialLink');
  if (btnAddSocialLink) {
    btnAddSocialLink.addEventListener('click', () => addSocialLinkRow());
  }

  // Site Ayarlarını Kaydet
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', saveSettings);
  }
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', saveSettings);
  }


  // Silme Onay Butonları
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      if (!deleteTarget || !appData) return;
      if (deleteTarget.isCategory) {
        const { catId } = deleteTarget;
        appData.categories = (appData.categories || []).filter(c => c.id !== catId);
        if (appData[catId]) {
          delete appData[catId];
        }
        if (currentCategory === catId) {
          currentCategory = 'videos';
        }
        closeDeleteModal();
        updateCounters();
        switchView('list', currentCategory);
        await submitDataToServer();
        showToast('✓ Kategori ve içerikleri silindi!', 'success');
      } else {
        const { category, id } = deleteTarget;
        if (appData[category]) {
          appData[category] = appData[category].filter(x => x.id !== id);
        }
        closeDeleteModal();
        renderList();
        updateCounters();
        await submitDataToServer();
      }
    });
  }

  const btnCancelDelete = document.getElementById('btnCancelDelete');
  if (btnCancelDelete) {
    btnCancelDelete.addEventListener('click', closeDeleteModal);
  }

  // Hakkında Kaydet Butonu ve Formu
  const btnSaveAbout = document.getElementById('btnSaveAbout');
  if (btnSaveAbout) {
    btnSaveAbout.addEventListener('click', saveAbout);
  }
  const aboutForm = document.getElementById('aboutForm');
  if (aboutForm) {
    aboutForm.addEventListener('submit', saveAbout);
  }

  // Hakkında Butonları: Yeni Alan ve Yeni İlke Ekle
  const btnAddPillar = document.getElementById('btnAddPillar');
  if (btnAddPillar) {
    btnAddPillar.addEventListener('click', () => addPillarRow('✨', '', ''));
  }
  const btnAddPrinciple = document.getElementById('btnAddPrinciple');
  if (btnAddPrinciple) {
    btnAddPrinciple.addEventListener('click', () => addPrincipleRow('', ''));
  }

  // Profil Avatarı Yükleme & Önizleme
  const dropZoneAvatar = document.getElementById('dropZoneAvatar');
  const fileAvatarInput = document.getElementById('fileAvatarInput');
  const inpAboutAvatar = document.getElementById('inpAboutAvatar');

  if (dropZoneAvatar && fileAvatarInput) {
    dropZoneAvatar.addEventListener('click', () => fileAvatarInput.click());
    fileAvatarInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await uploadAvatarFile(e.target.files[0]);
      }
    });

    dropZoneAvatar.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZoneAvatar.style.borderColor = 'var(--accent-amber)';
    });
    dropZoneAvatar.addEventListener('dragleave', () => {
      dropZoneAvatar.style.borderColor = 'var(--border)';
    });
    dropZoneAvatar.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZoneAvatar.style.borderColor = 'var(--border)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await uploadAvatarFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (inpAboutAvatar) {
    inpAboutAvatar.addEventListener('input', (e) => {
      updateAvatarPreview(e.target.value.trim());
    });
  }

  async function uploadAvatarFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        showToast('Profil fotoğrafı yükleniyor...', 'info');
        const payload = {
          filename: file.name,
          category: 'author',
          data: e.target.result
        };
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          if (inpAboutAvatar) inpAboutAvatar.value = data.path;
          updateAvatarPreview(data.path);
          showToast('✓ Profil fotoğrafı başarıyla yüklendi!', 'success');
        } else {
          showToast('Görsel yüklenemedi: ' + (data.error || data.message), 'error');
        }
      } catch (err) {
        showToast('Hata: ' + err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  }


  // İptal Butonu
  document.getElementById('btnCancelEdit').addEventListener('click', () => {
    switchView('list', currentCategory);
  });

  // Liste Arama
  document.getElementById('inpListSearch').addEventListener('input', renderList);
  document.getElementById('btnListAddNew').addEventListener('click', () => {
    switchView('form', currentCategory, 'new');
  });

  // Hızlı Derle
  document.getElementById('btnQuickBuild').addEventListener('click', async () => {
    const btn = document.getElementById('btnQuickBuild');
    btn.textContent = '⏳ Derleniyor...';
    btn.disabled = true;
    try {
      const res = await fetch('/api/build', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Tüm sayfalar başarıyla derlendi!', 'success');
      } else {
        const errText = data.error || data.message || 'Derleme başarısız oldu.';
        showToast('Derleme hatası: ' + errText, 'error');
      }
    } catch (err) {
      const errText = err.message || 'Bilinmeyen hata';
      showToast('Hata: ' + errText, 'error');
    } finally {
      btn.textContent = '⚡ Şimdi Derle';
      btn.disabled = false;
    }
  });

  // Kategori Modalı Dinleyicileri
  const btnOpenCatModal = document.getElementById('btnOpenNewCategoryModal');
  if (btnOpenCatModal) {
    btnOpenCatModal.addEventListener('click', openNewCategoryModal);
  }
  const btnCloseCatModal = document.getElementById('btnCloseCatModal');
  if (btnCloseCatModal) {
    btnCloseCatModal.addEventListener('click', closeCategoryModal);
  }
  const btnCancelCat = document.getElementById('btnCancelCategory');
  if (btnCancelCat) {
    btnCancelCat.addEventListener('click', closeCategoryModal);
  }
  const btnSaveCat = document.getElementById('btnSaveCategory');
  if (btnSaveCat) {
    btnSaveCat.addEventListener('click', saveCategory);
  }
  const categoryForm = document.getElementById('categoryForm');
  if (categoryForm) {
    categoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCategory();
    });
  }

  // Kategori Başlığı Girildikçe Otomatik Slug Üretimi
  const inpCatTitle = document.getElementById('inpCatTitle');
  const inpCatSlug = document.getElementById('inpCatSlug');
  if (inpCatTitle && inpCatSlug) {
    inpCatTitle.addEventListener('input', () => {
      const editId = getCategoryEditIdInput()?.value;
      if (!editId) {
        inpCatSlug.value = turkishSlugify(inpCatTitle.value);
      }
    });
  }

  // Emoji Hızlı Seçim Butonları
  const emojiQuickPicker = document.getElementById('emojiQuickPicker');
  const inpCatIcon = document.getElementById('inpCatIcon');
  if (emojiQuickPicker && inpCatIcon) {
    emojiQuickPicker.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        inpCatIcon.value = btn.dataset.emoji || '📁';
      });
    });
  }

  // Mobil Önizleme Dinleyicileri
  const btnTopMobilePreview = document.getElementById('btnTopMobilePreview');
  if (btnTopMobilePreview) {
    btnTopMobilePreview.addEventListener('click', () => openMobilePreview());
  }
  const btnSidebarMobilePreview = document.getElementById('btnSidebarMobilePreview');
  if (btnSidebarMobilePreview) {
    btnSidebarMobilePreview.addEventListener('click', () => openMobilePreview());
  }
  const btnClosePreview = document.getElementById('btnClosePreview');
  if (btnClosePreview) {
    btnClosePreview.addEventListener('click', closeMobilePreview);
  }

  // Cihaz Seçici Butonları
  document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const w = parseInt(btn.dataset.width, 10) || 390;
      const h = parseInt(btn.dataset.height, 10) || 844;
      applyDeviceDimensions(w, h);
    });
  });

  // Ekran Döndürme
  const btnRotatePreview = document.getElementById('btnRotatePreview');
  if (btnRotatePreview) {
    btnRotatePreview.addEventListener('click', togglePreviewOrientation);
  }

  // Önizlenecek Sayfa Değişimi
  const previewPageSelect = document.getElementById('previewPageSelect');
  const previewIframe = document.getElementById('previewIframe');
  const previewExternalLink = document.getElementById('previewExternalLink');
  if (previewPageSelect && previewIframe) {
    previewPageSelect.addEventListener('change', () => {
      const url = previewPageSelect.value;
      previewIframe.src = url;
      if (previewExternalLink) previewExternalLink.href = url;
    });
  }

  // Önizlemeyi Yenile Butonu
  const btnRefreshPreview = document.getElementById('btnRefreshPreview');
  if (btnRefreshPreview && previewIframe) {
    btnRefreshPreview.addEventListener('click', () => {
      const currentSrc = previewIframe.src;
      previewIframe.src = 'about:blank';
      setTimeout(() => { previewIframe.src = currentSrc; }, 50);
      showToast('Önizleme yenilendi', 'info');
    });
  }

  // ESC Tuşu ile Modalları Kapatma
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const mobileModal = document.getElementById('mobilePreviewModal');
      if (mobileModal && mobileModal.classList.contains('active')) {
        closeMobilePreview();
        return;
      }
      const catModal = document.getElementById('categoryModal');
      if (catModal && catModal.classList.contains('active')) {
        closeCategoryModal();
        return;
      }
      const delModal = document.getElementById('deleteModal');
      if (delModal && delModal.classList.contains('active')) {
        closeDeleteModal();
      }
    }
  });
});
