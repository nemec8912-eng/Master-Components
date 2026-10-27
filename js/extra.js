/* Доп. разделы: схемы узлов, цоколёвки, аналоги, калькуляторы, NTC, проверка под напряжением. */
(function () {
  window.MC = window.MC || {};
  var X = MC.extra = {};
  function U() { return MC.ui; }
  function esc(s) { return U().esc(s); }

  // ================= Схемы узлов =================
  X.nodes = [
    { id: 'smps', name: 'Импульсный блок питания', icon: '🔌', desc: 'Телевизоры, мониторы, зарядки, платы техники',
      parts: [['fuse', 'F1 Предохранитель'], ['varistor', 'RV1 Варистор'], ['ntc', 'NTC1 Термистор'], ['bridge', 'BD1 Диодный мост'], ['ecap', 'C1 Сетевой конденсатор'], ['mosfet', 'Q1 Ключ ШИМ'], ['tpi', 'T1 ТПИ'], ['schottky', 'D5 Выходной диод'], ['ecap', 'C10 Выходной конденсатор'], ['opto', 'U2 Оптопара'], ['tl431', 'U3 TL431'], ['pwm_uc', 'U1 ШИМ UC3842']],
      faults: [
        [0, 'open', 'Полностью мёртвый, индикатор не горит. Внутри предохранителя чисто.'],
        [1, 'short', 'После грозы не включается, при включении сразу выбивает предохранитель.'],
        [2, 'open', 'Не включается, предохранитель целый, на сетевом конденсаторе 0 В.'],
        [3, 'short', 'При включении хлопок, предохранитель почернел.'],
        [5, 'short', 'Был хлопок, предохранитель чёрный, резистор в истоке ключа обгорел.'],
        [6, 'turns', 'Цыкает, ключ сильно греется, через минуту уходит в защиту.'],
        [7, 'short', 'Цыкает, на выходе 12 В — около нуля, на выходе КЗ.'],
        [8, 'dry', 'Свистит, напряжение плавает, телевизор включается не с первого раза.'],
        [9, 'ledopen', 'Выходное напряжение завышено, блок уходит в защиту.'],
        [10, 'short', 'Цыкает, выходное напряжение не поднимается.'],
        [11, 'vccshort', 'Не запускается, резистор запуска сильно греется, на VCC ШИМ почти 0 В.'],
        [11, 'outshort', 'Ключ уже меняли — новый цел, но импульсов на затворе нет, БП не стартует.']
      ] },
    { id: 'washer', name: 'Стиральная машина', icon: '🧺', desc: 'Плата, нагрев, слив, налив, привод, люк',
      parts: [['fuse', 'F1 Предохранитель платы'], ['fcap', 'C1 Гасящий X2'], ['triac', 'TR1 Симистор насоса'], ['pump', 'Сливной насос'], ['valve', 'Заливной клапан'], ['relay', 'K1 Реле ТЭНа'], ['heater', 'ТЭН'], ['ntcsensor', 'Датчик температуры'], ['ubl', 'УБЛ (замок люка)'], ['pressostat', 'Прессостат'], ['wmotor', 'Мотор']],
      faults: [
        [1, 'lost', 'Плата не включается или индикаторы моргают, реле трещат.'],
        [2, 'short', 'Насос работает постоянно, даже при наборе воды.'],
        [3, 'open', 'Не сливает воду, насос молчит, ошибка слива.'],
        [4, 'open', 'Не набирает воду, ошибка налива. Кран открыт.'],
        [5, 'coil', 'Вода не греется, реле ТЭНа не щёлкает.'],
        [6, 'open', 'Вода не греется, ошибка нагрева, реле щёлкает.'],
        [6, 'leak', 'При нагреве выбивает УЗО.'],
        [7, 'open', 'Сразу ошибка датчика температуры.'],
        [8, 'heater', 'Люк не блокируется, стирка не начинается.'],
        [9, 'stuck', 'Набирает воду без остановки и сливает (или не начинает стирку).'],
        [10, 'brush', 'Барабан не крутится, мотор не подаёт признаков жизни.'],
        [10, 'tacho', 'Барабан крутится рывками, ошибка мотора.']
      ] },
    { id: 'micro', name: 'СВЧ-печь', icon: '♨', desc: 'Сетевая и высоковольтная часть',
      parts: [['fuse', 'F1 Сетевой предохранитель'], ['tfuse', 'Термопредохранитель'], ['button', 'Концевик дверцы'], ['mot', 'ВВ трансформатор'], ['hvcap', 'ВВ конденсатор'], ['hvdiode', 'ВВ диод'], ['magnetron', 'Магнетрон']],
      faults: [
        [0, 'open', 'Не включается совсем, дисплей не светится.'],
        [1, 'open', 'Перестала включаться после долгой работы.'],
        [2, 'broken', 'Дисплей работает, но при закрытой дверце не стартует.'],
        [3, 'open', 'Крутится, светит, тихо гудит — не греет.'],
        [4, 'short', 'При старте громко гудит и выбивает предохранитель.'],
        [5, 'short', 'Громко гудит, не греет.'],
        [6, 'open', 'Всё работает, но не греет. Гул обычный.'],
        [6, 'ground', 'Гудит сильнее обычного, не греет, иногда выбивает предохранитель.']
      ] },
    { id: 'fridge', name: 'Холодильник', icon: '❄', desc: 'Пуск компрессора, защита, датчики',
      parts: [['startrelay', 'Пусковое реле'], ['compressor', 'Компрессор'], ['thermostat', 'Тепловая защита'], ['ntcsensor', 'Датчик камеры'], ['wires', 'Проводка компрессора']],
      faults: [
        [0, 'open', 'Компрессор гудит, не запускается, щёлкает защита.'],
        [1, 'open', 'Компрессор не стартует, щёлкает защита, реле исправно.'],
        [1, 'ground', 'При включении выбивает УЗО.'],
        [2, 'open', 'Компрессор не включается вообще, щелчков нет.'],
        [3, 'drift', 'Морозит слишком сильно или почти не холодит.'],
        [4, 'open', 'Компрессор молчит, на клеммы не приходит питание.']
      ] },
    { id: 'aircon', name: 'Кондиционер', icon: '🌀', desc: 'Наружный блок: пуск компрессора и вентилятора',
      parts: [['runcap', 'Конденсатор вентилятора'], ['runcap', 'Конденсатор компрессора'], ['relay', 'Реле компрессора'], ['compressor', 'Компрессор'], ['ntcsensor', 'Датчик трубки']],
      faults: [
        [0, 'lost', 'Вентилятор наружного блока не крутится, а если подтолкнуть — раскручивается.'],
        [1, 'lost', 'Компрессор гудит и отключается по защите.'],
        [2, 'burnt', 'Компрессор то включается, то нет, на реле следы нагара.'],
        [3, 'turns', 'Компрессор сильно греется, выбивает защиту через несколько минут.'],
        [4, 'open', 'Ошибка датчика, наружный блок не запускается.']
      ] }
  ];

  X.viewNodes = function () {
    var ui = U();
    ui.$app.innerHTML = ui.header('Схемы узлов', '#/') + '<main class="wrap"><p class="lead">Узел техники с одной скрытой поломкой. Читаете жалобу, прозваниваете компоненты на схеме и находите неисправный.</p><div class="list">' +
      X.nodes.map(function (n) { return '<a class="row" href="#/node/' + n.id + '"><span class="node-ic">' + n.icon + '</span><span class="row-tx"><b>' + esc(n.name) + '</b><small>' + esc(n.desc) + ' · ' + n.parts.length + ' компонентов</small></span><span class="chev">›</span></a>'; }).join('') +
      '</div></main>';
  };

  X.viewNode = function (id) {
    var ui = U(), node = X.nodes.find(function (n) { return n.id === id; });
    if (!node) return X.viewNodes();
    var fault = node.faults[Math.floor(Math.random() * node.faults.length)];
    var sel = null, answered = false, score = ui.store('nodeScore') || { right: 0, total: 0 };
    function stateFor(i) {
      var comp = ui.compById[node.parts[i][0]];
      if (i === fault[0]) return comp.states.find(function (s) { return s.id === fault[1]; });
      return MC.meter.okState(comp);
    }
    ui.$app.innerHTML = ui.header(node.name, '#/nodes') + '<main class="wrap">' +
      '<div class="score">Счёт: <b>' + score.right + '</b> из ' + score.total + '</div>' +
      '<div class="card complaint"><div class="lbl">Жалоба</div><p>' + esc(fault[2]) + '</p></div>' +
      '<div class="card"><div class="lbl">Схема узла — нажмите на компонент, чтобы прозвонить</div><div class="flow" id="flow">' +
      node.parts.map(function (p, i) { return (i ? '<span class="arrow">→</span>' : '') + '<button class="fnode" data-i="' + i + '"><span class="fn-sym">' + MC.symbol(ui.compById[p[0]].sym) + '</span>' + esc(p[1]) + '</button>'; }).join('') +
      '</div></div><div id="nodeMeter"></div><div id="nodeVerdict"></div>' +
      '<div class="row2"><button class="btn ghost" id="giveup">Показать ответ</button><button class="btn" id="newf">Новая неисправность</button></div></main>';
    var $m = document.getElementById('nodeMeter'), $v = document.getElementById('nodeVerdict');
    function reveal(guess) {
      if (answered) return; answered = true;
      var right = guess === fault[0];
      if (guess !== null) { score.total++; if (right) score.right++; ui.store('nodeScore', score); }
      var comp = ui.compById[node.parts[fault[0]][0]], st = stateFor(fault[0]);
      document.querySelectorAll('.fnode').forEach(function (b) { if (+b.dataset.i === fault[0]) b.classList.add('right'); else if (+b.dataset.i === guess) b.classList.add('wrong'); });
      $v.innerHTML = '<div class="status ' + (guess === null ? 'warn' : right ? 'good' : 'bad') + '"><b>' + (guess === null ? 'Ответ:' : right ? '✓ Верно!' : '✗ Не этот.') + ' ' + esc(node.parts[fault[0]][1]) + ' — ' + esc(st.name.toLowerCase()) + '</b><span class="why">' + esc(st.why || '') + '</span></div>' +
        '<a class="btn ghost wide" href="#/c/' + comp.id + '">Открыть справочник: ' + esc(comp.name) + '</a>';
    }
    document.getElementById('flow').addEventListener('click', function (e) {
      var b = e.target.closest('.fnode'); if (!b) return;
      sel = +b.dataset.i;
      document.querySelectorAll('.fnode').forEach(function (x) { x.classList.toggle('sel', x === b); });
      var comp = ui.compById[node.parts[sel][0]];
      $m.innerHTML = '<div class="card nm-head"><b>' + esc(node.parts[sel][1]) + '</b><span class="muted">' + esc(comp.name) + ' · состояние скрыто</span></div><div id="nmw"></div>' +
        (answered ? '' : '<button class="btn danger wide" id="isbad">🔴 Это неисправный компонент</button>');
      ui.meterWidget(document.getElementById('nmw'), comp, { state: stateFor(sel), quiz: true });
      var ib = document.getElementById('isbad'); if (ib) ib.onclick = function () { reveal(sel); };
      $m.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('giveup').onclick = function () { reveal(null); };
    document.getElementById('newf').onclick = function () { X.viewNode(id); window.scrollTo(0, 0); };
  };

  // ================= Цоколёвки =================
  function pkg(type) {
    var s = '<svg viewBox="0 0 200 130" class="pkgsvg">';
    function leg(x, y1, y2, n) { return '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" stroke="#c9ced4" stroke-width="5" stroke-linecap="round"/><text x="' + x + '" y="' + (y2 + 16) + '" class="pn">' + n + '</text>'; }
    if (type === 'to92') s += '<path d="M60 70 L60 30 A40 40 0 0 1 140 30 L140 70 Z" fill="#222"/>' + leg(75, 70, 105, 1) + leg(100, 70, 105, 2) + leg(125, 70, 105, 3);
    if (type === 'to220' || type === 'to247') { var w = type === 'to247' ? 110 : 90; s += '<rect x="' + (100 - w / 2) + '" y="2" width="' + w + '" height="26" rx="3" fill="#b9bfc6"/><circle cx="100" cy="15" r="6" fill="#6b7179"/><rect x="' + (100 - w / 2) + '" y="24" width="' + w + '" height="48" rx="3" fill="#1f1f1f"/>' + leg(70, 72, 105, 1) + leg(100, 72, 105, 2) + leg(130, 72, 105, 3); }
    if (type === 'to126') s += '<rect x="62" y="10" width="76" height="62" rx="3" fill="#1f1f1f"/><circle cx="100" cy="28" r="7" fill="#11151a"/>' + leg(76, 72, 105, 1) + leg(100, 72, 105, 2) + leg(124, 72, 105, 3);
    if (type === 'sot23') s += '<rect x="70" y="40" width="60" height="34" rx="3" fill="#1f1f1f"/>' + leg(82, 74, 98, 1) + leg(118, 74, 98, 2) + '<line x1="100" y1="40" x2="100" y2="18" stroke="#c9ced4" stroke-width="5"/><text x="100" y="12" class="pn">3</text>';
    if (type === 'sot223') s += '<rect x="76" y="6" width="48" height="18" fill="#c9ced4"/><text x="100" y="19" class="pn" style="fill:#333">4</text><rect x="60" y="24" width="80" height="48" rx="3" fill="#1f1f1f"/>' + leg(72, 72, 100, 1) + leg(100, 72, 100, 2) + leg(128, 72, 100, 3);
    if (type === 'dip8') {
      s += '<rect x="50" y="22" width="100" height="70" rx="4" fill="#1f1f1f"/><circle cx="62" cy="80" r="5" fill="#555"/><path d="M50 50 A8 8 0 0 1 50 66" fill="#11151a"/>';
      for (var i = 0; i < 4; i++) { var x = 64 + i * 24; s += leg(x, 92, 112, i + 1); s += '<line x1="' + x + '" y1="22" x2="' + x + '" y2="4" stroke="#c9ced4" stroke-width="5"/><text x="' + x + '" y="18" class="pn" style="fill:#fff">' + (8 - i) + '</text>'; }
    }
    return s + '</svg>';
  }
  X.pinouts = [
    ['to92', 'TO-92', 'Плоской стороной к себе, выводы вниз: 1 — слева.', [['BC547, BC548, BC557', 'К', 'Б', 'Э'], ['2N3904, 2N3906, PN2222', 'Э', 'Б', 'К'], ['S8050, S8550, S9014, S9015', 'Э', 'Б', 'К'], ['TL431 (управляемый стабилитрон)', 'REF', 'A', 'K'], ['78L05 (стабилизатор 0,1 А)', 'Выход', 'Общий', 'Вход'], ['MCR100 (тиристор)', 'K', 'G', 'A'], ['A3144 (датчик Холла)', 'Питание', 'Общий', 'Выход']]],
    ['to220', 'TO-220', 'Надписью к себе, выводы вниз: 1 — слева. Металлическая пластина обычно соединена со средним выводом.', [['MOSFET: IRF740, IRFZ44N, 7N60, 20N60', 'G (затвор)', 'D (сток)', 'S (исток)'], ['Биполярные: TIP41, TIP122, 13007', 'Б', 'К', 'Э'], ['7805, 7812 (стабилизаторы +)', 'Вход', 'Общий', 'Выход'], ['7905, 7912 (стабилизаторы −)', 'Общий', 'Вход', 'Выход'], ['LM317 (регулируемый)', 'ADJ', 'Выход', 'Вход'], ['BT136, BT137, BT138 (симисторы)', 'T1', 'T2', 'G'], ['BT151 (тиристор)', 'K', 'A', 'G'], ['MBR20100CT (сдвоенный Шоттки)', 'Анод 1', 'Катод', 'Анод 2']]],
    ['to247', 'TO-247', 'Крупный корпус: IGBT, мощные MOSFET и транзисторы.', [['IGBT: FGA25N120, H20R1203', 'G (затвор)', 'C (коллектор)', 'E (эмиттер)'], ['MOSFET: IRFP460, IRFP250', 'G', 'D', 'S'], ['2SC5200, 2SA1943', 'Б', 'К', 'Э']]],
    ['to126', 'TO-126', 'Надписью к себе, выводы вниз.', [['BD139, BD140', 'Э', 'К', 'Б']]],
    ['sot23', 'SOT-23', 'SMD с тремя выводами: два снизу (1, 2), один сверху (3).', [['Биполярные: BC847, MMBT2222, MMBT3904', 'Б', 'Э', 'К'], ['MOSFET: AO3400, AO3401, 2N7002', 'G', 'S', 'D']]],
    ['sot223', 'SOT-223', 'SMD с теплоотводом (4 — широкий вывод сверху).', [['AMS1117, LM1117 (4 = выход)', 'Общий/ADJ', 'Выход', 'Вход']]],
    ['dip8', 'DIP-8 / SO-8', 'Ключ (выемка или точка) слева, номера идут против часовой стрелки: 1–4 снизу, 5–8 сверху.', [['UC3842…UC3845 (ШИМ)', '1 COMP · 2 FB · 3 CS (ток) · 4 RT/CT', '5 GND · 6 OUT (на затвор)', '7 VCC · 8 VREF (5 В)'], ['VIPer22A (ШИМ с ключом)', '1, 2 SOURCE · 3 FB', '4 VDD (питание)', '5–8 DRAIN']]]
  ];
  X.viewPinouts = function () {
    var ui = U();
    ui.$app.innerHTML = ui.header('Цоколёвки', '#/') + '<main class="wrap"><p class="lead">Типичное расположение выводов. Производители иногда отличаются — при сомнении сверяйтесь с даташитом и проверяйте прозвонкой.</p>' +
      X.pinouts.map(function (p, i) {
        var dip = p[0] === 'dip8';
        var table = '<table class="rt pt"><thead><tr><th>Компонент</th>' + (dip ? '<th colspan="3">Выводы</th>' : '<th>1</th><th>2</th><th>3</th>') + '</tr></thead><tbody>' +
          p[3].map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td></tr>'; }).join('') + '</tbody></table>';
        return ui.fold(esc(p[1]), '<div class="pkgrow">' + pkg(p[0]) + '<p class="muted">' + esc(p[2]) + '</p></div>' + table, i === 0);
      }).join('') + '</main>';
  };

  // ================= Аналоги и замена =================
  X.analogs = [
    ['Диоды', 'Не ниже по обратному напряжению и току. Быстрый (UF, FR, HER) можно ставить вместо обычного, но не наоборот. Шоттки — только на Шоттки (или с проверкой напряжения).',
      [['1N4007', '1N4004…1N4006 (по напряжению — только вверх), M7 (SMD)', '1 А 1000 В'], ['UF4007', 'FR107, HER108', 'Быстрый 1 А 1000 В'], ['1N5408', '1N5406 (меньше напряжение), 6A10 (больше ток)', '3 А 1000 В'], ['1N5819', 'SS14 (SMD)', 'Шоттки 1 А 40 В'], ['1N5822', 'SS34 (SMD)', 'Шоттки 3 А 40 В']]],
    ['Биполярные транзисторы', 'Тот же тип (NPN/PNP), напряжение К–Э и ток не ниже, коэффициент усиления близкий. ВНИМАНИЕ: у аналогов часто другая цоколёвка!',
      [['BC547', 'BC546 (65 В), BC548 (30 В), 2N3904 — цоколёвка Э-Б-К!', 'NPN 45 В 0,1 А'], ['BC557', 'BC556, BC558, 2N3906 — цоколёвка Э-Б-К!', 'PNP 45 В 0,1 А'], ['PN2222A', 'MMBT2222A (SMD, SOT-23)', 'NPN 40 В 0,6 А'], ['BD139 / BD140', 'BD137 / BD138 (меньше напряжение)', 'NPN / PNP 80 В 1,5 А']]],
    ['MOSFET', 'Тот же канал (N/P). Напряжение сток–исток не ниже, ток не ниже, сопротивление открытого канала Rds(on) не выше, заряд затвора Qg близкий (иначе ключ греется). Корпус и цоколёвка — как у оригинала.',
      [['IRFZ44N', 'IRF3205 (больше ток)', 'N 55 В'], ['7N60', 'FQP7N60, STP7NK60', 'N 600 В 7 А']]],
    ['IGBT (индукционные плиты)', 'Напряжение не ниже (1200–1350 В), ток не ниже, обязательно с обратным диодом, если он был. Проверьте драйвер и мост — они часто горят вместе.',
      [['FGA25N120ANTD', 'H20R1203 (часто ставят в плиты)', '1200 В, с диодом']]],
    ['Стабилизаторы', 'Напряжение — то же, ток — не меньше. Корпус и цоколёвка у 78xx одинаковые, у отрицательных 79xx — другая.',
      [['7805', 'L7805, LM7805, KA7805, MC7805; 78M05 — 0,5 А; 78L05 — 0,1 А', '5 В 1,5 А'], ['AMS1117-3.3', 'LM1117-3.3, LD1117-3.3', '3,3 В 0,8–1 А']]],
    ['TL431 и оптопары', 'Прямые аналоги взаимозаменяемы. TL432 — та же схема, но цоколёвка зеркальная!',
      [['TL431', 'KA431, AZ431, LM431', 'Опора 2,5 В'], ['PC817', 'EL817, LTV-817, FOD817', 'Транзисторная оптопара']]],
    ['Симисторы', 'Напряжение не ниже 600 В, ток не ниже. BTA — изолированный корпус, BTB — корпус соединён с T2 (важно, если стоит на общем радиаторе).',
      [['BT136-600', 'BTA06-600, BTB06-600', '4–6 А 600 В'], ['BT137-600', 'BTA08-600', '8 А 600 В'], ['BT138-600', 'BTA12-600, BTB12-600', '12 А 600 В']]],
    ['ШИМ-контроллеры', 'Часто «почти аналоги» с разными порогами — проверяйте!',
      [['UC3842', 'UC3843 — запуск от 8,4 В вместо 16 В (не всегда подходит)', 'Скважность до ~100%'], ['UC3844', 'UC3845 — запуск от 8,4 В', 'Скважность до 50%']]],
    ['Конденсаторы', 'Ёмкость — та же (±20%), напряжение — такое же или выше. В импульсных БП — только Low-ESR 105 °C. Пусковые и X2 — ровно такая же ёмкость и не ниже по напряжению.',
      []]
  ];
  X.viewAnalogs = function () {
    var ui = U();
    ui.$app.innerHTML = ui.header('Аналоги и замена', '#/') + '<main class="wrap"><p class="lead">Чем можно заменить и на что смотреть при подборе. Параметры аналога всегда сверяйте с даташитом.</p>' +
      X.analogs.map(function (a, i) {
        var body = '<p class="rule">✔ ' + esc(a[1]) + '</p>' + (a[2].length ? '<table class="rt pt"><thead><tr><th>Оригинал</th><th>Замена</th><th>Параметры</th></tr></thead><tbody>' + a[2].map(function (r) { return '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td class="muted">' + esc(r[2]) + '</td></tr>'; }).join('') + '</tbody></table>' : '');
        return ui.fold(esc(a[0]), body, i === 0);
      }).join('') + '</main>';
  };

  // ================= Калькуляторы =================
  function num(id) { var v = document.getElementById(id).value.replace(',', '.'); return v === '' ? NaN : parseFloat(v); }
  function f(v, d) { if (!isFinite(v)) return '—'; return parseFloat(v.toPrecision(d || 4)).toString().replace('.', ','); }
  function inp(id, label, unit, ph) { return '<label class="fld"><span>' + label + '</span><input id="' + id + '" inputmode="decimal" placeholder="' + (ph || '') + '"><em>' + unit + '</em></label>'; }
  X.viewCalcs = function () {
    var ui = U(), T = MC.tools;
    ui.$app.innerHTML = ui.header('Калькуляторы', '#/') + '<main class="wrap">' +
      ui.fold('⚡ Закон Ома и мощность', '<p class="muted">Введите любые два значения.</p>' + inp('oU', 'Напряжение', 'В') + inp('oI', 'Ток', 'А') + inp('oR', 'Сопротивление', 'Ом') + '<div class="cres" id="oRes"></div>', true) +
      ui.fold('♨ ТЭН: мощность ↔ сопротивление', inp('hU', 'Напряжение сети', 'В', '230') + inp('hP', 'Мощность', 'Вт', '2000') + inp('hR', 'или сопротивление (замер)', 'Ом') + '<div class="cres" id="hRes"></div>', false) +
      ui.fold('💡 Резистор для светодиода', inp('lU', 'Напряжение питания', 'В', '12') + inp('lV', 'Падение на светодиоде', 'В', '2') + inp('lN', 'Светодиодов последовательно', 'шт', '1') + inp('lI', 'Ток', 'мА', '20') + '<div class="cres" id="lRes"></div>', false) +
      ui.fold('🔋 Гасящий конденсатор (бестрансформаторное питание)', inp('cC', 'Ёмкость', 'мкФ', '0.47') + inp('cU', 'Напряжение сети', 'В', '230') + '<div class="cres" id="cRes"></div><p class="muted">Ток через конденсатор I = 2π·f·C·U (f = 50 Гц). Если конденсатор потерял ёмкость — ток падает, и плате не хватает питания.</p>', false) +
      ui.fold('🔗 Резисторы последовательно / параллельно', inp('r1', 'R1', 'Ом', '1000') + inp('r2', 'R2', 'Ом', '1000') + inp('r3', 'R3 (необязательно)', 'Ом') + '<div class="cres" id="rRes"></div>', false) +
      ui.fold('➗ Делитель напряжения', inp('dU', 'Входное напряжение', 'В', '12') + inp('dR1', 'R1 (верхний)', 'Ом', '10000') + inp('dR2', 'R2 (нижний)', 'Ом', '4700') + '<div class="cres" id="dRes"></div>', false) +
      '</main>';
    function calc() {
      var U1 = num('oU'), I1 = num('oI'), R1 = num('oR'), out = '';
      if (isFinite(U1) && isFinite(I1)) { R1 = U1 / I1; out = 'R = <b>' + f(R1) + ' Ом</b>'; }
      else if (isFinite(U1) && isFinite(R1)) { I1 = U1 / R1; out = 'I = <b>' + f(I1) + ' А</b>'; }
      else if (isFinite(I1) && isFinite(R1)) { U1 = I1 * R1; out = 'U = <b>' + f(U1) + ' В</b>'; }
      if (out) out += ' · P = <b>' + f(U1 * I1) + ' Вт</b>';
      document.getElementById('oRes').innerHTML = out || 'Введите два значения';

      var hu = num('hU'); if (!isFinite(hu)) hu = 230;
      var hp = num('hP'), hr = num('hR'), h = '';
      if (isFinite(hr)) h = 'Мощность: <b>' + f(hu * hu / hr) + ' Вт</b> · ток <b>' + f(hu / hr, 3) + ' А</b>';
      else { if (!isFinite(hp)) hp = 2000; h = 'Сопротивление исправного: <b>' + f(hu * hu / hp, 3) + ' Ом</b> · ток <b>' + f(hp / hu, 3) + ' А</b>'; }
      document.getElementById('hRes').innerHTML = h;

      var lu = num('lU'), lv = num('lV'), ln = num('lN'), li = num('lI');
      if (!isFinite(lu)) lu = 12; if (!isFinite(lv)) lv = 2; if (!isFinite(ln)) ln = 1; if (!isFinite(li)) li = 20;
      var drop = lu - lv * ln;
      document.getElementById('lRes').innerHTML = drop <= 0 ? 'Напряжения питания не хватает для такого числа светодиодов' :
        'R = <b>' + f(drop / (li / 1000), 3) + ' Ом</b> · мощность резистора <b>' + f(drop * li / 1000, 2) + ' Вт</b> (берите с запасом ×2)';

      var cc = num('cC'), cu = num('cU'); if (!isFinite(cc)) cc = 0.47; if (!isFinite(cu)) cu = 230;
      var ci = 2 * Math.PI * 50 * cc * 1e-6 * cu;
      document.getElementById('cRes').innerHTML = 'Ток: <b>' + f(ci * 1000, 3) + ' мА</b> · сопротивление Xc = <b>' + f(1 / (2 * Math.PI * 50 * cc * 1e-6), 3) + ' Ом</b>';

      var rs = [num('r1'), num('r2'), num('r3')].filter(isFinite);
      if (rs.length < 2) rs = [1000, 1000];
      var ser = rs.reduce(function (a, b) { return a + b; }, 0), par = 1 / rs.reduce(function (a, b) { return a + 1 / b; }, 0);
      document.getElementById('rRes').innerHTML = 'Последовательно: <b>' + T.fmtOhm(ser) + '</b> · параллельно: <b>' + T.fmtOhm(par) + '</b>';

      var du = num('dU'), d1 = num('dR1'), d2 = num('dR2');
      if (!isFinite(du)) du = 12; if (!isFinite(d1)) d1 = 10000; if (!isFinite(d2)) d2 = 4700;
      document.getElementById('dRes').innerHTML = 'Выход: <b>' + f(du * d2 / (d1 + d2), 3) + ' В</b>';
    }
    ui.$app.querySelector('main').addEventListener('input', calc);
    calc();
  };

  // ================= Таблицы NTC =================
  X.viewNtc = function () {
    var ui = U();
    ui.$app.innerHTML = ui.header('Датчики NTC', '#/') + '<main class="wrap">' +
      '<p class="lead">Сопротивление термистора при разных температурах. Расчёт по коэффициенту B — значения ориентировочные (±5–10%), точные таблицы — в сервис-мануале.</p>' +
      '<div class="card"><div class="lbl">Параметры датчика</div><div class="seg" id="ntcR">' + [5, 10, 12, 20, 50, 100].map(function (r, i) { return '<button data-r="' + r + '" class="' + (r === 10 ? 'on' : '') + '">' + r + 'k</button>'; }).join('') + '</div>' +
      '<div class="seg" id="ntcB" style="margin-top:8px">' + [3435, 3950, 4100].map(function (b) { return '<button data-b="' + b + '" class="' + (b === 3950 ? 'on' : '') + '">B ' + b + '</button>'; }).join('') + '</div>' +
      '<p class="muted">Номинал — сопротивление при 25 °C. B 3950 — самый распространённый, B 3435 часто у кондиционеров и холодильников.</p></div>' +
      '<div class="card"><div class="lbl">Перевести замер в температуру</div><label class="fld"><span>Намерил</span><input id="ntcM" inputmode="decimal" placeholder="например 6.5"><em>кОм</em></label><div class="cres" id="ntcT"></div></div>' +
      '<div class="card"><div class="lbl">Таблица</div><div id="ntcTab"></div></div></main>';
    var R25 = 10, B = 3950;
    function rAt(t) { return R25 * 1000 * Math.exp(B * (1 / (t + 273.15) - 1 / 298.15)); }
    function draw() {
      var rows = '';
      for (var t = -30; t <= 120; t += 10) rows += '<tr' + (t === 20 || t === 30 ? '' : '') + '><td>' + t + ' °C</td><td class="v">' + MC.tools.fmtOhm(rAt(t)) + '</td></tr>';
      rows = rows.replace('<tr><td>20 °C', '<tr class="hl"><td>20 °C');
      document.getElementById('ntcTab').innerHTML = '<table class="rt"><tbody><tr class="hl"><td>25 °C (номинал)</td><td class="v">' + MC.tools.fmtOhm(R25 * 1000) + '</td></tr>' + rows + '</tbody></table>';
      var m = parseFloat((document.getElementById('ntcM').value || '').replace(',', '.'));
      document.getElementById('ntcT').innerHTML = m > 0 ? 'Температура ≈ <b>' + (1 / (Math.log(m / R25) / B + 1 / 298.15) - 273.15).toFixed(1).replace('.', ',') + ' °C</b>' : '';
    }
    ui.$app.querySelector('main').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.r) { R25 = +b.dataset.r; document.querySelectorAll('#ntcR button').forEach(function (x) { x.classList.toggle('on', x === b); }); }
      if (b.dataset.b) { B = +b.dataset.b; document.querySelectorAll('#ntcB button').forEach(function (x) { x.classList.toggle('on', x === b); }); }
      draw();
    });
    document.getElementById('ntcM').addEventListener('input', draw);
    draw();
  };

  // ================= Проверка под напряжением =================
  X.voltage = [
    ['⚠ Безопасность', null, '<ul class="steps"><li>Работайте одной рукой, второй не касайтесь заземлённых предметов.</li><li>Горячая часть импульсного БП (до ТПИ) находится под сетевым потенциалом — общий провод мультиметра ставьте на «горячий» минус только для замеров в горячей части.</li><li>Лучше всего — разделительный трансформатор и лампа на 60–100 Вт последовательно с устройством вместо предохранителя.</li><li>В микроволновке высокое напряжение (около 2 кВ) мультиметром НЕ меряется — только на отключенной печи с разряженным конденсатором.</li><li>После выключения сетевой конденсатор держит до 300+ В — разряжайте.</li></ul>'],
    ['🔌 Импульсный БП (ТВ, мониторы)', [['Сетевой конденсатор (после моста)', '≈ 1,41 × U сети: 300–325 В пост.', 'Нет — предохранитель, NTC, мост, сетевой фильтр'], ['Питание ШИМ (VCC)', '12–20 В (UC3842: запуск ~16 В, отключение ~10 В)', 'Нет или «пила» — резистор запуска, конденсатор VCC, диод питания, ШИМ'], ['Дежурное питание', '3,3–5,3 В', 'Нет — дежурный БП, его ТПИ, Шоттки, оптопара'], ['Основные выходы', '12 В / 24 В ±5% (по маркировке на плате)', 'Цыкает — КЗ на выходе (Шоттки, кондёры), нет команды включения'], ['TL431 вывод REF', '≈ 2,50 В', 'Сильно отличается — обратная связь, делитель, TL431']]],
    ['🖥 Компьютерный БП ATX', [['Фиолетовый (+5VSB, дежурка)', '5 В всегда при включённой сети', 'Нет — дежурный БП'], ['Зелёный (PS_ON)', '3–5 В в дежурке; замыкание на чёрный — запуск', '—'], ['Серый (PWR_OK)', '≈ 5 В через доли секунды после запуска', 'Нет — БП считает напряжения плохими'], ['Оранжевый / Красный / Жёлтый', '+3,3 / +5 / +12 В ±5%', 'Просадка под нагрузкой — высохшие кондёры, плохая ГС'], ['Синий', '−12 В', '—']]],
    ['🧺 Плата стиральной машины', [['Питание логики', '5 В (иногда 3,3 В)', 'Нет — БП платы, гасящий X2, стабилизатор'], ['Питание реле', '12 В', 'Нет — БП платы'], ['На клапане при наборе', '≈ 220 В~', 'Нет при команде — симистор, проводка; есть, а не льёт — клапан'], ['На насосе при сливе', '≈ 220 В~', 'Нет — симистор, проводка'], ['На ТЭНе при нагреве', '≈ 220 В~', 'Нет — реле ТЭНа, датчик NTC (плата не даёт нагрев)'], ['Тахогенератор при вращении', 'Переменное, растёт с оборотами', 'Нет при вращении — обрыв тахо, проводка']]],
    ['♨ СВЧ-печь', [['На первичке ВВ трансформатора', '≈ 220 В~ при работе', 'Нет — концевики, реле на плате, термопредохранитель'], ['Высоковольтная часть', 'НЕ МЕРИТЬ (≈ 2 кВ)', 'Проверка только без питания: ВВ диод, конденсатор, магнетрон']]],
    ['❄ Холодильник / кондиционер', [['На клеммах компрессора', '≈ 220 В~ при запросе холода', 'Нет — термостат, плата, реле, проводка; есть, а не стартует — пусковое реле, конденсатор, компрессор'], ['Датчики NTC', 'Сопротивление по таблице при текущей температуре', 'Сильно отличается — менять датчик']]],
    ['🔧 Стабилизаторы и опорные', [['7805 выход', '4,8–5,2 В', 'Нет при наличии входа — стабилизатор или КЗ нагрузки'], ['AMS1117-3.3 выход', '3,23–3,37 В', '—'], ['TL431 REF', '2,495 В', '—'], ['UC384x VREF (вывод 8)', '5,0 В', 'Нет — ШИМ не запущен или неисправен']]]
  ];
  X.viewVoltage = function () {
    var ui = U();
    ui.$app.innerHTML = ui.header('Под напряжением', '#/') + '<main class="wrap"><p class="lead">Что должен показывать вольтметр в типичных точках и что проверять, если значение не то.</p>' +
      X.voltage.map(function (v, i) {
        var body = v[1] ? '<table class="rt pt"><thead><tr><th>Точка</th><th>Норма</th><th>Если нет</th></tr></thead><tbody>' + v[1].map(function (r) { return '<tr><td><b>' + esc(r[0]) + '</b></td><td class="g2">' + esc(r[1]) + '</td><td class="muted">' + esc(r[2]) + '</td></tr>'; }).join('') + '</tbody></table>' : v[2];
        return ui.fold(esc(v[0]), body, i === 0);
      }).join('') + '</main>';
  };
})();
