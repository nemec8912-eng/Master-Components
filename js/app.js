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

  // ---------- Шапка ----------
  function header(title, back) {
    return '<header class="top">' +
      (back ? '<a class="back" href="' + back + '" aria-label="Назад">‹</a>' : '<span class="logo">' + logoSvg() + '</span>') +
      '<h1>' + esc(title) + '</h1>' +
      (back ? '<a class="home" href="#/" aria-label="На главную">⌂</a>' : '') +
      '</header>';
  }
  function logoSvg() {
    return '<svg viewBox="0 0 48 48" width="30" height="30"><rect x="2" y="2" width="44" height="44" rx="11" fill="#ffc23a"/><rect x="9" y="8" width="30" height="14" rx="3" fill="#1d241a"/><text x="24" y="19" font-size="9" font-family="monospace" font-weight="700" fill="#cfe0b4" text-anchor="middle">0.56</text><circle cx="24" cy="33" r="7" fill="#1d241a"/><line x1="24" y1="33" x2="28" y2="28" stroke="#ffc23a" stroke-width="2.5" stroke-linecap="round"/></svg>';
  }

  // ---------- Главная ----------
  function viewHome() {
    var html = header('Master Components') +
      '<main class="wrap">' +
      '<p class="lead">Справочник мастера: какие бывают компоненты, как их прозванивать и что показывает мультиметр у исправных и у неисправных.</p>' +
      '<div class="search"><input id="q" type="search" placeholder="Поиск: диод, ТЭН, симистор…" autocomplete="off"></div>' +
      '<div id="results"></div>' +
      '<h2 class="sect">Тренажёры</h2>' +
      '<div class="tiles">' +
        tile('#/quiz', '🎯', 'Найди неисправность') + tile('#/nodes', '🧩', 'Схемы узлов') +
      '</div>' +
      '<h2 class="sect">Справочники и калькуляторы</h2>' +
      '<div class="tiles t3">' +
        tile('#/resistor', '🌈', 'Цвета резисторов') + tile('#/smd', '🔢', 'SMD-коды') + tile('#/calcs', '🧮', 'Калькуляторы') +
        tile('#/pinouts', '📌', 'Цоколёвки') + tile('#/analogs', '🔁', 'Аналоги и замена') + tile('#/ntc', '🌡', 'Датчики NTC') +
        tile('#/voltage', '⚡', 'Под напряжением') +
      '</div>' +
      '<h2 class="sect">Категории</h2><div class="cats">';
    MC.categories.forEach(function (c) {
      var n = MC.components.filter(function (x) { return x.cat === c.id; }).length;
      html += '<a class="cat" href="#/cat/' + c.id + '"><span class="cat-ic">' + c.icon + '</span><span class="cat-tx"><b>' + esc(c.name) + '</b><small>' + esc(c.desc) + '</small></span><span class="cnt">' + n + '</span></a>';
    });
    html += '</div><p class="foot">Значения в тренажёре — типичные для указанного примера. На реальной плате параллельные цепи могут менять показания: при сомнении выпаяйте компонент.</p></main>';
    $app.innerHTML = html;
    var q = document.getElementById('q'), res = document.getElementById('results');
    q.addEventListener('input', function () {
      var s = q.value.trim().toLowerCase();
      if (s.length < 2) { res.innerHTML = ''; return; }
      var found = MC.components.filter(function (c) { return (c.name + ' ' + c.sub + ' ' + c.types.map(function (t) { return t[0]; }).join(' ')).toLowerCase().indexOf(s) >= 0; });
      res.innerHTML = found.length ? '<div class="list">' + found.map(compRow).join('') + '</div>' : '<p class="muted">Ничего не найдено.</p>';
    });
  }
  function tile(href, ic, t) { return '<a class="tile" href="' + href + '"><span>' + ic + '</span><b>' + t + '</b></a>'; }
  function toolCard(href, ic, t, d) { return '<a class="tool" href="' + href + '"><span class="tool-ic">' + ic + '</span><b>' + t + '</b><small>' + d + '</small></a>'; }
  function compRow(c) {
    return '<a class="row" href="#/c/' + c.id + '"><span class="row-sym">' + MC.symbol(c.sym) + '</span><span class="row-tx"><b>' + esc(c.name) + '</b><small>' + esc(c.sub) + '</small></span><span class="chev">›</span></a>';
  }

  // ---------- Категория ----------
  function viewCat(id) {
    var c = catById[id]; if (!c) return viewHome();
    var list = MC.components.filter(function (x) { return x.cat === id; });
    $app.innerHTML = header(c.name, '#/') + '<main class="wrap"><p class="lead">' + esc(c.desc) + '</p><div class="list">' + list.map(compRow).join('') + '</div></main>';
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
          var a2 = ms.a, b2 = ms.b;
          badList.push('<li><span class="mtag">' + MC.modes[r.mode].name + '</span> <b>' + esc(pinName(comp, a2)) + ' ↔ ' + esc(pinName(comp, b2)) + '</b>: <span class="vbad">' + esc((r.m.val + ' ' + (r.m.unit || '')).trim()) + '</span> <span class="vok">норма ' + esc((okm.val + ' ' + (okm.unit || '')).trim()) + '</span></li>');
        }
      });
    }
    // подписи выводов: короткие; у тесных нижних — id
    var bottoms = comp.pins.filter(function (p) { return L.pos[p.id] && L.pos[p.id][2] === 'b'; }).sort(function (a, b) { return L.pos[a.id][0] - L.pos[b.id][0]; });
    var crowded = {}, stagger = {};
    bottoms.forEach(function (p, i) {
      var gap = Math.min(i > 0 ? L.pos[p.id][0] - L.pos[bottoms[i - 1].id][0] : 999, i < bottoms.length - 1 ? L.pos[bottoms[i + 1].id][0] - L.pos[p.id][0] : 999);
      if (gap < 60 && shortPin(p).length > 4) crowded[p.id] = 1;
      if (i % 2 === 1 && gap < 95) stagger[p.id] = 16;
    });
    var abbr = [];
    var pins = comp.pins.map(function (p) {
      var pos = L.pos[p.id]; if (!pos) return '';
      var cls = st.red === p.id ? ' pr-red' : st.black === p.id ? ' pr-black' : '';
      var lbl = crowded[p.id] ? p.id : shortPin(p);
      if (crowded[p.id]) abbr.push('<b>' + esc(p.id) + '</b> — ' + esc(p.name));
      var lx = pos[0], ly = pos[1], anchor = 'middle';
      if (pos[2] === 'b') ly += 24 + (stagger[p.id] || 0); else if (pos[2] === 't') ly -= 14; else if (pos[2] === 'l') { lx -= 14; ly += 4; anchor = 'end'; } else { lx += 14; ly += 4; anchor = 'start'; }
      return '<g class="pinpick" data-pick="' + p.id + '"><circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="16" class="hit"/>' +
        (badPins[p.id] ? '<circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="13" class="pbad"/>' : '') +
        '<circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="8" class="pdot' + cls + '"/>' +
        '<text x="' + lx + '" y="' + ly + '" text-anchor="' + anchor + '" class="plbl' + (badPins[p.id] ? ' bad' : '') + '">' + esc(lbl) + '</text></g>';
    }).join('');
    var legend;
    if (quiz) legend = '<div class="legend">Нажимайте на выводы: первый — красный щуп, второй — чёрный</div>';
    else if (st.state.ok) legend = '<div class="legend"><span><i class="lg ok"></i>между этими выводами всё в норме</span></div>';
    else if (badList.length) legend = '<div class="faultlist"><div class="fl-h">✗ ' + esc(st.state.name) + ' — где видно:</div><ul>' + badList.join('') + '</ul></div>';
    else legend = '<div class="faultlist warn"><div class="fl-h">≈ ' + esc(st.state.name) + '</div><p>Мультиметром не видно ни на одной паре выводов' + (comp.toggle && !st.on ? ' (попробуйте «' + esc(comp.toggle.label) + '»)' : '') + '. ' + esc(st.state.why || '') + '</p></div>';
    return '<div class="look"><svg viewBox="-60 -24 440 268" class="looksvg">' + L.g + arcs + pins + '</svg>' +
      (abbr.length ? '<div class="abbr">' + abbr.join(' · ') + '</div>' : '') + legend + '</div>';
  }

  // ---------- Мультиметр (общий виджет) ----------
  // opts: {state, quiz:boolean, states:boolean (кнопки состояний внутри), onChange}
  function meterWidget(root, comp, opts) {
    var st = { mode: comp.modes[0], red: null, black: null, on: false, board: false, state: opts.state || M.okState(comp) };
    var lastM = null;
    function txt(m) { return (m.val + (m.unit ? ' ' + m.unit : '')).trim(); }
    function verdict(m) {
      if (m.idle) return '<div class="li hint">Выберите выводы для <b>красного</b> и <b>чёрного</b> щупов</div>';
      if (m.same) return '<div class="li hint">Оба щупа на одном выводе — выберите разные</div>';
      if (opts.quiz) return '<div class="li hint">Состояние скрыто — меряйте и ставьте диагноз</div>';
      var okM = M.measure(comp, M.okState(comp), st.mode, st.red, st.black, st.on, st.board);
      var norm = '<div class="li norm"><span>НОРМА:</span> <b>' + esc(txt(okM)) + '</b></div>';
      if (st.state.ok) return norm + '<div class="li vd good">✓ ИСПРАВЕН — значение правильное</div>';
      var isSame = M.same(m.raw, okM.raw) && !(typeof m.raw === 'string' && m.raw !== okM.raw);
      if (isSame) {
        return norm + '<div class="li vd warn">≈ ' + esc(st.state.name.toUpperCase()) + ' — здесь не видно</div>' +
          '<div class="li why">' + (st.board ? 'На плате параллельная цепь маскирует неисправность — выпаяйте один вывод и перемерьте. ' : 'Попробуйте другие выводы, другой режим' + (comp.toggle ? ' или «' + esc(comp.toggle.label) + '»' : '') + '. ') + esc(st.state.why || '') + '</div>';
      }
      return norm + '<div class="li vd bad">✗ НЕИСПРАВЕН: ' + esc(st.state.name.toUpperCase()) + '</div>' +
        (st.state.why ? '<div class="li why">' + esc(st.state.why) + '</div>' : '');
    }
    function render() {
      var m = M.measure(comp, st.state, st.mode, st.red, st.black, st.on, st.board);
      lastM = m;
      var modeBtns = comp.modes.map(function (md) {
        return '<button class="mode' + (md === st.mode ? ' on' : '') + '" data-mode="' + md + '" title="' + MC.modes[md].title + '">' + MC.modes[md].name + '</button>';
      }).join('');
      var pinsRow = function (color) {
        return comp.pins.map(function (p) {
          return '<button class="pin ' + color + (st[color] === p.id ? ' sel' : '') + '" data-probe="' + color + '" data-pin="' + p.id + '">' + esc(p.name) + '</button>';
        }).join('');
      };
      var beep = m.beep === true ? '<span class="beep on">🔊</span>' : m.beep === 'jitter' ? '<span class="beep jit">🔊</span>' : '<span class="beep">🔊</span>';
      var glow = m.glow ? '<span class="glow ' + m.glow + '">● ' + (m.glow === 'dim' ? 'еле светится' : 'светится') + '</span>' : '';
      var probes = st.red && st.black && st.red !== st.black ? '<span class="lcd-pr"><i class="pr-r">+</i>' + esc(pinName(comp, st.red)) + ' <i class="pr-b">COM</i>' + esc(pinName(comp, st.black)) + '</span>' : '';
      var states = opts.states ? '<div class="states in">' + comp.states.map(function (s) {
        return '<button class="stbtn' + (s.ok ? ' okb' : '') + (s === st.state ? ' on' : '') + '" data-st="' + s.id + '">' + esc(s.name) + '</button>';
      }).join('') + '</div>' : '';
      var toggle = comp.toggle ? '<button class="toggle' + (st.on ? ' on' : '') + '" data-toggle="1">' + (st.on ? '✓ ' : '') + esc(comp.toggle.label) + '</button>' : '';

      root.innerHTML = states +
        '<div class="meter">' +
          '<div class="meter-top"><span class="brand">MASTER DT-830</span><span class="mt-r"><button class="mute" data-mute="1" aria-label="Звук прозвонки">' + (Sound.muted() ? '🔇 выкл' : '🔈 звук') + '</button><span class="auto">AUTO</span></span></div>' +
          '<div class="lcd">' +
            '<div class="lcd-r1"><span class="lcd-mode">' + (MC.modes[st.mode].lcd || MC.modes[st.mode].name) + '</span>' + beep + (st.board ? '<span class="pcb">НА ПЛАТЕ</span>' : '') + glow + '</div>' +
            '<div class="lcd-main' + (m.text ? ' txt' : '') + '"><span class="lcd-val">' + esc(m.val) + '</span><span class="lcd-unit">' + esc(m.unit || '') + '</span></div>' +
            probes +
            '<div class="lcd-info">' + verdict(m) + '</div>' +
          '</div>' +
          '<div class="modes">' + modeBtns + '</div>' +
        '</div>' +
        lookView(comp, st, opts.quiz) +
        '<div class="probes">' +
          '<div class="probe-lbl"><span class="dot red"></span>Красный щуп (+)</div><div class="pins">' + pinsRow('red') + '</div>' +
          '<div class="probe-lbl"><span class="dot black"></span>Чёрный щуп (COM)</div><div class="pins">' + pinsRow('black') + '</div>' +
          '<div class="actions"><button class="swap" data-swap="1">⇄ Щупы</button>' + toggle +
          '<button class="toggle' + (st.board ? ' on' : '') + '" data-board="1" title="Компонент впаян, параллельно стоит цепь ~1 кОм">' + (st.board ? '✓ ' : '') + 'На плате</button></div>' +
        '</div>';
    }
    var nextProbe = 'red';
    root.addEventListener('click', function (e) {
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
    if (comp.pins.length >= 2) { st.red = comp.pins[0].id; st.black = comp.pins[1].id; }
    render();
    return {
      setState: function (s) { st.state = s; render(); Sound.play(lastM && lastM.beep); },
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
    var tabs = [['test', 'Проверка'], ['info', 'Справочник'], ['fails', 'Неисправности']];
    var html = header(c.name, '#/cat/' + c.cat) + '<main class="wrap">' +
      '<div class="hero"><div class="hero-sym">' + MC.symbol(c.sym) + '</div><p>' + esc(c.sub) + '</p></div>' +
      '<nav class="tabs">' + tabs.map(function (t) { return '<a class="' + (t[0] === tab ? 'on' : '') + '" href="#/c/' + c.id + '/' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</nav>' +
      '<section id="tab"></section></main>';
    $app.innerHTML = html;
    var $t = document.getElementById('tab');
    if (tab === 'test') renderTest($t, c);
    else if (tab === 'info') renderInfo($t, c);
    else renderFails($t, c);
  }

  function stepsList(c) { return '<ol class="steps">' + c.howto.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ol>'; }

  function renderTest($t, c) {
    var ok = M.okState(c);
    $t.innerHTML =
      '<div class="note top-note">Выберите состояние, режим и выводы. Пример: ' + esc(ok.note || '') + '</div>' +
      '<div id="mw"></div>' +
      fold('📋 Как проверять', stepsList(c), false) +
      fold('✓ Нормальные показания', readingsTable(c, ok, true), false) +
      '<a class="btn wide" href="#/quiz/' + c.id + '">🎯 Тренировка: скрытая неисправность</a>';
    meterWidget(document.getElementById('mw'), c, { states: true });
  }

  function renderInfo($t, c) {
    $t.innerHTML =
      fold('📍 Где встречается', '<p>' + esc(c.where) + '</p>', true) +
      fold('🧩 Какие бывают', '<dl class="types">' + c.types.map(function (t) { return '<dt>' + esc(t[0]) + '</dt><dd>' + esc(t[1]) + '</dd>'; }).join('') + '</dl>', true) +
      fold('🏷 Маркировка и выводы', '<p>' + esc(c.marking) + '</p>', false) +
      fold('✓ Нормальные показания', readingsTable(c, M.okState(c), true), false) +
      fold('📋 Как проверять', stepsList(c), false);
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

  // ---------- Тренажёр «Найди неисправность» ----------
  function viewQuiz(fixedId) {
    var score = store('score') || { right: 0, total: 0 };
    var pool = fixedId && compById[fixedId] ? [compById[fixedId]] : MC.components;
    var c = pool[Math.floor(Math.random() * pool.length)];
    var s = c.states[Math.floor(Math.random() * c.states.length)];
    $app.innerHTML = header('Найди неисправность', fixedId ? '#/c/' + fixedId : '#/') + '<main class="wrap">' +
      '<div class="score">Счёт: <b>' + score.right + '</b> из ' + score.total + (score.total ? ' <button class="link" id="reset">сбросить</button>' : '') + '</div>' +
      '<div class="card"><div class="lbl">Компонент</div><div class="qhead"><span class="row-sym">' + MC.symbol(c.sym) + '</span><div><b>' + esc(c.name) + '</b><div class="note">Пример: ' + esc(M.okState(c).note || '') + '</div></div></div>' +
      '<p class="muted">Состояние скрыто. Померяйте в разных режимах и на разных выводах, затем выберите диагноз.</p></div>' +
      '<div id="mw"></div>' +
      '<div class="card"><div class="lbl">Ваш диагноз</div><div class="answers">' +
      c.states.map(function (x) { return '<button class="ans" data-st="' + x.id + '">' + esc(x.name) + '</button>'; }).join('') +
      '</div><div id="verdict"></div></div>' +
      '<details class="card hint"><summary>Подсказка: как проверять</summary><ol class="steps">' + c.howto.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ol></details>' +
      '</main>';
    meterWidget(document.getElementById('mw'), c, { state: s, quiz: true });
    var answered = false;
    var r = document.getElementById('reset');
    if (r) r.onclick = function () { store('score', { right: 0, total: 0 }); viewQuiz(fixedId); };
    document.querySelector('.answers').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || answered) return;
      answered = true;
      var right = b.dataset.st === s.id;
      score.total++; if (right) score.right++; store('score', score);
      document.querySelectorAll('.ans').forEach(function (x) {
        if (x.dataset.st === s.id) x.classList.add('right');
        else if (x === b) x.classList.add('wrong');
        x.disabled = true;
      });
      var silent = s.ok ? false : M.measurementList(c).every(function (ms) {
        var a = M.measure(c, s, ms.mode, ms.a, ms.b, ms.on).raw, o = M.measure(c, M.okState(c), ms.mode, ms.a, ms.b, ms.on).raw;
        return a === o;
      });
      document.getElementById('verdict').innerHTML =
        '<div class="status ' + (right ? 'good' : 'bad') + '"><b>' + (right ? '✓ Верно!' : '✗ Не угадали.') + ' Это: ' + esc(s.name) + '</b>' +
        (s.why ? '<span class="why">' + esc(s.why) + '</span>' : '') +
        (silent ? '<span>Эту неисправность мультиметр не показывает — в реальной работе её ищут другими приборами или заменой.</span>' : '') +
        '</div>' + (s.ok ? '' : '<div class="lbl" style="margin-top:12px">Что показывал прибор</div>' + readingsTable(c, s, false)) +
        '<div class="row2"><button class="btn" id="next">Следующий →</button><a class="btn ghost" href="#/c/' + c.id + '">Открыть справочник</a></div>';
      document.getElementById('next').onclick = function () { viewQuiz(fixedId); window.scrollTo(0, 0); };
    });
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
      '<div class="card"><div class="lbl">Частые коды</div><table class="rt"><tbody>' +
      [['100', '10 Ом'], ['101', '100 Ом'], ['102', '1 кОм'], ['472', '4,7 кОм'], ['103', '10 кОм'], ['104', '100 кОм / 100 нФ'], ['105', '1 МОм / 1 мкФ'], ['4R7', '4,7 Ом'], ['R100', '0,1 Ом'], ['000', 'Перемычка 0 Ом'], ['01C', '10 кОм 1%'], ['68X', '49,9 Ом 1%']]
        .map(function (r) { return '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table></div></main>';
    var sr = document.getElementById('sr'), sc = document.getElementById('sc');
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
  function route() {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    window.scrollTo(0, 0);
    switch (h[0]) {
      case 'cat': return viewCat(h[1]);
      case 'c': return viewComp(h[1], h[2]);
      case 'quiz': return viewQuiz(h[1]);
      case 'resistor': return viewResistor();
      case 'smd': return viewSmd();
      case 'nodes': return MC.extra.viewNodes();
      case 'node': return MC.extra.viewNode(h[1]);
      case 'pinouts': return MC.extra.viewPinouts();
      case 'analogs': return MC.extra.viewAnalogs();
      case 'calcs': return MC.extra.viewCalcs();
      case 'ntc': return MC.extra.viewNtc();
      case 'voltage': return MC.extra.viewVoltage();
      default: return viewHome();
    }
  }
  MC.ui = { $app: $app, header: header, esc: esc, fold: fold, meterWidget: meterWidget, compById: compById, store: store };
  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
