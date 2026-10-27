/* Реалистичные (объёмные) изображения компонентов для карточек каталога.
   Только оформление: на данные и логику не влияет.
   Все изображения в одном масштабе: viewBox 0 0 200 150, деталь по центру, мягкая тень снизу. */
(function () {
  window.MC = window.MC || {};

  // ---------- Общие градиенты (один раз на документ) ----------
  var DEFS =
    '<linearGradient id="phLegV" x1="0" x2="1"><stop offset="0" stop-color="#7d838b"/><stop offset=".45" stop-color="#eef1f4"/><stop offset="1" stop-color="#8a9097"/></linearGradient>' +
    '<linearGradient id="phLegH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d838b"/><stop offset=".45" stop-color="#eef1f4"/><stop offset="1" stop-color="#8a9097"/></linearGradient>' +
    '<linearGradient id="phGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".18" stop-color="#fff" stop-opacity=".45"/><stop offset=".38" stop-color="#fff" stop-opacity=".05"/><stop offset=".8" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>' +
    '<linearGradient id="phGlossX" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".22" stop-color="#000" stop-opacity=".05"/><stop offset=".38" stop-color="#fff" stop-opacity=".42"/><stop offset=".55" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>' +
    '<radialGradient id="phDisc" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".85" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>' +
    '<radialGradient id="phShadow"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="phSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f767e"/><stop offset=".35" stop-color="#e9edf1"/><stop offset=".6" stop-color="#a7aeb6"/><stop offset="1" stop-color="#4f555c"/></linearGradient>' +
    '<linearGradient id="phSteelX" x1="0" x2="1"><stop offset="0" stop-color="#5d636a"/><stop offset=".35" stop-color="#e9edf1"/><stop offset=".65" stop-color="#a7aeb6"/><stop offset="1" stop-color="#4f555c"/></linearGradient>' +
    '<linearGradient id="phCopper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a3d14"/><stop offset=".4" stop-color="#f0a865"/><stop offset=".6" stop-color="#c46a2c"/><stop offset="1" stop-color="#5e2c0c"/></linearGradient>' +
    '<linearGradient id="phCopperX" x1="0" x2="1"><stop offset="0" stop-color="#7a3d14"/><stop offset=".4" stop-color="#f0a865"/><stop offset=".6" stop-color="#c46a2c"/><stop offset="1" stop-color="#5e2c0c"/></linearGradient>' +
    '<linearGradient id="phTape" x1="0" x2="1"><stop offset="0" stop-color="#9c7a12"/><stop offset=".4" stop-color="#f7d457"/><stop offset="1" stop-color="#a7801a"/></linearGradient>';
  function ensureDefs() {
    if (document.getElementById('ph-defs')) return;
    var d = document.createElement('div');
    d.innerHTML = '<svg id="ph-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + DEFS + '</defs></svg>';
    document.body.appendChild(d.firstChild);
  }

  var CUR = null;
  function M(i, d) { return CUR && CUR[i] != null ? String(CUR[i]) : d; }
  // ---------- Помощники ----------
  function sh(cx, cy, rx, ry) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#phShadow)"/>'; }
  function R(x, y, w, h, f, rx, ex) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function C(x, y, r, f, ex) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function E(x, y, rx, ry, f, ex) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function P(d, f, ex) { return '<path d="' + d + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function S(d, c, w, ex) { return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (ex || '') + '/>'; }
  function T(x, y, t, s, c, ex) { return '<text x="' + x + '" y="' + y + '" font-size="' + s + '" fill="' + (c || '#fff') + '" text-anchor="middle" font-weight="700" font-family="Inter,system-ui,sans-serif"' + (ex || '') + '>' + t + '</text>'; }
  function legV(x, y1, y2, w) { w = w || 3.4; return R(x - w / 2, y1, w, y2 - y1, 'url(#phLegV)', w / 2); }
  function legH(x1, x2, y, w) { w = w || 3.4; return R(x1, y - w / 2, x2 - x1, w, 'url(#phLegH)', w / 2); }
  function gloss(x, y, w, h, rx) { return R(x, y, w, h, 'url(#phGloss)', rx); }
  function glossX(x, y, w, h, rx) { return R(x, y, w, h, 'url(#phGlossX)', rx); }
  function disc(x, y, r, col) { return C(x, y, r, col) + C(x, y, r, 'url(#phDisc)'); }
  function g(tr, inner) { return '<g transform="' + tr + '">' + inner + '</g>'; }

  // Осевой компонент (резистор, диод) с наклоном
  function axial(body, rot, sc, legLen) {
    sc = sc || 1.3;
    return sh(100, 122, 74, 9) + g('translate(100 75) rotate(' + (rot || -18) + ') scale(' + sc + ') translate(-100 -75)', legH(100 - legLen, 100 + legLen, 75, 2.8) + body);
  }
  function radialLegs(xs, y1, y2) { return xs.map(function (x) { return legV(x, y1, y2); }).join(''); }

  // Корпус TO-92
  function to92(label) {
    return sh(100, 136, 44, 6) + radialLegs([80, 100, 120], 94, 136) +
      P('M70 100 L70 62 A30 30 0 0 1 130 62 L130 100 Z', '#1d1f22') + P('M70 100 L70 62 A30 30 0 0 1 130 62 L130 100 Z', 'url(#phGlossX)') +
      R(70, 94, 60, 8, '#151618', 2) + T(100, 74, label, 10, '#c9cdd2');
  }
  // Корпус TO-220 / TO-247
  function to220(label, big) {
    var w = big ? 84 : 70, x = 100 - w / 2, h = big ? 60 : 48;
    return sh(100, 138, 50, 6) +
      R(x, 6, w, 34, 'url(#phSteelX)', 4) + C(100, 22, big ? 8 : 7, '#2a2d31') + C(100, 22, big ? 8 : 7, 'url(#phDisc)') +
      radialLegs([100 - w / 3.3, 100, 100 + w / 3.3], 36 + h, 138) +
      R(x, 36, w, h, '#1b1d20', 4) + glossX(x, 36, w, h, 4) + T(100, 36 + h / 2 + 4, label, big ? 11 : 10, '#cfd3d8');
  }

  var PH = {
    resistor: function () {
      var cols = ['#f5d10f', '#8b3fc7', '#e53b1f', '#c9a227'];
      if (CUR && CUR[0] && MC.tools) { var bd = MC.tools.toBands(CUR[0], 2); if (bd && !bd.inexact) cols = bd.concat(['gold']).map(function (id) { return MC.tools.byId[id].hex; }); }
      var body = P('M58 62 Q58 59 64 59 L76 61 L124 61 L136 59 Q142 59 142 62 L142 88 Q142 91 136 91 L124 89 L76 89 L64 91 Q58 91 58 88 Z', '#d6bd8e') +
        [70, 86, 100, 126].map(function (x, i) { return R(x, i === 0 || i === 3 ? 59.5 : 61, 7, i === 0 || i === 3 ? 31 : 28, cols[i]); }).join('') +
        P('M58 62 Q58 59 64 59 L76 61 L124 61 L136 59 Q142 59 142 62 L142 88 Q142 91 136 91 L124 89 L76 89 L64 91 Q58 91 58 88 Z', 'url(#phGloss)');
      return axial(body, -20, 1.12, 82);
    },
    pot: function () {
      return sh(100, 132, 44, 7) + radialLegs([80, 100, 120], 100, 134) +
        R(66, 28, 68, 74, '#1f56b8', 8) + gloss(66, 28, 68, 74, 8) +
        disc(100, 62, 24, '#e7e9ec') + R(97, 44, 6, 36, '#8d939a', 2) + T(100, 97, M(0, '10K'), 9, '#d8e3ff');
    },
    ecap: function () {
      return sh(100, 140, 42, 7) + radialLegs([90, 110], 116, 142) +
        R(68, 22, 64, 96, '#1a3f96', 10) + R(112, 22, 14, 96, '#b9c6e3') +
        T(119, 48, '−', 13, '#1a3f96') + T(119, 74, '−', 13, '#1a3f96') + T(119, 100, '−', 13, '#1a3f96') +
        T(90, 68, M(0, '470µF'), 10, '#fff') + T(90, 82, M(1, '25V'), 9, '#cfd8ee') +
        glossX(68, 22, 64, 96, 10) + R(68, 112, 64, 8, '#141516', 3) +
        E(100, 24, 32, 7, '#c4cad3') + E(100, 24, 32, 7, 'url(#phDisc)') + S('M88 21 L112 27 M112 21 L88 27', '#7f8792', 1.6);
    },
    ccap: function () {
      return sh(100, 138, 34, 6) + radialLegs([90, 110], 94, 138) +
        P('M86 92 Q84 104 90 104 L110 104 Q116 104 114 92 Z', '#d36a1e') +
        disc(100, 60, 38, '#e2741f') + T(100, 66, M(0, '104'), 15, '#4a2306');
    },
    fcap: function () {
      return sh(100, 138, 54, 7) + radialLegs([76, 124], 104, 138) +
        P('M50 46 L62 30 L160 30 L148 46 Z', '#f2d54d') + P('M148 46 L160 30 L160 92 L148 106 Z', '#a6880f') +
        R(50, 46, 98, 60, '#dcbc22', 3) + gloss(50, 46, 98, 60, 3) + T(99, 72, M(0, 'μ47 X2'), 12, '#3a3005') + T(99, 88, M(1, '275V~'), 9, '#4a3f0b');
    },
    choke: function () {
      var w = '';
      for (var a = -170; a <= 170; a += 13) {
        var r = a * Math.PI / 180, ca = Math.cos(r), sa = Math.sin(r);
        w += S('M' + (100 + ca * 22).toFixed(1) + ' ' + (68 + sa * 16).toFixed(1) + ' L' + (100 + ca * 50).toFixed(1) + ' ' + (68 + sa * 38).toFixed(1), sa > 0 ? '#9a4f1c' : '#e39555', 6);
      }
      return sh(100, 134, 56, 8) + radialLegs([80, 120], 104, 136) + R(64, 100, 72, 12, '#1b1c1e', 3) +
        E(100, 68, 52, 40, '#2c2e31') + E(100, 68, 20, 14, '#0f1012') + w + E(100, 68, 52, 40, 'url(#phDisc)', ' opacity=".6"');
    },
    varistor: function () {
      return sh(100, 140, 34, 6) + radialLegs([90, 110], 92, 140) + disc(100, 58, 38, '#2470d6') + T(100, 56, M(0, '14D'), 12, '#fff') + T(100, 71, M(1, '471K'), 11, '#e6efff');
    },
    ntc: function () {
      return sh(100, 140, 30, 6) + radialLegs([90, 110], 90, 140) + disc(100, 60, 32, '#1e1f22') + T(100, 58, 'NTC', 10, '#d5d8dc') + T(100, 72, M(0, '5D-9'), 10, '#d5d8dc');
    },
    ptc: function () {
      return sh(100, 140, 36, 6) + radialLegs([88, 112], 100, 140) + R(66, 30, 68, 72, '#e3dfd3', 14) + R(66, 30, 68, 72, 'url(#phDisc)', 14) + T(100, 64, 'PTC', 13, '#3b3a35') + T(100, 80, M(0, '18Ω'), 10, '#55534c');
    },
    fuse: function () {
      return sh(100, 108, 76, 8) + g('rotate(-14 100 75)',
        R(52, 61, 96, 28, 'rgba(210,230,255,.16)', 4, ' stroke="rgba(220,235,255,.5)" stroke-width="1.2"') + S('M58 75 Q80 70 100 75 T142 75', '#e9ecef', 1.4) +
        R(56, 64, 88, 5, 'rgba(255,255,255,.35)', 2) +
        R(28, 58, 30, 34, 'url(#phSteel)', 4) + R(142, 58, 30, 34, 'url(#phSteel)', 4) + T(100, 102, M(0, 'T3.15A 250V'), 8, '#a8afb7'));
    },
    tfuse: function () {
      return axial(R(62, 64, 62, 22, 'url(#phSteel)', 10) + R(118, 66, 20, 18, '#ece5d2', 4) + gloss(118, 66, 20, 18, 4) + T(92, 79, M(0, 'SF152E').split(' ')[0], 8, '#2b2f34'), -16, 1.3, 70);
    },
    quartz: function () {
      return sh(100, 136, 46, 7) + radialLegs([88, 112], 98, 138) + R(58, 40, 84, 60, '#c3c9d0', 28) + glossX(58, 40, 84, 60, 28) + R(58, 92, 84, 8, '#9aa1a8', 3) + T(100, 76, M(0, '8.000'), 13, '#30353b');
    },
    diode: function () {
      return axial(R(70, 63, 60, 24, '#18191b', 10) + R(116, 63, 8, 24, '#d8dde2') + gloss(70, 63, 60, 24, 10) + T(94, 79, M(0, '1N4007'), 7, '#9aa0a6'), -18, 1.45, 62);
    },
    schottky: function () {
      return axial(R(64, 60, 72, 30, '#18191b', 12) + R(124, 60, 9, 30, '#d8dde2') + gloss(64, 60, 72, 30, 12) + T(94, 79, M(0, 'SR560'), 8, '#9aa0a6'), -18, 1.3, 70);
    },
    zener: function () {
      return axial(R(78, 66, 44, 18, 'rgba(255,120,60,.75)', 9) + R(112, 66, 7, 18, '#1a1a1a') + R(84, 72, 22, 5, '#5a1e0c') + gloss(78, 66, 44, 18, 9), -18, 1.7, 52);
    },
    bridge: function () {
      return sh(100, 138, 58, 7) + radialLegs([67, 89, 111, 133], 98, 140) + R(50, 36, 100, 64, '#1c1d20', 5) + glossX(50, 36, 100, 64, 5) +
        T(67, 56, '+', 13, '#cfd3d8') + T(89, 56, '~', 13, '#cfd3d8') + T(111, 56, '~', 13, '#cfd3d8') + T(133, 56, '−', 13, '#cfd3d8') + T(100, 84, M(0, 'KBP307'), 10, '#9aa0a6');
    },
    led: function () {
      var lc = { red: ['#e8392a', '#c42b1b', '#7a140a'], green: ['#2fbf5a', '#1f8f40', '#0d4a1e'], yellow: ['#f1c21b', '#c79a0e', '#6b5106'], blue: ['#3b7bff', '#2a5bd0', '#0f2a6b'] }[M(0, 'red')] || ['#e8392a', '#c42b1b', '#7a140a'];
      return sh(100, 142, 30, 5) + legV(90, 96, 142) + legV(110, 96, 130) +
        R(76, 90, 48, 10, lc[1], 3) + P('M80 92 L80 46 A20 20 0 0 1 120 46 L120 92 Z', lc[0], ' opacity=".9"') +
        P('M88 72 L88 60 L96 64 L96 76 Z', lc[2], ' opacity=".7"') + P('M104 66 L112 62 L112 78 L104 80 Z', lc[2], ' opacity=".7"') +
        P('M80 92 L80 46 A20 20 0 0 1 120 46 L120 92 Z', 'url(#phGlossX)') + E(92, 42, 5, 9, '#fff', ' opacity=".55"');
    },
    npn: function () { return to92(M(0, 'BC547')); },
    pnp: function () { return to92(M(0, 'BC557')); },
    tl431: function () { return to92(M(0, 'TL431')); },
    hall: function () { return to92(M(0, '3144')); },
    mosfet: function () { return to220(M(0, 'IRF740')); },
    triac: function () { return to220(M(0, 'BT136')); },
    scr: function () { return to220(M(0, 'BT151')); },
    reg78: function () { return to220(M(0, 'L7805')); },
    igbt: function () { return to220(M(0, 'FGA25N120'), true); },
    opto: function () {
      return sh(100, 126, 50, 7) + [80, 120].map(function (x) { return R(x - 4, 28, 8, 22, 'url(#phLegV)', 2) + R(x - 4, 100, 8, 22, 'url(#phLegV)', 2); }).join('') +
        R(62, 44, 76, 62, '#1c1d20', 5) + glossX(62, 44, 76, 62, 5) + C(74, 56, 4, '#38393c') + T(100, 82, M(0, 'PC817'), 11, '#cfd3d8');
    },
    tpi: function () {
      return sh(100, 138, 64, 8) + radialLegs([60, 80, 120, 140], 112, 140) + R(44, 98, 112, 16, '#1b1c1e', 3) +
        R(40, 34, 30, 70, '#3b3d41', 3) + R(130, 34, 30, 70, '#3b3d41', 3) + glossX(40, 34, 30, 70, 3) + glossX(130, 34, 30, 70, 3) +
        R(62, 30, 76, 76, '#3b3d41', 3) + R(70, 40, 60, 60, 'url(#phTape)', 4) + gloss(70, 40, 60, 60, 4) + T(100, 76, M(0, 'EER28'), 11, '#3d2f04') +
        R(40, 26, 120, 8, '#46494e', 2) + R(40, 104, 120, 6, '#2e3034', 2);
    },
    mains: function () {
      var lam = '';
      for (var i = 0; i < 10; i++) lam += R(34, 30 + i * 8, 132, 4, i % 2 ? '#80868e' : '#9aa0a7');
      return sh(100, 140, 72, 9) + R(34, 28, 132, 84, '#6d737a', 3) + lam + R(66, 24, 68, 92, 'url(#phCopperX)', 6) + R(72, 34, 56, 72, 'url(#phTape)', 4) + gloss(72, 34, 56, 72, 4) +
        T(100, 74, M(0, '230V / 12V').replace('V / ', '/').replace(' ', ''), 10, '#3d2f04') + R(28, 108, 144, 10, '#4b5056', 2) + R(28, 22, 144, 8, '#4b5056', 2);
    },
    relay: function () {
      return sh(100, 140, 60, 7) + radialLegs([64, 82, 100, 118, 136], 110, 140) + R(48, 30, 104, 82, '#1e4eb4', 5) + glossX(48, 30, 104, 82, 5) + R(48, 30, 104, 82, 'url(#phGloss)', 5) +
        T(100, 62, M(0, 'JQC-3FF'), 12, '#fff') + T(100, 78, M(1, '12VDC'), 10, '#d7e2ff') + T(100, 94, '10A 250VAC', 8, '#b8c9f2');
    },
    speaker: function () {
      return sh(100, 140, 66, 8) + E(100, 74, 66, 58, '#16171a') + E(100, 74, 58, 50, '#2f3236') + E(100, 74, 48, 41, '#45494f') + E(100, 74, 48, 41, 'url(#phDisc)') +
        E(100, 74, 18, 15, '#202225') + E(100, 74, 18, 15, 'url(#phDisc)') + [[46, 32], [154, 32], [46, 116], [154, 116]].map(function (p) { return C(p[0], p[1], 4, '#55595f'); }).join('');
    },
    heater: function () {
      return sh(100, 132, 80, 8) +
        S('M58 58 L166 58 A18 18 0 0 1 166 94 L58 94', '#6a7077', 16) + S('M58 58 L166 58 A18 18 0 0 1 166 94 L58 94', 'url(#phSteel)', 12) + S('M60 55 L164 55', '#fff', 2, ' opacity=".55"') +
        R(30, 40, 30, 72, '#7b8189', 4) + glossX(30, 40, 30, 72, 4) + R(14, 54, 18, 8, 'url(#phLegH)', 2) + R(14, 90, 18, 8, 'url(#phLegH)', 2) + C(45, 76, 6, '#c9ced4') + C(45, 76, 6, 'url(#phDisc)') +
        T(118, 80, M(0, '2000W').split(' ')[0], 9, '#4b5157');
    },
    ntcsensor: function () {
      return sh(100, 118, 76, 7) + S('M44 74 Q30 70 22 58', '#e9e9e9', 5) + S('M44 82 Q30 88 22 100', '#e9e9e9', 5) + R(12, 50, 16, 14, '#e7e1d0', 3) + R(12, 94, 16, 14, '#e7e1d0', 3) +
        R(40, 64, 40, 28, '#1d1e21', 6) + glossX(40, 64, 40, 28, 6) + R(78, 68, 102, 20, 'url(#phSteel)', 10) + T(128, 82, M(0, 'NTC'), 8, '#3c4249');
    },
    pump: function () {
      return sh(100, 136, 76, 9) +
        C(66, 80, 42, '#e9eaec') + C(66, 80, 42, 'url(#phDisc)') + C(66, 80, 22, '#d2d5d9') + R(36, 26, 22, 30, '#e3e4e7', 6) + glossX(36, 26, 22, 30, 6) + R(92, 110, 30, 18, '#dedfe2', 5) +
        R(104, 50, 76, 62, '#1d1e21', 8) + glossX(104, 50, 76, 62, 8) + R(118, 60, 48, 42, 'url(#phCopperX)', 6) + T(142, 86, M(0, '30W'), 9, '#3b1e08') + R(176, 64, 14, 32, '#3a3c40', 3);
    },
    valve: function () {
      return sh(100, 136, 76, 9) + R(28, 92, 144, 28, '#e7e8ea', 12) + gloss(28, 92, 144, 28, 12) + R(14, 98, 20, 16, '#cfd1d5', 4) + R(166, 98, 20, 16, '#cfd1d5', 4) +
        R(64, 30, 72, 66, '#1f2023', 8) + glossX(64, 30, 72, 66, 8) + R(72, 22, 10, 14, 'url(#phLegV)', 2) + R(118, 22, 10, 14, 'url(#phLegV)', 2) + T(100, 70, M(0, '220V'), 11, '#c9cdd2');
    },
    wmotor: function () {
      var fins = ''; for (var i = 0; i < 8; i++) fins += R(46 + i * 12, 34, 4, 82, '#6f757c');
      return sh(100, 136, 84, 9) + R(36, 32, 112, 86, '#9aa1a8', 40) + fins + glossX(36, 32, 112, 86, 40) + R(36, 32, 112, 86, 'url(#phGloss)', 40) +
        R(148, 64, 20, 22, 'url(#phSteelX)', 3) + R(166, 56, 18, 38, '#2b2d31', 5) + glossX(166, 56, 18, 38, 5) + R(56, 110, 64, 14, '#1d1e21', 3);
    },
    ubl: function () {
      return sh(100, 136, 56, 7) + R(50, 26, 100, 90, '#e4dfd2', 8) + R(50, 26, 100, 90, 'url(#phGlossX)', 8) + R(78, 46, 44, 26, '#a9a291', 5) + R(84, 52, 32, 14, '#4c4840', 3) +
        radialLegs([80, 100, 120], 112, 138) + T(100, 98, 'УБЛ', 11, '#5a5546');
    },
    pressostat: function () {
      return sh(100, 140, 52, 7) + R(92, 8, 16, 26, '#cfd1d5', 4) + glossX(92, 8, 16, 26, 4) + C(100, 76, 46, '#f0f0f0') + C(100, 76, 46, 'url(#phDisc)') + C(100, 76, 18, '#d9dadd') +
        [82, 100, 118].map(function (x) { return R(x - 4, 112, 8, 26, 'url(#phLegV)', 1); }).join('');
    },
    thermostat: function () {
      return sh(100, 132, 46, 7) + R(66, 92, 22, 40, 'url(#phLegV)', 2) + R(112, 92, 22, 40, 'url(#phLegV)', 2) + R(62, 72, 76, 26, '#ece6d6', 5) + gloss(62, 72, 76, 26, 5) +
        E(100, 66, 40, 14, '#bfc5cc') + R(60, 50, 80, 16, 'url(#phSteel)', 6) + E(100, 50, 40, 12, '#dfe3e7') + E(100, 50, 40, 12, 'url(#phDisc)') + T(100, 54, M(0, '85°C'), 9, '#3c4249');
    },
    compressor: function () {
      return sh(100, 140, 82, 9) + R(30, 120, 140, 12, '#1d1e21', 3) +
        P('M38 122 L38 74 Q38 26 100 26 Q162 26 162 74 L162 122 Z', '#23262a') + P('M38 122 L38 74 Q38 26 100 26 Q162 26 162 74 L162 122 Z', 'url(#phGlossX)') +
        S('M128 38 L128 12 L150 12', 'url(#phCopperX)', 6) + S('M140 44 L156 30 L176 30', 'url(#phCopperX)', 6) + S('M60 40 L60 16', 'url(#phCopperX)', 6) +
        R(54, 72, 40, 32, '#3a3d42', 5) + glossX(54, 72, 40, 32, 5);
    },
    startrelay: function () {
      return sh(100, 136, 56, 7) + R(50, 34, 100, 88, '#1c1d20', 8) + glossX(50, 34, 100, 88, 8) + C(78, 72, 10, '#0c0c0d') + C(122, 72, 10, '#0c0c0d') +
        R(64, 102, 72, 10, '#2c2e32', 3) + T(100, 52, M(0, 'PTC'), 11, '#9aa0a6') + R(150, 54, 18, 10, 'url(#phLegH)', 2) + R(150, 84, 18, 10, 'url(#phLegH)', 2);
    },
    runcap: function () {
      return sh(100, 140, 46, 7) + R(64, 34, 72, 100, '#f0f0f0', 8) + glossX(64, 34, 72, 100, 8) + E(100, 34, 36, 8, '#2a2b2e') + R(84, 14, 8, 22, 'url(#phLegV)', 2) + R(108, 14, 8, 22, 'url(#phLegV)', 2) +
        T(100, 78, M(0, '10µF'), 13, '#2f3237') + T(100, 96, M(1, '450V~'), 9, '#555a61') + T(100, 112, 'CBB60', 8, '#777c83');
    },
    magnetron: function () {
      var fins = ''; for (var i = 0; i < 7; i++) fins += R(40 + i * 15, 46, 9, 76, '#aeb4bb') + R(40 + i * 15, 46, 9, 76, 'url(#phGlossX)');
      return sh(100, 138, 80, 9) + R(34, 54, 122, 60, '#80868e', 4) + fins + R(78, 14, 34, 34, 'url(#phSteelX)', 6) + E(95, 14, 17, 6, '#d8dde2') +
        R(156, 66, 30, 40, '#5a5f66', 4) + glossX(156, 66, 30, 40, 4) + R(184, 74, 10, 6, 'url(#phLegH)', 1) + R(184, 92, 10, 6, 'url(#phLegH)', 1);
    },
    mot: function () {
      var lam = ''; for (var i = 0; i < 12; i++) lam += R(30, 30 + i * 7, 140, 3, i % 2 ? '#80868e' : '#9aa0a7');
      return sh(100, 140, 78, 9) + R(30, 28, 140, 86, '#6d737a', 3) + lam + R(50, 22, 44, 98, 'url(#phCopperX)', 8) + R(106, 22, 44, 98, 'url(#phCopperX)', 8) +
        R(56, 30, 32, 82, 'url(#phTape)', 4) + gloss(106, 22, 44, 98, 8) + R(24, 112, 152, 12, '#4b5056', 2);
    },
    hvdiode: function () {
      return axial(R(56, 62, 88, 26, '#18191b', 12) + R(132, 62, 8, 26, '#c9ced4') + gloss(56, 62, 88, 26, 12) + T(96, 79, M(0, 'HVR-1X'), 8, '#9aa0a6') + C(186, 75, 9, 'none', ' stroke="url(#phSteel)" stroke-width="5"'), -14, 1.05, 80);
    },
    hvcap: function () {
      return sh(100, 140, 70, 8) + R(20, 112, 160, 12, 'url(#phSteel)', 3) + R(40, 36, 120, 80, '#c3c9d0', 30) + glossX(40, 36, 120, 80, 30) + R(40, 36, 120, 80, 'url(#phGloss)', 30) +
        R(72, 14, 14, 26, 'url(#phLegV)', 2) + R(114, 14, 14, 26, 'url(#phLegV)', 2) + T(100, 82, M(0, '1.0µF 2100V').split(' ')[0], 13, '#2f3237') + T(100, 98, M(0, '1.0µF 2100V').split(' ')[1] || '2100V', 9, '#4b5157');
    },
    button: function () {
      return sh(100, 132, 50, 7) + [[66, 104], [134, 104], [66, 40], [134, 40]].map(function (p) { return R(p[0] - 4, p[1] - 2, 8, 30, 'url(#phLegV)', 2); }).join('') +
        R(58, 42, 84, 76, '#1d1e21', 5) + glossX(58, 42, 84, 76, 5) + R(64, 48, 72, 64, 'url(#phSteel)', 4) + C(100, 80, 22, '#141517') + C(100, 80, 22, 'url(#phDisc)') +
        [[70, 54], [130, 54], [70, 106], [130, 106]].map(function (p) { return C(p[0], p[1], 3, '#4b5056'); }).join('');
    },
    wires: function () {
      var ribbon = '';
      var cols = ['#c8312a', '#9aa0a7', '#9aa0a7', '#9aa0a7', '#9aa0a7', '#9aa0a7'];
      cols.forEach(function (c, i) { ribbon += S('M42 ' + (52 + i * 6) + ' C90 ' + (20 + i * 6) + ' 110 ' + (120 + i * 6) + ' 158 ' + (70 + i * 6), c, 5.5); });
      return sh(100, 134, 80, 8) + ribbon + S('M42 52 C90 20 110 120 158 70', '#fff', 1.5, ' opacity=".35"') +
        R(16, 44, 30, 44, '#1c1d20', 4) + glossX(16, 44, 30, 44, 4) + R(154, 62, 30, 44, '#1c1d20', 4) + glossX(154, 62, 30, 44, 4);
    }
  };


  // Корпус DIP (вид сверху под углом)
  function dipPhoto(n, label) {
    var half = n / 2, x0 = half === 4 ? 58 : 68, step = half === 4 ? 28 : 32, legs = '';
    for (var i = 0; i < half; i++) {
      var x = x0 + i * step;
      legs += R(x - 4, 100, 8, 10, 'url(#phLegV)', 1) + R(x - 2.5, 108, 5, 24, 'url(#phLegV)', 1.5) + R(x - 4, 36, 8, 8, 'url(#phLegV)', 1);
    }
    return sh(100, 134, 66, 8) + legs + P('M44 42 L156 42 L164 50 L164 102 L36 102 L36 50 Z', '#1b1c1f') + P('M36 50 L44 42 L156 42 L164 50 Z', '#2c2e33') +
      R(36, 50, 128, 52, 'url(#phGlossX)', 3) + C(50, 90, 4, '#2f3135') + P('M36 68 A9 9 0 0 1 36 86 Z', '#0f1012') +
      T(100, 80, label, label.length > 8 ? 11 : 13, '#cfd3d8');
  }
  PH.pwm_uc = function () { return dipPhoto(8, M(0, 'UC3842')); };
  PH.pwm_sw = function () { return dipPhoto(8, M(0, 'VIPer22A')); };
  PH.pwm_ncp = function () { return dipPhoto(8, M(0, 'NCP1203')); };
  PH.opto_triac = function () { return dipPhoto(6, M(0, 'MOC3021')); };
  PH.opto_fast = function () { return dipPhoto(8, M(0, '6N137')); };
  PH.opto_drv = function () { return dipPhoto(8, M(0, 'TLP250')); };
  PH.zener_smd = function () {
    var shape = M(0, 'SOD123');
    if (shape === 'MELF') {
      return sh(100, 112, 64, 8) + g('rotate(-12 100 75)', R(40, 58, 26, 34, 'url(#phSteel)', 5) + R(134, 58, 26, 34, 'url(#phSteel)', 5) +
        R(62, 56, 76, 38, 'rgba(255,130,70,.7)', 16) + R(118, 56, 12, 38, '#1a1a1a') + R(70, 68, 40, 8, '#6a2a12', 3) + R(62, 56, 76, 38, 'url(#phGloss)', 16));
    }
    if (shape === 'SOT23') {
      return sh(100, 120, 56, 8) + R(66, 92, 14, 26, 'url(#phLegV)', 2) + R(120, 92, 14, 26, 'url(#phLegV)', 2) + R(93, 30, 14, 22, 'url(#phLegV)', 2) +
        P('M56 50 L144 50 L150 56 L150 98 L50 98 L50 56 Z', '#1b1c1f') + R(50, 56, 100, 42, 'url(#phGlossX)', 3) + P('M50 56 L56 50 L144 50 L150 56 Z', '#2c2e33');
    }
    return sh(100, 116, 70, 8) + g('translate(100 79) scale(1.22) translate(-100 -79)', R(34, 80, 30, 12, 'url(#phLegH)', 2) + R(136, 80, 30, 12, 'url(#phLegH)', 2) +
      P('M52 58 L148 58 L156 66 L156 100 L44 100 L44 66 Z', '#1b1c1f') + P('M44 66 L52 58 L148 58 L156 66 Z', '#2c2e33') +
      R(126, 62, 14, 38, '#d8dde2') + R(44, 66, 112, 34, 'url(#phGlossX)', 3));
  };

  MC.photo = function (comp) {
    ensureDefs();
    var fn = PH[comp.id];
    CUR = Array.isArray(comp.marking) ? comp.marking : null;
    var inner = fn ? fn() : '';
    CUR = null;
    return '<svg class="photo" viewBox="0 0 200 150" aria-hidden="true">' + inner + '</svg>';
  };
  MC.hasPhoto = function (id) { return !!PH[id]; };
})();
