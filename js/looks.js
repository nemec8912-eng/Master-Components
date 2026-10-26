/* Реалистичные рисунки компонентов с координатами выводов.
   Каждый рисунок: viewBox 0 0 320 200, возвращает {g: svg, pins: [[x, y, 'b'|'t'|'l'|'r'], ...]} в порядке comp.pins. */
(function () {
  function R(x, y, w, h, fill, rx, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function Ln(x1, y1, x2, y2, c, w) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (c || '#b8bec6') + '" stroke-width="' + (w || 4) + '" stroke-linecap="round"/>'; }
  function Ci(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function Tx(x, y, t, s, c, a) { return '<text x="' + x + '" y="' + y + '" font-size="' + (s || 12) + '" fill="' + (c || '#fff') + '" text-anchor="' + (a || 'middle') + '" font-weight="700" font-family="system-ui,sans-serif">' + t + '</text>'; }
  function P(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  var LEG = '#c9ced4', TIN = '#d8dde2';
  var CUR = null;
  function M(i, d) { return CUR && CUR[i] != null ? String(CUR[i]) : d; }

  // Выводной компонент вдоль оси (резистор, диод, предохранитель)
  function axial(body, deco, len) {
    len = len || 120;
    var x = 160 - len / 2;
    return { g: Ln(30, 100, 290, 100, LEG, 4) + body(x, len) + (deco ? deco(x, len) : ''), pins: [[30, 100, 'b'], [290, 100, 'b']] };
  }
  function radial(bodyFn, pinsX, legTop, legBot) {
    var g = pinsX.map(function (x) { return Ln(x, legTop, x, legBot, LEG, 4); }).join('') + bodyFn();
    return { g: g, pins: pinsX.map(function (x) { return [x, legBot, 'b']; }) };
  }
  function bentLegs(xs, yTop, xe, yEnd, w) {
    return xs.map(function (x, i) { return '<path d="M' + x + ' ' + yTop + ' L' + x + ' ' + (yTop + 18) + ' L' + xe[i] + ' ' + (yEnd - 14) + ' L' + xe[i] + ' ' + yEnd + '" fill="none" stroke="' + LEG + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"/>'; }).join('');
  }
  function to92(label) {
    var g = bentLegs([140, 160, 180], 104, [95, 160, 225], 176, 4) +
      P('M114 108 L114 44 A46 46 0 0 1 206 44 L206 108 Z', '#222') + R(114, 96, 92, 12, '#2b2b2b') + Tx(160, 64, label, 14, '#ddd') + Tx(160, 86, 'плоская сторона к вам', 9, '#888');
    return { g: g, pins: [[95, 176, 'b'], [160, 176, 'b'], [225, 176, 'b']] };
  }
  function to220(label, big) {
    var w = big ? 120 : 100, x = 160 - w / 2, h = big ? 74 : 60;
    var g = R(x, 0, w, 36, '#b9bfc6', 4) + Ci(160, 18, 8, '#6b7179') +
      bentLegs([126, 160, 194], 32 + h, [92, 160, 228], 182, 6) +
      R(x, 32, w, h, '#1f1f1f', 4) + Tx(160, 32 + h / 2 + 5, label, 13, '#ddd');
    return { g: g, pins: [[92, 182, 'b'], [160, 182, 'b'], [228, 182, 'b']] };
  }
  function boxPins(n, x0, x1, y, legTop) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(x0 + (x1 - x0) * (n === 1 ? 0.5 : i / (n - 1)));
    return { legs: out.map(function (x) { return Ln(x, legTop, x, y, LEG, 4); }).join(''), pins: out.map(function (x) { return [x, y, 'b']; }) };
  }

  var LOOKS = {
    resistor: function () {
      return axial(function (x, l) {
        var cols = ['#f5d10f', '#8b3fc7', '#f07b16', '#c9a227'];
        if (CUR && CUR[0] && MC.tools) { var bd = MC.tools.toBands(CUR[0], 2); if (bd && !bd.inexact) cols = bd.concat(['gold']).map(function (id) { return MC.tools.byId[id].hex; }); }
        return R(x, 82, l, 36, '#d9c39a', 16) + [0.18, 0.33, 0.48, 0.8].map(function (k, i) { return R(x + l * k, 82, 9, 36, cols[i]); }).join('');
      });
    },
    pot: function () {
      var g = R(90, 30, 140, 100, '#2f5fa8', 10) + Ci(160, 80, 34, '#d7dce2') + R(156, 52, 8, 30, '#8b939c', 2) + Tx(160, 145, M(0, '10K'), 13, '#ddd') +
        [120, 160, 200].map(function (x) { return Ln(x, 130, x, 180, LEG, 5); }).join('');
      return { g: g, pins: [[120, 180, 'b'], [160, 180, 'b'], [200, 180, 'b']] };
    },
    ecap: function () {
      return radial(function () {
        return R(110, 14, 100, 130, '#1d3c8a', 12) + R(184, 14, 26, 130, '#c7d1e6', 0) + R(110, 14, 100, 10, '#9aa8c4', 6) +
          Tx(197, 50, '−', 22, '#1d3c8a') + Tx(197, 85, '−', 22, '#1d3c8a') + Tx(197, 120, '−', 22, '#1d3c8a') +
          Tx(146, 75, M(0, '470µF'), 13, '#fff') + Tx(146, 95, M(1, '25V'), 12, '#ddd') + P('M120 22 L180 22 M150 16 L150 28', 'none', ' stroke="#6c7a99" stroke-width="2"');
      }, [140, 190], 140, 185);
    },
    ccap: function () {
      return radial(function () { return Ci(160, 70, 52, '#d77a27') + Tx(160, 76, M(0, '104'), 18, '#3a1d05'); }, [140, 180], 110, 185);
    },
    fcap: function () {
      return radial(function () { return R(90, 30, 140, 90, '#d8b31e', 8) + Tx(160, 70, M(0, 'μ47 X2'), 16, '#2b2405') + Tx(160, 92, M(1, '275V~'), 12, '#2b2405'); }, [120, 200], 118, 185);
    },
    choke: function () {
      var g = Ln(110, 110, 110, 180, LEG, 4) + Ln(210, 110, 210, 180, LEG, 4) + Ci(160, 75, 62, '#3a3a3a') + Ci(160, 75, 24, '#11151a');
      for (var a = 0; a < 360; a += 15) {
        var r = a * Math.PI / 180;
        g += Ln(160 + Math.cos(r) * 26, 75 + Math.sin(r) * 26, 160 + Math.cos(r) * 60, 75 + Math.sin(r) * 60, '#c1803b', 4);
      }
      return { g: g, pins: [[110, 180, 'b'], [210, 180, 'b']] };
    },
    varistor: function () { return radial(function () { return Ci(160, 70, 52, '#2b6cb5') + Tx(160, 66, M(0, '14D'), 14, '#fff') + Tx(160, 84, M(1, '471K'), 14, '#fff'); }, [140, 180], 110, 185); },
    ntc: function () { return radial(function () { return Ci(160, 75, 44, '#1d1d1d') + Tx(160, 72, M(0, '5D-9'), 14, '#ddd') + Tx(160, 90, 'NTC', 10, '#999'); }, [142, 178], 110, 185); },
    ptc: function () { return radial(function () { return R(110, 30, 100, 80, '#e4e1d6', 12) + Tx(160, 66, 'PTC', 16, '#333') + Tx(160, 88, M(0, '18Ω'), 13, '#555'); }, [135, 185], 108, 185); },
    fuse: function () {
      return axial(function (x, l) { return R(x - 14, 80, 22, 40, '#c8ccd1', 3) + R(x + l - 8, 80, 22, 40, '#c8ccd1', 3) + R(x + 8, 84, l - 16, 32, 'rgba(200,225,255,.22)', 4, ' stroke="#9fb6cc" stroke-width="2"'); },
        function (x, l) { return Ln(x + 8, 100, x + l - 8, 100, '#e6e9ec', 2) + Tx(160, 140, M(0, 'T3.15A 250V'), 11, '#aaa'); });
    },
    tfuse: function () {
      return axial(function (x, l) { return R(x + 10, 86, l - 20, 28, '#aeb4ba', 12) + R(x + l - 34, 88, 20, 24, '#e8e2d0', 4); }, function () { return Tx(150, 140, M(0, 'SF152E 10A'), 11, '#aaa'); }, 110);
    },
    quartz: function () { return radial(function () { return R(105, 40, 110, 70, '#c9ced4', 30) + Tx(160, 82, M(0, '8.000'), 15, '#333'); }, [140, 180], 108, 185); },
    diode: function () {
      return axial(function (x, l) { return R(x, 86, l, 28, '#1f1f1f', 8) + R(x + l - 26, 86, 12, 28, '#d7dce2'); }, function () { return Tx(150, 140, M(0, '1N4007'), 12, '#aaa'); }, 90);
    },
    schottky: function () { return axial(function (x, l) { return R(x, 86, l, 28, '#1f1f1f', 8) + R(x + l - 26, 86, 12, 28, '#d7dce2'); }, function () { return Tx(150, 140, M(0, 'SR560'), 12, '#aaa'); }, 90); },
    zener: function () { return axial(function (x, l) { return R(x, 88, l, 24, 'rgba(255,120,80,.55)', 10, ' stroke="#e6a07a" stroke-width="2"') + R(x + l - 22, 88, 8, 24, '#222'); }, function () { return Tx(150, 140, M(0, 'BZX55C12'), 12, '#aaa'); }, 70); },
    hvdiode: function () { return axial(function (x, l) { return R(x, 84, l, 32, '#1f1f1f', 10) + R(x + l - 24, 84, 10, 32, '#c9ced4'); }, function () { return Tx(150, 140, M(0, 'HVR-1X'), 12, '#aaa'); }, 130); },
    bridge: function () {
      var bp = boxPins(4, 104, 216, 182, 120);
      return { g: bp.legs + R(80, 30, 160, 92, '#202020', 6) + Tx(104, 62, '+', 22, '#ddd') + Tx(141, 62, '~', 22, '#ddd') + Tx(179, 62, '~', 22, '#ddd') + Tx(216, 62, '−', 22, '#ddd') + Tx(160, 100, M(0, 'KBP307'), 14, '#bbb'), pins: bp.pins };
    },
    led: function () {
      var lc = { red: '255,70,50', green: '60,220,90', yellow: '255,210,40', blue: '60,120,255' }[M(0, 'red')] || '255,70,50';
      var g = Ln(140, 120, 140, 185, LEG, 4) + Ln(180, 120, 180, 168, LEG, 4) + R(118, 112, 84, 10, 'rgba(' + lc + ',.6)', 2) +
        P('M124 116 L124 60 A36 36 0 0 1 196 60 L196 116 Z', 'rgba(' + lc + ',.55)', ' stroke="rgba(' + lc + ',.9)" stroke-width="2"');
      return { g: g, pins: [[140, 185, 'b'], [180, 168, 'b']] };
    },
    opto: function () {
      var g = R(110, 50, 100, 90, '#1f1f1f', 6) + Ci(124, 64, 5, '#666') + Tx(160, 102, M(0, 'PC817'), 13, '#ddd') +
        Ln(130, 140, 130, 182, LEG, 5) + Ln(190, 140, 190, 182, LEG, 5) + Ln(130, 50, 130, 14, LEG, 5) + Ln(190, 50, 190, 14, LEG, 5) +
        Tx(116, 175, '1', 11, '#888') + Tx(176, 175, '2', 11, '#888') + Tx(176, 26, '3', 11, '#888') + Tx(116, 26, '4', 11, '#888');
      return { g: g, pins: [[130, 182, 'b'], [190, 182, 'b'], [190, 14, 't'], [130, 14, 't']] };
    },
    tpi: function () {
      var g = R(70, 60, 180, 80, '#2a2a2a', 6) + R(90, 30, 140, 140, '#4a4a4a', 8) + R(108, 44, 104, 112, '#d0a34a', 6) + R(124, 54, 72, 92, '#3a3a3a', 4) + Tx(160, 106, M(0, 'EER28'), 13, '#ddd') +
        [40, 80, 120, 160].map(function (y) { return Ln(30, y, 90, y, LEG, 4); }).join('') +
        [70, 130].map(function (y) { return Ln(230, y, 290, y, LEG, 4); }).join('') +
        Tx(50, 22, 'горячая', 11, '#e88') + Tx(270, 22, 'выход', 11, '#8e8');
      return { g: g, pins: [[30, 40, 'l'], [30, 80, 'l'], [30, 120, 'l'], [30, 160, 'l'], [290, 70, 'r'], [290, 130, 'r']] };
    },
    mains: function () {
      var g = R(90, 30, 140, 130, '#5a5f66', 4) + R(110, 50, 100, 90, '#b8862f', 6) + R(140, 30, 40, 130, '#3d4248') + Tx(160, 182, M(0, '230V / 12V'), 12, '#aaa') +
        Ln(60, 70, 110, 70, '#c06030', 4) + Ln(60, 120, 110, 120, '#c06030', 4) + Ln(210, 70, 260, 70, '#c06030', 4) + Ln(210, 120, 260, 120, '#c06030', 4);
      return { g: g, pins: [[60, 70, 'l'], [60, 120, 'l'], [260, 70, 'r'], [260, 120, 'r']] };
    },
    relay: function () {
      var bp = boxPins(5, 92, 228, 184, 130);
      return { g: bp.legs + R(70, 20, 180, 112, '#1e4aa8', 8) + Tx(160, 62, M(0, 'JQC-3FF'), 15, '#fff') + Tx(160, 84, M(1, '12VDC'), 13, '#dde') + Tx(160, 106, '10A 250VAC', 11, '#bcd'), pins: bp.pins };
    },
    speaker: function () {
      var g = Ci(150, 95, 78, '#2b2b2b') + Ci(150, 95, 56, '#3d3d3d') + Ci(150, 95, 20, '#555') + R(226, 70, 30, 50, '#444', 4) + Ln(256, 78, 290, 78, TIN, 5) + Ln(256, 112, 290, 112, TIN, 5) + Tx(272, 70, '+', 14, '#e88');
      return { g: g, pins: [[290, 78, 'r'], [290, 112, 'r']] };
    },
    heater: function () {
      var g = R(40, 70, 80, 60, '#6b7179', 6) + P('M120 82 L280 82 A18 18 0 0 1 280 118 L120 118', 'none', ' stroke="#9aa1a8" stroke-width="12" stroke-linejoin="round"') +
        Ln(14, 84, 46, 84, TIN, 6) + Ln(14, 116, 46, 116, TIN, 6) + Ci(80, 100, 8, '#c9ced4') + Tx(210, 60, M(0, '2000W 230V'), 12, '#aaa');
      return { g: g, pins: [[14, 84, 'l'], [14, 116, 'l'], [80, 100, 't']] };
    },
    ntcsensor: function () {
      var g = R(170, 82, 120, 36, '#c9ced4', 18) + R(140, 78, 36, 44, '#333', 6) + P('M140 92 Q90 92 60 70', 'none', ' stroke="#e0e0e0" stroke-width="5"') + P('M140 108 Q90 108 60 130', 'none', ' stroke="#e0e0e0" stroke-width="5"') + Tx(230, 140, M(0, 'NTC 20k'), 12, '#aaa');
      return { g: g, pins: [[60, 70, 'l'], [60, 130, 'l']] };
    },
    pump: function () {
      var g = Ci(120, 100, 64, '#e6e6e6') + Ci(120, 100, 40, '#cfcfcf') + R(170, 60, 110, 80, '#2a2a2a', 10) + R(184, 74, 82, 52, '#d0a34a', 6) + Tx(225, 106, M(0, '30W'), 12, '#333') +
        Ln(240, 140, 240, 182, TIN, 5) + Ln(270, 140, 270, 182, TIN, 5);
      return { g: g, pins: [[240, 182, 'b'], [270, 182, 'b']] };
    },
    valve: function () {
      var g = R(60, 110, 200, 40, '#e8e8e8', 10) + R(120, 30, 80, 84, '#2a2a2a', 8) + Tx(160, 76, M(0, '220V'), 13, '#ddd') + Ln(140, 30, 140, 8, TIN, 5) + Ln(180, 30, 180, 8, TIN, 5);
      return { g: g, pins: [[140, 8, 't'], [180, 8, 't']] };
    },
    wmotor: function () {
      var bp = boxPins(7, 40, 220, 188, 150);
      var g = R(30, 20, 200, 110, '#9aa1a8', 50) + R(230, 50, 70, 50, '#7c838a', 10) + R(28, 130, 204, 22, '#222', 4) + Tx(130, 80, 'Мотор', 16, '#222') + bp.legs + Ci(265, 75, 9, '#c9ced4');
      return { g: g, pins: bp.pins.concat([[265, 75, 't']]) };
    },
    ubl: function () {
      var bp = boxPins(3, 120, 200, 186, 130);
      return { g: R(90, 30, 140, 102, '#e6e1d4', 10) + R(130, 50, 60, 40, '#bdb6a3', 6) + Tx(160, 115, 'УБЛ', 14, '#333') + bp.legs, pins: bp.pins };
    },
    pressostat: function () {
      var g = Ci(160, 88, 62, '#f0f0f0') + Ci(160, 88, 20, '#ccc') + R(152, 2, 16, 30, '#999', 4) + Tx(160, 160, '11  12  14', 11, '#aaa') +
        [110, 160, 210].map(function (x) { return Ln(x, 140, x, 186, TIN, 6); }).join('');
      return { g: g, pins: [[110, 186, 'b'], [160, 186, 'b'], [210, 186, 'b']] };
    },
    thermostat: function () {
      var g = Ci(160, 80, 50, '#c9ced4') + Ci(160, 80, 36, '#e9e9e9') + Tx(160, 86, M(0, '85°C'), 14, '#333') + Ln(130, 120, 110, 180, TIN, 7) + Ln(190, 120, 210, 180, TIN, 7);
      return { g: g, pins: [[110, 180, 'b'], [210, 180, 'b']] };
    },
    runcap: function () {
      var g = R(100, 40, 120, 140, '#d9d9d9', 14) + R(100, 40, 120, 18, '#333', 8) + Tx(160, 106, M(0, '10µF'), 16, '#333') + Tx(160, 128, M(1, '450V~'), 12, '#555') + Ln(135, 40, 135, 10, TIN, 6) + Ln(185, 40, 185, 10, TIN, 6);
      return { g: g, pins: [[135, 10, 't'], [185, 10, 't']] };
    },
    compressor: function () {
      var g = P('M50 180 L50 90 Q50 30 160 30 Q270 30 270 90 L270 180 Z', '#2b2f33') + R(120, 70, 80, 70, '#555', 8) + Ci(140, 92, 7, TIN) + Ci(180, 92, 7, TIN) + Ci(160, 122, 7, TIN) + Ci(240, 150, 8, '#8a9098');
      return { g: g, pins: [[140, 92, 't'], [180, 92, 't'], [160, 122, 'b'], [240, 150, 'b']] };
    },
    startrelay: function () {
      var g = R(90, 40, 140, 110, '#1f1f1f', 10) + Ci(130, 95, 12, '#555') + Ci(190, 95, 12, '#555') + Tx(160, 140, M(0, 'PTC'), 12, '#aaa');
      return { g: g, pins: [[130, 95, 't'], [190, 95, 't']] };
    },
    magnetron: function () {
      var g = R(70, 50, 180, 110, '#b9bfc6', 6) + [0, 1, 2, 3, 4, 5].map(function (i) { return R(80 + i * 28, 40, 14, 130, '#9aa1a8', 2); }).join('') + R(140, 10, 40, 34, '#7a8088', 4) +
        R(250, 80, 50, 50, '#555', 6) + Ln(300, 94, 314, 94, TIN, 5) + Ln(300, 116, 314, 116, TIN, 5) + Ci(100, 180, 8, '#c9ced4');
      return { g: g, pins: [[314, 94, 'r'], [314, 116, 'r'], [100, 180, 'b']] };
    },
    mot: function () {
      var g = R(80, 30, 160, 140, '#5a5f66', 4) + R(96, 46, 50, 108, '#b8862f', 4) + R(174, 46, 50, 108, '#b8862f', 4) + R(150, 30, 20, 140, '#3d4248') +
        Ln(40, 70, 96, 70, '#c06030', 4) + Ln(40, 110, 96, 110, '#c06030', 4) + Ln(224, 60, 280, 60, '#c06030', 4) + Ln(224, 90, 280, 90, '#c06030', 4) + Ln(224, 130, 280, 130, '#ddd', 5) + Ci(160, 182, 8, '#c9ced4');
      return { g: g, pins: [[40, 70, 'l'], [40, 110, 'l'], [280, 60, 'r'], [280, 90, 'r'], [280, 130, 'r'], [160, 182, 'b']] };
    },
    hvcap: function () {
      var g = R(80, 50, 160, 100, '#c9ced4', 30) + R(60, 140, 200, 14, '#9aa1a8', 4) + Tx(160, 102, M(0, '1.0µF 2100V'), 13, '#333') + Ln(130, 50, 130, 14, TIN, 6) + Ln(190, 50, 190, 14, TIN, 6) + Ci(250, 160, 8, '#9aa1a8');
      return { g: g, pins: [[130, 14, 't'], [190, 14, 't'], [250, 160, 'b']] };
    },
    button: function () {
      var g = R(110, 50, 100, 100, '#2a2a2a', 6) + Ci(160, 100, 30, '#5a5a5a') + Ci(160, 100, 22, '#777') + Ln(120, 150, 120, 184, LEG, 5) + Ln(200, 150, 200, 184, LEG, 5);
      return { g: g, pins: [[120, 184, 'b'], [200, 184, 'b']] };
    },
    wires: function () {
      var g = P('M40 70 C120 50 200 90 280 70', 'none', ' stroke="#c33" stroke-width="10"') + P('M40 130 C120 150 200 110 280 130', 'none', ' stroke="#36c" stroke-width="10"');
      return { g: g, pins: [[40, 70, 'l'], [280, 70, 'r'], [40, 130, 'l'], [280, 130, 'r']] };
    }
  };
  // Транзисторы и прочие корпуса
  LOOKS.npn = function () { return to92(M(0, 'BC547')); };
  LOOKS.pnp = function () { return to92(M(0, 'BC557')); };
  LOOKS.scr = function () { return to220(M(0, 'BT151')); };
  LOOKS.tl431 = function () { return to92(M(0, 'TL431')); };
  LOOKS.hall = function () { return to92(M(0, '3144')); };
  LOOKS.mosfet = function () { return to220(M(0, 'IRF740')); };
  LOOKS.igbt = function () { return to220(M(0, 'FGA25N120'), true); };
  LOOKS.triac = function () { return to220(M(0, 'BT136')); };
  LOOKS.reg78 = function () { return to220(M(0, 'L7805')); };
  LOOKS.mains = LOOKS.mains;

  // Порядок выводов рисунка → id выводов компонента (если отличается от порядка comp.pins)
  var ORDER = {
    npn: ['C', 'B', 'E'], pnp: ['C', 'B', 'E'],      // BC547/557: К–Б–Э
    scr: ['K', 'A', 'G'],                            // BT151
    tl431: ['R', 'A', 'K'], hall: ['V', 'GND', 'OUT'],
    mosfet: ['G', 'D', 'S'], igbt: ['G', 'C', 'E'], triac: ['T1', 'T2', 'G'], reg78: ['IN', 'GND', 'OUT'],
    bridge: ['P', 'AC1', 'AC2', 'N'],
    tpi: ['P1', 'P2', 'A1', 'A2', 'S1', 'S2'],
    relay: ['K1', 'COM', 'NC', 'NO', 'K2'],
    ubl: ['N', 'L', 'C'], pressostat: ['COM', 'NC', 'NO'],
    wmotor: ['T1', 'T2', 'B1', 'B2', 'S1', 'S2', 'S3', 'K'],
    compressor: ['C', 'S', 'R', 'K']
  };

  // Группы выводов (обмотки, контакты) — рисуются рамкой с подписью
  var GROUPS = {
    tpi: [['P1', 'P2', 'Первичная (горячая)'], ['A1', 'A2', 'Вспомогательная'], ['S1', 'S2', 'Вторичная (выход)']],
    mains: [['P1', 'P2', 'Сетевая 220 В'], ['S1', 'S2', 'Вторичная']],
    mot: [['P1', 'P2', 'Сеть'], ['F1', 'F2', 'Накал'], ['HV', 'K', 'ВВ обмотка']],
    relay: [['K1', 'K2', 'Катушка'], ['COM', 'NC', 'NO', 'Контакты']],
    wmotor: [['T1', 'T2', 'Тахо'], ['B1', 'B2', 'Щётки'], ['S1', 'S2', 'S3', 'Статор']],
    opto: [['A', 'K', 'Светодиод'], ['E', 'C', 'Транзистор']],
    magnetron: [['F1', 'F2', 'Накал']],
    heater: [['L1', 'L2', 'Спираль']],
    wires: [['A1', 'A2', 'Жила 1 (начало–конец)'], ['B1', 'B2', 'Жила 2 (начало–конец)']]
  };
  window.MC = window.MC || {};
  MC.look = function (comp) {
    var fn = LOOKS[comp.id];
    if (!fn) return null;
    CUR = comp.marking || null;
    var L = fn();
    CUR = null;
    var order = ORDER[comp.id] || comp.pins.map(function (p) { return p.id; });
    var pos = {};
    var num = {};
    order.forEach(function (id, i) { if (L.pins[i]) { pos[id] = L.pins[i]; num[id] = i + 1; } });
    return { g: L.g, pos: pos, num: num, groups: GROUPS[comp.id] || [] };
  };
})();
