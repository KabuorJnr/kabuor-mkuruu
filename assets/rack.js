/*!
 * Mkurugenzi v2.1.0
 * Photoreal clothing rail + accessories wall for WooCommerce.
 * No cookies, no browser storage, no tracking.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Groups                                                             */
  /* ------------------------------------------------------------------ */

  // Rails hold at most 10 pieces. Accessories live on the wall.
  var RAILS = [
    { id: 'tees', label: 'Tees', types: ['tee'] },
    { id: 'tops', label: 'Tops & Trousers', types: ['hoodie', 'qzip', 'jacket', 'crew', 'pants'] },
    { id: 'suits', label: 'Sweatsuits', types: ['suit'] }
  ];
  var WALL_TYPES = ['beanie', 'cap', 'bucket', 'tote', 'socks'];
  var MAX_ON_RAIL = 10;

  var TYPES = [
    [/sock/i, 'socks'],
    [/tote|\bbag\b/i, 'tote'],
    [/bucket/i, 'bucket'],
    [/\bcap\b/i, 'cap'],
    [/beanie|\bhat\b/i, 'beanie'],
    [/pant|trouser|jogger|short/i, 'pants'],
    [/suit/i, 'suit'],
    [/quarter|zip/i, 'qzip'],
    [/jacket|coat/i, 'jacket'],
    [/hood/i, 'hoodie'],
    [/crew|sweatshirt|long ?sleeve/i, 'crew'],
    [/t-?shirt|\btee/i, 'tee']
  ];
  var SWATCH = [
    [/jungle|green/i, '#34503a'], [/coffee|brown/i, '#5a3e2e'], [/burgundy|maroon/i, '#7a1f2b'],
    [/ivory|cream/i, '#eee7d8'], [/taupe/i, '#a8957f'], [/sand/i, '#d6c09c'], [/beige/i, '#d5c3a3'],
    [/navy|blue/i, '#2c3a5c'], [/white/i, '#f7f6f2'], [/grey|gray|snow/i, '#9d9fa1'], [/black|makosa/i, '#1f1f21']
  ];
  // Display height (px, desktop) from hook tip to hem, so every type hangs at a true relative scale
  var HEIGHT = { tee: 300, hoodie: 318, qzip: 318, jacket: 322, crew: 318, pants: 392, suit: 432, beanie: 92, cap: 88, bucket: 88, tote: 140, socks: 136 };

  function classify(name) {
    var type = 'tee';
    for (var i = 0; i < TYPES.length; i++) if (TYPES[i][0].test(name)) { type = TYPES[i][1]; break; }
    var parts = name.split(/\s+[–—-]\s+/);
    var colourName = parts.length > 1 ? parts.slice(1).join(' ') : '';
    var swatch = '#1f1f21';
    for (var j = 0; j < SWATCH.length; j++) if (SWATCH[j][0].test(colourName || name)) { swatch = SWATCH[j][1]; break; }
    return { type: type, colourName: colourName, swatch: swatch, ladies: /ladies|women/i.test(name) };
  }
  function signature(name) {
    var c = classify(name);
    return (c.ladies ? 'ladies-' : '') + c.type + '|' + c.colourName.toLowerCase().replace(/[^a-z]/g, '');
  }

  /* ------------------------------------------------------------------ */
  /*  Utilities                                                          */
  /* ------------------------------------------------------------------ */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function el(html) { var t = document.createElement('div'); t.innerHTML = html.trim(); return t.firstChild; }
  function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  var uid = 0;

  /* ------------------------------------------------------------------ */
  /*  Rack                                                               */
  /* ------------------------------------------------------------------ */

  function Rack(root) {
    var cfg = {};
    try { cfg = JSON.parse(root.getAttribute('data-mkr-config') || '{}'); } catch (e) { cfg = {}; }
    this.cfg = {
      title: cfg.title || 'The Rack',
      ticker: (cfg.ticker && cfg.ticker.length) ? cfg.ticker : ['More than just a brand', 'Wakurugenzi', 'Tap a piece to take it off the rail', 'New pieces land every drop'],
      currency: cfg.currency || 'KSh',
      cartUrl: cfg.cartUrl || '',
      addToCart: cfg.addToCart || ''
    };
    this.cart = window.MkurugenziCart || null;
    if (this.cart && !Rack.cartReady) {
      Rack.cartReady = true;
      this.cart.init(Object.assign({ currency: this.cfg.currency }, cfg.cart || {}));
    }
    var fallback = window.MKR_FALLBACK_PRODUCTS || [];
    this.atlas = window.MKR_ATLAS || null;
    var keyBySig = {};
    fallback.forEach(function (p) { if (p.key) keyBySig[signature(p.name)] = p.key; });
    var atlas = this.atlas;

    var list = (cfg.products && cfg.products.length) ? cfg.products : fallback;
    this.products = list.map(function (p) {
      p._c = classify(p.name);
      p._key = p.key || keyBySig[signature(p.name)] || '';
      p._cut = !!(atlas && p._key && atlas.items[p._key]);
      return p;
    }).filter(function (p) { return p._cut || p.image; });

    var self = this;
    this.rails = RAILS.map(function (r) {
      return { id: r.id, label: r.label, items: self.products.filter(function (p) { return r.types.indexOf(p._c.type) > -1; }).slice(0, MAX_ON_RAIL) };
    }).filter(function (r) { return r.items.length; });
    this.wall = this.products.filter(function (p) { return WALL_TYPES.indexOf(p._c.type) > -1; }).slice(0, 9);

    this.root = root;
    this.railIndex = 0;
    this.active = -1;
    this.build();
  }

  Rack.prototype.money = function (n) {
    if (n == null || isNaN(n) || +n === 0) return '';
    return this.cfg.currency + ' ' + Number(n).toLocaleString('en-KE', { maximumFractionDigits: 0 });
  };

  // A studio cut-out drawn from the shared image sheet, or the product photo as a fallback
  Rack.prototype.sideOf = function (p) {
    var a = this.atlas;
    return (a && p._key && a.items['side:' + p._key]) || null;
  };
  Rack.prototype.ratio = function (p, side) {
    var a = this.atlas, it = a && p._key && a.items[(side ? 'side:' : '') + p._key];
    return it ? it[2] / it[3] : (side ? .3 : .78);
  };
  Rack.prototype.imgTag = function (p, cls, side) {
    var a = this.atlas, it = p._cut ? a.items[(side && this.sideOf(p) ? 'side:' : '') + p._key] : null;
    if (it) {
      var h = it[3];
      return '<span class="mkr-sprite ' + cls + '" role="img" aria-label="' + esc(p.name) + '" style="' +
        '--r:' + (it[2] / h).toFixed(4) + ';--bs:' + (a.w / h).toFixed(4) + ';--bx:' + (-it[0] / h).toFixed(4) + ';--by:' + (-it[1] / h).toFixed(4) +
        ';background-image:url(\'' + a.url + '\')"></span>';
    }
    return '<img class="mkr-photo-fallback ' + cls + '" src="' + esc(p.image) + '" alt="' + esc(p.name) + '" draggable="false" decoding="async">';
  };

  Rack.prototype.build = function () {
    var self = this;
    var tick = this.cfg.ticker.map(function (t) { return '<span>' + esc(t) + '</span><i aria-hidden="true">✦</i>'; }).join('');

    this.root.innerHTML =
      '<section class="mkr-shell" aria-label="' + esc(this.cfg.title) + '">' +
      '<div class="mkr-grain" aria-hidden="true"></div>' +
      '<header class="mkr-top">' +
      '<span class="mkr-top-side">' + esc(this.cfg.title) + '</span>' +
      '<span class="mkr-logo" aria-hidden="true">Mkurugenzi</span>' +
      (this.cart ? '<span class="mkr-top-r"><button type="button" class="mkr-bagbtn" aria-label="Open bag, 0 items"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 016 0V8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span class="mkr-bagtxt">Bag</span><span class="mkr-bagcount">0</span></button></span>' :
        '<span class="mkr-top-side mkr-top-r">More than just a brand</span>') +
      '</header>' +
      '<div class="mkr-tabs" role="group" aria-label="Choose a rail">' +
      this.rails.map(function (r, i) {
        return '<button type="button" class="mkr-tab" data-r="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(r.label) + '<span class="mkr-tab-n">' + r.items.length + '</span></button>';
      }).join('') +
      '</div>' +
      '<div class="mkr-scene">' +
      '<div class="mkr-railzone">' +
      '<div class="mkr-rod" aria-hidden="true"><span class="mkr-bracket mkr-bracket-l"></span><span class="mkr-bar"></span><span class="mkr-bracket mkr-bracket-r"></span></div>' +
      '<ul class="mkr-rack" role="list"></ul>' +
      '</div>' +
      (this.wall.length ?
        '<aside class="mkr-wall" aria-label="Hats, bags and socks wall">' +
        '<div class="mkr-wall-panel">' +
        '<ul class="mkr-pegs" role="list">' +
        this.wall.map(function (p, i) {
          var h = HEIGHT[p._c.type] || 120;
          return '<li class="mkr-peg mkr-peg-' + p._c.type + '" style="--h:' + h + 'px">' +
            '<span class="mkr-hook" aria-hidden="true"></span>' +
            '<button type="button" class="mkr-wallitem" data-w="' + i + '" aria-label="' + esc(p.name + ', ' + self.money(p.price) + (p.inStock === false ? ', sold out' : '') + '. Open details') + '">' +
            '<span class="mkr-wallswing">' + self.imgTag(p, 'mkr-wallimg') + '</span>' +
            '<span class="mkr-tag" aria-hidden="true">' + esc(p.name) + '</span></button>' +
            '</li>';
        }).join('') +
        '</ul></div>' +
        '<p class="mkr-wall-label">Hats, bags &amp; socks</p>' +
        '</aside>' : '') +
      '</div>' +
      '<div class="mkr-under">' +
      '<p class="mkr-caption mkr-sr" aria-live="polite"></p>' +
      '<button type="button" class="mkr-pill">See availability</button>' +
      '</div>' +
      '<div class="mkr-ticker" aria-hidden="true"><div class="mkr-ticker-track">' + tick + tick + tick + tick + '</div></div>' +
      '<div class="mkr-toast" role="status" aria-live="polite"></div>' +
      '</section>';

    this.rackEl = this.root.querySelector('.mkr-rack');
    this.zoneEl = this.root.querySelector('.mkr-railzone');
    this.captionEl = this.root.querySelector('.mkr-caption');
    this.toastEl = this.root.querySelector('.mkr-toast');
    var bagBtn = this.root.querySelector('.mkr-bagbtn');
    if (bagBtn) {
      bagBtn.addEventListener('click', function () { self.cart.open('bag'); });
      var setCount = function (n) {
        bagBtn.querySelector('.mkr-bagcount').textContent = n;
        bagBtn.setAttribute('aria-label', 'Open bag, ' + n + (n === 1 ? ' item' : ' items'));
        bagBtn.classList.toggle('has-items', n > 0);
        bagBtn.classList.remove('is-bump'); void bagBtn.offsetWidth; if (n > 0) bagBtn.classList.add('is-bump');
      };
      setCount(this.cart.count());
      document.addEventListener('mkr:cart', function (e) { setCount(e.detail.count); });
    }

    this.root.querySelectorAll('.mkr-tab').forEach(function (b) {
      b.addEventListener('click', function () { self.setRail(+b.getAttribute('data-r')); });
    });
    this.root.querySelector('.mkr-pill').addEventListener('click', function () {
      self.openDetail('rail', self.active >= 0 ? self.active : 0, this);
    });
    this.rackEl.addEventListener('mouseleave', function () {
      if (!self.rackEl.contains(document.activeElement)) self.setActive(-1);
    });
    this.rackEl.addEventListener('focusout', function (e) {
      if (!self.rackEl.contains(e.relatedTarget)) self.setActive(-1);
    });

    this.root.querySelectorAll('.mkr-wallitem').forEach(function (b) {
      var i = +b.getAttribute('data-w');
      b.addEventListener('mouseenter', function () { self.showCaption(self.wall[i]); });
      b.addEventListener('focus', function () { self.showCaption(self.wall[i]); });
      b.addEventListener('mouseleave', function () { self.showCaption(null); });
      b.addEventListener('click', function () { self.openDetail('wall', i, b); });
    });

    this.buildDetail();
    this.renderRail();
    var ro = window.ResizeObserver ? new ResizeObserver(function () { self.layout(); }) : null;
    if (ro) ro.observe(this.zoneEl); else window.addEventListener('resize', function () { self.layout(); });
  };

  Rack.prototype.setRail = function (i) {
    this.railIndex = i;
    this.root.querySelectorAll('.mkr-tab').forEach(function (b) {
      b.setAttribute('aria-pressed', String(+b.getAttribute('data-r') === i));
    });
    this.renderRail();
  };

  Rack.prototype.renderRail = function () {
    var self = this;
    var items = this.rails.length ? this.rails[this.railIndex].items : [];
    this.visible = items;
    this.rackEl.innerHTML = items.map(function (p, i) {
      var sold = p.inStock === false;
      var h = HEIGHT[p._c.type] || 320;
      var real = !!self.sideOf(p);
      var ws = Math.round(h * (real ? self.ratio(p, true) : self.ratio(p) * .42));
      var wf = Math.round(h * self.ratio(p));
      return '<li class="mkr-slot' + (sold ? ' is-sold' : '') + '" style="--i:' + i + ';--h:' + h + 'px;--ws:' + ws + 'px;--wf:' + wf + 'px">' +
        '<button type="button" class="mkr-item" data-i="' + i + '" aria-label="' + esc(p.name + ', ' + self.money(p.price) + (sold ? ', sold out' : '') + '. Open details') + '">' +
        '<span class="mkr-garment">' +
        '<span class="mkr-face mkr-face-side' + (real ? '' : ' is-fake') + '">' + self.imgTag(p, 'mkr-img', true) + '</span>' +
        '<span class="mkr-face mkr-face-front"><span class="mkr-swing">' + self.imgTag(p, 'mkr-img') + '</span></span>' +
        '</span>' +
        '<span class="mkr-tag" aria-hidden="true">' + esc(p.name) + (sold ? ' · Sold out' : '') + '</span>' +
        '</button></li>';
    }).join('');

    this.rackEl.querySelectorAll('.mkr-item').forEach(function (b) {
      var i = +b.getAttribute('data-i');
      b.addEventListener('mouseenter', function () { self.setActive(i); });
      b.addEventListener('focus', function () { self.setActive(i); });
      b.addEventListener('click', function () { self.openDetail('rail', i, b); });
      b.addEventListener('keydown', function (e) {
        var n = items.length, to = null;
        if (e.key === 'ArrowRight') to = (i + 1) % n;
        if (e.key === 'ArrowLeft') to = (i - 1 + n) % n;
        if (e.key === 'Home') to = 0;
        if (e.key === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); self.rackEl.querySelector('.mkr-item[data-i="' + to + '"]').focus(); }
      });
    });
    this.layout();
    this.setActive(-1);
    this.rackEl.classList.remove('is-entering');
    void this.rackEl.offsetWidth;
    this.rackEl.classList.add('is-entering');
  };

  // Fit the rail: garments keep their true proportions and the whole row scales down if needed
  Rack.prototype.layout = function () {
    var items = this.visible || [];
    if (!items.length) return;
    var self = this, w = this.zoneEl.clientWidth, small = w < 560;
    var gap = small ? 14 : 24, sum = 0, extra = 0, maxH = 0;
    items.forEach(function (p) {
      var h = HEIGHT[p._c.type] || 320;
      maxH = Math.max(maxH, h);
      var ws = h * (self.sideOf(p) ? self.ratio(p, true) : self.ratio(p) * .42), wf = h * self.ratio(p);
      sum += ws + gap; extra = Math.max(extra, wf - ws);
    });
    var need = sum + extra + 60;
    var k = Math.min(1, (w - 20) / need);
    var scroll = k < (small ? .8 : .62);
    if (scroll) k = small ? .8 : .62;
    this.zoneEl.classList.toggle('is-scroll', scroll);
    this.root.style.setProperty('--k', k.toFixed(3));
    this.root.style.setProperty('--railh', Math.round(Math.max(maxH * k + 96, 380)) + 'px');
    this.root.style.setProperty('--gap', gap + 'px');
    this.root.style.setProperty('--rodw', Math.round(Math.min(scroll ? need * k : w - 8, need * k + 120)) + 'px');
  };

  Rack.prototype.setActive = function (i) {
    this.active = i;
    var items = this.rackEl.children;
    for (var k = 0; k < items.length; k++) {
      items[k].classList.toggle('is-active', k === i);
      items[k].classList.toggle('is-before', i >= 0 && k < i);
    }
    this.showCaption(i >= 0 ? this.visible[i] : null);
  };

  Rack.prototype.showCaption = function (p) {
    if (p) {
      var price = this.money(p.price);
      this.captionEl.innerHTML = '<span class="mkr-caption-name">' + esc(p.name) + '</span>' +
        (price ? '<span class="mkr-caption-price">' + price + '</span>' : '') +
        (p.inStock === false ? '<span class="mkr-caption-sold">Sold out</span>' : '');
    } else {
      this.captionEl.innerHTML = '';
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Detail view                                                        */
  /* ------------------------------------------------------------------ */

  Rack.prototype.buildDetail = function () {
    var self = this;
    var nameId = 'mkr-d-name-' + (++uid);
    var d = el(
      '<div class="mkr-detail" role="dialog" aria-modal="true" aria-labelledby="' + nameId + '" hidden>' +
      '<div class="mkr-d-bg" aria-hidden="true"></div>' +
      '<div class="mkr-d-top"><span class="mkr-d-count"></span><span class="mkr-d-logo" aria-hidden="true">Mkurugenzi</span><button type="button" class="mkr-d-close">Close</button></div>' +
      '<div class="mkr-d-stage">' +
      '<div class="mkr-d-ghost mkr-d-ghost-l" aria-hidden="true"></div>' +
      '<button type="button" class="mkr-d-arrow mkr-d-prev" aria-label="Previous piece"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>' +
      '<figure class="mkr-d-main"><div class="mkr-d-art"></div><img class="mkr-d-photo" alt="" hidden><span class="mkr-d-shadow" aria-hidden="true"></span></figure>' +
      '<button type="button" class="mkr-d-arrow mkr-d-next" aria-label="Next piece"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>' +
      '<div class="mkr-d-ghost mkr-d-ghost-r" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="mkr-d-info">' +
      '<h3 class="mkr-d-name" id="' + nameId + '"></h3>' +
      '<p class="mkr-d-meta"></p>' +
      '<div class="mkr-d-sizes" role="group" aria-label="Choose a size"></div>' +
      '<div class="mkr-d-actions"></div>' +
      '<p class="mkr-d-note" aria-live="polite"></p>' +
      '</div></div>'
    );
    document.body.appendChild(d);
    this.detail = d;

    d.querySelector('.mkr-d-close').addEventListener('click', function () { self.closeDetail(); });
    d.querySelector('.mkr-d-prev').addEventListener('click', function () { self.step(-1); });
    d.querySelector('.mkr-d-next').addEventListener('click', function () { self.step(1); });
    d.querySelector('.mkr-d-ghost-l').addEventListener('click', function () { self.step(-1); });
    d.querySelector('.mkr-d-ghost-r').addEventListener('click', function () { self.step(1); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); self.closeDetail(); }
      else if (e.key === 'ArrowRight' && !e.target.closest('.mkr-d-sizes')) self.step(1);
      else if (e.key === 'ArrowLeft' && !e.target.closest('.mkr-d-sizes')) self.step(-1);
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(d.querySelectorAll('button:not([disabled]), a[href]'), function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    var sx = null, stage = d.querySelector('.mkr-d-stage');
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) self.step(dx < 0 ? 1 : -1);
      sx = null;
    });
  };

  Rack.prototype.openDetail = function (group, i, from) {
    this.dList = group === 'wall' ? this.wall : this.visible;
    if (!this.dList || !this.dList.length) return;
    this.lastFocus = from || document.activeElement;
    this.dIndex = i;
    this.detail.hidden = false;
    document.documentElement.classList.add('mkr-lock');
    this.renderDetail(0);
    var d = this.detail;
    requestAnimationFrame(function () { d.classList.add('is-open'); d.querySelector('.mkr-d-close').focus(); });
  };

  Rack.prototype.closeDetail = function () {
    var d = this.detail;
    d.classList.remove('is-open');
    document.documentElement.classList.remove('mkr-lock');
    setTimeout(function () { d.hidden = true; }, reduced() ? 0 : 260);
    if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
  };

  Rack.prototype.step = function (dir) {
    var n = this.dList.length;
    this.dIndex = (this.dIndex + dir + n) % n;
    this.renderDetail(dir);
  };

  Rack.prototype.renderDetail = function (dir) {
    var self = this, d = this.detail, list = this.dList, n = list.length, i = this.dIndex, p = list[i];
    var wallItem = WALL_TYPES.indexOf(p._c.type) > -1;
    d.classList.toggle('is-small', wallItem);
    d.querySelector('.mkr-d-count').textContent = pad(i + 1) + ' / ' + pad(n);
    d.querySelector('.mkr-d-ghost-l').innerHTML = n > 1 ? this.imgTag(list[(i - 1 + n) % n], 'mkr-d-ghostimg') : '';
    d.querySelector('.mkr-d-ghost-r').innerHTML = n > 1 ? this.imgTag(list[(i + 1) % n], 'mkr-d-ghostimg') : '';

    var art = d.querySelector('.mkr-d-art');
    art.innerHTML = this.imgTag(p, 'mkr-d-img');
    art.hidden = false;
    art.classList.remove('from-l', 'from-r', 'is-swing');
    void art.offsetWidth;
    art.classList.add(dir > 0 ? 'from-r' : dir < 0 ? 'from-l' : 'is-swing');
    var photo = d.querySelector('.mkr-d-photo');
    photo.hidden = true; photo.removeAttribute('src'); photo.alt = 'Photo of ' + p.name;
    d.querySelector('.mkr-d-shadow').hidden = false;

    d.querySelector('.mkr-d-name').textContent = p.name;
    var price = this.money(p.price);
    var was = (p.regular && +p.regular > +p.price) ? this.money(p.regular) : '';
    var meta = '';
    if (price) meta += '<span class="mkr-d-price">' + price + '</span>';
    if (was) meta += '<s class="mkr-d-was"><span class="mkr-sr">Was </span>' + was + '</s>';
    if (p._c.colourName) meta += '<span class="mkr-d-dot" aria-hidden="true"></span><span class="mkr-d-swatch" style="background:' + p._c.swatch + '" aria-hidden="true"></span>' + esc(p._c.colourName);
    d.querySelector('.mkr-d-meta').innerHTML = meta;

    var sizesEl = d.querySelector('.mkr-d-sizes'), actions = d.querySelector('.mkr-d-actions'), note = d.querySelector('.mkr-d-note');
    note.textContent = ''; sizesEl.innerHTML = ''; actions.innerHTML = ''; this.selectedVariation = null;

    var woo = !!(this.cfg.addToCart && p.id);
    var viaCart = !!this.cart && (woo || !this.cfg.addToCart);
    // Demo mode (no store attached): offer standard sizes for clothing so the bag flow can be tried
    if (viaCart && !woo && !p.variations && !wallItem) {
      p.variations = ['S', 'M', 'L', 'XL', 'XXL'].map(function (l) { return { id: null, label: l, inStock: true }; });
    }
    var hasVar = (woo || viaCart) && p.variations && p.variations.length;
    var sold = p.inStock === false;
    if (hasVar) {
      sizesEl.innerHTML = p.variations.map(function (v, k) {
        return '<button type="button" class="mkr-size" data-k="' + k + '" aria-pressed="false"' + (v.inStock ? '' : ' disabled') + '>' + esc(v.label) + (v.inStock ? '' : '<span class="mkr-sr"> sold out</span>') + '</button>';
      }).join('');
      sizesEl.querySelectorAll('.mkr-size').forEach(function (b) {
        b.addEventListener('click', function () {
          sizesEl.querySelectorAll('.mkr-size').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          self.selectedVariation = p.variations[+b.getAttribute('data-k')];
          note.textContent = '';
        });
      });
    }
    sizesEl.hidden = !hasVar;

    var canCart = (woo || viaCart) && !sold && p.purchasable !== false && (hasVar || p.productType === 'simple' || !p.productType);
    if (canCart) {
      var add = el('<button type="button" class="mkr-btn mkr-btn-primary">Add to bag</button>');
      add.addEventListener('click', function () { self.addToCart(p, add); });
      actions.appendChild(add);
    } else if (sold) {
      actions.appendChild(el('<span class="mkr-btn mkr-btn-disabled" aria-disabled="true">Sold out</span>'));
    }
    if (p.url && !(viaCart && !woo)) actions.appendChild(el('<a class="mkr-btn ' + (canCart || sold ? 'mkr-btn-ghost' : 'mkr-btn-primary') + '" href="' + esc(p.url) + '">' + (canCart ? 'Full details' : 'Shop this piece') + '</a>'));
    if (p.image && p._cut) {
      var t = el('<button type="button" class="mkr-btn mkr-btn-ghost" aria-pressed="false">See photo</button>');
      t.addEventListener('click', function () {
        if (!photo.hidden) {
          photo.hidden = true; art.hidden = false; d.querySelector('.mkr-d-shadow').hidden = false;
          t.textContent = 'See photo'; t.setAttribute('aria-pressed', 'false');
        } else {
          photo.onerror = function () { photo.hidden = true; art.hidden = false; t.remove(); note.textContent = 'Photo unavailable right now.'; };
          photo.src = p.image; photo.hidden = false; art.hidden = true; d.querySelector('.mkr-d-shadow').hidden = true;
          t.textContent = 'Back to the rack'; t.setAttribute('aria-pressed', 'true');
        }
      });
      actions.appendChild(t);
    }
  };

  Rack.prototype.addToCart = function (p, btn) {
    var self = this, note = this.detail.querySelector('.mkr-d-note'), id = p.id;
    if (p.variations && p.variations.length) {
      if (!this.selectedVariation) {
        note.textContent = 'Pick a size first.';
        var f = this.detail.querySelector('.mkr-size:not([disabled])'); if (f) f.focus();
        return;
      }
      id = this.selectedVariation.id;
    }
    btn.disabled = true; btn.textContent = 'Adding…';
    if (this.cart) {
      var v = (p.variations && p.variations.length) ? this.selectedVariation : null;
      this.cart.add(p, v).then(function () {
        btn.disabled = false; btn.textContent = 'Add to bag';
        if (window.jQuery) window.jQuery(document.body).trigger('wc_fragment_refresh');
        self.closeDetail();
        self.cart.open('bag');
      }).catch(function (e) {
        btn.disabled = false; btn.textContent = 'Add to bag';
        note.textContent = (e && e.message) || 'Could not add that. Please try again.';
      });
      return;
    }
    fetch(this.cfg.addToCart, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: 'product_id=' + encodeURIComponent(id) + '&quantity=1'
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res || res.error) { window.location.href = (res && res.product_url) || p.url; return; }
      if (window.jQuery) window.jQuery(document.body).trigger('added_to_cart', [res.fragments, res.cart_hash, window.jQuery(btn)]);
      btn.textContent = 'Added';
      note.innerHTML = 'In your bag. ' + (self.cfg.cartUrl ? '<a href="' + esc(self.cfg.cartUrl) + '">View bag and check out</a>' : '');
      self.toast(p.name + ' added to your bag');
      setTimeout(function () { btn.disabled = false; btn.textContent = 'Add to bag'; }, 1600);
    }).catch(function () { window.location.href = p.url; });
  };

  Rack.prototype.toast = function (msg) {
    var t = this.toastEl;
    t.innerHTML = esc(msg) + (this.cfg.cartUrl ? ' <a href="' + esc(this.cfg.cartUrl) + '">View bag</a>' : '');
    t.classList.add('is-on');
    clearTimeout(this._tt);
    this._tt = setTimeout(function () { t.classList.remove('is-on'); }, 3600);
  };

  function boot() {
    document.querySelectorAll('.mkr[data-mkr-config]:not([data-mkr-ready])').forEach(function (root) {
      root.setAttribute('data-mkr-ready', '');
      new Rack(root);
    });
  }
  // Small cut-out for the bag, matched by garment and colourway
  function thumb(name) {
    var a = window.MKR_ATLAS, list = window.MKR_FALLBACK_PRODUCTS || [], sig = signature(name), key = '';
    for (var i = 0; i < list.length; i++) if (list[i].key && signature(list[i].name) === sig) { key = list[i].key; break; }
    var it = a && key && a.items[key];
    if (!it) return '';
    var h = it[3];
    return '<span class="mkr-sprite" style="--sh:var(--mkc-th,64px);--r:' + (it[2] / h).toFixed(4) + ';--bs:' + (a.w / h).toFixed(4) + ';--bx:' + (-it[0] / h).toFixed(4) + ';--by:' + (-it[1] / h).toFixed(4) + ';background-image:url(\'' + a.url + '\')"></span>';
  }
  window.MkurugenziRack = { boot: boot, classify: classify, thumb: thumb };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
