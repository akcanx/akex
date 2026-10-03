// ==========================================================================
// AKCAN AKDAĞ — Kişisel Web Sitesi JavaScript Motoru
// Navigasyon, Akış Filtreleme, Kronolojik Sıralama, Dinamik Hero & Arama (Cmd+K)
// Desteklenen Kategoriler: Youtube, Şarkılar & Remixler, Podcast, Blog
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------------------------------------------------
  // 1. DOM REFERANSLARI
  // ------------------------------------------------------------------------
  const navLinks = document.querySelectorAll('[data-nav]');
  const pageSections = {
    anasayfa: document.getElementById('section-anasayfa'),
    youtube: document.getElementById('section-youtube'),
    podcast: document.getElementById('section-podcast'),
    blog: document.getElementById('section-blog'),
    'sarkilar-remixler': document.getElementById('section-sarkilar-remixler'),
    hakkinda: document.getElementById('section-hakkinda')
  };

  const heroSection = document.getElementById('heroSection');
  const feedContainer = document.getElementById('feedContainer');
  const youtubeGrid = document.getElementById('youtubeGrid');
  const musicGrid = document.getElementById('musicGrid');
  const podcastList = document.getElementById('podcastList');
  const blogList = document.getElementById('blogList');

  // Sayaç DOM Elemanları
  const countAll = document.getElementById('countAll');
  const countYt = document.getElementById('countYt');
  const countMusic = document.getElementById('countMusic');
  const countPod = document.getElementById('countPod');
  const countBlog = document.getElementById('countBlog');

  // Arama Modalı DOM Elemanları
  const searchModal = document.getElementById('searchModal');
  const searchBackdrop = document.getElementById('searchBackdrop');
  const btnOpenSearch = document.getElementById('btnOpenSearch');
  const btnCloseSearch = document.getElementById('btnCloseSearch');
  const inputSearch = document.getElementById('inputSearch');
  const searchResults = document.getElementById('searchResults');

  // ------------------------------------------------------------------------
  // 2. NAVİGASYON VE SEKME YÖNETİMİ
  // ------------------------------------------------------------------------
  function switchTab(targetTab) {
    // Nav link aktiflik durumu
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.nav === targetTab) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Bölüm görünürlükleri
    Object.keys(pageSections).forEach(key => {
      const sec = pageSections[key];
      if (sec) {
        sec.style.display = (key === targetTab) ? 'block' : 'none';
      }
    });

    // Hero vitrini sadece 'anasayfa'dayken gösterilir
    if (heroSection) {
      heroSection.style.display = (targetTab === 'anasayfa') ? 'block' : 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = targetTab;

    // Mobil menü açıksa kapat
    const mobileDrawer = document.getElementById('mobileDrawer');
    if (mobileDrawer) mobileDrawer.classList.remove('active');
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.nav;
      if (target) switchTab(target);
    });
  });

  // Mobil Menü Butonu & Linkleri
  const btnMobileToggle = document.getElementById('btnMobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  if (btnMobileToggle && mobileDrawer) {
    btnMobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileDrawer.classList.toggle('active');
    });

    // Mobil menü dışına tıklandığında menüyü kapat
    document.addEventListener('click', (e) => {
      if (mobileDrawer.classList.contains('active')) {
        if (!mobileDrawer.contains(e.target) && !btnMobileToggle.contains(e.target)) {
          mobileDrawer.classList.remove('active');
        }
      }
    });
  }

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.nav;
      if (target) switchTab(target);
      if (mobileDrawer) mobileDrawer.classList.remove('active');
    });
  });

  // URL Hash kontrolü ile başlangıç sekmesi
  const initialHash = window.location.hash.replace('#', '');
  const customCatIds = (typeof siteData !== 'undefined' && siteData.categories) ? siteData.categories.map(c => c.id) : [];
  if (['anasayfa', 'youtube', 'podcast', 'blog', 'sarkilar-remixler', 'hakkinda'].includes(initialHash)) {
    switchTab(initialHash);
  } else {
    switchTab('anasayfa');
    if (customCatIds.includes(initialHash)) {
      setTimeout(() => {
        if (typeof filterFeedToCategory === 'function') filterFeedToCategory(initialHash);
      }, 100);
    }
  }

  // Header scroll efekti
  window.addEventListener('scroll', () => {
    const siteNav = document.getElementById('siteNav');
    if (siteNav) {
      if (window.scrollY > 40) {
        siteNav.classList.add('scrolled');
      } else {
        siteNav.classList.remove('scrolled');
      }
    }
  });

  // ------------------------------------------------------------------------
  // 3. TARİH AYRIŞTIRMA VE KRONOLOJİK SIRALAMA (EN YENİ İLK SIRADA)
  // ------------------------------------------------------------------------
  const trMonths = {
    ocak: 0, subat: 1, şubat: 1, mart: 2, nisan: 3, mayis: 4, mayıs: 4, haziran: 5,
    temmuz: 6, agustos: 7, ağustos: 7, eylul: 8, eylül: 8, ekim: 9, kasim: 10, kasım: 10, aralik: 11, aralık: 11
  };

  function parseDate(dateStr) {
    if (!dateStr) return 0;
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr).getTime();
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const monthName = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10);
      const month = trMonths[monthName] ?? 0;
      return new Date(year, month, day).getTime();
    }
    return new Date(dateStr).getTime() || 0;
  }

  if (typeof siteData !== 'undefined') {
    if (!siteData.categories) siteData.categories = [];

    // Kategorileri kendi içinde en yeni tarihten eskiye sırala
    if (siteData.videos) siteData.videos.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    if (siteData.music) siteData.music.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    if (siteData.podcasts) siteData.podcasts.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    if (siteData.articles) siteData.articles.sort((a, b) => parseDate(b.date) - parseDate(a.date));

    const customFeedItems = [];
    siteData.categories.forEach(cat => {
      if (Array.isArray(siteData[cat.id])) {
        siteData[cat.id].sort((a, b) => parseDate(b.date) - parseDate(a.date));
        siteData[cat.id].forEach(item => {
          customFeedItems.push({
            ...item,
            feedType: cat.id,
            categoryMeta: cat
          });
        });
      }
    });

    // Sayaçları ve İstatistik Bandını güncelle
    let totalCount = (siteData.videos?.length || 0) + 
                     (siteData.music?.length || 0) + 
                     (siteData.podcasts?.length || 0) + 
                     (siteData.articles?.length || 0);

    siteData.categories.forEach(cat => {
      totalCount += (siteData[cat.id]?.length || 0);
    });

    if (countAll) countAll.textContent = totalCount;
    if (countYt) countYt.textContent = siteData.videos?.length || 0;
    if (countMusic) countMusic.textContent = siteData.music?.length || 0;
    if (countPod) countPod.textContent = siteData.podcasts?.length || 0;
    if (countBlog) countBlog.textContent = siteData.articles?.length || 0;

    // Tüm içerikleri (Video, Müzik, Podcast, Blog, Özel Kategoriler) tek bir akışta birleştirip en yeni en üstte olacak şekilde sırala
    const unifiedFeedItems = [
      ...(siteData.videos || []).map(v => ({ ...v, feedType: 'youtube' })),
      ...(siteData.music || []).map(m => ({ ...m, feedType: 'music' })),
      ...(siteData.podcasts || []).map(p => ({ ...p, feedType: 'podcast' })),
      ...(siteData.articles || []).map(a => ({ ...a, feedType: 'blog' })),
      ...customFeedItems
    ].sort((a, b) => parseDate(b.date) - parseDate(a.date));

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;');
    }

    // Site Ayarlarını (Marka, Menü, Footer, Sosyal Medya) Uygula
    if (siteData.settings) {
      const s = siteData.settings;
      const brandName = s.brandName || 'AKCAN AKDAĞ';
      const navLabels = s.navLabels || {};

      document.querySelectorAll('.brand').forEach(brandEl => {
        brandEl.innerHTML = `${escapeHtml(brandName)} <span class="dot"></span>`;
      });

      const navMapping = {
        'anasayfa': navLabels.home || 'Anasayfa',
        'youtube': navLabels.youtube || 'Youtube',
        'podcast': navLabels.podcast || 'Podcast',
        'blog': navLabels.blog || 'Blog',
        'sarkilar-remixler': navLabels.music || 'Şarkılar & Remixler',
        'hakkinda': navLabels.about || 'Hakkında'
      };

      document.querySelectorAll('.nav-link, .mobile-link').forEach(link => {
        const navKey = link.dataset.nav;
        if (navKey && navMapping[navKey]) {
          link.textContent = navMapping[navKey];
        }
      });

      if (navLabels.youtube) {
        const btnYt = document.querySelector('#feedFilterPills [data-filter="youtube"]');
        if (btnYt) {
          const count = btnYt.querySelector('.count')?.outerHTML || '';
          btnYt.innerHTML = `${escapeHtml(navLabels.youtube)} ${count}`;
        }
        const secYt = document.querySelector('#section-youtube .section-label');
        if (secYt) secYt.textContent = navLabels.youtube;
      }
      if (navLabels.podcast) {
        const btnPod = document.querySelector('#feedFilterPills [data-filter="podcast"]');
        if (btnPod) {
          const count = btnPod.querySelector('.count')?.outerHTML || '';
          btnPod.innerHTML = `${escapeHtml(navLabels.podcast)} ${count}`;
        }
        const secPod = document.querySelector('#section-podcast .section-label');
        if (secPod) secPod.textContent = navLabels.podcast;
      }
      if (navLabels.blog) {
        const btnBlog = document.querySelector('#feedFilterPills [data-filter="blog"]');
        if (btnBlog) {
          const count = btnBlog.querySelector('.count')?.outerHTML || '';
          btnBlog.innerHTML = `${escapeHtml(navLabels.blog)} ${count}`;
        }
        const secBlog = document.querySelector('#section-blog .section-label');
        if (secBlog) secBlog.textContent = navLabels.blog;
      }
      if (navLabels.music) {
        const btnMusic = document.querySelector('#feedFilterPills [data-filter="music"]');
        if (btnMusic) {
          const count = btnMusic.querySelector('.count')?.outerHTML || '';
          btnMusic.innerHTML = `${escapeHtml(navLabels.music)} ${count}`;
        }
        const secMusic = document.querySelector('#section-sarkilar-remixler .section-label');
        if (secMusic) secMusic.textContent = navLabels.music;
      }

      const footerSettings = s.footer || {};
      const footerBrand = footerSettings.brand || brandName;
      const footerCopy = footerSettings.copy || '© 2026 AKCAN AKDAĞ · Kültür, teknoloji ve zihin haritaları.';

      const footerBrandEl = document.querySelector('.footer-brand');
      if (footerBrandEl) footerBrandEl.textContent = footerBrand;

      const footerCopyEl = document.querySelector('.footer-copy');
      if (footerCopyEl) footerCopyEl.textContent = footerCopy;

      if (s.socialLinks && s.socialLinks.length > 0) {
        const footerSocialEl = document.querySelector('.footer-social');
        if (footerSocialEl) {
          footerSocialEl.innerHTML = s.socialLinks
            .filter(item => item.url && item.platform)
            .map(item => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="social-link">${escapeHtml(item.platform)}</a>`)
            .join('\n');
        }
      }
    }

    // Hakkında Bilgilerini Dinamik Uygula
    if (siteData.about) {
      const a = siteData.about;
      const avatarImg = document.querySelector('#section-hakkinda .about-avatar-img');
      if (avatarImg && a.avatar) avatarImg.src = a.avatar;

      const badgeEl = document.querySelector('#section-hakkinda .about-badge');
      if (badgeEl && a.badge) badgeEl.textContent = a.badge;

      const nameEl = document.querySelector('#section-hakkinda .about-name');
      if (nameEl && a.name) nameEl.textContent = a.name;

      const leadEl = document.querySelector('#section-hakkinda .about-lead');
      if (leadEl && a.lead) leadEl.textContent = a.lead;
    }



    function getFallbackCover(item) {
      if (item && item.youtubeUrl) {
        const match = String(item.youtubeUrl).match(/(?:embed\/|v=|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
        if (match && match[1]) {
          return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
        }
      }
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
    }

    // En son eklenen içeriği dinamik olarak Hero Vitrini'ne bağla
    function setupHeroSection(item) {
      if (!item) return;
      const heroEyebrow = document.getElementById('heroEyebrow');
      const heroTitleLink = document.getElementById('heroTitleLink');
      const heroDesc = document.getElementById('heroDesc');
      const btnHeroWatch = document.getElementById('btnHeroWatch');
      const heroCoverImg = document.getElementById('heroCoverImg');
      const heroMediaLink = document.getElementById('heroMediaLink');
      const heroDuration = document.getElementById('heroDuration');

      const targetUrl = item.url || (
        item.feedType === 'youtube' ? `video/${item.slug}/index.html` :
        item.feedType === 'music' ? `muzik/${item.slug}/index.html` :
        item.feedType === 'podcast' ? `bolum/${item.episodeNumber}/index.html` :
        `yazi/${item.slug}/index.html`
      );

      if (item.feedType === 'youtube') {
        if (heroEyebrow) heroEyebrow.textContent = `Son Video · ${item.date}`;
        if (btnHeroWatch) {
          btnHeroWatch.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>İzle ve Oku</span>`;
          btnHeroWatch.href = targetUrl;
        }
      } else if (item.feedType === 'music') {
        if (heroEyebrow) heroEyebrow.textContent = `Son Müzik · ${item.date}`;
        if (btnHeroWatch) {
          btnHeroWatch.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Dinle ve Detaylar</span>`;
          btnHeroWatch.href = targetUrl;
        }
      } else if (item.feedType === 'podcast') {
        if (heroEyebrow) heroEyebrow.textContent = `Son Podcast · ${item.date}`;
        if (btnHeroWatch) {
          btnHeroWatch.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Dinle ve Oku</span>`;
          btnHeroWatch.href = targetUrl;
        }
      } else if (item.feedType === 'blog') {
        if (heroEyebrow) heroEyebrow.textContent = `Son Yazı · ${item.date}`;
        if (btnHeroWatch) {
          btnHeroWatch.innerHTML = `<span>Yazıyı Oku →</span>`;
          btnHeroWatch.href = targetUrl;
        }
      }

      if (heroTitleLink) {
        heroTitleLink.textContent = item.title;
        heroTitleLink.href = targetUrl;
      }
      if (heroDesc) {
        heroDesc.textContent = item.description || item.summary || '';
      }
      if (heroCoverImg && item.cover) {
        heroCoverImg.src = item.cover;
        heroCoverImg.alt = item.title;
        heroCoverImg.onerror = function() {
          this.onerror = null;
          this.src = getFallbackCover(item);
        };
      }
      if (heroMediaLink) {
        heroMediaLink.href = targetUrl;
      }
      if (heroDuration) {
        const dur = item.duration || item.readTime || (item.episodeNumber ? `Bölüm ${item.episodeNumber}` : '');
        heroDuration.textContent = dur;
        heroDuration.style.display = dur ? 'inline-block' : 'none';
      }
    }

    if (unifiedFeedItems.length > 0) {
      setupHeroSection(unifiedFeedItems[0]);
    }

    // ------------------------------------------------------------------------
    // 4. ANASAYFA / BİRLEŞİK AKIŞ LİSTESİ RENDER
    // ------------------------------------------------------------------------
    function renderFeed(filter = 'all') {
      if (!feedContainer) return;
      feedContainer.innerHTML = '';

      const filtered = unifiedFeedItems.filter(item => {
        if (filter === 'all') return true;
        return item.feedType === filter;
      });

      filtered.forEach(item => {
        const row = document.createElement('div');
        row.className = 'feed-row';

        const targetUrl = item.url || (
          item.feedType === 'youtube' ? `video/${item.slug}/index.html` :
          item.feedType === 'music' ? `muzik/${item.slug}/index.html` :
          item.feedType === 'podcast' ? `bolum/${item.episodeNumber}/index.html` :
          item.feedType === 'blog' ? `yazi/${item.slug}/index.html` :
          `kategori/${item.feedType}/${item.slug}/index.html`
        );

        let typeBadge = '';
        let thumbImg = item.cover;

        if (item.feedType === 'youtube') {
          typeBadge = `<span class="tag-pill type-yt">Youtube</span>`;
        } else if (item.feedType === 'music') {
          typeBadge = `<span class="tag-pill type-music">Müzik</span>`;
        } else if (item.feedType === 'podcast') {
          typeBadge = `<span class="tag-pill type-pod">Podcast</span>`;
        } else if (item.feedType === 'blog') {
          typeBadge = `<span class="tag-pill type-blog">Blog</span>`;
        } else if (item.categoryMeta) {
          typeBadge = `<span class="tag-pill type-custom" style="background: rgba(217, 119, 6, 0.15); color: #d97706; border-color: rgba(217, 119, 6, 0.3); font-weight: 500;">${item.categoryMeta.icon || '📁'} ${escapeHtml(item.categoryMeta.title)}</span>`;
        }

        const itemDesc = item.description || item.summary || '';
        const fallbackSrc = getFallbackCover(item);

        row.innerHTML = `
          <a href="${targetUrl}" class="row-thumb">
            <img src="${thumbImg}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
            <div class="play-badge">▶</div>
          </a>
          <div class="row-content">
            <div class="row-tags">
              ${typeBadge}
              ${item.tags ? item.tags.map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('') : ''}
            </div>
            <h3 class="row-title">
              <a href="${targetUrl}">${escapeHtml(item.title)}</a>
            </h3>
            ${itemDesc ? `<p class="row-desc">${escapeHtml(itemDesc)}</p>` : ''}
          </div>
          <div class="row-meta">
            <span class="row-date">${item.date}</span>
          </div>
        `;

        feedContainer.appendChild(row);
      });
    }

    // Özel Kategorileri Akış Filtrelerine Dinamik Ekle
    const feedFilterPills = document.getElementById('feedFilterPills');
    if (feedFilterPills && siteData.categories) {
      siteData.categories.forEach(cat => {
        if (cat.showInFeed !== false && !document.querySelector(`#feedFilterPills [data-filter="${cat.id}"]`)) {
          const catCount = siteData[cat.id]?.length || 0;
          const btn = document.createElement('button');
          btn.className = 'filter-pill';
          btn.dataset.filter = cat.id;
          btn.innerHTML = `${cat.icon ? cat.icon + ' ' : ''}${escapeHtml(cat.title)} <span class="count">${catCount}</span>`;
          btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            renderFeed(cat.id);
          });
          feedFilterPills.appendChild(btn);
        }
      });
    }

    // Özel Kategorileri Navbar ve Mobil Çekmeceye Ekle
    const navLinksUl = document.querySelector('.nav-links');
    const mobileDrawerContent = document.querySelector('.mobile-drawer-content');
    const hakkindaNavLink = document.querySelector('.nav-links [data-nav="hakkinda"]')?.closest('li');
    const hakkindaMobileLink = document.querySelector('.mobile-drawer-content [data-nav="hakkinda"]');

    if (siteData.categories) {
      siteData.categories.forEach(cat => {
        if (cat.showInNav !== false) {
          if (navLinksUl && !document.querySelector(`.nav-links [data-nav="${cat.id}"]`)) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#${cat.id}" class="nav-link" data-nav="${cat.id}">${cat.icon ? cat.icon + ' ' : ''}${escapeHtml(cat.title)}</a>`;
            const a = li.querySelector('a');
            a.addEventListener('click', (e) => {
              e.preventDefault();
              switchTab('anasayfa');
              filterFeedToCategory(cat.id);
            });
            if (hakkindaNavLink) {
              navLinksUl.insertBefore(li, hakkindaNavLink);
            } else {
              navLinksUl.appendChild(li);
            }
          }

          if (mobileDrawerContent && !document.querySelector(`.mobile-drawer-content [data-nav="${cat.id}"]`)) {
            const mLink = document.createElement('a');
            mLink.href = `#${cat.id}`;
            mLink.className = 'mobile-link';
            mLink.dataset.nav = cat.id;
            mLink.innerHTML = `${cat.icon ? cat.icon + ' ' : ''}${escapeHtml(cat.title)}`;
            mLink.addEventListener('click', (e) => {
              e.preventDefault();
              switchTab('anasayfa');
              filterFeedToCategory(cat.id);
              if (mobileDrawer) mobileDrawer.classList.remove('active');
            });
            if (hakkindaMobileLink) {
              mobileDrawerContent.insertBefore(mLink, hakkindaMobileLink);
            } else {
              mobileDrawerContent.appendChild(mLink);
            }
          }
        }
      });
    }

    function filterFeedToCategory(catId) {
      const pill = document.querySelector(`#feedFilterPills [data-filter="${catId}"]`);
      if (pill) {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      }
      renderFeed(catId);
      const pillsEl = document.getElementById('feedFilterPills');
      if (pillsEl) {
        pillsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    window.filterFeedToCategory = filterFeedToCategory;

    renderFeed('all');

    // Akış Filtreleme Butonları Dinleyicisi
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderFeed(pill.dataset.filter);
      });
    });

    // ------------------------------------------------------------------------
    // 5. YOUTUBE GRID RENDER
    // ------------------------------------------------------------------------
    function renderYoutubeSection() {
      if (!youtubeGrid || !siteData.videos) return;
      youtubeGrid.innerHTML = '';
      siteData.videos.forEach(v => {
        const targetUrl = v.url || `video/${v.slug}/index.html`;
        const fallbackSrc = getFallbackCover(v);
        const card = document.createElement('div');
        card.className = 'yt-card';
        card.innerHTML = `
          <a href="${targetUrl}" class="yt-card-media">
            <img src="${v.cover}" alt="${escapeHtml(v.title)}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
            <div class="play-badge" style="width: 44px; height: 44px; font-size: 1.1rem;">▶</div>
          </a>
          <div class="yt-card-body">
            <div class="yt-card-meta">
              <span>${v.date}</span>
              <div style="display:flex; gap:0.3rem;">
                ${v.tags ? v.tags.map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('') : ''}
              </div>
            </div>
            <h3 class="yt-card-title">
              <a href="${targetUrl}">${escapeHtml(v.title)}</a>
            </h3>
            <p class="yt-card-desc">${escapeHtml(v.description)}</p>
            <div class="yt-card-footer">
              <a href="${targetUrl}" class="btn-primary btn-sm">
                İzle ve Oku
              </a>
            </div>
          </div>
        `;
        youtubeGrid.appendChild(card);
      });
    }
    renderYoutubeSection();

    // ------------------------------------------------------------------------
    // 6. ŞARKILAR & REMİXLER GRID RENDER
    // ------------------------------------------------------------------------
    function renderMusicSection() {
      if (!musicGrid || !siteData.music) return;
      musicGrid.innerHTML = '';
      siteData.music.forEach(m => {
        const targetUrl = m.url || `muzik/${m.slug}/index.html`;
        const fallbackSrc = getFallbackCover(m);
        const card = document.createElement('div');
        card.className = 'music-card';
        card.innerHTML = `
          <a href="${targetUrl}" class="music-card-media">
            <img src="${m.cover}" alt="${escapeHtml(m.title)}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
            <span class="music-type-badge">${escapeHtml(m.type || 'Remix')}</span>
            <div class="play-badge" style="width: 44px; height: 44px; font-size: 1.1rem;">▶</div>
          </a>
          <div class="music-card-body">
            <div class="music-card-meta">
              <span>${m.date}</span>
              <div style="display:flex; gap:0.3rem;">
                ${m.tags ? m.tags.map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('') : ''}
              </div>
            </div>
            <h3 class="music-card-title">
              <a href="${targetUrl}">${escapeHtml(m.title)}</a>
            </h3>
            <p class="music-card-desc">${escapeHtml(m.description)}</p>
            <div class="music-card-footer">
              <a href="${targetUrl}" class="btn-primary btn-sm">
                Dinle ve Detaylar
              </a>
              ${m.youtubeMusicUrl ? `
                <a href="${m.youtubeMusicUrl}" target="_blank" rel="noopener" class="btn-yt-music" title="YouTube Music'te Aç">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  <span>YT Music</span>
                </a>
              ` : ''}
            </div>
          </div>
        `;
        musicGrid.appendChild(card);
      });
    }
    renderMusicSection();

    // ------------------------------------------------------------------------
    // 7. PODCAST LİSTESİ RENDER
    // ------------------------------------------------------------------------
    function renderPodcastSection() {
      if (!podcastList || !siteData.podcasts) return;
      podcastList.innerHTML = '';
      siteData.podcasts.forEach(p => {
        const targetUrl = p.url || `bolum/${p.episodeNumber}/index.html`;
        const fallbackSrc = getFallbackCover(p);
        const card = document.createElement('div');
        card.className = 'podcast-card';
        card.id = `pod-card-${p.id}`;
        card.innerHTML = `
          <a href="${targetUrl}" class="podcast-cover-wrap">
            <img src="${p.cover}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
            <div class="podcast-play-btn">▶</div>
          </a>
          <div class="podcast-info">
            <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom: 0.4rem;">
              <span class="row-date">${p.date}</span>
            </div>
            <h3 class="podcast-title">
              <a href="${targetUrl}">${escapeHtml(p.title)}</a>
            </h3>
            <p class="podcast-desc">${escapeHtml(p.description)}</p>
          </div>
          <div class="podcast-actions">
            <a href="${targetUrl}" class="btn-primary btn-sm">
              Dinle ve Oku
            </a>
          </div>
        `;
        podcastList.appendChild(card);
      });
    }
    renderPodcastSection();

    // ------------------------------------------------------------------------
    // 8. BLOG LİSTESİ RENDER
    // ------------------------------------------------------------------------
    function renderBlogSection() {
      if (!blogList || !siteData.articles) return;
      blogList.innerHTML = '';
      siteData.articles.forEach(a => {
        const targetUrl = a.url || `yazi/${a.slug}/index.html`;
        const card = document.createElement('div');
        card.className = 'blog-card';
        card.innerHTML = `
          <div class="blog-card-head">
            <span class="row-date">${a.date}</span>
          </div>
          <h2 class="blog-card-title">
            <a href="${targetUrl}">${a.title}</a>
          </h2>
          <p class="blog-card-summary">${a.summary}</p>
          <div class="blog-card-footer">
            <div class="row-tags">
              ${a.tags ? a.tags.map(t => `<span class="tag-pill">${t}</span>`).join('') : ''}
            </div>
            <a href="${targetUrl}" class="read-more-link">Yazıyı Oku →</a>
          </div>
        `;
        blogList.appendChild(card);
      });
    }
    renderBlogSection();
  }

  // ------------------------------------------------------------------------
  // 9. HIZLI ARAMA SİSTEMİ (CMD+K / ARAMA MODALI)
  // ------------------------------------------------------------------------
  if (searchModal && inputSearch && searchResults) {
    function openSearch() {
      searchModal.classList.add('active');
      document.body.classList.add('modal-open');
      inputSearch.value = '';
      renderSearchResults('');
      setTimeout(() => inputSearch.focus(), 50);
    }

    function closeSearch() {
      searchModal.classList.remove('active');
      document.body.classList.remove('modal-open');
    }

    if (btnOpenSearch) btnOpenSearch.addEventListener('click', openSearch);
    if (btnCloseSearch) btnCloseSearch.addEventListener('click', closeSearch);
    if (searchBackdrop) searchBackdrop.addEventListener('click', closeSearch);

    // Kısayollar (Cmd+K, Ctrl+K veya Escape)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchModal.classList.contains('active') ? closeSearch() : openSearch();
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    });

    inputSearch.addEventListener('input', (e) => {
      renderSearchResults(e.target.value.trim());
    });

    function renderSearchResults(query) {
      searchResults.innerHTML = '';
      if (!query) {
        searchResults.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Yazı, video, şarkı veya podcast aramak için yazmaya başlayın...</div>`;
        return;
      }

      if (typeof siteData === 'undefined') return;

      const q = query.toLowerCase();
      const results = [];

      // Videolar
      (siteData.videos || []).forEach(v => {
        if (v.title.toLowerCase().includes(q) || (v.description && v.description.toLowerCase().includes(q))) {
          results.push({
            title: v.title,
            resType: 'Youtube Videosu',
            url: v.url || `video/${v.slug}/index.html`
          });
        }
      });

      // Şarkılar & Remixler
      (siteData.music || []).forEach(m => {
        if (m.title.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q)) || (m.type && m.type.toLowerCase().includes(q))) {
          results.push({
            title: m.title,
            resType: 'Şarkı & Remix',
            url: m.url || `muzik/${m.slug}/index.html`
          });
        }
      });

      // Podcastler
      (siteData.podcasts || []).forEach(p => {
        if (p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))) {
          results.push({
            title: p.title,
            resType: 'Podcast Bölümü',
            url: p.url || `bolum/${p.episodeNumber}/index.html`
          });
        }
      });

      // Makaleler
      (siteData.articles || []).forEach(a => {
        if (a.title.toLowerCase().includes(q) || (a.summary && a.summary.toLowerCase().includes(q))) {
          results.push({
            title: a.title,
            resType: 'Haftalık Blog',
            url: a.url || `yazi/${a.slug}/index.html`
          });
        }
      });

      // Özel Kategoriler
      (siteData.categories || []).forEach(cat => {
        (siteData[cat.id] || []).forEach(item => {
          if (item.title.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q)) || (item.summary && item.summary.toLowerCase().includes(q))) {
            results.push({
              title: item.title,
              resType: `${cat.icon || '📁'} ${cat.title}`,
              url: item.url || `kategori/${cat.id}/${item.slug}/index.html`
            });
          }
        });
      });

      // Hakkında Eşleşmesi
      if ('hakkında'.includes(q) || 'kimdir'.includes(q) || 'biyografi'.includes(q) || 'iletişim'.includes(q) || 'akcan akdağ'.includes(q)) {
        results.unshift({
          title: 'AKCAN AKDAĞ — Hakkımda (Biyografi & Hikâye)',
          resType: 'Sayfa',
          url: '#hakkinda'
        });
      }

      if (results.length === 0) {
        searchResults.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">"${query}" ile eşleşen içerik bulunamadı.</div>`;
        return;
      }

      results.forEach(res => {
        const item = document.createElement('a');
        item.href = res.url;
        item.className = 'search-item';
        item.style.textDecoration = 'none';
        item.innerHTML = `
          <span class="search-item-title">${res.title}</span>
          <span class="search-item-type">${res.resType}</span>
        `;
        item.addEventListener('click', (e) => {
          closeSearch();
          if (res.url.startsWith('#')) {
            e.preventDefault();
            switchTab(res.url.replace('#', ''));
          }
        });
        searchResults.appendChild(item);
      });
    }
  }
});
