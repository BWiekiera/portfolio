/* ============================================================
   MAIN.JS — Bernardeta Wiekiera Portfolio
   Obsługa języka, nawigacji, animacji i interakcji.
   ============================================================ */

/* ----- ZARZĄDZANIE JĘZYKIEM ----- */

let currentLang = localStorage.getItem('bw-lang') || 'pl';

/**
 * Aplikuje tłumaczenia do wszystkich elementów [data-i18n].
 * Dla elementów [data-i18n-html] ustawia innerHTML (np. linki w tekście).
 */
function applyTranslations(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('bw-lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key] !== undefined) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (translations[lang][key] !== undefined) {
      el.innerHTML = translations[lang][key];
    }
  });

  // Aktualizuj atrybut lang na <html>
  document.documentElement.lang = lang;

  // Aktualizuj etykietę przycisku języka
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = translations[lang]['lang_label'];

  // Odbuduj tagi z kluczem tłumaczenia (data-i18n-tags).
  // data-tag-variant: klasa CSS tagu (domyślnie "tag")
  document.querySelectorAll('[data-i18n-tags]').forEach(el => {
    const key     = el.getAttribute('data-i18n-tags');
    const variant = el.getAttribute('data-tag-variant') || 'tag';
    if (translations[lang][key]) {
      const tags = translations[lang][key].split(',');
      el.innerHTML = tags.map(t => `<span class="${variant}">${t.trim()}</span>`).join('');
    }
  });
}

function toggleLanguage() {
  applyTranslations(currentLang === 'pl' ? 'en' : 'pl');
}

/* ----- HAMBURGER MENU ----- */

function initHamburger() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('nav-menu');
  if (!btn || !menu) return;

  const closeMenu = () => {
    btn.classList.remove('active');
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  const toggleMenu = () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('active', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Zamknij menu po kliknięciu linku lub przycisku języka
  menu.querySelectorAll('a, button').forEach(item => {
    item.addEventListener('click', closeMenu);
  });

  // Zamknij po kliknięciu poza menu
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      closeMenu();
    }
  });

  // Zamknij po naciśnięciu Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  // Po rozszerzeniu okna do wersji desktopowej menu nie powinno zostać otwarte
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

/* ----- EFEKT SCROLLOWANIA NAVBARU ----- */

function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ----- SMOOTH SCROLL DLA KOTW ANCHORÓW ----- */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });
}

/* ----- ANIMACJA FADE-IN PRZY SCROLLU ----- */

function initFadeIn() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ----- NAWIGACJA BOCZNA CASE STUDY ----- */

function initSidebarNav() {
  const links = document.querySelectorAll('.cs-sidebar-nav a');
  if (!links.length) return;

  const sections = document.querySelectorAll('.cs-section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ----- AKTYWNY LINK NAWIGACJI ----- */

function setActiveNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    const page = link.getAttribute('data-page');
    const isActive =
      (page === 'home' && (path.endsWith('index.html') || path.endsWith('/') || path === '')) ||
      (page === 'portfolio' && path.includes('portfolio')) ||
      (page === 'cert' && path.includes('certificates')) ||
      (page === 'project' && path.includes('project'));
    link.classList.toggle('active', isActive);
  });
}

/* ----- KARUZELA PROJEKTÓW ----- */

