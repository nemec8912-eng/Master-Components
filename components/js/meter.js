/* Логика виртуального мультиметра: поиск показаний, форматирование, сравнение с нормой. */
(function () {
  function okState(comp) { return comp.states.find(function (s) { return s.ok; }) || comp.states[0]; }

  function lookup(comp, state, mode, red, black, on) {
    var ok = okState(comp);
    var srcs = state === ok ? [state.r] : [state.r, ok.r];
    var keys = [mode + ':' + red + '>' + black, mode + ':' + red + '|' + black, mode + ':' + black + '|' + red];
    for (var i = 0; i < srcs.length; i++) {
      var src = srcs[i];
      if (on) for (var j = 0; j < keys.length; j++) if (('on|' + keys[j]) in src) return src['on|' + keys[j]];
      for (var k = 0; k < keys.length; k++) if (keys[k] in src) return src[keys[k]];
    }
    // Постоянное напряжение: при перевороте щупов знак меняется
    if (mode === 'v') {
      var rev = mode + ':' + black + '>' + red;
      for (var q = 0; q < srcs.length; q++) {
        var v = on && ('on|' + rev) in srcs[q] ? srcs[q]['on|' + rev] : (rev in srcs[q] ? srcs[q][rev] : undefined);
        if (v !== undefined) return typeof v === 'number' ? (v === 0 ? 0 : -v) : v;
      }
    }
    for (var m = 0; m < srcs.length; m++) if ((mode + ':*') in srcs[m]) return srcs[m][mode + ':*'];
    return mode === 'v' ? 0 : 'OL';
  }

  function sig(n, digits) {
    if (n === 0) return '0';
    var d = Math.max(0, digits - 1 - Math.floor(Math.log10(Math.abs(n))));
    return n.toFixed(Math.min(d, 3));
  }

  // Возвращает {val, unit} для дисплея
  function format(mode, v) {
    if (v === 'OL') return { val: 'OL', unit: '' };
    if (typeof v === 'string') return { val: v, unit: '', text: true };
    switch (mode) {
      case 'ohm': case 'beep': case 'esr':
        if (v < 1000) return { val: v < 1 ? v.toFixed(2) : sig(v, 3), unit: 'Ω' };
        if (v < 1e6) return { val: sig(v / 1e3, 4), unit: 'kΩ' };
        return { val: sig(v / 1e6, 3), unit: 'MΩ' };
      case 'diode':
        return { val: v.toFixed(3), unit: 'V' };
      case 'v':
        var a = Math.abs(v), dg = a < 2 ? 3 : a < 20 ? 2 : a < 200 ? 1 : 0;
        return { val: (v < 0 ? '-' : '') + a.toFixed(dg), unit: 'V' };
      case 'cap':
        if (v === 0) return { val: '0.00', unit: 'nF' };
        if (v < 0.001) return { val: sig(v * 1e6, 3), unit: 'pF' };
        if (v < 1) return { val: sig(v * 1e3, 3), unit: 'nF' };
        return { val: sig(v, 3), unit: 'µF' };
      case 'L':
        if (v < 1) return { val: sig(v * 1e3, 3), unit: 'µH' };
        return { val: sig(v, 3), unit: 'mH' };
    }
    return { val: String(v), unit: '' };
  }

  // Полное измерение: учитывает режим прозвонки и свечение светодиода
  // Режим «на плате»: параллельно выводам стоит цепь ~1 кОм (резистор, обмотка, другие компоненты)
  var BOARD_R = 1000;
  function boardify(mode, raw) {
    if (mode === 'ohm') {
      if (raw === 'OL') return BOARD_R;
      if (typeof raw === 'number') return raw * BOARD_R / (raw + BOARD_R);
      if (typeof raw === 'string' && raw.indexOf('OL') >= 0) return BOARD_R;
      return raw;
    }
    if (mode === 'diode') {
      if (raw === 'OL') return 1.0; // тестовый ток ~1 мА через 1 кОм
      return raw;
    }
    return raw;
  }
  function measure(comp, state, mode, red, black, on, board) {
    var get = board ? function (c, s, m, r, b, o) { return boardify(m, lookup(c, s, m, r, b, o)); } : lookup;
    if (!red || !black) return { val: '- - -', unit: '', idle: true };
    if (red === black) return { val: '0.00', unit: 'Ω', same: true, raw: 0 };
    var raw, out;
    if (mode === 'beep') {
      if (comp.modes.indexOf('ohm') >= 0) {
        raw = get(comp, state, 'ohm', red, black, on);
        if (typeof raw === 'number') {
          if (raw < 1000) { out = format('ohm', raw); out.beep = raw < 50; }
          else out = { val: 'OL', unit: '' };
        } else if (typeof raw === 'string' && raw.indexOf('скачет') === 0) {
          out = { val: raw, unit: '', text: true, beep: 'jitter' };
        } else out = { val: 'OL', unit: '' };
      } else {
        raw = get(comp, state, 'diode', red, black, on);
        if (typeof raw === 'number' && raw < 0.1) { out = format('diode', raw); out.unit = ''; out.beep = true; }
        else out = { val: 'OL', unit: '' };
      }
      out.raw = raw;
      return out;
    }
    raw = get(comp, state, mode, red, black, on);
    out = format(mode, raw);
    out.raw = raw;
    if (mode === 'diode') {
      var glowMap = state.glow || okState(comp).glow || {};
      if (!state.glow && !state.ok) glowMap = okState(comp).glow || {};
      out.glow = glowMap[red + '>' + black] || null;
    }
    return out;
  }

  function same(a, b) {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number') {
      if (Math.abs(a) < 0.01 && Math.abs(b) < 0.01) return true;
      return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)) < 0.12;
    }
    return false;
  }

  // Текст «нормального» показания
  function expectedText(comp, mode, red, black, on, board) {
    var m = measure(comp, okState(comp), mode, red, black, on, board);
    return (m.val + (m.unit ? ' ' + m.unit : '')).trim();
  }

  // Список измерений для таблиц справочника
  function measurementList(comp) {
    var seen = {}, list = [];
    comp.states.forEach(function (s) {
      Object.keys(s.r).forEach(function (k) {
        var on = k.indexOf('on|') === 0;
        var kk = on ? k.slice(3) : k;
        var mode = kk.split(':')[0], pair = kk.split(':')[1];
        if (pair === '*') return;
        var dir = pair.indexOf('>') > 0;
        var p = pair.split(dir ? '>' : '|');
        var norm = mode + ':' + (dir ? p[0] + '>' + p[1] : p.slice().sort().join('|')) + (on ? ':on' : '');
        if (seen[norm]) return;
        seen[norm] = true;
        list.push({ mode: mode, a: p[0], b: p[1], dir: dir, on: on });
      });
    });
    return list;
  }

  window.MC = window.MC || {};
  MC.meter = { okState: okState, lookup: lookup, format: format, measure: measure, same: same, expectedText: expectedText, measurementList: measurementList };
})();
