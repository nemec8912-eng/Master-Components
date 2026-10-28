/* Калькулятор цветовой маркировки резисторов и расшифровка SMD-кодов. */
(function () {
  var COLORS = [
    { id: 'black',  name: 'Чёрный',     hex: '#1a1a1a', d: 0, m: 1,    tcr: 250 },
    { id: 'brown',  name: 'Коричневый', hex: '#7a4a22', d: 1, m: 10,   tol: 1,    tcr: 100 },
    { id: 'red',    name: 'Красный',    hex: '#d0281f', d: 2, m: 100,  tol: 2,    tcr: 50 },
    { id: 'orange', name: 'Оранжевый',  hex: '#f07b16', d: 3, m: 1e3,  tcr: 15 },
    { id: 'yellow', name: 'Жёлтый',     hex: '#f5d10f', d: 4, m: 1e4,  tcr: 25 },
    { id: 'green',  name: 'Зелёный',    hex: '#1f9a43', d: 5, m: 1e5,  tol: 0.5,  tcr: 20 },
    { id: 'blue',   name: 'Синий',      hex: '#1f5fd0', d: 6, m: 1e6,  tol: 0.25, tcr: 10 },
    { id: 'violet', name: 'Фиолетовый', hex: '#8b3fc7', d: 7, m: 1e7,  tol: 0.1,  tcr: 5 },
    { id: 'grey',   name: 'Серый',      hex: '#8a8f96', d: 8, m: 1e8,  tol: 0.05, tcr: 1 },
    { id: 'white',  name: 'Белый',      hex: '#f4f4f4', d: 9, m: 1e9 },
    { id: 'gold',   name: 'Золотой',    hex: '#c9a227', m: 0.1,  tol: 5 },
    { id: 'silver', name: 'Серебряный', hex: '#b9bec4', m: 0.01, tol: 10 },
    { id: 'none',   name: 'Нет полосы', hex: 'transparent', tol: 20 }
  ];
  var byId = {}; COLORS.forEach(function (c) { byId[c.id] = c; });

  function fmtOhm(v) {
    if (v === 0) return '0 Ω';
    var units = [[1e9, 'GΩ'], [1e6, 'MΩ'], [1e3, 'kΩ'], [1, 'Ω']];
    for (var i = 0; i < units.length; i++) {
      if (v >= units[i][0] || i === units.length - 1) {
        var n = v / units[i][0];
        return parseFloat(n.toPrecision(4)).toString().replace('.', ',') + ' ' + units[i][1];
      }
    }
  }

  // Роли полос для 4/5/6-полосной маркировки
  function bandRoles(n) {
    if (n === 4) return ['digit', 'digit', 'mult', 'tol'];
    if (n === 5) return ['digit', 'digit', 'digit', 'mult', 'tol'];
    return ['digit', 'digit', 'digit', 'mult', 'tol', 'tcr'];
  }
  function allowed(role) {
    return COLORS.filter(function (c) {
      if (role === 'digit') return c.d !== undefined;
      if (role === 'mult') return c.m !== undefined;
      if (role === 'tol') return c.tol !== undefined;
      if (role === 'tcr') return c.tcr !== undefined;
    });
  }
  function calc(bands) {
    var n = bands.length, roles = bandRoles(n), digits = '', mult = 1, tol = null, tcr = null;
    roles.forEach(function (r, i) {
      var c = byId[bands[i]];
      if (r === 'digit') digits += c.d;
      if (r === 'mult') mult = c.m;
      if (r === 'tol') tol = c.tol;
      if (r === 'tcr') tcr = c.tcr;
    });
    var v = parseInt(digits, 10) * mult;
    v = parseFloat(v.toPrecision(6));
    return { value: v, tol: tol, tcr: tcr, min: v * (1 - tol / 100), max: v * (1 + tol / 100) };
  }

  // Обратный расчёт: номинал → цвета
  function parseValue(s) {
    s = String(s).trim().replace(',', '.').replace(/\s/g, '').replace(/ом|ohm|Ω/gi, '');
    var m = s.match(/^(\d*)\.?(\d*)([rkмmgкг]?)(\d*)$/i);
    if (!m) return NaN;
    var mulMap = { '': 1, r: 1, k: 1e3, 'к': 1e3, m: 1e6, 'м': 1e6, g: 1e9, 'г': 1e9 };
    var letter = m[3].toLowerCase();
    var num;
    if (letter && m[4] && !m[2]) num = parseFloat((m[1] || '0') + '.' + m[4]); // 4k7
    else num = parseFloat((m[1] || '0') + (m[2] ? '.' + m[2] : ''));
    return num * (mulMap[letter] || 1);
  }
  function toBands(v, sigDigits) {
    if (!(v > 0)) return null;
    var exp = Math.floor(Math.log10(v)) - (sigDigits - 1);
    var mant = Math.round(v / Math.pow(10, exp));
    if (mant >= Math.pow(10, sigDigits)) { mant = Math.round(mant / 10); exp++; }
    if (Math.abs(mant * Math.pow(10, exp) - v) / v > 1e-6) return { inexact: true };
    if (exp < -2 || exp > 9) return null;
    var ds = String(mant).split('').map(function (d) { return COLORS[+d].id; });
    var multColor = exp === -1 ? 'gold' : exp === -2 ? 'silver' : COLORS[exp].id;
    return ds.concat([multColor]);
  }

  // ---------- SMD-коды резисторов ----------
  var E96 = [100,102,105,107,110,113,115,118,121,124,127,130,133,137,140,143,147,150,154,158,162,165,169,174,178,182,187,191,196,200,205,210,215,221,226,232,237,243,249,255,261,267,274,280,287,294,301,309,316,324,332,340,348,357,365,374,383,392,402,412,422,432,442,453,464,475,487,499,511,523,536,549,562,576,590,604,619,634,649,665,681,698,715,732,750,768,787,806,825,845,866,887,909,931,953,976];
  var EIA_MULT = { Z: 0.001, Y: 0.01, R: 0.01, X: 0.1, S: 0.1, A: 1, B: 10, H: 10, C: 100, D: 1e3, E: 1e4, F: 1e5 };

  function decodeSmdRes(code) {
    var c = String(code).trim().toUpperCase().replace(/\s/g, '');
    if (!c) return null;
    if (/^0+$/.test(c)) return { value: 0, how: 'Перемычка 0 Ом (джампер).' };
    if (/^\d{2}[A-Z]$/.test(c)) {
      var idx = parseInt(c.slice(0, 2), 10), mul = EIA_MULT[c[2]];
      if (idx >= 1 && idx <= 96 && mul !== undefined) return { value: parseFloat((E96[idx - 1] * mul).toPrecision(6)), how: 'EIA-96 (точность 1%): код ' + c.slice(0, 2) + ' = ' + E96[idx - 1] + ', буква ' + c[2] + ' = ×' + mul + '.' };
    }
    if (/^\d*[RKM]\d*$/.test(c) && /\d/.test(c)) {
      var L = c.match(/[RKM]/)[0], mm = { R: 1, K: 1e3, M: 1e6 }[L];
      var parts = c.split(L);
      return { value: parseFloat(((parts[0] || '0') + '.' + (parts[1] || '0'))) * mm, how: 'Буква ' + L + ' стоит на месте запятой' + (L === 'R' ? ' (Ом).' : L === 'K' ? ' (кОм).' : ' (МОм).') };
    }
    if (/^\d{3}$/.test(c)) return { value: parseInt(c.slice(0, 2), 10) * Math.pow(10, +c[2]), how: 'Три цифры (точность 5%): ' + c.slice(0, 2) + ' и ' + c[2] + ' нул' + (c[2] === '1' ? 'ь' : 'я/ей') + '.' };
    if (/^\d{4}$/.test(c)) return { value: parseInt(c.slice(0, 3), 10) * Math.pow(10, +c[3]), how: 'Четыре цифры (точность 1%): ' + c.slice(0, 3) + ' и ' + c[3] + ' нул' + (c[3] === '1' ? 'ь' : 'я/ей') + '.' };
    return null;
  }

  // ---------- Коды конденсаторов ----------
  var TOL = { B: '±0,1 пФ', C: '±0,25 пФ', D: '±0,5 пФ', F: '±1%', G: '±2%', J: '±5%', K: '±10%', M: '±20%', Z: '+80/−20%' };
  function fmtCap(pf) {
    if (pf >= 1e6) return parseFloat((pf / 1e6).toPrecision(4)).toString().replace('.', ',') + ' мкФ';
    if (pf >= 1e3) return parseFloat((pf / 1e3).toPrecision(4)).toString().replace('.', ',') + ' нФ';
    return parseFloat(pf.toPrecision(4)).toString().replace('.', ',') + ' пФ';
  }
  function decodeCap(code) {
    var c = String(code).trim().replace(/\s/g, '').replace(',', '.');
    if (!c) return null;
    var tol = null;
    var t = c.match(/^(.*?)([BCDFGJKMZ])$/i);
    if (t && /\d/.test(t[1]) && !/[pnuµμ]/i.test(t[1].slice(-1))) { c = t[1]; tol = TOL[t[2].toUpperCase()]; }
    var m = c.match(/^(\d*)([pnuµμ])(\d*)$/i);
    if (m) {
      var mult = { p: 1, n: 1e3, u: 1e6, 'µ': 1e6, 'μ': 1e6 }[m[2].toLowerCase()];
      var v = parseFloat((m[1] || '0') + '.' + (m[3] || '0')) * mult;
      return { pf: v, text: fmtCap(v), tol: tol, how: 'Буква стоит на месте запятой: p — пикофарады, n — нанофарады, µ/u — микрофарады.' };
    }
    if (/^\d{3}$/.test(c)) {
      var pf = parseInt(c.slice(0, 2), 10) * Math.pow(10, c[2] === '9' ? -1 : c[2] === '8' ? -2 : +c[2]);
      return { pf: pf, text: fmtCap(pf), tol: tol, how: 'Первые две цифры — значение, третья — число нулей. Результат в пикофарадах: ' + c + ' = ' + pf + ' пФ.' };
    }
    if (/^\d{1,2}$/.test(c)) return { pf: +c, text: fmtCap(+c), tol: tol, how: 'Одна-две цифры — сразу пикофарады.' };
    if (/^\d*\.\d+$/.test(c)) return { pf: parseFloat(c) * 1e6, text: fmtCap(parseFloat(c) * 1e6), tol: tol, how: 'Дробное число без буквы обычно означает микрофарады.' };
    return null;
  }

  window.MC = window.MC || {};
  MC.tools = { COLORS: COLORS, byId: byId, bandRoles: bandRoles, allowed: allowed, calc: calc, fmtOhm: fmtOhm, parseValue: parseValue, toBands: toBands, decodeSmdRes: decodeSmdRes, decodeCap: decodeCap };
})();