function initCarousel() {
  const stage   = document.getElementById('proj-stage');
  const prevBtn = document.getElementById('proj-prev');
  const nextBtn = document.getElementById('proj-next');
  const dotsEl  = document.getElementById('proj-dots');
  if (!stage || !prevBtn || !nextBtn) return;

  const track = stage.querySelector('.carousel-track');
  if (!track) return;

  const origCards = Array.from(track.querySelectorAll('.project-card'));
  const total = origCards.length;
  if (!total) return;

  // 2 klony z każdej strony — przy 1 klonie brakuje sąsiada gdy klon jest aktywny
  // Układ: [klon(n-2), klon(n-1), orig0..origN, klon(0), klon(1)]
  const LEAD = 2, TRAIL = 2;

  for (let i = total - 1; i >= total - LEAD; i--) {
    const c = origCards[i].cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
    track.insertBefore(c, origCards[0]);
  }
  for (let i = 0; i < TRAIL; i++) {
    const c = origCards[i].cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
    track.appendChild(c);
  }

  // allCards: [klon, klon, orig0, orig1, orig2, klon, klon]
  const allCards = Array.from(track.querySelectorAll('.project-card'));

  let physIdx  = LEAD;  // zaczyna na pierwszej realnej karcie
  let virtIdx  = 0;
  let animating = false;
  let startX   = 0;
  let dragging = false;
  let cardStep = 0; // odległość między lewymi krawędziami kolejnych kart (< cardW = nakładanie)

  function setCardWidths() {
    const stageW = stage.offsetWidth;
    let cardW, step;
    if (window.innerWidth <= 768) {
      cardW = Math.floor(stageW * 0.80);
      step  = cardW + 20; // mały odstęp na mobile
    } else {
      cardW = Math.floor(stageW * 0.58);
      step  = Math.floor(stageW * 0.38); // krok < cardW → karty się nakładają
    }
    cardStep = step;
    const marginR = step - cardW; // ujemny na desktopie = nakładanie
    allCards.forEach(c => {
      c.style.width       = cardW + 'px';
      c.style.marginRight = marginR + 'px';
    });
  }

  function updateHeight() {
    const h = origCards[0].offsetHeight;
    stage.style.height = Math.ceil(h * 1.12 + 32) + 'px';
  }

  function calcOffset() {
    const stageW = stage.offsetWidth;
    const cardW  = origCards[0].offsetWidth;
    return stageW / 2 - (physIdx * cardStep + cardW / 2);
  }

  function moveTrack(animated) {
    if (animated) {
      track.classList.add('is-animating');
      void track.offsetWidth;  // wymuś recalc żeby transition był aktywny przed zmianą transform
    } else {
      track.classList.remove('is-animating');
    }
    track.style.transform = `translateX(${calcOffset()}px)`;
  }

  function updateClasses() {
    allCards.forEach((card, i) => {
      card.classList.remove('cs-active', 'cs-prev', 'cs-next', 'cs-hidden');
      const d = i - physIdx;
      if      (d === 0)  card.classList.add('cs-active');
      else if (d === 1)  card.classList.add('cs-next');
      else if (d === -1) card.classList.add('cs-prev');
      else               card.classList.add('cs-hidden');
    });
  }

  function updateDots() {
    if (!dotsEl) return;
    dotsEl.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === virtIdx);
    });
  }

  function applyState() { updateClasses(); updateDots(); }

  // Po animacji: cichy skok z klona na realną kartę
  track.addEventListener('transitionend', e => {
    if (e.propertyName !== 'transform' || e.target !== track) return;
    track.classList.remove('is-animating');
    if (physIdx < LEAD || physIdx >= LEAD + total) {
      if (physIdx < LEAD) physIdx += total;
      else physIdx -= total;
      // Wyłącz transitions na kartach — bez tego karta animuje się z cs-hidden do cs-active (widoczny "skok")
      stage.classList.add('is-jumping');
      moveTrack(false);
      applyState();
      void stage.offsetWidth; // wymuś commit wszystkich zmian przed re-włączeniem transitions
      stage.classList.remove('is-jumping');
    }
    animating = false;
  });

  function navigate(dir) {
    if (animating) return;
    animating = true;
    physIdx += dir;
    virtIdx = ((virtIdx + dir) % total + total) % total;
    moveTrack(true);
    applyState();
  }

  const next = () => navigate(+1);
  const prev = () => navigate(-1);

  prevBtn.disabled = false;
  nextBtn.disabled = false;
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Kliknięcie bocznej karty
  allCards.forEach((card, j) => {
    const isClone = j < LEAD || j >= LEAD + total;
    card.addEventListener('click', e => {
      if (card.classList.contains('cs-next'))      { e.preventDefault(); next(); }
      else if (card.classList.contains('cs-prev')) { e.preventDefault(); prev(); }
      else if (isClone)                            { e.preventDefault(); }
    });
  });

  // Kropki
  if (dotsEl) {
    dotsEl.querySelectorAll('.carousel-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const target = Number(dot.dataset.index);
        if (target === virtIdx || animating) return;
        const dir = ((target - virtIdx + total) % total) <= total / 2 ? 1 : -1;
        navigate(dir);
      });
    });
  }

  // Klawiatura
  document.addEventListener('keydown', e => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
  });

  // Swipe / drag
  stage.addEventListener('pointerdown', e => { startX = e.clientX; dragging = true; });
  window.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;
    const diff = startX - e.clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  });
  window.addEventListener('pointercancel', () => { dragging = false; });

  // Resize
  window.addEventListener('resize', () => {
    setCardWidths();
    moveTrack(false);
    updateHeight();
  }, { passive: true });

  // Init
  setCardWidths();
  moveTrack(false);
  applyState();
  updateHeight();
}

/* ----- LIGHTBOX CERTYFIKATÓW ----- */

function initCertLightbox() {
  const lightbox    = document.getElementById('cert-lightbox');
  const lightboxImg = document.getElementById('cert-lightbox-img');
  const closeBtn    = document.getElementById('cert-lightbox-close');
  if (!lightbox || !lightboxImg) return;

  const certList = document.querySelector('.cert-list');
  if (certList) {
    certList.addEventListener('click', e => {
      const container = e.target.closest('.cert-card-img');
      if (!container || container.classList.contains('cert-img-missing')) return;
      const img = container.querySelector('img');
      if (!img) return;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  const close = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) close();
  });
}

/* ----- INICJALIZACJA ----- */

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations(currentLang);
  initHamburger();
  initNavScroll();
  initSmoothScroll();
  initFadeIn();
  initCarousel();
  initSidebarNav();
  initCertLightbox();
  setActiveNavLink();

  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.addEventListener('click', toggleLanguage);
});
