/* ==========================================================================
   KTK High School — site JavaScript (no libraries, ~10 KB)
   Each feature is a small function that only runs if its element exists.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isRTL = document.documentElement.dir === 'rtl';
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Sticky header shrinks on scroll + back-to-top button ---------- */
  function initScroll() {
    var header = $('[data-header]');
    var toTop = $('[data-to-top]');
    var ticking = false;
    function update() {
      var y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 40);
      if (toTop) toTop.hidden = y < 600;
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        var main = $('#main');
        if (main) main.focus({ preventScroll: true });
      });
    }
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    var toggle = $('[data-menu-toggle]');
    var menu = $('[data-mobile-menu]');
    if (!toggle || !menu) return;
    var panel = $('.mobile-menu__panel', menu);

    function open() {
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      var first = $('[data-menu-close]', menu);
      if (first) first.focus();
      document.addEventListener('keydown', onKey);
    }
    function close() {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      document.removeEventListener('keydown', onKey);
      toggle.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') { // keep keyboard focus inside the menu
        var items = $$('a, button', panel);
        var firstEl = items[0], lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    }
    toggle.addEventListener('click', open);
    $$('[data-menu-close]', menu).forEach(function (b) { b.addEventListener('click', close); });
    menu.addEventListener('click', function (e) { if (e.target === menu) close(); });
  }

  /* ---------- "More" dropdown in the desktop menu ---------- */
  function initDropdowns() {
    $$('[data-dropdown]').forEach(function (btn) {
      var list = document.getElementById(btn.getAttribute('aria-controls'));
      if (!list) return;
      function set(openIt) { btn.setAttribute('aria-expanded', String(openIt)); list.hidden = !openIt; }
      btn.addEventListener('click', function (e) { e.stopPropagation(); set(list.hidden); });
      document.addEventListener('click', function (e) { if (!list.contains(e.target)) set(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !list.hidden) { set(false); btn.focus(); } });
    });
  }

  /* ---------- Scrolling notice ticker ---------- */
  function initTicker() {
    var ticker = $('[data-ticker]');
    if (!ticker) return;
    var track = $('[data-ticker-track]', ticker);
    // Copy the items once so the loop is seamless (copy is hidden from screen readers)
    $$('li', track).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      $$('a', c).forEach(function (a) { a.tabIndex = -1; });
      track.appendChild(c);
    });
    // Constant reading speed (about 60px per second) whatever the text length
    track.style.setProperty('--ticker-duration', Math.max(20, track.scrollWidth / 2 / 60) + 's');

    var btn = $('[data-ticker-toggle]', ticker);
    if (btn) {
      btn.addEventListener('click', function () {
        var paused = ticker.classList.toggle('is-paused');
        btn.setAttribute('aria-pressed', String(paused));
        btn.setAttribute('aria-label', paused ? btn.dataset.labelPlay : btn.dataset.labelPause);
        btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-' + (paused ? 'play' : 'pause') + '"></use></svg>';
      });
    }
  }

  /* ---------- Home page photo slider ---------- */
  function initSlider() {
    var root = $('[data-slider]');
    if (!root) return;
    var slides = $$('[data-slide]', root);
    var dots = $$('[data-dot]', root);
    var pauseBtn = $('[data-pause]', root);
    if (slides.length < 2) return;
    var current = 0, timer = null, userPaused = reduceMotion, DELAY = 6000;

    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var active = n === current;
        s.classList.toggle('is-active', active);
        if (active) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
        $$('a, button', s).forEach(function (el) { el.tabIndex = active ? 0 : -1; });
      });
      dots.forEach(function (d, n) {
        if (n === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }
    function next() { show(current + 1); }
    function prev() { show(current - 1); }
    function start() { stop(); if (!userPaused) timer = setInterval(next, DELAY); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function setPaused(p) {
      userPaused = p;
      if (pauseBtn) {
        pauseBtn.setAttribute('aria-label', p ? pauseBtn.dataset.labelPlay : pauseBtn.dataset.labelPause);
        pauseBtn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-' + (p ? 'play' : 'pause') + '"></use></svg>';
      }
      p ? stop() : start();
    }

    var nextBtn = $('[data-next]', root), prevBtn = $('[data-prev]', root);
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); start(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); start(); });
    dots.forEach(function (d) { d.addEventListener('click', function () { show(+d.dataset.dot); start(); }); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });

    // Pause while the mouse is over it or keyboard focus is inside
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) start(); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    // Swipe on phones
    var x0 = null, y0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        var forward = isRTL ? dx > 0 : dx < 0;
        forward ? next() : prev();
        start();
      }
      x0 = null;
    });
    // Arrow keys when the slider has focus
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { isRTL ? prev() : next(); start(); }
      if (e.key === 'ArrowLeft') { isRTL ? next() : prev(); start(); }
    });

    show(0);
    if (reduceMotion) setPaused(true); else start();
  }

  /* ---------- Reveal sections as they scroll into view ---------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Animated number counters ---------- */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length || reduceMotion || !('IntersectionObserver' in window)) return;
    function run(el) {
      var target = parseInt(el.dataset.count, 10) || 0, suffix = el.dataset.suffix || '';
      var t0 = null, dur = 1400;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { el.textContent = '0' + (el.dataset.suffix || ''); io.observe(el); });
  }

  /* ---------- Countdown to the next big event ---------- */
  function initCountdown() {
    var box = $('[data-countdown]');
    if (!box) return;
    var target = new Date(box.dataset.countdown).getTime();
    if (isNaN(target)) return;
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        $('.countdown__clock', box).hidden = true;
        $('.countdown__today', box).hidden = false;
        return;
      }
      var m = Math.floor(diff / 60000);
      $('[data-cd="days"]', box).textContent = Math.floor(m / 1440);
      $('[data-cd="hours"]', box).textContent = Math.floor((m % 1440) / 60);
      $('[data-cd="minutes"]', box).textContent = m % 60;
    }
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Prev/next buttons for scrolling rows (testimonials) ---------- */
  function initCarousels() {
    $$('[data-carousel]').forEach(function (track) {
      var name = track.dataset.carousel;
      function move(dir) {
        var item = track.firstElementChild;
        var w = item ? item.getBoundingClientRect().width + 20 : track.clientWidth;
        track.scrollBy({ left: dir * w * (isRTL ? -1 : 1), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      $$('[data-carousel-next="' + name + '"]').forEach(function (b) { b.addEventListener('click', function () { move(1); }); });
      $$('[data-carousel-prev="' + name + '"]').forEach(function (b) { b.addEventListener('click', function () { move(-1); }); });
    });
  }

  /* ---------- Forms: friendly checks before sending ---------- */
  var RX = {
    phone: /^(\+92|0092|92|0)3\d{2}-?\d{7}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    cnic: /^\d{5}-?\d{7}-?\d$/
  };

  function fieldError(field, msg) {
    var box = $('.field__error', field);
    var inputs = $$('input, select, textarea', field);
    field.classList.toggle('field--error', !!msg);
    inputs.forEach(function (i) { if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); });
    if (box) {
      $('span', box).textContent = msg || '';
      box.hidden = !msg;
      if (msg) {
        inputs.forEach(function (i) {
          var d = (i.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
          if (d.indexOf(box.id) === -1) { d.push(box.id); i.setAttribute('aria-describedby', d.join(' ')); }
        });
      }
    }
  }

  function checkField(field, form) {
    var m = form.dataset;
    var input = $('input:not([type="hidden"]), select, textarea', field);
    if (!input) return true;
    var msg = '';

    if (input.type === 'radio') {
      if (input.required && !$('input:checked', field)) msg = m.msgRequired;
    } else if (input.type === 'checkbox') {
      if (input.required && !input.checked) msg = m.msgAccepted;
    } else if (input.type === 'file') {
      var files = input.files ? Array.prototype.slice.call(input.files) : [];
      var maxMb = parseFloat(input.dataset.maxMb || '5');
      var maxFiles = parseInt(input.dataset.maxFiles || '1', 10);
      var accept = (input.accept || '').split(',');
      if (input.required && !files.length) msg = m.msgPhoto || m.msgRequired;
      else if (input.multiple && files.length > maxFiles) msg = (m.msgTooMany || '').replace('{n}', maxFiles);
      else {
        files.some(function (f) {
          if (accept.length && accept[0] && accept.indexOf(f.type) === -1) { msg = input.multiple ? m.msgBadDoc : m.msgBadPhoto; return true; }
          if (f.size > maxMb * 1048576) { msg = (m.msgTooBig || '').replace('{size}', maxMb); return true; }
          return false;
        });
      }
    } else {
      var v = input.value.trim();
      if (input.required && !v) msg = m.msgRequired;
      else if (v && input.dataset.type === 'phone' && !RX.phone.test(v.replace(/\s/g, ''))) msg = m.msgPhone;
      else if (v && input.dataset.type === 'cnic' && !RX.cnic.test(v)) msg = m.msgCnic;
      else if (v && input.type === 'email' && !RX.email.test(v)) msg = m.msgEmail;
    }
    fieldError(field, msg);
    return !msg;
  }

  function initForms() {
    $$('form[data-validate]').forEach(function (form) {
      var fields = $$('[data-field]', form);
      var summary = $('[data-summary]', form);

      // Check a field when the person leaves it (only after they've typed)
      fields.forEach(function (field) {
        $$('input, select, textarea', field).forEach(function (input) {
          input.addEventListener('blur', function () { if (input.value || field.classList.contains('field--error')) checkField(field, form); });
          input.addEventListener('change', function () { if (field.classList.contains('field--error')) checkField(field, form); });
          input.addEventListener('input', function () { if (field.classList.contains('field--error')) checkField(field, form); });
        });
      });

      form.addEventListener('submit', function (e) {
        var firstBad = null;
        fields.forEach(function (f) { if (!checkField(f, form) && !firstBad) firstBad = f; });
        if (firstBad) {
          e.preventDefault();
          if (summary) {
            $('[data-summary-text]', summary).textContent = form.dataset.msgSummary;
            summary.hidden = false;
          }
          var input = $('input:not([type="hidden"]), select, textarea', firstBad);
          firstBad.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
          if (input) setTimeout(function () { input.focus({ preventScroll: true }); }, reduceMotion ? 0 : 350);
          return;
        }
        // Prevent double submission
        var btn = $('[data-submit]', form);
        if (btn) { btn.disabled = true; btn.textContent = form.dataset.sending; }
      });

      // After a server-side error, move focus to the message
      if (summary && !summary.hidden) {
        summary.focus();
      }
    });

    // CNIC / B-Form: add the dashes automatically (12345-1234567-1)
    $$('input[data-type="cnic"]').forEach(function (input) {
      input.addEventListener('input', function () {
        var d = input.value.replace(/\D/g, '').slice(0, 13);
        var out = d.slice(0, 5);
        if (d.length > 5) out += '-' + d.slice(5, 12);
        if (d.length > 12) out += '-' + d.slice(12);
        input.value = out;
      });
    });

    // File pickers: show chosen file names and a photo preview
    $$('.file-pick input[type="file"]').forEach(function (input) {
      var field = input.closest('[data-field]');
      var label = $('[data-file-name]', field);
      var preview = $('[data-file-preview]', field);
      input.addEventListener('change', function () {
        var files = input.files ? Array.prototype.slice.call(input.files) : [];
        if (!files.length) label.textContent = label.dataset.empty;
        else if (files.length === 1) label.textContent = files[0].name;
        else label.textContent = label.dataset.many.replace('{n}', files.length);
        if (preview) {
          if (files[0] && /^image\//.test(files[0].type) && window.URL) {
            preview.src = URL.createObjectURL(files[0]);
            preview.hidden = false;
          } else {
            preview.hidden = true;
          }
        }
        var form = input.closest('form');
        if (form) checkField(field, form);
      });
    });

    // Success message after sending: move focus to it
    var ok = $('[data-focus]');
    if (ok) ok.focus();
  }

  /* ---------- Print buttons ---------- */
  function initPrint() {
    $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
  }

  /* ---------- Start everything ---------- */
  initScroll();
  initMobileMenu();
  initDropdowns();
  initTicker();
  initSlider();
  initReveal();
  initCounters();
  initCountdown();
  initCarousels();
  initForms();
  initPrint();
})();
