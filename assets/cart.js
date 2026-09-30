/*!
 * Mkurugenzi: bag and checkout panel v2.1.0
 *
 * On WordPress it drives the real WooCommerce cart through the Store API
 * (/wp-json/wc/store/v1). Payment is handed to the store's own payment
 * gateway (M-Pesa, Stripe, etc.), so card details never touch this page.
 * Without WooCommerce (stand-alone preview) it runs as a clearly labelled
 * demo that keeps the bag in memory and takes no payment.
 * No cookies of its own, no browser storage, no tracking.
 */
(function () {
  'use strict';

  var cfg = {};
  var state = { items: [], subtotal: 0, shipping: null, total: 0, rates: [], methods: [], minor: 0, count: 0 };
  var demoItems = [];
  var nonce = '';
  var step = 'bag';
  var details = { email: '', phone: '', name: '', town: '', address: '', note: '', terms: false, news: false };
  var chosenMethod = '';
  var root = null, lastFocus = null, busy = false;

  var DEMO_METHODS = [
    { id: 'mpesa', title: 'M-Pesa', description: 'You will get a prompt on your phone to enter your M-Pesa PIN.' },
    { id: 'card', title: 'Card', description: 'Visa or Mastercard, entered on the secure payment page.' }
  ];

  /* ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    if (n == null || isNaN(n)) return '';
    return (cfg.currency || 'KSh') + ' ' + Number(n).toLocaleString('en-KE', { maximumFractionDigits: 0 });
  }
  function isWoo() { return !!cfg.storeApi; }
  function emit() {
    document.dispatchEvent(new CustomEvent('mkr:cart', { detail: { count: state.count } }));
  }
  function thumb(name) {
    return (window.MkurugenziRack && window.MkurugenziRack.thumb) ? window.MkurugenziRack.thumb(name) : '';
  }

  /* ------------------------------------------------------------------ */
  /*  Store API                                                          */
  /* ------------------------------------------------------------------ */
  function api(path, method, body) {
    var headers = { 'Content-Type': 'application/json' };
    if (nonce) headers.Nonce = nonce;
    return fetch(cfg.storeApi.replace(/\/?$/, '/') + path, {
      method: method || 'GET', credentials: 'same-origin', headers: headers,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      var n = r.headers.get('Nonce'); if (n) nonce = n;
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error((j && j.message) || 'Something went wrong. Please try again.'); e.data = j; throw e; }
        return j;
      });
    });
  }
  function fromStore(c) {
    var minor = (c.totals && c.totals.currency_minor_unit) || 0, d = Math.pow(10, minor);
    function m(v) { return v == null ? null : parseInt(v, 10) / d; }
    var rates = [];
    (c.shipping_rates || []).forEach(function (pkg) {
      (pkg.shipping_rates || []).forEach(function (r) {
        rates.push({ pkg: pkg.package_id, id: r.rate_id, name: r.name, price: m(r.price), selected: !!r.selected });
      });
    });
    state = {
      items: (c.items || []).map(function (it) {
        var meta = (it.variation || []).map(function (v) { return v.value; }).join(' / ');
        return { key: it.key, name: it.name, meta: meta, qty: it.quantity, unit: m(it.prices && it.prices.price), line: m(it.totals && it.totals.line_total) };
      }),
      subtotal: m(c.totals && c.totals.total_items),
      shipping: rates.length ? m(c.totals && c.totals.total_shipping) : null,
      total: m(c.totals && c.totals.total_price),
      rates: rates,
      methods: (c.payment_methods || []).map(function (id) {
        var g = (cfg.gateways || []).filter(function (x) { return x.id === id; })[0];
        return g || { id: id, title: id, description: '' };
      }),
      count: c.items_count || 0
    };
    if (!chosenMethod && state.methods.length) chosenMethod = state.methods[0].id;
    emit();
  }
  function fromDemo() {
    var sub = 0, count = 0;
    state.items = demoItems.map(function (it) { sub += it.unit * it.qty; count += it.qty; return { key: it.key, name: it.name, meta: it.meta, qty: it.qty, unit: it.unit, line: it.unit * it.qty }; });
    state.subtotal = sub; state.count = count;
    state.rates = []; state.shipping = null; state.total = sub;
    state.methods = DEMO_METHODS;
    if (!chosenMethod) chosenMethod = 'mpesa';
    emit();
  }
  function refresh() {
    if (!isWoo()) { fromDemo(); return Promise.resolve(); }
    return api('cart').then(fromStore);
  }

  /* ------------------------------------------------------------------ */
  /*  Public: add to bag                                                 */
  /* ------------------------------------------------------------------ */
  function add(product, variation) {
    if (isWoo()) {
      return api('cart/add-item', 'POST', { id: variation ? variation.id : product.id, quantity: 1 }).then(fromStore);
    }
    var label = variation ? variation.label : '';
    var key = product.name + '|' + label;
    var found = demoItems.filter(function (x) { return x.key === key; })[0];
    if (found) found.qty += 1;
    else demoItems.push({ key: key, name: product.name, meta: label, unit: +product.price || 0, qty: 1 });
    fromDemo();
    return Promise.resolve();
  }
  function setQty(key, qty) {
    if (isWoo()) {
      return (qty <= 0 ? api('cart/remove-item', 'POST', { key: key }) : api('cart/update-item', 'POST', { key: key, quantity: qty })).then(fromStore);
    }
    demoItems = demoItems.filter(function (x) { if (x.key === key) x.qty = qty; return x.qty > 0; });
    fromDemo();
    return Promise.resolve();
  }

  /* ------------------------------------------------------------------ */
  /*  Panel                                                              */
  /* ------------------------------------------------------------------ */
  var ICON = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    check: '<svg viewBox="0 0 52 52" aria-hidden="true"><circle class="mkc-check-c" cx="26" cy="26" r="24" fill="none" stroke-width="2.5"/><path class="mkc-check-p" d="M15 27l7 7 15-16" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    hanger: '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M60 22v-6a6 6 0 1 1 6 -6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M60 22L10 60q-4 4 2 4h96q6 0 2-4Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>'
  };

  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'mkc';
    root.hidden = true;
    root.innerHTML =
      '<div class="mkc-scrim" data-close></div>' +
      '<aside class="mkc-panel" role="dialog" aria-modal="true" aria-labelledby="mkc-title">' +
      '<header class="mkc-head">' +
      '<button type="button" class="mkc-icon mkc-back" aria-label="Back">' + ICON.back + '</button>' +
      '<h2 class="mkc-title" id="mkc-title">Your bag</h2>' +
      '<button type="button" class="mkc-icon" data-close aria-label="Close bag">' + ICON.close + '</button>' +
      '</header>' +
      '<ol class="mkc-steps" aria-label="Checkout steps"><li data-s="bag">Bag</li><li data-s="details">Details</li><li data-s="pay">Payment</li></ol>' +
      (isWoo() ? '' : '<p class="mkc-demo" role="note">Demo checkout. Nothing is charged and no details leave this page.</p>') +
      '<div class="mkc-body" tabindex="-1"></div>' +
      '<footer class="mkc-foot"></footer>' +
      '</aside>';
    document.body.appendChild(root);
    root.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
    root.querySelector('.mkc-back').addEventListener('click', function () {
      go(step === 'pay' ? 'details' : 'bag');
    });
    document.addEventListener('keydown', function (e) {
      if (!root || root.hidden || !root.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(root.querySelectorAll('button:not([disabled]), a[href], input, select, textarea'), function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  function open(atStep) {
    build();
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add('mkr-lock');
    go(atStep || 'bag');
    requestAnimationFrame(function () { root.classList.add('is-open'); });
    refresh().then(render).catch(function () { render(); });
  }
  function close() {
    if (!root) return;
    root.classList.remove('is-open');
    document.documentElement.classList.remove('mkr-lock');
    setTimeout(function () { root.hidden = true; }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function go(s) {
    step = s;
    render();
    var body = root.querySelector('.mkc-body');
    body.scrollTop = 0;
    var first = body.querySelector('input, button, a[href]') || body;
    setTimeout(function () { first.focus({ preventScroll: true }); }, 40);
  }

  function render() {
    if (!root) return;
    var titles = { bag: 'Your bag', details: 'Delivery details', pay: 'Payment', done: 'Order placed' };
    root.querySelector('.mkc-title').textContent = titles[step];
    root.querySelector('.mkc-back').style.visibility = (step === 'details' || step === 'pay') ? 'visible' : 'hidden';
    var order = ['bag', 'details', 'pay'];
    root.querySelectorAll('.mkc-steps li').forEach(function (li) {
      var i = order.indexOf(li.getAttribute('data-s')), cur = order.indexOf(step);
      li.className = (step === 'done' || i < cur) ? 'is-done' : i === cur ? 'is-current' : '';
      if (i === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    root.querySelector('.mkc-steps').hidden = step === 'done' || (step === 'bag' && !state.items.length);
    var body = root.querySelector('.mkc-body'), foot = root.querySelector('.mkc-foot');
    if (step === 'bag') renderBag(body, foot);
    if (step === 'details') renderDetails(body, foot);
    if (step === 'pay') renderPay(body, foot);
    // Keep keyboard focus inside the panel when its contents are redrawn
    if (!root.hidden && !root.contains(document.activeElement)) body.focus({ preventScroll: true });
  }

  function lineHTML(it, editable) {
    return '<li class="mkc-line">' +
      '<span class="mkc-thumb" aria-hidden="true">' + thumb(it.name) + '</span>' +
      '<span class="mkc-line-main">' +
      '<span class="mkc-line-name">' + esc(it.name) + '</span>' +
      (it.meta ? '<span class="mkc-line-meta">Size ' + esc(it.meta) + '</span>' : '') +
      (editable ?
        '<span class="mkc-qty" role="group" aria-label="Quantity for ' + esc(it.name) + '">' +
        '<button type="button" class="mkc-qbtn" data-k="' + esc(it.key) + '" data-d="-1" aria-label="Remove one">−</button>' +
        '<span class="mkc-qn" aria-live="polite">' + it.qty + '</span>' +
        '<button type="button" class="mkc-qbtn" data-k="' + esc(it.key) + '" data-d="1" aria-label="Add one">+</button>' +
        '</span><button type="button" class="mkc-remove" data-k="' + esc(it.key) + '">Remove</button>'
        : '<span class="mkc-line-meta">Qty ' + it.qty + '</span>') +
      '</span>' +
      '<span class="mkc-line-price">' + money(it.line) + '</span>' +
      '</li>';
  }

  function renderBag(body, foot) {
    if (!state.items.length) {
      body.innerHTML = '<div class="mkc-empty">' + ICON.hanger + '<p class="mkc-empty-t">Your bag is empty</p><p class="mkc-empty-s">Pick something off the rack and it will land here.</p><button type="button" class="mkc-btn mkc-btn-ghost" data-close>Back to the rack</button></div>';
      body.querySelector('[data-close]').addEventListener('click', close);
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = '<ul class="mkc-lines">' + state.items.map(function (it) { return lineHTML(it, true); }).join('') + '</ul>';
    body.querySelectorAll('.mkc-qbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var it = state.items.filter(function (x) { return x.key === b.getAttribute('data-k'); })[0];
        if (it) mutate(setQty(it.key, it.qty + (+b.getAttribute('data-d'))));
      });
    });
    body.querySelectorAll('.mkc-remove').forEach(function (b) {
      b.addEventListener('click', function () { mutate(setQty(b.getAttribute('data-k'), 0)); });
    });
    foot.innerHTML =
      '<dl class="mkc-sum"><div><dt>Subtotal</dt><dd>' + money(state.subtotal) + '</dd></div>' +
      '<div class="mkc-muted"><dt>Delivery</dt><dd>Calculated at the next step</dd></div></dl>' +
      '<button type="button" class="mkc-btn mkc-btn-primary mkc-go">Checkout<span class="mkc-btn-amt">' + money(state.subtotal) + '</span></button>';
    foot.querySelector('.mkc-go').addEventListener('click', function () { go('details'); });
  }

  function field(id, label, type, value, attrs) {
    return '<label class="mkc-field"><span class="mkc-label">' + label + '</span>' +
      '<input class="mkc-input" id="mkc-' + id + '" name="' + id + '" type="' + type + '" value="' + esc(value) + '" ' + (attrs || '') + '>' +
      '<span class="mkc-err" id="mkc-' + id + '-err" aria-live="polite"></span></label>';
  }

  function renderDetails(body, foot) {
    body.innerHTML =
      '<form class="mkc-form" novalidate>' +
      '<fieldset class="mkc-set"><legend>Contact</legend>' +
      field('email', 'Email', 'email', details.email, 'autocomplete="email" required aria-describedby="mkc-email-err"') +
      '<label class="mkc-field"><span class="mkc-label">Phone (for delivery and M-Pesa)</span><span class="mkc-phone"><span class="mkc-cc" aria-hidden="true">+254</span>' +
      '<input class="mkc-input" id="mkc-phone" name="phone" type="tel" inputmode="tel" value="' + esc(details.phone) + '" autocomplete="tel-national" placeholder="712 345 678" required aria-describedby="mkc-phone-err"></span>' +
      '<span class="mkc-err" id="mkc-phone-err" aria-live="polite"></span></label>' +
      '</fieldset>' +
      '<fieldset class="mkc-set"><legend>Delivery</legend>' +
      field('name', 'Full name', 'text', details.name, 'autocomplete="name" required aria-describedby="mkc-name-err"') +
      '<div class="mkc-row">' +
      field('town', 'Town or city', 'text', details.town, 'autocomplete="address-level2" list="mkc-towns" required aria-describedby="mkc-town-err"') +
      field('address', 'Estate, street or building', 'text', details.address, 'autocomplete="address-line1" required aria-describedby="mkc-address-err"') +
      '</div>' +
      '<datalist id="mkc-towns"><option>Nairobi</option><option>Mombasa</option><option>Kisumu</option><option>Nakuru</option><option>Eldoret</option><option>Thika</option><option>Machakos</option><option>Nyeri</option><option>Kisii</option><option>Homa Bay</option><option>Malindi</option><option>Kitale</option></datalist>' +
      '<label class="mkc-field"><span class="mkc-label">Delivery note <em>(optional)</em></span><textarea class="mkc-input mkc-textarea" id="mkc-note" name="note" rows="2" maxlength="300">' + esc(details.note) + '</textarea></label>' +
      '</fieldset>' +
      '<label class="mkc-check"><input type="checkbox" id="mkc-terms"' + (details.terms ? ' checked' : '') + ' required aria-describedby="mkc-terms-err"><span>I agree to the ' +
      link(cfg.termsUrl, 'terms') + (cfg.refundUrl ? ', ' + link(cfg.refundUrl, 'refund policy') : '') + ' and ' + link(cfg.privacyUrl, 'privacy policy') + '.</span></label>' +
      '<span class="mkc-err" id="mkc-terms-err" aria-live="polite"></span>' +
      '<label class="mkc-check mkc-check-soft"><input type="checkbox" id="mkc-news"' + (details.news ? ' checked' : '') + '><span>Email me about new drops. Optional, unsubscribe any time.</span></label>' +
      '<p class="mkc-fine">We only ask for what is needed to deliver your order.' + (cfg.deleteUrl ? ' ' + link(cfg.deleteUrl, 'Request deletion of your data') + '.' : '') + '</p>' +
      '</form>';
    foot.innerHTML = summaryMini() + '<button type="button" class="mkc-btn mkc-btn-primary mkc-go">Continue to payment</button>';
    var form = body.querySelector('form');
    form.addEventListener('submit', function (e) { e.preventDefault(); submitDetails(); });
    foot.querySelector('.mkc-go').addEventListener('click', submitDetails);
  }
  function link(url, text) {
    return url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + text + '</a>' : text;
  }
  function summaryMini() {
    return '<dl class="mkc-sum"><div><dt>' + state.count + (state.count === 1 ? ' item' : ' items') + '</dt><dd>' + money(state.subtotal) + '</dd></div></dl>';
  }

  function readDetails() {
    var v = function (id) { var el = root.querySelector('#mkc-' + id); return el ? el.value.trim() : ''; };
    details.email = v('email'); details.phone = v('phone'); details.name = v('name');
    details.town = v('town'); details.address = v('address'); details.note = v('note');
    details.terms = root.querySelector('#mkc-terms').checked;
    details.news = root.querySelector('#mkc-news').checked;
  }
  function normPhone(p) {
    var d = p.replace(/[^\d]/g, '');
    if (d.indexOf('254') === 0) d = d.slice(3);
    if (d.charAt(0) === '0') d = d.slice(1);
    return /^[17]\d{8}$/.test(d) ? '+254' + d : '';
  }
  function setErr(id, msg) {
    var e = root.querySelector('#mkc-' + id + '-err'), inp = root.querySelector('#mkc-' + id);
    if (e) e.textContent = msg || '';
    if (inp) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
    return !msg;
  }
  function submitDetails() {
    readDetails();
    var ok = true, first = null;
    function check(id, cond, msg) { var good = setErr(id, cond ? '' : msg); if (!good && !first) first = id; ok = ok && good; }
    check('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email), 'Enter a valid email address.');
    check('phone', !!normPhone(details.phone), 'Enter a Kenyan mobile number, for example 712 345 678.');
    check('name', details.name.split(/\s+/).length >= 2, 'Enter your first and last name.');
    check('town', !!details.town, 'Enter your town or city.');
    check('address', !!details.address, 'Tell us where to deliver.');
    check('terms', details.terms, 'Please agree to the terms to continue.');
    if (!ok) { var f = root.querySelector('#mkc-' + first); if (f) f.focus(); return; }
    if (!isWoo()) { go('pay'); return; }
    var addr = address();
    busyOn(root.querySelector('.mkc-go'), 'Saving…');
    api('cart/update-customer', 'POST', { billing_address: addr.billing, shipping_address: addr.shipping })
      .then(fromStore).then(function () { busy = false; go('pay'); })
      .catch(function (e) { busy = false; render(); showFootError(e.message); });
  }
  function address() {
    var parts = details.name.split(/\s+/), first = parts.shift(), last = parts.join(' ');
    var ship = { first_name: first, last_name: last, address_1: details.address, city: details.town, country: 'KE', postcode: '', state: '' };
    var bill = Object.assign({}, ship, { email: details.email, phone: normPhone(details.phone) });
    return { billing: bill, shipping: ship };
  }

  function renderPay(body, foot) {
    var rates = state.rates;
    body.innerHTML =
      '<details class="mkc-order" open><summary>Order summary <span>' + money(state.total) + '</span></summary>' +
      '<ul class="mkc-lines mkc-lines-sm">' + state.items.map(function (it) { return lineHTML(it, false); }).join('') + '</ul></details>' +
      (rates.length ?
        '<fieldset class="mkc-set"><legend>Delivery option</legend><div class="mkc-radios">' +
        rates.map(function (r) {
          return '<label class="mkc-radio"><input type="radio" name="mkc-rate" value="' + esc(r.id) + '" data-pkg="' + r.pkg + '"' + (r.selected ? ' checked' : '') + '>' +
            '<span class="mkc-radio-main">' + esc(r.name) + '</span><span class="mkc-radio-price">' + (r.price ? money(r.price) : 'Free') + '</span></label>';
        }).join('') + '</div></fieldset>' : '') +
      '<fieldset class="mkc-set"><legend>Pay with</legend><div class="mkc-radios">' +
      (state.methods.length ? state.methods.map(function (m) {
        var mp = /mpesa|m-pesa|lipa/i.test(m.id + m.title);
        return '<label class="mkc-radio mkc-method"><input type="radio" name="mkc-method" value="' + esc(m.id) + '"' + (m.id === chosenMethod ? ' checked' : '') + '>' +
          '<span class="mkc-radio-main"><span class="mkc-badge' + (mp ? ' mkc-badge-mp' : '') + '" aria-hidden="true">' + (mp ? 'M' : '●●') + '</span>' + esc(m.title) +
          (m.description ? '<span class="mkc-radio-desc">' + esc(String(m.description).replace(/<[^>]+>/g, '')) + '</span>' : '') + '</span></label>';
      }).join('') : '<p class="mkc-fine">No payment methods are switched on for this store yet.</p>') +
      '</div></fieldset>' +
      '<p class="mkc-secure">' + ICON.lock + '<span>' + (isWoo() ?
        'You will confirm payment with the store\'s secure payment provider. Card details are never entered on this page.' :
        'In the live store you confirm payment with the store\'s secure payment provider. This demo takes no payment.') + '</span></p>';

    body.querySelectorAll('input[name="mkc-rate"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!isWoo()) return;
        mutate(api('cart/select-shipping-rate', 'POST', { package_id: +r.getAttribute('data-pkg'), rate_id: r.value }).then(fromStore));
      });
    });
    body.querySelectorAll('input[name="mkc-method"]').forEach(function (r) {
      r.addEventListener('change', function () { chosenMethod = r.value; });
    });

    foot.innerHTML =
      '<dl class="mkc-sum">' +
      '<div><dt>Subtotal</dt><dd>' + money(state.subtotal) + '</dd></div>' +
      '<div><dt>Delivery</dt><dd>' + (state.shipping == null ? (isWoo() ? 'Confirmed on payment' : 'Set by the store') : (state.shipping ? money(state.shipping) : 'Free')) + '</dd></div>' +
      '<div class="mkc-total"><dt>Total</dt><dd>' + money(state.total) + '</dd></div></dl>' +
      '<button type="button" class="mkc-btn mkc-btn-primary mkc-go"' + (state.methods.length ? '' : ' disabled') + '>' + ICON.lock + '<span>' + (isWoo() ? 'Pay ' : 'Place demo order · ') + money(state.total) + '</span></button>';
    foot.querySelector('.mkc-go').addEventListener('click', placeOrder);
  }

  function placeOrder() {
    var btn = root.querySelector('.mkc-go');
    if (!isWoo()) {
      busyOn(btn, 'Placing order…');
      setTimeout(function () {
        busy = false;
        var total = state.total;
        demoItems = []; fromDemo();
        done('Demo order complete', 'Nothing was charged. On the live store this is where the shopper confirms payment with M-Pesa or card.', total, '');
      }, 900);
      return;
    }
    var addr = address();
    busyOn(btn, 'Placing order…');
    api('checkout', 'POST', {
      billing_address: addr.billing, shipping_address: addr.shipping,
      customer_note: details.note, payment_method: chosenMethod, create_account: false
    }).then(function (res) {
      var pr = res.payment_result || {};
      if (pr.redirect_url) { window.location.href = pr.redirect_url; return; }
      busy = false;
      if (pr.payment_status === 'success' || res.status === 'processing' || res.status === 'completed' || res.status === 'on-hold') {
        var total = state.total;
        refresh();
        done('Thank you, ' + details.name.split(' ')[0], 'Order #' + res.order_id + ' is confirmed. A receipt is on its way to ' + details.email + '.', total, '');
      } else {
        render();
        showFootError('This payment method needs a few more details.', cfg.checkoutUrl);
      }
    }).catch(function (e) {
      busy = false; render();
      showFootError(e.message, cfg.checkoutUrl);
    });
  }

  function done(title, text, total) {
    step = 'done';
    render();
    var body = root.querySelector('.mkc-body'), foot = root.querySelector('.mkc-foot');
    body.innerHTML = '<div class="mkc-done"><span class="mkc-tick">' + ICON.check + '</span>' +
      '<p class="mkc-done-t">' + esc(title) + '</p><p class="mkc-done-s">' + esc(text) + '</p>' +
      (total ? '<p class="mkc-done-amt">' + money(total) + '</p>' : '') + '</div>';
    foot.innerHTML = '<button type="button" class="mkc-btn mkc-btn-primary" data-close>Back to the rack</button>';
    foot.querySelector('[data-close]').addEventListener('click', function () { close(); step = 'bag'; });
    body.focus();
  }

  function busyOn(btn, label) {
    busy = true;
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="mkc-spin" aria-hidden="true"></span><span>' + label + '</span>'; }
  }
  function mutate(p) {
    root.classList.add('is-busy');
    return p.then(function () { root.classList.remove('is-busy'); render(); })
      .catch(function (e) { root.classList.remove('is-busy'); render(); showFootError(e.message); });
  }
  function showFootError(msg, fallbackUrl) {
    var foot = root.querySelector('.mkc-foot');
    var el = document.createElement('p');
    el.className = 'mkc-alert'; el.setAttribute('role', 'alert');
    el.innerHTML = esc(msg) + (fallbackUrl ? ' <a href="' + esc(fallbackUrl) + '">Finish on the secure checkout page</a>' : '');
    foot.insertBefore(el, foot.firstChild);
  }

  /* ------------------------------------------------------------------ */
  function init(options) {
    cfg = Object.assign({}, options || {});
    nonce = cfg.nonce || '';
    if (isWoo()) refresh().catch(function () {}); else fromDemo();
  }

  window.MkurugenziCart = { init: init, add: add, open: open, close: close, count: function () { return state.count; } };
})();
