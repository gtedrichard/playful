/* ============================================================================
   KEEPKASE — THEME.JS
   Shared front-end behavior for the whole theme.
   No dependencies. Safe to load in <head> with defer.
   - Scroll reveal
   - Animated SVG squiggles
   - Draggable elements with spring snap-back (the signature toy)
   - Mobile menu
   - Shopify AJAX cart drawer (add / change / remove / render)
   - Qty steppers, toasts, product gallery + variant swatches, marquee a11y
   ========================================================================== */
(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- tiny helpers ----------------------------------------------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  window.KK = window.KK || {};
  KK.esc = esc;

  /* ---- reveal on scroll ------------------------------------------------- */
  function initReveal() {
    var els = $$('.rv');
    if (!('IntersectionObserver' in window) || prefersReduced) {
      els.forEach(function (el) { el.classList.add('on'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
      });
    }, { threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---- animated squiggles ----------------------------------------------- */
  function animateSquiggle(pathId, baseX, amp, freq, phase) {
    var el = document.getElementById(pathId);
    if (!el || prefersReduced) return;
    var t = phase || 0, yStep = 100, segs = 6;
    (function frame() {
      t += 0.006;
      var d = 'M' + baseX + ' 0';
      for (var i = 0; i < segs; i++) {
        var y1 = i * yStep + yStep / 2, y2 = (i + 1) * yStep;
        var shift = Math.sin(t * freq + i * 0.8) * amp;
        d += ' Q' + (baseX + shift) + ' ' + y1 + ' ' + baseX + ' ' + y2;
      }
      el.setAttribute('d', d);
      requestAnimationFrame(frame);
    })();
  }
  function initSquiggles() {
    [['sqHL1', 15, 22, .7, 0], ['sqHL2', 42, 18, .9, 1.5], ['sqHL3', 68, 14, .6, 3],
     ['sqHR1', 20, 28, .75, .5], ['sqHR2', 50, 20, 1.0, 2],
     ['sqPP1', 15, 20, .65, 1], ['sqPP2', 45, 15, .8, 2.5]
    ].forEach(function (a) { animateSquiggle(a[0], a[1], a[2], a[3], a[4]); });
  }

  /* ---- draggable with spring snap-back ---------------------------------- */
  function makeDraggable(el) {
    if (!el) return;
    var dragging = false, dx = 0, dy = 0, sx, sy, moved = false;
    function down(clientX, clientY, e) {
      dragging = true; moved = false;
      el.classList.add('dragging');
      el.style.transition = 'none';
      sx = clientX - dx; sy = clientY - dy;
      el.style.zIndex = '300';
      if (e && e.cancelable) e.preventDefault();
    }
    function move(clientX, clientY) {
      if (!dragging) return;
      dx = clientX - sx; dy = clientY - sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      var rot = dx * 0.02;
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.05) rotate(' + rot + 'deg)';
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      el.style.transition = 'transform .55s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease';
      el.style.transform = '';
      el.style.zIndex = '';
      dx = 0; dy = 0;
      setTimeout(function () { el.style.transition = ''; }, 600);
    }
    on(el, 'mousedown', function (e) { down(e.clientX, e.clientY, e); });
    on(window, 'mousemove', function (e) { move(e.clientX, e.clientY); });
    on(window, 'mouseup', up);
    on(el, 'touchstart', function (e) { var t = e.touches[0]; down(t.clientX, t.clientY, e); }, { passive: false });
    on(window, 'touchmove', function (e) { if (dragging) { var t = e.touches[0]; move(t.clientX, t.clientY); e.preventDefault(); } }, { passive: false });
    on(window, 'touchend', up);
    // prevent ghost-clicks on links after a drag
    on(el, 'click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  KK.makeDraggable = makeDraggable;
  function initDraggables() {
    $$('[data-draggable]').forEach(makeDraggable);
    $$('.draggable-emoji').forEach(makeDraggable);
    ['logoEl', 'footerLogo'].forEach(function (id) { makeDraggable(document.getElementById(id)); });
    var mac = document.getElementById('macDrag');
    if (mac) {
      makeDraggable(mac);
      ['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6'].forEach(function (id) { makeDraggable(document.getElementById(id)); });
    }
  }

  /* ---- mobile menu ------------------------------------------------------ */
  function initMobileMenu() {
    var burger = $('.nav-burger'), menu = $('.mobile-menu');
    if (!burger || !menu) return;
    function setOpen(open) {
      var wasOpen = menu.classList.contains('open');
      burger.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { var first = menu.querySelector('a, button'); if (first) setTimeout(function () { first.focus(); }, 60); }
      else if (wasOpen) { burger.focus(); }
    }
    on(burger, 'click', function () { setOpen(!menu.classList.contains('open')); });
    $$('a', menu).forEach(function (a) { on(a, 'click', function () { setOpen(false); }); });
    on(window, 'keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---- toast ------------------------------------------------------------ */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      toastEl.setAttribute('aria-atomic', 'true');
      toastEl.innerHTML = '<span class="t-dot"></span><span class="t-msg"></span>';
      document.body.appendChild(toastEl);
    }
    $('.t-msg', toastEl).textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }
  KK.toast = toast;

  /* ---- money formatting (Shopify) --------------------------------------- */
  function formatMoney(cents) {
    var fmt = (window.KK_SETTINGS && window.KK_SETTINGS.moneyFormat) || '${{amount}}';
    var c = parseInt(cents, 10);
    if (isNaN(c) || c < 0) c = 0;
    var value = (c / 100).toFixed(2);
    return fmt.replace(/\{\{\s*amount\s*\}\}/, value)
              .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(c / 100));
  }
  KK.formatMoney = formatMoney;

  /* ---- qty steppers ----------------------------------------------------- */
  function initQty() {
    $$('.qty').forEach(function (q) {
      var input = $('input', q), dec = $('[data-qty="dec"]', q), inc = $('[data-qty="inc"]', q);
      function clamp() { var v = parseInt(input.value, 10); if (isNaN(v) || v < 1) v = 1; input.value = v; return v; }
      on(dec, 'click', function () { input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1); input.dispatchEvent(new Event('change', { bubbles: true })); });
      on(inc, 'click', function () { input.value = (parseInt(input.value, 10) || 1) + 1; input.dispatchEvent(new Event('change', { bubbles: true })); });
      on(input, 'change', clamp);
    });
  }

  /* ====================================================================== */
  /*  SHOPIFY AJAX CART + DRAWER                                             */
  /* ====================================================================== */
  var cartTrigger = null;
  var Cart = {
    open: function () {
      cartTrigger = document.activeElement;
      var o = $('#cart-overlay'), d = $('#cart-drawer');
      if (o) o.classList.add('open');
      if (d) { d.classList.add('open'); d.setAttribute('aria-hidden', 'false'); var c = $('.drawer-close', d); if (c) setTimeout(function () { c.focus(); }, 60); }
      document.body.style.overflow = 'hidden';
    },
    close: function () {
      var o = $('#cart-overlay'), d = $('#cart-drawer');
      if (o) o.classList.remove('open');
      if (d) { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); }
      document.body.style.overflow = '';
      if (cartTrigger && cartTrigger.focus) { cartTrigger.focus(); cartTrigger = null; }
    },
    get: function () { return fetch('/cart.js', { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); }); },
    add: function (id, qty, props) {
      var body = { items: [{ id: id, quantity: qty || 1, properties: props || {} }] };
      return fetch('/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body)
      }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); });
    },
    change: function (key, qty) {
      return fetch('/cart/change.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ id: key, quantity: qty })
      }).then(function (r) { return r.json(); });
    },
    updateCount: function (count) {
      $$('.cart-count').forEach(function (el) { el.textContent = count; el.setAttribute('data-count', count); });
    },
    render: function (cart) {
      Cart.updateCount(cart.item_count);
      var body = $('#cart-drawer-body'), foot = $('#cart-drawer-foot');
      if (!body) return;
      if (!cart.items || cart.items.length === 0) {
        body.innerHTML = '<div class="drawer-empty"><p style="font-weight:800;font-size:18px;letter-spacing:-.5px;color:var(--ink)">Your cart is empty.</p><p style="margin-top:8px">Claim an alpha spot to start your KeepKase.</p><a href="/collections/all" class="btn btn--ink" style="margin-top:18px">Browse the alpha →</a></div>';
        if (foot) foot.classList.add('hidden');
        return;
      }
      if (foot) foot.classList.remove('hidden');
      body.innerHTML = cart.items.map(function (it) {
        var media = it.image
          ? '<img src="' + it.image.replace(/(\.[^.]*)$/, '_160x160$1') + '" alt="" loading="lazy">'
          : '<div class="li-media">🗂️</div>';
        var variant = (it.variant_title && it.variant_title !== 'Default Title') ? '<div class="li-variant">' + esc(it.variant_title) + '</div>' : '';
        var qid = 'li-qty-' + it.key;
        return '<div class="line-item" data-key="' + it.key + '">' + media +
          '<div class="li-info"><div class="li-title">' + esc(it.product_title) + '</div>' + variant +
          '<div class="li-foot"><div class="qty"><button data-li="dec" aria-label="Decrease quantity">–</button><label class="visually-hidden" for="' + qid + '">Quantity for ' + esc(it.product_title) + '</label><input id="' + qid + '" value="' + it.quantity + '" inputmode="numeric"><button data-li="inc" aria-label="Increase quantity">+</button></div>' +
          '<strong>' + formatMoney(it.final_line_price) + '</strong></div>' +
          '<button class="li-remove" data-li="remove">Remove</button></div></div>';
      }).join('');
      var sub = $('#cart-subtotal'); if (sub) sub.textContent = formatMoney(cart.total_price);
      Cart.bindLineItems();
    },
    bindLineItems: function () {
      $$('#cart-drawer-body .line-item').forEach(function (row) {
        var key = row.getAttribute('data-key');
        var input = $('input', row);
        function set(qty) {
          Cart.change(key, qty).then(function (cart) { Cart.render(cart); });
        }
        on($('[data-li="dec"]', row), 'click', function () { set(Math.max(0, (parseInt(input.value, 10) || 1) - 1)); });
        on($('[data-li="inc"]', row), 'click', function () { set((parseInt(input.value, 10) || 1) + 1); });
        on($('[data-li="remove"]', row), 'click', function () { set(0); });
        on(input, 'change', function () { set(Math.max(0, parseInt(input.value, 10) || 0)); });
      });
    },
    refresh: function () { Cart.get().then(Cart.render); }
  };
  KK.Cart = Cart;

  function initCart() {
    // open/close
    $$('[data-cart-open]').forEach(function (b) { on(b, 'click', function (e) { e.preventDefault(); Cart.open(); Cart.refresh(); }); });
    $$('[data-cart-close]').forEach(function (b) { on(b, 'click', function (e) { e.preventDefault(); Cart.close(); }); });
    on($('#cart-overlay'), 'click', Cart.close);
    on(window, 'keydown', function (e) { if (e.key === 'Escape') Cart.close(); });

    // AJAX add-to-cart forms (product page + quick buttons)
    $$('form[data-cart-form]').forEach(function (form) {
      on(form, 'submit', function (e) {
        e.preventDefault();
        var btn = $('[type="submit"]', form);
        var id = $('[name="id"]', form) ? $('[name="id"]', form).value : null;
        var qtyEl = $('[name="quantity"]', form);
        var qty = qtyEl ? (parseInt(qtyEl.value, 10) || 1) : 1;
        if (!id) { toast('Pick an option first'); return; }
        var label = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
        Cart.add(id, qty).then(function () {
          return Cart.refresh();
        }).then(function () {
          Cart.open();
          toast('Added to cart ✦');
        }).catch(function (err) {
          toast((err && err.description) || 'Could not add to cart');
        }).then(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
      });
    });

    // initial count sync
    if ($('.cart-count')) Cart.get().then(function (c) { Cart.updateCount(c.item_count); });
  }

  /* ---- product gallery + variant swatches ------------------------------- */
  function initProduct() {
    // gallery thumbs
    var main = $('[data-gallery-main]');
    $$('[data-gallery-thumb]').forEach(function (t) {
      on(t, 'click', function () {
        $$('[data-gallery-thumb]').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        var src = t.getAttribute('data-src');
        if (main && src) main.setAttribute('src', src);
      });
    });

    // variant selection -> hidden id + price
    var form = $('form[data-product-form]');
    if (!form) return;
    var variantsEl = $('[data-variants-json]');
    if (!variantsEl) return;
    var variants;
    try { variants = JSON.parse(variantsEl.textContent); } catch (e) { return; }
    var idInput = $('[name="id"]', form);
    var priceEl = $('[data-price]');
    var btn = $('[type="submit"]', form);

    function currentOptions() {
      return $$('[data-option-index]', form).map(function (group) {
        var checked = $('input:checked', group);
        return checked ? checked.value : null;
      });
    }
    function match(opts) {
      return variants.filter(Boolean).find(function (v) {
        return opts.every(function (o, i) { return o === null || v.options[i] === o; });
      });
    }
    function update() {
      var v = match(currentOptions());
      // reflect chosen swatch label
      $$('[data-option-index]', form).forEach(function (group) {
        var pick = $('.vl-pick', group.previousElementSibling || {});
        var checked = $('input:checked', group);
        if (pick && checked) pick.textContent = checked.value;
      });
      if (!v) { if (btn) { btn.disabled = true; btn.dataset.soldout = '1'; btn.textContent = 'Unavailable'; } return; }
      if (idInput) idInput.value = v.id;
      if (priceEl) priceEl.textContent = formatMoney(v.price);
      if (btn) {
        if (v.available) { btn.disabled = false; btn.textContent = btn.getAttribute('data-add-label') || 'Add to cart'; }
        else { btn.disabled = true; btn.textContent = 'Sold out'; }
      }
    }
    $$('[data-option-index] input', form).forEach(function (i) { on(i, 'change', update); });
    update();
  }

  /* ---- accordion a11y (sync aria-expanded on <summary>) ----------------- */
  function initAccordions() {
    $$('.faq-item').forEach(function (d) {
      var s = $('summary', d);
      if (!s) return;
      s.setAttribute('aria-expanded', d.open ? 'true' : 'false');
      on(d, 'toggle', function () { s.setAttribute('aria-expanded', d.open ? 'true' : 'false'); });
    });
  }

  /* ---- init ------------------------------------------------------------- */
  function init() {
    initReveal();
    initSquiggles();
    initDraggables();
    initMobileMenu();
    initQty();
    initCart();
    initProduct();
    initAccordions();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
