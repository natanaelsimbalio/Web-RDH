(() => {
  // Header background swap on scroll
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav toggle
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobile-nav');
  burger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.classList.toggle('active', open);
  });
  mobileNav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    })
  );

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Highlight a catalog card when jumped to via anchor (e.g. marquee links)
  const highlightCard = (hash) => {
    const target = document.querySelector(hash);
    if (!target || !target.classList.contains('cat-card')) return;
    target.classList.add('pulse');
    setTimeout(() => target.classList.remove('pulse'), 1400);
  };
  document.querySelectorAll('a[href^="#cat-"]').forEach(a =>
    a.addEventListener('click', () => highlightCard(a.getAttribute('href')))
  );
  if (location.hash) highlightCard(location.hash);

  // PDP gallery: crossfade the main image on thumbnail click, and bring the
  // clicked photo to the foreground in a lightbox instead of a static swap.
  const pdpMainWrap = document.querySelector('.pdp-gallery-main');
  const pdpMain = pdpMainWrap ? pdpMainWrap.querySelector('img') : null;
  const pdpThumbs = document.querySelectorAll('.pdp-gallery-thumbs button');
  const pdpLightbox = document.getElementById('pdpLightbox');
  const pdpLightboxImg = pdpLightbox ? pdpLightbox.querySelector('img') : null;

  const setMainImage = (src, alt) => {
    pdpMain.classList.add('is-switching');
    setTimeout(() => {
      pdpMain.setAttribute('src', src);
      pdpMain.setAttribute('alt', alt);
      requestAnimationFrame(() => pdpMain.classList.remove('is-switching'));
    }, 200);
  };

  if (pdpMain && pdpThumbs.length) {
    pdpThumbs.forEach(btn => btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      setMainImage(img.getAttribute('src'), img.getAttribute('alt'));
      pdpThumbs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }));
  }

  if (pdpMainWrap && pdpLightbox && pdpLightboxImg) {
    const openLightbox = () => {
      pdpLightboxImg.setAttribute('src', pdpMain.getAttribute('src'));
      pdpLightboxImg.setAttribute('alt', pdpMain.getAttribute('alt'));
      pdpLightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      pdpLightbox.classList.remove('open');
      document.body.style.overflow = '';
    };
    pdpMainWrap.addEventListener('click', openLightbox);
    pdpLightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }
})();
