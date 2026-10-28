/* Master-Components — интерфейс: маршруты, страницы, мультиметр, тренажёр, калькуляторы. */
(function () {
  var $app = document.getElementById('app');
  var M = MC.meter, T = MC.tools;
  var catById = {}; MC.categories.forEach(function (c) { catById[c.id] = c; });
  var compById = {}; MC.components.forEach(function (c) { compById[c.id] = c; });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem('mc_' + k)); localStorage.setItem('mc_' + k, JSON.stringify(v)); } catch (e) { return null; } }
  // ---------- Звук прозвонки (как пищалка мультиметра, ~2,7 кГц) ----------
  var Sound = (function () {
    var ctx = null, active = [];
    var muted = store('muted') === true;
    function ensure() {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function stop() { active.forEach(function (o) { try { o.stop(); } catch (e) {} }); active = []; }
    function tone(start, dur) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 2700;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.07, start + 0.005);
      g.gain.setValueAtTime(0.07, start + dur - 0.01);
      g.gain.linearRampToValueAtTime(0, start + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(start); o.stop(start + dur + 0.02);
      active.push(o);
    }
    return {
      // kind: true — цепь целая (непрерывный писк), 'jitter' — плохой контакт (прерывистый), иначе тишина
      play: function (kind) {
        stop();
        if (muted || !kind || !ensure()) return;
        var t = ctx.currentTime + 0.01;
        if (kind === 'jitter') {
          var pat = [0.07, 0.12, 0.04, 0.2, 0.09, 0.05, 0.15, 0.06];
          pat.forEach(function (d, i) { if (i % 2 === 0) tone(t, d); t += d + 0.05; });
        } else tone(t, 0.9);
        if (navigator.vibrate) navigator.vibrate(kind === 'jitter' ? [60, 80, 40, 120, 80] : 300);
      },
      toggle: function () { muted = !muted; store('muted', muted); if (muted) stop(); },
      muted: function () { return muted; }
    };
  })();

  function pinName(comp, id) { var p = comp.pins.find(function (x) { return x.id === id; }); return p ? p.name : id; }

  // ---------- Оформление: акценты категорий, иконки ----------
  var CAT_UI = {
    passive:   { c: '#F5B82E', i: '<path d="M2 12h3.5l1.8-4.5 3 9 3-9 3 9 1.8-4.5H22"/>' },
    semi:      { c: '#3EA6FF', i: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/>' },
    wound:     { c: '#A66BFF', i: '<path d="M3 12h2.5a2.6 2.6 0 0 1 5 0 2.6 2.6 0 0 1 5 0 2.6 2.6 0 0 1 5 0H21"/><path d="M5 17h14" opacity=".55"/>' },
    appliance: { c: '#FF8A3D', i: '<path d="M12 3c.8 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2.6 1.6-3.8 2-5.6.9.9 1.5 2 2.6 2.4-.2-2.3-.6-4.4.4-6.8z"/>' },
    fridge:    { c: '#2ED3C6', i: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/>' },
    micro:     { c: '#FF5A55', i: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><rect x="5.5" y="8" width="10" height="8" rx="1"/><path d="M18.5 9v.01M18.5 12v.01M18.5 15v.01"/>' },
    switch:    { c: '#3FD47A', i: '<path d="M12 3v8"/><path d="M6.6 6.6a7.5 7.5 0 1 0 10.8 0"/>' },
    power:     { c: '#A3E05A', i: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3"/><path d="M10 9l-2 3h4l-2 3"/>' },
    tv:        { c: '#FF6FB1', i: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/><path d="M6 13h.01M9 13h.01M12 13h.01M15 13h.01M18 13h.01"/>' }
  };
  // ---------- Избранное, недавние, статистика ошибок ----------
  function favs() { return store('fav') || []; }
  function isFav(id) { return favs().indexOf(id) >= 0; }
  function toggleFav(id) { var f = favs(), i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.unshift(id); store('fav', f); return i < 0; }
  function pushRecent(id) { var r = (store('recent') || []).filter(function (x) { return x !== id; }); r.unshift(id); store('recent', r.slice(0, 8)); }
  function recordAnswer(c, s, right) {
    var st = store('stats') || {}, e = st[c.id] || { r: 0, t: 0, w: {} };
    e.t++; if (right) e.r++; else e.w[s.id] = (e.w[s.id] || 0) + 1;
    st[c.id] = e; store('stats', st);
  }
  function weakList() {
    var st = store('stats') || {};
    return Object.keys(st).filter(function (id) { return compById[id] && st[id].t > st[id].r; }).map(function (id) { var e = st[id]; return { c: compById[id], e: e, rate: (e.t - e.r) / e.t }; })
      .sort(function (a, b) { return b.rate - a.rate || (b.e.t - b.e.r) - (a.e.t - a.e.r); });
  }
  function icon(paths, size) { return '<svg viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'; }
  var ICO = {
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 12.6 12.6 21 11.3 19.7a4 4 0 0 0-5-5L3 11.4 11.4 3z" opacity="0"/><path d="M14.5 5.5a4 4 0 0 1 5 5l-2 .5-3.5-3.5z"/><path d="M14 7l-9.5 9.5a2.1 2.1 0 0 0 3 3L17 10"/><path d="M4 4l5 5M3 7l4-4"/>',
    trainers: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    exam: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    nodes: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h4a3 3 0 0 1 3 3V14"/>',
    rainbow: '<path d="M3 17a9 9 0 0 1 18 0"/><path d="M7 17a5 5 0 0 1 10 0"/>',
    smd: '<rect x="4" y="7" width="16" height="10" rx="1.5"/><path d="M8 7v10M16 7v10"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    pin: '<path d="M8 4h8v7a4 4 0 0 1-8 0z"/><path d="M10 15v6M14 15v6M12 15v6"/>',
    swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
    therm: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'
  };
  // Раздел, к которому относится текущий экран (для нижней навигации и кнопки «Назад»)
  var TOOL_ROUTES = ['tools', 'resistor', 'smd', 'calcs', 'pinouts', 'analogs', 'ntc', 'voltage'];
  var TRAIN_ROUTES = ['trainers', 'quiz', 'nodes', 'node'];
  function section() {
    var r = location.hash.replace(/^#\/?/, '').split('/')[0];
    if (TOOL_ROUTES.indexOf(r) >= 0) return 'tools';
    if (TRAIN_ROUTES.indexOf(r) >= 0) return 'trainers';
    return 'home';
  }

  // ---------- Шапка ----------
  function header(title, back) {
    if (back === '#/') { var sec = section(); if (sec === 'tools') back = '#/tools'; else if (sec === 'trainers') back = '#/trainers'; }
    return '<header class="top">' +
      (back ? '<a class="back" href="' + back + '" aria-label="Назад">' + icon(ICO.back, 22) + '</a>' : '<span class="logo">' + logoSvg() + '</span>') +
      '<h1>' + esc(title) + '</h1>' +
      '</header>';
  }
  function brandHeader(sub) {
    return '<header class="top brand"><span class="logo">' + logoSvg() + '</span><div class="brand-tx"><h1>Master Components</h1><small>' + esc(sub) + '</small></div></header>';
  }
  function logoSvg() {
    return '<svg viewBox="0 0 48 48" width="36" height="36"><defs><linearGradient id="lgA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD064"/><stop offset="1" stop-color="#E8A512"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="12" fill="url(#lgA)"/><rect x="9" y="8" width="30" height="14" rx="3" fill="#1d241a"/><text x="24" y="19" font-size="9" font-family="monospace" font-weight="700" fill="#cfe0b4" text-anchor="middle">0.56</text><circle cx="24" cy="33" r="7" fill="#1d241a"/><line x1="24" y1="33" x2="28" y2="28" stroke="#F5B82E" stroke-width="2.5" stroke-linecap="round"/></svg>';
  }
  // Нижняя навигация (создаётся один раз)
  function tabbar() {
    var nav = document.getElementById('tabbar');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'tabbar';
      nav.setAttribute('aria-label', 'Разделы');
      nav.innerHTML = [['home', '#/', 'Главная', ICO.home], ['tools', '#/tools', 'Инструменты', ICO.tools], ['trainers', '#/trainers', 'Тренажёры', ICO.trainers]].map(function (t) {
        return '<a href="' + t[1] + '" data-tab="' + t[0] + '"><span class="tb-ic">' + icon(t[3], 24) + '</span><span>' + t[2] + '</span></a>';
      }).join('');
      document.body.appendChild(nav);
    }
    var sec = section();
    nav.querySelectorAll('a').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === sec); });
  }
  // Карточка компонента с реалистичным изображением
  function compCard(c, href, i, extra) {
    var cu = CAT_UI[c.cat] || CAT_UI.passive;
    return '<a class="ccard" href="' + (href || '#/c/' + c.id) + '" style="--i:' + (i || 0) + ';--c:' + cu.c + '"><span class="ccard-img">' + MC.photo(c) + '</span><span class="ccard-n">' + esc(c.name) + '</span>' + (extra ? '<small class="ccard-x">' + extra + '</small>' : '') + '</a>';
  }

  // ---------- Плавное раскрытие/сворачивание (общая анимация) ----------
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animateHeight(el, from, to, done) {
    if (reduceMotion || !el.animate) { done && done(); return; }
    el.style.overflow = 'hidden';
    var an = el.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
    an.onfinish = function () { el.style.overflow = ''; done && done(); };
  }
  // Все <details> в приложении раскрываются плавно
  document.addEventListener('click', function (e) {
    var sum = e.target.closest('summary');
    if (!sum) return;
    var d = sum.parentElement;
    if (!d || d.tagName !== 'DETAILS' || d.dataset.animating) return;
    e.preventDefault();
    var start = d.offsetHeight;
    d.dataset.animating = '1';
    if (d.open) {
      animateHeight(d, start, sum.offsetHeight, function () { d.open = false; delete d.dataset.animating; });
    } else {
      d.open = true;
      var end = d.offsetHeight;
      d.classList.add('opening');
      animateHeight(d, start, end, function () { d.classList.remove('opening'); delete d.dataset.animating; });
    }
  });

  // ---------- Главная (Компоненты) ----------
  var openCat = null; // какая категория раскрыта (в пределах сеанса; при загрузке все закрыты)
  var homeScroll = 0;
  function viewHome() {
    var html = brandHeader('Справочник радиокомпонентов') +
      '<main class="wrap hm">' +
      '<div class="search"><span class="s-ic">' + icon(ICO.search, 20) + '</span><input id="q" type="search" placeholder="Поиск: диод, ТЭН, симистор…" autocomplete="off" enterkeyhint="search"><button class="s-clr" id="qclr" aria-label="Очистить" hidden>' + icon(ICO.x, 18) + '</button></div>' +
      '<div id="results"></div>' +
      '<div id="catlist">' + homeLists() + '<h2 class="sect">Категории</h2><div class="accs">';
    MC.categories.forEach(function (c) {
      var items = MC.components.filter(function (x) { return x.cat === c.id; });
      var cu = CAT_UI[c.id] || CAT_UI.passive, isOpen = openCat === c.id;
      html += '<section class="acc' + (isOpen ? ' open' : '') + '" data-cat="' + c.id + '" style="--c:' + cu.c + '">' +
        '<button class="acc-h" aria-expanded="' + isOpen + '"><span class="acc-ic">' + icon(cu.i, 22) + '</span><span class="acc-t">' + esc(c.name) + '</span>' +
        '<span class="acc-cnt">' + items.length + '</span><span class="acc-chev">' + icon(ICO.chev, 18) + '</span></button>' +
        '<div class="acc-b"' + (isOpen ? '' : ' hidden') + '><div class="acc-in"><p class="acc-d">' + esc(c.desc) + '</p><div class="cgrid">' + items.map(function (x, i) { return compCard(x, null, i); }).join('') + '</div></div></div></section>';
    });
    html += '</div><p class="foot">Значения в тренажёре — типичные для указанного примера. На реальной плате параллельные цепи могут менять показания: при сомнении выпаяйте компонент.</p></div></main>';
    $app.innerHTML = html;
    if (openCat) window.scrollTo(0, homeScroll);
    var accs = $app.querySelector('.accs');
    function setOpen(sec, open, instant) {
      var body = sec.querySelector('.acc-b'), h = sec.querySelector('.acc-h');
      h.setAttribute('aria-expanded', open);
      if (open) {
        sec.classList.add('open'); body.hidden = false;
        var end = body.scrollHeight;
        if (!instant) animateHeight(body, 0, end);
      } else {
        var startH = body.offsetHeight;
        sec.classList.remove('open');
        if (instant || reduceMotion) { body.hidden = true; return; }
        animateHeight(body, startH, 0, function () { if (!sec.classList.contains('open')) body.hidden = true; });
      }
    }
    accs.addEventListener('click', function (e) {
      var h = e.target.closest('.acc-h'); if (!h) return;
      var sec = h.parentElement, willOpen = !sec.classList.contains('open');
      accs.querySelectorAll('.acc.open').forEach(function (o) { if (o !== sec) setOpen(o, false); });
      setOpen(sec, willOpen);
      openCat = willOpen ? sec.dataset.cat : null;
      if (willOpen) setTimeout(function () {
        var r = sec.getBoundingClientRect();
        if (r.top < 70 || r.top > window.innerHeight * 0.55) window.scrollTo({ top: window.scrollY + r.top - 76, behavior: reduceMotion ? 'auto' : 'smooth' });
      }, 320);
    });
    $app.querySelector('main').addEventListener('click', function (e) { if (e.target.closest('.ccard')) homeScroll = window.scrollY; });
    var q = document.getElementById('q'), res = document.getElementById('results'), clr = document.getElementById('qclr'), cl = document.getElementById('catlist');
    q.addEventListener('input', function () {
      var s = q.value.trim().toLowerCase();
      clr.hidden = !q.value;
      if (s.length < 2) { res.innerHTML = ''; cl.hidden = false; return; }
      var found = MC.components.filter(function (c) { return (c.name + ' ' + c.sub + ' ' + c.types.map(function (t) { return t[0]; }).join(' ')).toLowerCase().indexOf(s) >= 0; });
      cl.hidden = true;
      res.innerHTML = found.length ? '<h2 class="sect">Найдено: ' + found.length + '</h2><div class="cgrid res-in">' + found.map(function (x, i) { return compCard(x, null, i); }).join('') + '</div>' : '<p class="muted empty">Ничего не найдено.</p>';
    });
    clr.addEventListener('click', function () { q.value = ''; q.dispatchEvent(new Event('input')); q.focus(); });
  }
  function homeLists() {
    var f = favs().map(function (id) { return compById[id]; }).filter(Boolean);
    var r = (store('recent') || []).map(function (id) { return compById[id]; }).filter(Boolean).slice(0, 8);
    var out = '';
    if (f.length) out += '<h2 class="sect">★ Избранное</h2><div class="cgrid mini">' + f.map(function (x, i) { return compCard(x, null, i); }).join('') + '</div>';
    if (r.length) out += '<h2 class="sect">Недавние</h2><div class="cgrid mini">' + r.map(function (x, i) { return compCard(x, null, i); }).join('') + '</div>';
    return out;
  }
  function tile(href, ic, t) { return '<a class="tile" href="' + href + '"><span>' + ic + '</span><b>' + t + '</b></a>'; }
  function toolCard(href, ic, t, d, c, i) {
    return '<a class="tool2" href="' + href + '" style="--c:' + (c || 'var(--acc)') + ';--i:' + (i || 0) + '"><span class="tool2-ic">' + icon(ic, 24) + '</span><b>' + t + '</b><small>' + d + '</small><span class="tool2-go">' + icon(ICO.chev, 16) + '</span></a>';
  }
  function compRow(c) {
    return '<a class="row" href="#/c/' + c.id + '"><span class="row-ph">' + MC.photo(c) + '</span><span class="row-tx"><b>' + esc(c.name) + '</b><small>' + esc(c.sub) + '</small></span><span class="chev">' + icon(ICO.chev, 18) + '</span></a>';
  }

  // ---------- Инструменты ----------
  function viewTools() {
    var L = [
      ['#/resistor', ICO.rainbow, 'Цвета резисторов', 'Маркировка 4, 5, 6 полос и обратно', '#F5B82E'],
      ['#/smd', ICO.smd, 'SMD-коды', 'Резисторы, конденсаторы, транзисторы и диоды SOT-23', '#3EA6FF'],
      ['#/calcs', ICO.calc, 'Калькуляторы', 'Ом, ТЭН, светодиод, делитель и другие', '#A66BFF'],
      ['#/pinouts', ICO.pin, 'Цоколёвки', 'TO-92, TO-220, TO-247, SOT, DIP-8', '#2ED3C6'],
      ['#/analogs', ICO.swap, 'Аналоги и замена', 'Чем заменить и на что смотреть', '#FF8A3D'],
      ['#/ntc', ICO.therm, 'Датчики NTC', 'Таблицы и перевод замера в °C', '#FF5A55'],
      ['#/voltage', ICO.bolt, 'Под напряжением', 'Нормы в типичных точках техники', '#3FD47A']
    ];
    $app.innerHTML = brandHeader('Инструменты и справочники') + '<main class="wrap"><h2 class="sect">Инструменты</h2><div class="tgrid">' +
      L.map(function (t, i) { return toolCard(t[0], t[1], t[2], t[3], t[4], i); }).join('') + '</div></main>';
  }
  // Слабые места: где чаще всего ошибались в экзамене и тренировках
  function weakBlock() {
    var w = weakList();
    if (!w.length) return '<h2 class="sect">Слабые места</h2><p class="muted">Здесь появятся компоненты, на которых вы ошибались в экзамене. Пока ошибок нет.</p>';
    return '<h2 class="sect">Слабые места</h2><div class="list">' + w.slice(0, 6).map(function (x) {
      var worst = Object.keys(x.e.w).sort(function (a, b) { return x.e.w[b] - x.e.w[a]; })[0];
      var stn = (x.c.states.find(function (s) { return s.id === worst; }) || {}).name || '';
      return '<a class="row" href="#/quiz/' + x.c.id + '"><span class="row-ph">' + MC.photo(x.c) + '</span><span class="row-tx"><b>' + esc(x.c.name) + '</b><small>Ошибок ' + (x.e.t - x.e.r) + ' из ' + x.e.t + (stn ? ' · чаще всего: «' + esc(stn) + '»' : '') + '</small></span><span class="chev">' + icon(ICO.chev, 18) + '</span></a>';
    }).join('') + '</div><div class="row2"><a class="btn" href="#/quiz/weak">🎯 Экзамен по слабым местам</a><button class="btn ghost" id="wreset">Сбросить статистику</button></div>';
  }
  // ---------- Тренажёры ----------
  function viewTrainers() {
    var sc = store('score') || { right: 0, total: 0 }, ns = store('nodeScore') || { right: 0, total: 0 };
    $app.innerHTML = brandHeader('Тренажёры и экзамены') + '<main class="wrap"><h2 class="sect">Тренажёры</h2><div class="tgrid big">' +
      toolCard('#/quiz', ICO.exam, 'Экзамен: найди неисправность', 'Скрытая поломка, меряете и выбираете ответ. Тренировка на любом компоненте.', '#F5B82E', 0) +
      toolCard('#/nodes', ICO.nodes, 'Схемы узлов', 'БП, стиралка, СВЧ, холодильник, кондиционер — найдите сгоревший компонент.', '#3EA6FF', 1) +
      '</div>' +
      '<h2 class="sect">Ваш счёт</h2><div class="stats"><div class="stat"><b>' + sc.right + '<small> / ' + sc.total + '</small></b><span>Тренировки</span></div><div class="stat"><b>' + ns.right + '<small> / ' + ns.total + '</small></b><span>Схемы узлов</span></div></div>' +
      weakBlock() + '</main>';
    var rs = document.getElementById('wreset'); if (rs) rs.onclick = function () { store('stats', {}); viewTrainers(); };
  }

  // ---------- Категория ----------
  function viewCat(id) {
    var c = catById[id]; if (!c) return viewHome();
    var list = MC.components.filter(function (x) { return x.cat === id; });
    $app.innerHTML = header(c.name, '#/') + '<main class="wrap"><p class="lead">' + esc(c.desc) + '</p><div class="cgrid">' + list.map(function (x, i) { return compCard(x, null, i); }).join('') + '</div></main>';
  }

  // ---------- Реалистичный рисунок с выводами и линиями неисправностей ----------
  function pairStatus(comp, state, a, b, on, prefMode) {
    var ok = M.okState(comp), modes = comp.modes.filter(function (m) { return m !== 'beep'; });
    if (prefMode && prefMode !== 'beep') modes = [prefMode].concat(modes.filter(function (m) { return m !== prefMode; }));
    for (var i = 0; i < modes.length; i++) {
      var dirs = [[a, b], [b, a]];
      for (var j = 0; j < 2; j++) {
        var x = M.measure(comp, state, modes[i], dirs[j][0], dirs[j][1], on), y = M.measure(comp, ok, modes[i], dirs[j][0], dirs[j][1], on);
        if (x.val !== y.val && !M.same(x.raw, y.raw)) return { bad: true, mode: modes[i], m: x };
        if (typeof x.raw === 'string' && x.raw !== y.raw) return { bad: true, mode: modes[i], m: x };
      }
    }
    return { bad: false };
  }
  function shortPin(p) {
    var n = p.name.replace(/\s*\(([^)]*)\)\s*/, function (m, inner) { return inner.length <= 3 ? '|' + inner : ''; });
    if (n.indexOf('|') >= 0) n = n.split('|')[1];
    return n.trim();
  }
  var GCOL = ['#4fa3ff', '#ffb547', '#c08bff', '#4fd2c8'];
  var TRAY = { red: [226, 256], black: [226, 282] };
  // Щуп: остриё в (x,y), корпус вдоль оси, угол a
  function probeSvg(color, x, y, a, dragging) {
    var body = color === 'red' ? '#e5352b' : '#15181c', edge = color === 'red' ? '#ff8a80' : '#8a939c';
    return '<g class="probe' + (dragging ? ' drag' : '') + '" data-drag="' + color + '" transform="translate(' + x + ' ' + y + ') rotate(' + a + ')">' +
      '<circle r="26" cy="40" fill="transparent"/>' +
      '<line x1="0" y1="0" x2="0" y2="40" stroke="#dfe3e8" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="-7" y="38" width="14" height="10" rx="2" fill="' + edge + '"/>' +
      '<rect x="-8" y="47" width="16" height="52" rx="6" fill="' + body + '" stroke="' + edge + '" stroke-width="1.5"/>' +
      '<line x1="-4" y1="58" x2="4" y2="58" stroke="' + edge + '"/><line x1="-4" y1="64" x2="4" y2="64" stroke="' + edge + '"/>' +
      '<path d="M0 99 Q0 120 ' + (color === 'red' ? -14 : 14) + ' 132" fill="none" stroke="' + body + '" stroke-width="4"/></g>';
  }
  function probeAngle(side, color) {
    if (side === 'l') return color === 'red' ? 145 : 35;
    if (side === 'r') return color === 'red' ? -145 : -35;
    var base = side === 't' ? 180 : 0;
    return base + (color === 'red' ? 22 : -22);
  }
  function lookView(comp, st, quiz) {
    var L = MC.look(comp);
    if (!L) return '<div class="comp-vis">' + MC.symbol(comp.sym) + '</div>';
    var arcs = '', badList = [], seen = {}, badPins = {};
    if (!quiz) {
      M.measurementList(comp).forEach(function (ms) {
        var key = [ms.a, ms.b].sort().join('|');
        if (seen[key] || !L.pos[ms.a] || !L.pos[ms.b]) return;
        seen[key] = 1;
        var p = L.pos[ms.a], q = L.pos[ms.b];
        var r = pairStatus(comp, st.state, ms.a, ms.b, st.on, st.mode);
        var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / len, ny = dx / len, bulge = 14 + len * 0.22 + (p[2] === 'b' && q[2] === 'b' ? 40 : 0) + (p[2] === 't' && q[2] === 't' ? 24 : 0);
        if ((mx + nx * bulge - 160) * (mx + nx * bulge - 160) + (my + ny * bulge - 100) * (my + ny * bulge - 100) < (mx - nx * bulge - 160) * (mx - nx * bulge - 160) + (my - ny * bulge - 100) * (my - ny * bulge - 100)) { nx = -nx; ny = -ny; }
        var cx = mx + nx * bulge, cy = my + ny * bulge;
        var active = [st.red, st.black].sort().join('|') === key;
        arcs += '<path d="M' + p[0] + ' ' + p[1] + ' Q' + cx + ' ' + cy + ' ' + q[0] + ' ' + q[1] + '" class="arc ' + (r.bad ? 'bad' : 'ok') + (active ? ' act' : '') + '"/>';
        if (r.bad) {
          badPins[ms.a] = badPins[ms.b] = 1;
          var okm = M.measure(comp, M.okState(comp), r.mode, ms.a, ms.b, st.on);
          badList.push('<li><span class="mtag">' + MC.modes[r.mode].name + '</span> <b>' + L.num[ms.a] + '–' + L.num[ms.b] + '</b> ' + esc(pinName(comp, ms.a)) + ' ↔ ' + esc(pinName(comp, ms.b)) + ': <span class="vbad">' + esc((r.m.val + ' ' + (r.m.unit || '')).trim()) + '</span> <span class="vok">норма ' + esc((okm.val + ' ' + (okm.unit || '')).trim()) + '</span></li>');
        }
      });
    }
    // группы (обмотки/контакты)
    var gcol = {}, frames = '', gleg = [];
    L.groups.forEach(function (g, gi) {
      var ids = g.slice(0, -1), name = g[g.length - 1], col = GCOL[gi % GCOL.length];
      var pts = ids.map(function (id) { return L.pos[id]; }).filter(Boolean);
      if (!pts.length) return;
      ids.forEach(function (id) { gcol[id] = col; });
      var x0 = Math.min.apply(null, pts.map(function (p) { return p[0]; })) - 17, x1 = Math.max.apply(null, pts.map(function (p) { return p[0]; })) + 17;
      var y0 = Math.min.apply(null, pts.map(function (p) { return p[1]; })) - 17, y1 = Math.max.apply(null, pts.map(function (p) { return p[1]; })) + 17;
      frames += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" rx="12" class="gframe" style="stroke:' + col + '"/>';
      gleg.push('<span class="gl"><i style="background:' + col + '"></i>' + ids.map(function (id) { return L.num[id]; }).join('–') + ' ' + esc(name) + '</span>');
    });
    // подписи выводов
    var bottoms = comp.pins.filter(function (p) { return L.pos[p.id] && L.pos[p.id][2] === 'b'; }).sort(function (a, b) { return L.pos[a.id][0] - L.pos[b.id][0]; });
    var crowded = {}, stagger = {};
    bottoms.forEach(function (p, i) {
      var gap = Math.min(i > 0 ? L.pos[p.id][0] - L.pos[bottoms[i - 1].id][0] : 999, i < bottoms.length - 1 ? L.pos[bottoms[i + 1].id][0] - L.pos[p.id][0] : 999);
      if (gap < 60 && shortPin(p).length > 4) crowded[p.id] = 1;
      if (i % 2 === 1 && gap < 95) stagger[p.id] = 16;
    });
    var pins = comp.pins.map(function (p) {
      var pos = L.pos[p.id]; if (!pos) return '';
      var lbl = crowded[p.id] || (gcol[p.id] && shortPin(p).length > 4) ? '' : shortPin(p);
      var lx = pos[0], ly = pos[1], anchor = 'middle';
      if (pos[2] === 'b') ly += 28 + (stagger[p.id] || 0); else if (pos[2] === 't') ly -= 18; else if (pos[2] === 'l') { lx -= 18; ly += 4; anchor = 'end'; } else { lx += 18; ly += 4; anchor = 'start'; }
      return '<g class="pinpick" data-pick="' + p.id + '"><circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="20" class="hit"/>' +
        (badPins[p.id] ? '<circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="15" class="pbad"/>' : '') +
        '<circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="11" class="pdot" style="stroke:' + (gcol[p.id] || '#11151a') + '"/>' +
        '<text x="' + pos[0] + '" y="' + (pos[1] + 4.5) + '" class="pnum">' + L.num[p.id] + '</text>' +
        (lbl ? '<text x="' + lx + '" y="' + ly + '" text-anchor="' + anchor + '" class="plbl' + (badPins[p.id] ? ' bad' : '') + '">' + esc(lbl) + '</text>' : '') + '</g>';
    }).join('');
    // щупы
    var probes = ['black', 'red'].map(function (color) {
      var id = st[color], pos = id && L.pos[id];
      if (pos) return probeSvg(color, pos[0], pos[1], probeAngle(pos[2], color));
      return probeSvg(color, TRAY[color][0], TRAY[color][1], -90);
    }).join('');
    var tray = '<rect x="214" y="240" width="166" height="58" rx="10" class="tray"/><text x="190" y="274" class="traytx" text-anchor="end">щупы →</text>';
    var legend;
    if (quiz) legend = '';
    else if (st.state.ok) legend = '<div class="legend"><span><i class="lg ok"></i>между этими выводами всё в норме</span></div>';
    else if (badList.length) legend = '<div class="faultlist"><div class="fl-h">✗ ' + esc(st.state.name) + ' — где видно:</div><ul>' + badList.join('') + '</ul></div>';
    else legend = '<div class="faultlist warn"><div class="fl-h">≈ ' + esc(st.state.name) + '</div><p>Мультиметром не видно ни на одной паре выводов' + (comp.toggle && !st.on ? ' (попробуйте «' + esc(comp.toggle.label) + '»)' : '') + '. ' + esc(st.state.why || '') + '</p></div>';
    return '<div class="look"><div class="look-hint">Перетащите <b class="tred">красный</b> и <b class="tblack">чёрный</b> щупы на ножки — или нажимайте на ножки по очереди</div>' +
      '<svg viewBox="-60 -24 440 330" class="looksvg">' + L.g + frames + arcs + pins + tray + probes + '</svg>' +
      (gleg.length ? '<div class="glegend">' + gleg.join('') + '</div>' : '') + legend + '</div>';
  }

  // ---------- Мультиметр (общий виджет) ----------
  // opts: {state, quiz:boolean, states:boolean (кнопки состояний внутри), onChange}
  function meterWidget(root, comp, opts) {
    // Номинал: случайный вариант (или заданный)
    var baseComp = comp;
    var vcount = (MC.variants[baseComp.id] || [0]).length;
    var vi = opts.variant != null ? opts.variant : Math.floor(Math.random() * vcount);
    comp = MC.variant(baseComp, vi);
    function mapState(s) { return s ? (comp.states.find(function (x) { return x.id === s.id; }) || M.okState(comp)) : M.okState(comp); }
    var st = { mode: comp.modes[0], red: null, black: null, on: false, board: false, state: mapState(opts.state) };
    var lastM = null;
    function txt(m) { return (m.val + (m.unit ? ' ' + m.unit : '')).trim(); }
    // Блок «Сейчас / Норма» и вывод
    function readout(m) {
      var label = comp.variantLabel || (M.okState(comp).note || comp.name);
      var head = '<div class="scr-title"><span>ВЗЯТ ЗА ОСНОВУ</span><b>' + esc(label) + '</b>' +
        (vcount > 1 ? '<button class="reroll" data-reroll="1">🎲 Другой номинал</button>' : '') + '</div>';
      var nowCls = 'now', normTxt = '?', vd = '';
      if (m.idle) vd = '<div class="li hint">Поставьте <b class="tred">красный</b> и <b class="tblack">чёрный</b> щупы на ножки (перетащите на рисунке ниже)</div>';
      else if (m.same) vd = '<div class="li hint">Оба щупа на одной ножке — переставьте один</div>';
      else if (opts.quiz) vd = '<div class="li hint">Состояние скрыто — меряйте и ставьте диагноз</div>';
      else {
        var okM = M.measure(comp, M.okState(comp), st.mode, st.red, st.black, st.on, st.board);
        normTxt = txt(okM);
        var isSame = M.same(m.raw, okM.raw) && !(typeof m.raw === 'string' && m.raw !== okM.raw);
        if (st.state.ok) { nowCls += ' good'; vd = '<div class="li vd good">✓ ИСПРАВЕН — значение правильное</div>'; }
        else if (isSame) {
          nowCls += ' warn';
          vd = '<div class="li vd warn">≈ ' + esc(st.state.name.toUpperCase()) + ' — в этой точке не видно</div>' +
            '<div class="li why">' + (st.board ? 'На плате параллельная цепь маскирует неисправность — выпаяйте один вывод и перемерьте. ' : 'Переставьте щупы, смените режим' + (comp.toggle ? ' или нажмите «' + esc(comp.toggle.label) + '»' : '') + '. ') + esc(st.state.why || '') + '</div>';
        } else {
          nowCls += ' bad';
          vd = '<div class="li vd bad">✗ НЕИСПРАВЕН: ' + esc(st.state.name.toUpperCase()) + '</div>' + (st.state.why ? '<div class="li why">' + esc(st.state.why) + '</div>' : '') + '<div class="li ex">Показание неисправной детали — пример замера.</div>';
        }
      }
      var nowVal = '<span class="lcd-val' + (m.text ? ' txt' : '') + '">' + esc(m.val) + '</span><span class="lcd-unit">' + esc(m.unit || '') + '</span>';
      return head +
        '<div class="scr-vals"><div class="sv ' + nowCls + '"><span>СЕЙЧАС</span><div class="svv">' + nowVal + '</div></div>' +
        '<div class="sv norm' + (normTxt.length > 9 ? ' long' : '') + '"><span>НОРМА</span><div class="svv"><b>' + esc(normTxt) + '</b></div></div></div>' +
        '<div class="lcd-info">' + vd + '</div>';
    }
    function render() {
      var m = M.measure(comp, st.state, st.mode, st.red, st.black, st.on, st.board);
      lastM = m;
      var modeBtns = comp.modes.map(function (md) {
        return '<button class="mode' + (md === st.mode ? ' on' : '') + '" data-mode="' + md + '" title="' + MC.modes[md].title + '">' + MC.modes[md].name + '</button>';
      }).join('');
      var LK = MC.look(comp);
      var pinsRow = function (color) {
        return comp.pins.map(function (p) {
          return '<button class="pin ' + color + (st[color] === p.id ? ' sel' : '') + '" data-probe="' + color + '" data-pin="' + p.id + '">' + (LK && LK.num[p.id] ? '<b>' + LK.num[p.id] + '</b> ' : '') + esc(p.name) + '</button>';
        }).join('');
      };
      var beep = m.beep === true ? '<span class="beep on">🔊</span>' : m.beep === 'jitter' ? '<span class="beep jit">🔊</span>' : '<span class="beep">🔊</span>';
      var glow = m.glow ? '<span class="glow ' + m.glow + '">● ' + (m.glow === 'dim' ? 'еле светится' : 'светится') + '</span>' : '';
      var probes = st.red && st.black && st.red !== st.black ? '<span class="lcd-pr"><i class="pr-r">+</i>' + (LK ? LK.num[st.red] + ' ' : '') + esc(pinName(comp, st.red)) + ' <i class="pr-b">COM</i>' + (LK ? LK.num[st.black] + ' ' : '') + esc(pinName(comp, st.black)) + '</span>' : '';
      var states = opts.states ? '<div class="states in">' + comp.states.map(function (s) {
        return '<button class="stbtn' + (s.ok ? ' okb' : '') + (s.id === st.state.id ? ' on' : '') + '" data-st="' + s.id + '">' + esc(s.name) + '</button>';
      }).join('') + '</div>' : '';
      var toggle = comp.toggle ? '<button class="toggle' + (st.on ? ' on' : '') + '" data-toggle="1">' + (st.on ? '✓ ' : '') + esc(comp.toggle.label) + '</button>' : '';

      root.innerHTML = states +
        '<div class="meter big">' +
          '<div class="meter-top"><span class="brand">MASTER DT-830</span><span class="mt-r"><button class="mute" data-mute="1" aria-label="Звук прозвонки">' + (Sound.muted() ? '🔇 выкл' : '🔈 звук') + '</button><span class="auto">AUTO</span></span></div>' +
          '<div class="modes top">' + modeBtns + '</div>' +
          '<div class="scr">' +
            '<div class="lcd-r1"><span class="lcd-mode">' + (MC.modes[st.mode].lcd || MC.modes[st.mode].name) + ' <small>' + MC.modes[st.mode].title + '</small></span>' + beep + (st.board ? '<span class="pcb">НА ПЛАТЕ</span>' : '') + glow + '</div>' +
            readout(m) + (opts.quiz ? '' : '<div class="anim-host"></div>') + probes +
            lookView(comp, st, opts.quiz) +
          '</div>' +
        '</div>' +
        '<div class="actions"><button class="swap" data-swap="1">⇄ Поменять щупы</button>' + toggle +
          '<button class="toggle' + (st.board ? ' on' : '') + '" data-board="1" title="Компонент впаян, параллельно стоит цепь ~1 кОм">' + (st.board ? '✓ ' : '') + 'На плате</button></div>' +
        '<details class="fold probes"' + (pinsOpen ? ' open' : '') + '><summary>🔢 Выбрать выводы кнопками</summary><div class="fold-b">' +
          '<div class="probe-lbl"><span class="dot red"></span>Красный щуп (+)</div><div class="pins">' + pinsRow('red') + '</div>' +
          '<div class="probe-lbl"><span class="dot black"></span>Чёрный щуп (COM)</div><div class="pins">' + pinsRow('black') + '</div>' +
        '</div></details>';      var hp = opts.states ? document.querySelector('.hero-ph') : null;
      if (hp && hp.getAttribute('data-v') !== String(vi)) { hp.setAttribute('data-v', vi); hp.innerHTML = MC.photo(comp); }
      var ah = root.querySelector('.anim-host');
      if (ah && MC.Anim) { if (!anim) anim = new MC.Anim(); anim.mount(ah, comp, st.state); }
    }
    var nextProbe = 'red', pinsOpen = false, drag = null, anim = null;
    function svgPt(svg, e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
    root.addEventListener('toggle', function (e) { if (e.target.classList && e.target.classList.contains('probes')) pinsOpen = e.target.open; }, true);
    root.addEventListener('touchstart', function (e) { if (e.target.closest && e.target.closest('[data-drag]')) e.preventDefault(); }, { passive: false });
    root.addEventListener('pointerdown', function (e) {
      var g = e.target.closest('[data-drag]'); if (!g) return;
      e.preventDefault();
      var svg = g.ownerSVGElement;
      drag = { color: g.getAttribute('data-drag'), el: g, svg: svg, moved: false };
      g.classList.add('drag');
      svg.appendChild(g);
      function move(ev) {
        var p = svgPt(svg, ev); drag.moved = true;
        g.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') rotate(0)');
        var L = MC.look(comp), best = null, bd = 34;
        Object.keys(L.pos).forEach(function (id) { var q = L.pos[id], d = Math.hypot(q[0] - p.x, q[1] - p.y); if (d < bd) { bd = d; best = id; } });
        svg.querySelectorAll('.pinpick').forEach(function (n) { n.classList.toggle('near', n.getAttribute('data-pick') === best); });
        drag.target = best;
      }
      function up() {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        var d = drag; drag = null;
        if (!d.moved) { render(); return; }
        var other = d.color === 'red' ? 'black' : 'red';
        st[d.color] = d.target || null;
        if (d.target && st[other] === d.target) st[other] = null;
        nextProbe = other;
        render(); Sound.play(lastM && lastM.beep);
      }
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-drag]') || e.target.closest('.anim-host')) return;
      var pk = e.target.closest('[data-pick]');
      if (pk) {
        var id = pk.getAttribute('data-pick'), other = nextProbe === 'red' ? 'black' : 'red';
        st[nextProbe] = id; if (st[other] === id) st[other] = null;
        nextProbe = other;
        render(); Sound.play(lastM && lastM.beep); return;
      }
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.mute) { Sound.toggle(); render(); return; }
      if (b.dataset.mode) st.mode = b.dataset.mode;
      if (b.dataset.st) st.state = comp.states.find(function (s) { return s.id === b.dataset.st; });
      if (b.dataset.reroll) { vi = (vi + 1 + Math.floor(Math.random() * Math.max(1, vcount - 1))) % vcount; comp = MC.variant(baseComp, vi); st.state = mapState(st.state); }
      if (b.dataset.probe) {
        var other = b.dataset.probe === 'red' ? 'black' : 'red';
        st[b.dataset.probe] = b.dataset.pin;
        if (st[other] === b.dataset.pin) st[other] = null;
      }
      if (b.dataset.swap) { var t = st.red; st.red = st.black; st.black = t; }
      if (b.dataset.toggle) st.on = !st.on;
      if (b.dataset.board) st.board = !st.board;
      render();
      Sound.play(lastM && lastM.beep);
      if (opts.onChange) opts.onChange(st);
    });
    if (comp.probes) { st.red = comp.probes[0]; st.black = comp.probes[1]; }
    else if (comp.pins.length >= 2) { st.red = comp.pins[0].id; st.black = comp.pins[1].id; }
    render();
    return {
      setState: function (s) { st.state = mapState(s); render(); Sound.play(lastM && lastM.beep); },
      get: function () { return st; }
    };
  }

  // ---------- Страница компонента ----------
  // Сворачиваемый блок
  function fold(title, body, open, cls) {
    return '<details class="fold' + (cls ? ' ' + cls : '') + '"' + (open ? ' open' : '') + '><summary>' + title + '</summary><div class="fold-b">' + body + '</div></details>';
  }
  function viewComp(id, tab) {
    var c = compById[id]; if (!c) return viewHome();
    tab = tab || 'test';
    pushRecent(c.id);
    var tabs = [['test', 'Проверка'], ['info', 'Справочник'], ['fails', 'Неисправности']];
    var html = header(c.name, '#/') + '<main class="wrap">' +
      '<div class="hero" style="--c:' + (CAT_UI[c.cat] || CAT_UI.passive).c + '"><div class="hero-ph">' + MC.photo(c) + '</div><div class="hero-tx"><span class="hero-cat">' + esc((catById[c.cat] || {}).name || '') + '</span><p>' + esc(c.sub) + '</p><span class="hero-sym" title="Условное обозначение на схеме">' + MC.symbol(c.sym) + '</span></div>' +
      '<button class="fav-btn' + (isFav(c.id) ? ' on' : '') + '" id="favb" aria-label="В избранное" title="В избранное">' + (isFav(c.id) ? '★' : '☆') + '</button></div>' +
      '<nav class="tabs">' + tabs.map(function (t) { return '<a class="' + (t[0] === tab ? 'on' : '') + '" href="#/c/' + c.id + '/' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</nav>' +
      '<section id="tab"></section></main>';
    $app.innerHTML = html;
    document.getElementById('favb').onclick = function () { var on = toggleFav(c.id); this.classList.toggle('on', on); this.textContent = on ? '★' : '☆'; };
    var $t = document.getElementById('tab');
    if (tab === 'test') renderTest($t, c);
    else if (tab === 'info') renderInfo($t, c);
    else renderFails($t, c);
  }

  function stepsList(c) { return '<ol class="steps">' + c.howto.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ol>'; }

  // Источники значений и пометка о точности
  function srcBlock(c) {
    var list = (MC.sources && MC.sources[c.id]) || [];
    var acc = (MC.accuracy && MC.accuracy[c.id]) || '';
    var body = (list.length ? '<ul class="srcs">' + list.map(function (x) { return '<li><a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + '</a></li>'; }).join('') + '</ul>' :
      '<p class="muted">Для этого компонента нет одного даташита: значения типовые.</p>') +
      (acc ? '<p class="acc-note">' + esc(acc) + '</p>' : '') +
      '<p class="acc-note">' + esc(MC.accuracyCommon || '') + '</p>';
    return fold('📚 Источники значений', body, false);
  }

  function renderTest($t, c) {
    var ok = M.okState(c);
    $t.innerHTML =
      '<div class="note top-note">Выберите состояние компонента, режим и перетащите щупы на ножки.</div>' +
      '<div id="mw"></div>' +
      fold('📋 Как проверять', stepsList(c), false) +
      fold('✓ Нормальные показания', readingsTable(c, ok, true), false) +
      srcBlock(c) +
      '<a class="btn wide" href="#/quiz/' + c.id + '">🎯 Тренировка: скрытая неисправность</a>';
    meterWidget(document.getElementById('mw'), c, { states: true });
  }

  function renderInfo($t, c) {
    $t.innerHTML =
      fold('📍 Где встречается', '<p>' + esc(c.where) + '</p>', true) +
      fold('🧩 Какие бывают', '<dl class="types">' + c.types.map(function (t) { return '<dt>' + esc(t[0]) + '</dt><dd>' + esc(t[1]) + '</dd>'; }).join('') + '</dl>', true) +
      fold('🏷 Маркировка и выводы', '<p>' + esc(c.marking) + '</p>', false) +
      fold('✓ Нормальные показания', readingsTable(c, M.okState(c), true), false) +
      fold('📋 Как проверять', stepsList(c), false) +
      srcBlock(c);
  }

  function measLabel(c, ms) {
    var md = MC.modes[ms.mode].name;
    var pair = ms.dir ? '<span class="tred">' + esc(pinName(c, ms.a)) + '</span> → <span class="tblack">' + esc(pinName(c, ms.b)) + '</span>' : esc(pinName(c, ms.a)) + ' ↔ ' + esc(pinName(c, ms.b));
    return '<span class="mtag">' + md + '</span> ' + pair + (ms.on ? ' <span class="ontag">' + esc(c.toggle ? c.toggle.label : 'вкл.') + '</span>' : '');
  }
  function readingsTable(c, state, all) {
    var ok = M.okState(c);
    var rows = M.measurementList(c).filter(function (ms) {
      if (all) return true;
      var a = M.measure(c, state, ms.mode, ms.a, ms.b, ms.on).raw, b = M.measure(c, ok, ms.mode, ms.a, ms.b, ms.on).raw;
      return !(a === b || (typeof a === 'number' && typeof b === 'number' && M.same(a, b) && Math.abs(a - b) < 1e-9));
    });
    if (!rows.length) return '<p class="muted">Мультиметром эту неисправность не видно — показания как у исправного.</p>';
    return '<table class="rt"><tbody>' + rows.map(function (ms) {
      var m = M.measure(c, state, ms.mode, ms.a, ms.b, ms.on);
      var o = M.measure(c, ok, ms.mode, ms.a, ms.b, ms.on);
      return '<tr><td>' + measLabel(c, ms) + '</td><td class="v' + (state.ok ? ' g' : ' r') + '">' + esc((m.val + ' ' + (m.unit || '')).trim()) + '</td>' +
        (state.ok ? '' : '<td class="v g small">норма ' + esc((o.val + ' ' + (o.unit || '')).trim()) + '</td>') + '</tr>';
    }).join('') + '</tbody></table>';
  }

  function renderFails($t, c) {
    var html = fold('⚠ Типичные поломки', '<dl class="types">' + c.fails.map(function (f) { return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('') + '</dl>', true);
    c.states.forEach(function (s) {
      html += fold((s.ok ? '✓ ' : '✗ ') + esc(s.name), (s.why ? '<p class="muted">' + esc(s.why) + '</p>' : '') + readingsTable(c, s, s.ok), false, s.ok ? 'okf' : 'badf');
    });
    $t.innerHTML = html;
  }

  // ---------- Тренажёр «Найди неисправность» (экзамен) ----------
  function quizQuestion($host, c, s, ctx) {
    // ctx: {title, onAnswer(right, c, s), next: fn, nextLabel}
    $host.innerHTML =
      '<div class="card qcard"><div class="qhead"><span class="row-ph">' + MC.photo(c) + '</span><div><div class="qn">' + esc(ctx.title) + '</div><b>' + esc(c.name) + '</b><div class="note">Состояние скрыто. Померяйте и выберите ответ — вариантов: ' + c.states.length + '</div></div></div></div>' +
      '<div id="qmw"></div>' +
      '<div class="card"><div class="lbl">Ваш ответ — что с компонентом?</div><div class="answers">' +
      c.states.map(function (x, i) { return '<button class="ans" data-st="' + x.id + '"><i>' + String.fromCharCode(1040 + i) + '</i>' + esc(x.name) + '</button>'; }).join('') +
      '</div><div id="verdict"></div></div>' +
      fold('💡 Подсказка: как проверять', stepsList(c), false);
    meterWidget(document.getElementById('qmw'), c, { state: s, quiz: true });
    var answered = false;
    $host.querySelector('.answers').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || answered) return;
      answered = true;
      var right = b.dataset.st === s.id;
      $host.querySelectorAll('.ans').forEach(function (x) {
        if (x.dataset.st === s.id) x.classList.add('right'); else if (x === b) x.classList.add('wrong');
        x.disabled = true;
      });
      var silent = s.ok ? false : M.measurementList(c).every(function (ms) {
        return M.measure(c, s, ms.mode, ms.a, ms.b, ms.on).raw === M.measure(c, M.okState(c), ms.mode, ms.a, ms.b, ms.on).raw;
      });
      document.getElementById('verdict').innerHTML =
        '<div class="status ' + (right ? 'good' : 'bad') + '"><b>' + (right ? '✓ Верно!' : '✗ Неверно.') + ' Правильный ответ: ' + esc(s.name) + '</b>' +
        (s.why ? '<span class="why">' + esc(s.why) + '</span>' : '') +
        (silent ? '<span>Эту неисправность мультиметр не показывает — её ищут другими приборами или заменой.</span>' : '') + '</div>' +
        (s.ok ? '' : fold('Что показывал прибор', readingsTable(c, s, false), true)) +
        '<div class="row2"><button class="btn" id="next">' + esc(ctx.nextLabel) + '</button><a class="btn ghost" href="#/c/' + c.id + '">Справочник</a></div>';
      document.getElementById('next').onclick = function () { ctx.next(); window.scrollTo(0, 0); };
      recordAnswer(c, s, right);
      ctx.onAnswer(right, c, s);
    });
  }
  function pickState(c) {
    // 3 из 4 вопросов — с неисправностью
    var faults = c.states.filter(function (x) { return !x.ok; });
    if (!faults.length || Math.random() < 0.25) return M.okState(c);
    return faults[Math.floor(Math.random() * faults.length)];
  }
  function viewQuiz(arg) {
    var score = store('score') || { right: 0, total: 0 };
    if (arg === 'weak') { runExam({ cat: 'weak', n: 10 }); return; }
    if (arg && compById[arg]) {
      // Тренировка на одном компоненте — бесконечно
      var c = compById[arg];
      $app.innerHTML = header('Тренировка: ' + c.name, '#/c/' + c.id) + '<main class="wrap"><div class="score">Счёт: <b>' + score.right + '</b> из ' + score.total + '</div><div id="q"></div></main>';
      quizQuestion(document.getElementById('q'), c, pickState(c), {
        title: 'Тренировка', nextLabel: 'Ещё раз →', next: function () { viewQuiz(arg); },
        onAnswer: function (r) { score.total++; if (r) score.right++; store('score', score); }
      });
      return;
    }
    // Экзамен: выбор категории и количества вопросов
    var cfg = store('examCfg') || { cat: 'all', n: 10 };
    $app.innerHTML = header('Экзамен: найди неисправность', '#/') + '<main class="wrap">' +
      '<p class="lead">Вам дают компонент со скрытым состоянием. Меряете мультиметром и выбираете ответ — у каждого компонента столько вариантов, сколько у него бывает состояний.</p>' +
      '<div class="card"><div class="lbl">Категория</div><div class="chipsel" id="ecat">' +
      [['all', 'Все компоненты']].concat(MC.categories.map(function (x) { return [x.id, x.icon + ' ' + x.name]; })).map(function (x) { return '<button data-cat="' + x[0] + '" class="' + (cfg.cat === x[0] ? 'on' : '') + '">' + esc(x[1]) + '</button>'; }).join('') +
      '</div><div class="lbl" style="margin-top:12px">Вопросов</div><div class="seg" id="en">' + [5, 10, 20].map(function (n) { return '<button data-n="' + n + '" class="' + (cfg.n === n ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div>' +
      '<button class="btn wide" id="estart" style="margin-top:14px">▶ Начать экзамен</button></div>' +
      fold('🎯 Тренировка на одном компоненте', '<div class="cgrid">' + MC.components.map(function (x, i) { return compCard(x, '#/quiz/' + x.id, i, x.states.length + ' вар.'); }).join('') + '</div>', false) +
      '<div class="score">Общий счёт тренировок: <b>' + score.right + '</b> из ' + score.total + (score.total ? ' <button class="link" id="reset">сбросить</button>' : '') + '</div>' +
      '</main>';
    var r = document.getElementById('reset'); if (r) r.onclick = function () { store('score', { right: 0, total: 0 }); viewQuiz(); };
    document.getElementById('ecat').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; cfg.cat = b.dataset.cat; store('examCfg', cfg); this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); };
    document.getElementById('en').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; cfg.n = +b.dataset.n; store('examCfg', cfg); this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); };
    document.getElementById('estart').onclick = function () { runExam(cfg); };
  }
  function runExam(cfg) {
    var stats = store('stats') || {};
    var pool = cfg.cat === 'weak' ? weakList().map(function (x) { return x.c; }) : MC.components.filter(function (x) { return cfg.cat === 'all' || x.cat === cfg.cat; });
    if (!pool.length) pool = MC.components.slice();
    // В режиме «слабые места» чаще спрашиваем те состояния, на которых ошибались
    function pickWeak(c) {
      var e = stats[c.id], ids = e ? Object.keys(e.w) : [];
      if (cfg.cat === 'weak' && ids.length && Math.random() < 0.6) { var id = ids[Math.floor(Math.random() * ids.length)], st = c.states.find(function (s) { return s.id === id; }); if (st) return st; }
      return pickState(c);
    }
    var qs = [], i;
    var shuffled = pool.slice().sort(function () { return Math.random() - 0.5; });
    for (i = 0; i < cfg.n; i++) { var c = shuffled[i % shuffled.length]; qs.push({ c: c, s: pickWeak(c) }); }
    var k = 0, right = 0, mistakes = [];
    var catName = cfg.cat === 'all' ? 'Все компоненты' : cfg.cat === 'weak' ? 'Слабые места' : catById[cfg.cat].name;
    function show() {
      if (k >= qs.length) return finish();
      $app.innerHTML = header('Экзамен · ' + catName, '#/quiz') + '<main class="wrap">' +
        '<div class="progress"><div style="width:' + (k / qs.length * 100) + '%"></div></div>' +
        '<div class="score">Вопрос <b>' + (k + 1) + '</b> из ' + qs.length + ' · верно: <b>' + right + '</b></div><div id="q"></div></main>';
      quizQuestion(document.getElementById('q'), qs[k].c, qs[k].s, {
        title: 'Вопрос ' + (k + 1) + ' из ' + qs.length, nextLabel: k + 1 < qs.length ? 'Следующий вопрос →' : 'Результат →',
        next: function () { k++; show(); },
        onAnswer: function (ok, c, s) { if (ok) right++; else mistakes.push({ c: c, s: s }); }
      });
    }
    function finish() {
      var pct = Math.round(right / qs.length * 100);
      var grade = pct >= 90 ? 'Отлично! 🏆' : pct >= 70 ? 'Хорошо 👍' : pct >= 50 ? 'Удовлетворительно' : 'Нужно потренироваться';
      $app.innerHTML = header('Результат экзамена', '#/quiz') + '<main class="wrap">' +
        '<div class="card result"><div class="res-big">' + right + ' / ' + qs.length + '</div><div class="res-pct">' + pct + '% · ' + grade + '</div></div>' +
        (mistakes.length ? '<div class="card"><div class="lbl">Ошибки — повторите</div><div class="list">' + mistakes.map(function (m) {
          return '<a class="row" href="#/c/' + m.c.id + '"><span class="row-ph">' + MC.photo(m.c) + '</span><span class="row-tx"><b>' + esc(m.c.name) + '</b><small>Правильно: ' + esc(m.s.name) + '</small></span><span class="chev">›</span></a>';
        }).join('') + '</div></div>' : '<p class="lead">Ни одной ошибки!</p>') +
        '<div class="row2"><button class="btn" id="again">↻ Ещё экзамен</button><a class="btn ghost" href="#/quiz">Настройки</a></div></main>';
      document.getElementById('again').onclick = function () { runExam(cfg); };
    }
    show();
  }

  // ---------- Калькулятор резисторов ----------
  function viewResistor() {
    var st = store('res') || { n: 4, bands: ['yellow', 'violet', 'red', 'gold'] };
    function defaults(n) {
      if (n === 4) return ['yellow', 'violet', 'red', 'gold'];
      if (n === 5) return ['brown', 'black', 'black', 'red', 'brown'];
      return ['brown', 'black', 'black', 'red', 'brown', 'brown'];
    }
    var roleName = { digit: 'Цифра', mult: 'Множитель', tol: 'Допуск', tcr: 'ТКС' };
    $app.innerHTML = header('Калькулятор резисторов', '#/') + '<main class="wrap"><div id="rc"></div>' +
      '<div class="card"><div class="lbl">Номинал → цвета</div><div class="inrow"><input id="rv" placeholder="Например 4k7, 220, 1.5M" autocomplete="off"><span class="unit">Ом</span></div><div id="rout"></div></div>' +
      '<div class="card"><div class="lbl">Как читать</div><p>Начинайте с полосы, которая ближе к краю. Золотая или серебряная полоса (допуск) всегда последняя. У 4-полосных: 2 цифры + множитель + допуск, у 5-полосных: 3 цифры + множитель + допуск, у 6-полосных добавляется температурный коэффициент (ТКС).</p><p class="muted">Совет: цвета на старых и обгоревших резисторах легко перепутать — всегда сверяйте мультиметром.</p></div></main>';
    var $rc = document.getElementById('rc');
    function draw() {
      var roles = T.bandRoles(st.n), res = T.calc(st.bands);
      var bandsSvg = st.bands.map(function (b, i) {
        var x = st.n === 4 ? [82, 104, 126, 168][i] : st.n === 5 ? [78, 98, 118, 138, 172][i] : [74, 92, 110, 128, 150, 176][i];
        var c = T.byId[b];
        return c.id === 'none' ? '' : '<rect x="' + x + '" y="22" width="11" height="56" fill="' + c.hex + '"' + (c.id === 'white' ? ' stroke="#999" stroke-width="1"' : '') + '/>';
      }).join('');
      var svg = '<svg class="ressvg" viewBox="0 0 260 100"><line x1="0" y1="50" x2="260" y2="50" stroke="#9aa3ad" stroke-width="5"/>' +
        '<path d="M62 26 Q62 16 76 16 L92 18 L168 18 L184 16 Q198 16 198 26 L198 74 Q198 84 184 84 L168 82 L92 82 L76 84 Q62 84 62 74 Z" fill="#d9c8a2"/>' + bandsSvg + '</svg>';
      var pickers = roles.map(function (role, i) {
        return '<div class="band"><div class="band-h">' + (i + 1) + '. ' + roleName[role] + ' — <b>' + T.byId[st.bands[i]].name + '</b></div><div class="swatches">' +
          T.allowed(role).map(function (c) {
            return '<button class="sw' + (st.bands[i] === c.id ? ' sel' : '') + (c.id === 'none' ? ' none' : '') + '" style="background:' + c.hex + '" data-i="' + i + '" data-c="' + c.id + '" title="' + c.name + '" aria-label="' + c.name + '"></button>';
          }).join('') + '</div></div>';
      }).join('');
      $rc.innerHTML = '<div class="seg">' + [4, 5, 6].map(function (n) { return '<button class="' + (st.n === n ? 'on' : '') + '" data-n="' + n + '">' + n + ' полос' + (n === 4 ? 'ы' : '') + '</button>'; }).join('') + '</div>' +
        svg + '<div class="resval">' + T.fmtOhm(res.value) + ' <small>±' + String(res.tol).replace('.', ',') + '%</small></div>' +
        '<div class="resrange">от ' + T.fmtOhm(res.min) + ' до ' + T.fmtOhm(res.max) + (res.tcr ? ' · ТКС ' + res.tcr + ' ppm/°C' : '') + '</div>' +
        '<div class="card">' + pickers + '</div>';
      store('res', st);
    }
    $rc.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.n) { st.n = +b.dataset.n; st.bands = defaults(st.n); }
      if (b.dataset.c) st.bands[+b.dataset.i] = b.dataset.c;
      draw();
    });
    draw();
    var $rv = document.getElementById('rv'), $ro = document.getElementById('rout');
    $rv.addEventListener('input', function () {
      var v = T.parseValue($rv.value);
      if (!$rv.value.trim()) { $ro.innerHTML = ''; return; }
      if (!(v > 0)) { $ro.innerHTML = '<p class="muted">Не понял значение. Примеры: 4k7, 10k, 220, 1M, 0.47</p>'; return; }
      var out = '<p>Номинал: <b>' + T.fmtOhm(v) + '</b></p>';
      [[2, 'gold', '4 полосы (±5%)'], [3, 'brown', '5 полос (±1%)']].forEach(function (cfg) {
        var b = T.toBands(v, cfg[0]);
        if (!b) out += '<p class="muted">' + cfg[2] + ': вне диапазона</p>';
        else if (b.inexact) out += '<p class="muted">' + cfg[2] + ': такой номинал не записать ' + cfg[0] + ' цифрами</p>';
        else {
          b.push(cfg[1]);
          out += '<div class="chips"><span class="chips-l">' + cfg[2] + '</span>' + b.map(function (id) { var c = T.byId[id]; return '<span class="chip"><i style="background:' + c.hex + '"></i>' + c.name + '</span>'; }).join('') +
            '<button class="link" data-apply="' + b.join(',') + '">показать</button></div>';
        }
      });
      $ro.innerHTML = out;
    });
    $ro.addEventListener('click', function (e) {
      var b = e.target.closest('[data-apply]'); if (!b) return;
      st.bands = b.dataset.apply.split(','); st.n = st.bands.length; draw(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------- SMD-коды ----------
  function viewSmd() {
    $app.innerHTML = header('SMD-коды', '#/') + '<main class="wrap">' +
      '<div class="card"><div class="lbl">Резистор (SMD)</div><div class="inrow"><input id="sr" placeholder="103, 4R7, 1002, 01C" autocomplete="off" autocapitalize="characters"></div><div id="srout" class="decode"></div>' +
      '<p class="muted">Форматы: 3 цифры (5%), 4 цифры (1%), буква R/K/M вместо запятой, EIA-96 — две цифры и буква.</p></div>' +
      '<div class="card"><div class="lbl">Конденсатор</div><div class="inrow"><input id="sc" placeholder="104, 222J, 4n7, 0.1" autocomplete="off"></div><div id="scout" class="decode"></div>' +
      '<p class="muted">Код из трёх цифр — в пикофарадах. SMD-керамика обычно без маркировки — только измерять.</p></div>' +
      '<div class="card"><div class="lbl">Транзистор или диод SOT-23 (код на корпусе)</div><div class="inrow"><input id="ss" placeholder="1AM, 702, A7, KL3, BC847" autocomplete="off" autocapitalize="characters"></div><div id="ssout" class="decode"></div>' +
      '<p class="muted">Только коды, сверенные с даташитом производителя. Один и тот же код у разных производителей может означать разные детали — сверяйте со схемой и замером. Символ после кода (1AM<b>W</b>, 1F<b>t</b>) — обычно завод или дата.</p></div>' +
      '<details class="fold"><summary>📋 Все коды SOT-23 (' + MC.smdCodes.length + ')</summary><div class="fold-b"><table class="rt smdt"><tbody>' + MC.smdCodes.map(function (r) { return '<tr><td><b>' + esc(r.code) + '</b></td><td>' + esc(r.part) + '<br><small class="muted">' + esc(r.type) + '</small></td><td class="small">' + esc(r.mfr) + '</td></tr>'; }).join('') + '</tbody></table></div></details>' +
      '<div class="card"><div class="lbl">Частые коды резисторов и конденсаторов</div><table class="rt"><tbody>' +
      [['100', '10 Ом'], ['101', '100 Ом'], ['102', '1 кОм'], ['472', '4,7 кОм'], ['103', '10 кОм'], ['104', '100 кОм / 100 нФ'], ['105', '1 МОм / 1 мкФ'], ['4R7', '4,7 Ом'], ['R100', '0,1 Ом'], ['000', 'Перемычка 0 Ом'], ['01C', '10 кОм 1%'], ['68X', '49,9 Ом 1%']]
        .map(function (r) { return '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table></div></main>';
    var sr = document.getElementById('sr'), sc = document.getElementById('sc'), ss = document.getElementById('ss');
    ss.addEventListener('input', function () {
      var o = document.getElementById('ssout'), q = ss.value.trim();
      if (!q) { o.innerHTML = ''; return; }
      var f = MC.smdLookup(q);
      o.innerHTML = f.length ? f.slice(0, 6).map(function (r) {
        var link = r.comp && compById[r.comp] ? ' · <a href="#/c/' + r.comp + '">как проверять</a>' : '';
        return '<div class="smdhit"><div class="big">' + esc(r.code) + ' → ' + esc(r.part) + '</div><p>' + esc(r.type) + '</p><p class="muted">Выводы: ' + esc(r.pins) + '</p><p class="muted">' + esc(r.mfr) + ' · <a href="' + esc(r.src[1]) + '" target="_blank" rel="noopener">' + esc(r.src[0]) + '</a>' + link + '</p></div>';
      }).join('') : '<p class="muted">Такого кода нет в проверенной таблице. Ищите по даташиту производителя (код + корпус SOT-23).</p>';
    });
    sr.addEventListener('input', function () {
      var r = T.decodeSmdRes(sr.value), o = document.getElementById('srout');
      o.innerHTML = !sr.value.trim() ? '' : r ? '<div class="big">' + T.fmtOhm(r.value) + '</div><p class="muted">' + esc(r.how) + '</p>' : '<p class="muted">Неизвестный код.</p>';
    });
    sc.addEventListener('input', function () {
      var r = T.decodeCap(sc.value), o = document.getElementById('scout');
      o.innerHTML = !sc.value.trim() ? '' : r ? '<div class="big">' + r.text + (r.tol ? ' <small>' + r.tol + '</small>' : '') + '</div><p class="muted">' + esc(r.how) + '</p>' : '<p class="muted">Неизвестный код.</p>';
    });
  }

  // ---------- Маршруты ----------
  var lastHash = null;
  function route() {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    var wasHome = lastHash === '' || lastHash === '/' || lastHash === null;
    if (wasHome && lastHash !== null && section() !== 'home') homeScroll = window.scrollY;
    lastHash = location.hash.replace(/^#/, '');
    window.scrollTo(0, 0);
    switch (h[0]) {
      case 'cat': viewCat(h[1]); break;
      case 'c': viewComp(h[1], h[2]); break;
      case 'quiz': viewQuiz(h[1]); break;
      case 'resistor': viewResistor(); break;
      case 'smd': viewSmd(); break;
      case 'nodes': MC.extra.viewNodes(); break;
      case 'node': MC.extra.viewNode(h[1]); break;
      case 'pinouts': MC.extra.viewPinouts(); break;
      case 'analogs': MC.extra.viewAnalogs(); break;
      case 'calcs': MC.extra.viewCalcs(); break;
      case 'ntc': MC.extra.viewNtc(); break;
      case 'voltage': MC.extra.viewVoltage(); break;
      case 'tools': viewTools(); break;
      case 'trainers': viewTrainers(); break;
      default: viewHome();
    }
    tabbar();
    // Плавное появление экрана
    if (!reduceMotion) { $app.classList.remove('enter'); void $app.offsetWidth; $app.classList.add('enter'); }
  }
  MC.ui = { $app: $app, header: header, esc: esc, fold: fold, meterWidget: meterWidget, compById: compById, store: store };
  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
