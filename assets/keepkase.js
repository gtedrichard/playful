/* KeepKase — Custom JS
   Drag + snap, squiggle animation, reveal on scroll,
   accordion, slideshow, cart drawer, gallery, FAQ
   ========================================= */

(function() {
  'use strict';

  /* ── REVEAL ON SCROLL ── */
  function initReveal() {
    const els = document.querySelectorAll('.kk-reveal');
    if (!els.length) return;
    const io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('kk-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });
    els.forEach(function(el) { io.observe(el); });
  }

  /* ── DRAG + SPRING SNAP ── */
  function makeDraggable(el) {
    if (!el) return;
    let dragging = false, dx = 0, dy = 0, sx, sy;
    
    el.addEventListener('mousedown', function(e) {
      // Don't capture clicks on buttons or links
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.tagName === 'INPUT') return;
      dragging = true;
      el.classList.add('kk-dragging');
      el.style.transition = 'none';
      el.style.zIndex = '300';
      sx = e.clientX - dx;
      sy = e.clientY - dy;
      e.preventDefault();
    });

    window.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      dx = e.clientX - sx;
      dy = e.clientY - sy;
      var rot = dx * 0.018;
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.05) rotate(' + rot + 'deg)';
    });

    window.addEventListener('mouseup', function() {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('kk-dragging');
      el.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease';
      el.style.transform = '';
      el.style.zIndex = '';
      dx = 0; dy = 0;
      setTimeout(function() {
        if (!dragging) el.style.transition = '';
      }, 600);
    });
  }

  /* ── SQUIGGLE ANIMATION ── */
  function animateSquiggle(pathId, baseX, amp, freq, phase) {
    var el = document.getElementById(pathId);
    if (!el) return;
    var t = phase || 0;
    var yStep = 100;
    var segs = 6;
    function frame() {
      t += 0.006;
      var d = 'M' + baseX + ' 0';
      for (var i = 0; i < segs; i++) {
        var y1 = i * yStep + yStep / 2;
        var y2 = (i + 1) * yStep;
        var shift = Math.sin(t * freq + i * 0.8) * amp;
        d += ' Q' + (baseX + shift) + ' ' + y1 + ' ' + baseX + ' ' + y2;
      }
      el.setAttribute('d', d);
      requestAnimationFrame(frame);
    }
    frame();
  }

  /* ── ACCORDION / FAQ ── */
  function initAccordions() {
    document.querySelectorAll('.kk-accordion-toggle, .kk-faq-q').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var body = this.nextElementSibling;
        var isOpen = this.classList.contains('open');
        this.classList.toggle('open', !isOpen);
        if (body) body.classList.toggle('open', !isOpen);
      });
    });
  }

  /* ── SLIDESHOW ── */
  function initSlideshows() {
    document.querySelectorAll('.kk-slideshow').forEach(function(ss) {
      var slides = ss.querySelectorAll('.kk-slide');
      var dots = ss.querySelectorAll('.kk-slide-dot');
      if (!slides.length) return;
      var current = 0;
      var timer;

      function goTo(idx) {
        slides[current].classList.remove('active');
        dots[current] && dots[current].classList.remove('active');
        current = (idx + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current] && dots[current].classList.add('active');
      }

      dots.forEach(function(dot, i) {
        dot.addEventListener('click', function() { goTo(i); resetTimer(); });
      });

      var prev = ss.querySelector('.kk-slide-prev');
      var next = ss.querySelector('.kk-slide-next');
      if (prev) prev.addEventListener('click', function() { goTo(current - 1); resetTimer(); });
      if (next) next.addEventListener('click', function() { goTo(current + 1); resetTimer(); });

      function resetTimer() {
        clearInterval(timer);
        timer = setInterval(function() { goTo(current + 1); }, 5000);
      }

      goTo(0);
      resetTimer();
    });
  }

  /* ── PRODUCT PAGE ── */
  function initProductPage() {
    // Thumbnail gallery
    document.querySelectorAll('.kk-product-thumb').forEach(function(thumb) {
      thumb.addEventListener('click', function() {
        var src = this.getAttribute('data-src');
        var mainImg = document.querySelector('.kk-product-main-img img');
        if (mainImg && src) mainImg.src = src;
        document.querySelectorAll('.kk-product-thumb').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    // Quantity buttons
    var qtyInput = document.querySelector('.kk-qty-input');
    if (qtyInput) {
      document.querySelector('.kk-qty-minus') && document.querySelector('.kk-qty-minus').addEventListener('click', function() {
        var v = parseInt(qtyInput.value) || 1;
        if (v > 1) qtyInput.value = v - 1;
      });
      document.querySelector('.kk-qty-plus') && document.querySelector('.kk-qty-plus').addEventListener('click', function() {
        qtyInput.value = (parseInt(qtyInput.value) || 1) + 1;
      });
    }

    // Variant selection
    document.querySelectorAll('.kk-variant-option').forEach(function(opt) {
      opt.addEventListener('click', function() {
        var group = this.closest('.kk-variant-options');
        group.querySelectorAll('.kk-variant-option').forEach(function(o) { o.classList.remove('selected'); });
        this.classList.add('selected');
      });
    });
  }

  /* ── CART DRAWER ── */
  function initCartDrawer() {
    var drawer = document.querySelector('.kk-cart-drawer');
    var overlay = document.querySelector('.kk-cart-drawer-overlay');
    if (!drawer) return;

    function openDrawer() {
      drawer.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-cart-drawer-open]').forEach(function(btn) {
      btn.addEventListener('click', openDrawer);
    });
    var closeBtn = drawer.querySelector('.kk-cart-drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);
  }

  /* ── VIDEO SECTION ── */
  function initVideos() {
    document.querySelectorAll('.kk-video-placeholder').forEach(function(placeholder) {
      placeholder.addEventListener('click', function() {
        var wrap = this.closest('.kk-video-wrap');
        var videoId = wrap.getAttribute('data-video-id');
        var videoType = wrap.getAttribute('data-video-type') || 'youtube';
        if (!videoId) return;
        var iframe = document.createElement('iframe');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'autoplay; encrypted-media');
        if (videoType === 'youtube') {
          iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
        } else {
          iframe.src = 'https://player.vimeo.com/video/' + videoId + '?autoplay=1';
        }
        this.style.display = 'none';
        wrap.appendChild(iframe);
      });
    });
  }

  /* ── MOBILE NAV ── */
  function initMobileNav() {
    var toggle = document.querySelector('.kk-nav-mobile-toggle');
    var navLinks = document.querySelector('.kk-nav-links');
    if (!toggle || !navLinks) return;
    toggle.addEventListener('click', function() {
      var isOpen = navLinks.style.display === 'flex';
      navLinks.style.display = isOpen ? '' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '100%';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'var(--kk-bg)';
      navLinks.style.padding = '12px';
      navLinks.style.borderBottom = '2px solid var(--kk-ink)';
      navLinks.style.zIndex = '99';
      if (isOpen) {
        navLinks.style.display = '';
      }
    });
  }

  /* ── ANNOUNCEMENT BAR DISMISS ── */
  function initAnnouncement() {
    var closeBtn = document.querySelector('.kk-announcement-close');
    if (!closeBtn) return;
    closeBtn.addEventListener('click', function() {
      var bar = this.closest('.kk-announcement');
      if (bar) {
        bar.style.transition = 'max-height .3s ease, opacity .3s ease';
        bar.style.maxHeight = '0';
        bar.style.opacity = '0';
        bar.style.overflow = 'hidden';
        setTimeout(function() { bar.remove(); }, 300);
      }
    });
  }

  /* ── INIT ALL ── */
  function init() {
    initReveal();
    initAccordions();
    initSlideshows();
    initProductPage();
    initCartDrawer();
    initVideos();
    initMobileNav();
    initAnnouncement();

    // Squiggles
    animateSquiggle('kk-sq-hl1', 15, 22, 0.7, 0);
    animateSquiggle('kk-sq-hl2', 42, 18, 0.9, 1.5);
    animateSquiggle('kk-sq-hr1', 20, 28, 0.75, 0.5);
    animateSquiggle('kk-sq-hr2', 50, 20, 1.0, 2);
    animateSquiggle('kk-sq-pp1', 15, 20, 0.65, 1);
    animateSquiggle('kk-sq-pp2', 45, 15, 0.8, 2.5);

    // Draggable elements
    var mac = document.getElementById('kk-mac-wrap');
    if (mac) makeDraggable(mac);

    var logo = document.getElementById('kk-logo');
    if (logo) makeDraggable(logo);

    var footerLogo = document.getElementById('kk-footer-logo');
    if (footerLogo) makeDraggable(footerLogo);

    document.querySelectorAll('.kk-draggable').forEach(makeDraggable);

    document.querySelectorAll('.kk-sticker').forEach(function(s, i) {
      s.style.animationDelay = (0.6 + i * 0.15) + 's';
      makeDraggable(s);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
