/* Анимация тока на экране мультиметра.
   Для каждого компонента — маленькая живая схема: источник, компонент, нагрузка (лампа),
   по проводам бегут точки тока. Поведение зависит от состояния (исправен / вид поломки). */
(function () {
  window.MC = window.MC || {};

  // ---------- Тип анимации для каждого компонента ----------
  var KIND = {
    resistor: 'res', pot: 'res', choke: 'res', speaker: 'speaker',
    ntc: 'ntc', ntcsensor: 'ntc', ptc: 'ptc', startrelay: 'ptc',
    fuse: 'fuse', tfuse: 'tfuse', heater: 'heater', valve: 'valve',
    pump: 'motor', wmotor: 'motor', compressor: 'motor',
    ecap: 'cap', ccap: 'cap', fcap: 'cap', runcap: 'cap', hvcap: 'cap',
    diode: 'diode', schottky: 'diode', zener: 'diode', hvdiode: 'diode', led: 'led',
    bridge: 'bridge',
    npn: 'switch', pnp: 'switch', mosfet: 'switch', igbt: 'switch', triac: 'switch', scr: 'switch', opto: 'switch',
    relay: 'switch', button: 'switch', ubl: 'switch', pressostat: 'switch', hall: 'switch', thermostat: 'thermosw',
    tpi: 'xfmr', mains: 'xfmr', mot: 'xfmr',
    varistor: 'varistor', reg78: 'reg', tl431: 'reg',
    quartz: 'osc', magnetron: 'magnetron', wires: 'wires',
    zener_smd: 'diode', pwm_uc: 'pwm', pwm_sw: 'pwm', pwm_ncp: 'pwm',
    opto_triac: 'switch', opto_fast: 'switch', opto_drv: 'switch',
    li18650: 'batt', liphone: 'batt', pack: 'batt', bms: 'batt', usbc: 'res', led_bl: 'led', bl_strip: 'strip',
    dualmos: 'switch', fan: 'motor', ddmotor: 'motor', indcoil: 'heater'
  };
  // Подпись управляющего воздействия для ключей
  var CTRL = {
    npn: 'Подать ток на базу', pnp: 'Подать ток на базу', mosfet: 'Напряжение на затвор', igbt: 'Напряжение на затвор',
    triac: 'Импульс на управляющий', scr: 'Импульс на управляющий', opto: 'Включить светодиод оптопары',
    relay: 'Подать 12 В на катушку', button: 'Нажать кнопку', ubl: 'Подать 220 В на УБЛ', pressostat: 'Подуть (давление воды)', hall: 'Поднести магнит',
    opto_triac: 'Включить светодиод оптопары', opto_fast: 'Подать сигнал на светодиод', opto_drv: 'Подать сигнал на светодиод',
    dualmos: 'Напряжение на затвор G1'
  };

  // ---------- Поведение по состоянию ----------
  var OVERRIDE = {
    thermostat: { stuck: 'always', open: 'open' },
    pressostat: { stuck: 'never', membrane: 'never', burnt: 'jitter' },
    relay: { welded: 'always', coil: 'never', burnt: 'jitter' },
    button: { stuck: 'always', oxid: 'jitter', broken: 'never' },
    ubl: { heater: 'never', contact: 'never' },
    opto: { ledopen: 'never', trshort: 'always', weak: 'weak' },
    opto_triac: { ledopen: 'never', triacshort: 'always', weak: 'weak' },
    opto_fast: { ledopen: 'never', outshort: 'never', vccshort: 'never', weak: 'weak' },
    opto_drv: { ledopen: 'never', outshort: 'never', vccshort: 'never', weak: 'weak' },
    pwm_uc: { dead: 'nogo', vccshort: 'vccshort', outshort: 'outshort', csopen: 'hiccup' },
    pwm_sw: { dead: 'nogo', dsshort: 'dsshort', vddshort: 'vccshort', fbopen: 'hiccup' },
    pwm_ncp: { dead: 'nogo', hvshort: 'hvshort', vccshort: 'vccshort', drvshort: 'outshort' },
    npn: { shortce: 'always', shortbe: 'gateshort', openbe: 'never' },
    pnp: { shortce: 'always', opencb: 'never' },
    mosfet: { short: 'always', gate: 'gateshort', noopen: 'never' },
    igbt: { short: 'always', gate: 'gateshort' },
    triac: { short: 'always', gate: 'never' },
    scr: { short: 'always', gate: 'never' },
    hall: { short: 'never', outshort: 'never' },
    resistor: { burnt: 'low' },
    wmotor: { brush: 'open', tacho: 'jerky', ground: 'leak', rotor: 'hot' },
    compressor: { ground: 'leak' },
    reg78: { shortin: 'inshort', shortio: 'passthru' },
    tl431: { short: 'inshort', open: 'passthru' },
    hvcap: { ground: 'leak' },
    magnetron: { ground: 'leak' },
    mot: { ground: 'leak' },
    led: { weak: 'weak' },
    li18650: { deep: 'nogo', dead: 'short', worn: 'weak' },
    liphone: { prot: 'nogo', ntc: 'ntcopen', worn: 'weak', swollen: 'mech' },
    pack: { imbalance: 'weak', cell: 'cellshort', deep: 'nogo', strip: 'open' },
    bms: { od: 'nogo', fetopen: 'open', oc: 'trip', fetshort: 'always' },
    usbc: { vbusshort: 'short', ccopen: 'open', dshort: 'drift', vbusopen: 'nogo' },
    led_bl: { weak: 'weak' },
    dualmos: { short1: 'always', short2: 'always', gate1: 'gateshort', noopen1: 'never' },
    fan: { stuck: 'jam', short: 'short' },
    ddmotor: { turns: 'hot', ground: 'leak', hall: 'jerky', nopower: 'jerky' },
    indcoil: { turns: 'hot', strands: 'hot' }
  };
  // Свои пояснения для отдельных компонентов (вместо общих по типу анимации)
  var CMSG = {
    li18650: { ok: 'Подключите нагрузку: банка отдаёт ток, лампа горит ярко, напряжение почти не проседает.', nogo: 'Глубокий разряд: энергии нет — лампа не горит.', short: 'Внутреннее КЗ: банка разряжается сама в себя и греется, на выходе 0.', weak: 'Износ: под нагрузкой напряжение проседает — лампа тусклая.' },
    liphone: { ok: 'Аккумулятор отдаёт ток в телефон — всё работает.', nogo: 'Сработала защита: плата отключила выход — тока нет.', ntcopen: 'Ток отдаёт, но телефон не видит температуру и не заряжает аккумулятор.', weak: 'Износ: под нагрузкой проседает — телефон выключается раньше времени.', mech: 'Вздутие: электрически работает, но это опасно.' },
    pack: { ok: 'Три банки последовательно складывают напряжение — инструмент крутит.', weak: 'Разбаланс: слабая банка садится первой, BMS отключает всю сборку раньше времени.', cellshort: 'Мёртвая банка: сборка выдаёт на 4 В меньше — инструмент слабый.', nogo: 'Глубокий разряд: все банки пустые, тока нет.', open: 'Оборвана перемычка: цепь разорвана — тока нет.' },
    bms: { ok: 'Ключи открыты — ток идёт из банки в нагрузку. Плата следит за напряжением и током.', nogo: 'Переразряд: ключ разряда закрыт, тока в нагрузку нет. Зарядка снимет защиту.', open: 'Ключ в обрыве: банка заряжена, а ток не идёт.', trip: 'Сработала защита от КЗ: ключи закрыты до подключения зарядки.', always: 'Пробой ключа: ток идёт всегда — защита не сработает при КЗ или переразряде!' },
    usbc: { ok: 'Зарядка видит резистор 5,1 кОм на CC и подаёт 5 В — ток идёт в устройство.', open: 'Нет резистора на CC: зарядка USB-C не видит устройство и не подаёт 5 В.', short: 'КЗ VBUS–GND: ток идёт мимо устройства, зарядка уходит в защиту.', drift: 'D+ и D− замкнуты: заряжает, но медленно — быстрая зарядка не согласуется.', nogo: 'Контакт VBUS отгорел: питание в устройство не приходит.' },
    strip: {},
    fan: { ok: 'Ток через обмотки — крыльчатка крутится, на TACH идут импульсы.', jam: 'Не крутится: ротор стоит, импульсов на TACH нет — плата видит 0 об/мин.', short: 'КЗ драйвера: ток большой, кулер стоит, порт на плате уходит в защиту.', mech: 'Электрически исправен — шумит подшипник.' },
    ddmotor: { ok: 'Инвертор по сигналам датчика Холла по очереди включает фазы — барабан крутится.', hot: 'Межвитковое в катушке: ток больше, мотор дёргается, инвертор греется.', open: 'Обрыв фазы: вращающееся поле не создаётся — барабан стоит.', leak: 'Пробой на корпус: ток уходит на корпус — выбивает УЗО.', jerky: 'Нет сигналов датчика Холла: инвертор не знает положение ротора — барабан дёргается.' },
    indcoil: { ok: 'Переменный ток 20–50 кГц в катушке наводит вихревые токи в дне посуды — посуда греется.', open: 'Обрыв: тока в катушке нет — плита не видит посуду.', hot: 'Ток больше нормы, катушка и клемма греются, IGBT перегружаются.', leak: 'Утечка на основание: часть тока уходит на корпус — опасно.' }
  };
  var DEF = { ok: 'ok', open: 'open', short: 'short', leak: 'leak', dry: 'dry', lost: 'dry', drift: 'drift', turns: 'hot', crack: 'jitter', bad: 'jitter', wiper: 'jitter', oxid: 'jitter', weak: 'weak', mech: 'mech', dead: 'nogo', jam: 'jam', ground: 'leak', insul: 'insul' };
  function behavior(comp, state) {
    var o = OVERRIDE[comp.id] || {};
    return o[state.id] || DEF[state.id] || (state.ok ? 'ok' : 'open');
  }

  // ---------- Тексты ----------
  function msgFor(kind, b, sim) {
    var M = {
      res: { ok: 'Ток течёт, резистор его ограничивает — лампа горит ровно.', open: 'Обрыв: цепь разорвана, ток не течёт, лампа не горит.', drift: 'Сопротивление выросло — ток меньше, лампа тусклая.', low: 'Сопротивление упало — ток больше нормы, лампа ярче, детали греются.', hot: 'Межвитковое: витки закорочены, ток больше, дроссель греется.', jitter: 'Плохой контакт: ток то есть, то нет — лампа мигает.', short: 'Пробой: сопротивления нет — ток не ограничен, КЗ!' },
      speaker: { ok: 'Переменный ток гоняет катушку — диффузор колеблется, звук есть.', open: 'Обрыв катушки: тока нет, диффузор стоит, звука нет.', mech: 'Ток идёт, диффузор колеблется, но катушка трётся — хрип (электрически норма).', short: 'КЗ катушки: ток большой, звука нет.' },
      heater: { ok: 'Ток проходит через спираль — ТЭН греется.', open: 'Обрыв спирали: тока нет, вода не греется.', leak: 'Утечка: часть тока уходит на корпус (на землю) — выбивает УЗО, может бить током.' },
      valve: { ok: 'Ток через катушку — магнит открывает клапан, вода идёт.', open: 'Обрыв катушки: тока нет, клапан закрыт.', hot: 'Межвитковое: ток больше, катушка греется, клапан открывается через раз.' },
      motor: { ok: 'Ток через обмотки — мотор крутится.', open: 'Обрыв: тока нет, мотор стоит.', jam: 'Заклинило: ток большой, но ротор не крутится — обмотки греются, сработает защита.', hot: 'Межвитковое: ток больше нормы, мотор греется и слабо тянет.', leak: 'Пробой на корпус: часть тока уходит на корпус — выбивает УЗО, опасно!', jerky: 'Нет сигнала тахогенератора: плата не видит обороты — мотор дёргается рывками.', mech: 'Электрически исправен.' },
      ntc: { ok: 'Нагрейте ползунком: сопротивление NTC падает — ток растёт.', open: 'Обрыв: тока нет при любой температуре (плата видит «−40 °C»).', short: 'КЗ: ток максимальный всегда (плата видит «перегрев»).', drift: 'Уплыл номинал: при той же температуре ток другой — плата ошибается в температуре.', jitter: 'Трещина: ток скачет.' },
      ptc: { ok: 'Холодный позистор пропускает ток. Нагрейте — сопротивление резко растёт, ток почти исчезает.', open: 'Обрыв: тока нет даже в холодном состоянии.', jitter: 'Трещина: ток скачет.' },
      fuse: { ok: 'Увеличивайте нагрузку: при превышении тока нить перегорает и защищает схему.', open: 'Предохранитель сгорел — тока нет. Ищите причину перегрузки!' },
      tfuse: { ok: 'Нагревайте: при достижении температуры срабатывания он разомкнётся навсегда.', open: 'Сработал — цепь разорвана навсегда. Был перегрев.' },
      cap: { ok: 'Нажмите «Зарядить»: сначала большой ток, потом он затухает — конденсатор зарядился и держит заряд.', dry: 'Высох: заряжается мгновенно, но ёмкости почти нет — держит мало заряда.', leak: 'Утечка: ток не прекращается, заряд утекает даже после отключения.', short: 'Пробой: конденсатор — как перемычка, ток течёт постоянно, заряда нет.', open: 'Обрыв: ток не идёт, заряда нет.' },
      diode: { ok: 'Переменный ток: в прямую сторону диод пропускает, в обратную — запирает. Ток идёт только «вперёд».', short: 'Пробой: ток идёт в обе стороны — диод перестал выпрямлять.', open: 'Обрыв: тока нет ни в одну сторону.', leak: 'Утечка: в обратную сторону тоже просачивается ток.' },
      led: { ok: 'В прямую сторону ток проходит — светодиод светится. В обратную — заперт.', short: 'Пробой: ток идёт, но кристалл не светится.', open: 'Обрыв: тока нет, не светится.', weak: 'Деградация: ток идёт, а светит еле-еле.' },
      bridge: { ok: 'На входе ток меняет направление, а через нагрузку всегда течёт в одну сторону — мост выпрямляет.', short: 'Пробой плеча: в один полупериод вход замкнут накоротко — выбивает предохранитель.', open: 'Обрыв плеча: выпрямляется только половина — лампа мигает, пульсации.' },
      switch: { ok: 'Нажмите кнопку управления: ключ открывается и пропускает ток в нагрузку.', always: 'Пробой: ключ замкнут всегда — нагрузка работает без команды.', never: 'Не открывается: команда есть, а ток в нагрузку не идёт.', gateshort: 'Пробой управления: сигнал управления уходит в КЗ — ключ не открывается.', jitter: 'Плохой контакт: при включении ток прерывается — нагрузка моргает.', weak: 'Слабо открывается: ток в нагрузку маленький.' },
      thermosw: { ok: 'Холодный термостат замкнут — ток идёт. Нагрейте выше порога — он размыкается, остыл — снова замкнулся.', always: 'Залип: при нагреве не размыкается — перегрев!', open: 'Обрыв: цепь разорвана даже холодным.' },
      xfmr: { ok: 'Переменный ток в первичной обмотке наводит ток во вторичной — лампа горит.', open: 'Обрыв: в первичной тока нет — на выходе ничего.', hot: 'Межвитковое: в первичной ток большой, сердечник греется, на выходе мало.', insul: 'Пробой изоляции: ток из сети попадает прямо на выход — ОПАСНО!', leak: 'Пробой на корпус: ток уходит на корпус — выбивает защиту.' },
      varistor: { ok: 'При нормальном напряжении варистор не проводит. Нажмите «Скачок» — он открывается и забирает импульс на себя.', short: 'Пробой: варистор проводит всегда — КЗ сети, предохранитель сгорел.' },
      reg: { ok: 'Вход 12 В — на выходе стабильные 5 В.', inshort: 'Пробой вход–общий: КЗ по входу, на выходе 0.', passthru: 'Пробой вход–выход: на выход проходит всё входное напряжение — сгорит логика!', open: 'Обрыв: на выходе ничего.', never: 'Нет выходного сигнала.' },
      pwm: { ok: 'ШИМ работает: на затвор ключа идут прямоугольные импульсы, блок питания выдаёт напряжение.', nogo: 'Импульсов нет: генератор внутри микросхемы не работает, БП мёртвый при наличии питания.', vccshort: 'Пробой по питанию: напряжение на VCC не поднимается, микросхема не стартует.', outshort: 'Выход замкнут: импульсы на затвор ключа не проходят.', dsshort: 'Встроенный ключ пробит: КЗ, горит предохранитель или входной резистор.', hvshort: 'Пробит вход пуска HV: микросхема не стартует от сети.', hiccup: 'Нет управления: ШИМ запускается и сразу уходит в защиту — «цыкает» пачками импульсов.' },
      osc: { ok: 'Кварц генерирует стабильную частоту — микроконтроллер тактируется.', short: 'Пробой: генерации нет — микроконтроллер стоит.', nogo: 'Не генерирует: колебаний нет, плата «мёртвая» при наличии питания.' },
      magnetron: { ok: 'Накал горит, магнетрон излучает СВЧ — еда греется.', open: 'Обрыв накала: катод холодный, излучения нет — не греет.', leak: 'Пробой на корпус: ток уходит на корпус, искрит — не греет.', weak: 'Потеря эмиссии: излучение слабое — греет плохо.' },
      strip: { ok: 'Тестер гонит ток 20 мА через все светодиоды последовательно — светятся ровно.', open: 'Обрыв одного светодиода: цепь разорвана — не светит вся линейка.', short: 'Пробой одного: он тёмный, ток идёт мимо него, остальные светят ярче и перегреваются.', weak: 'Деградация: один светодиод светит синим и тускло.' },
      wires: { ok: 'Ток идёт по жиле 1 к нагрузке и возвращается по жиле 2.', open: 'Обрыв жилы: цепь разорвана, нагрузка не работает.', short: 'Замыкание жил: ток идёт напрямую между жилами мимо нагрузки — КЗ!', jitter: 'Плохой контакт: ток прерывается — нагрузка мигает.' }
    };
    var t = (M[kind] || {})[b];
    if (!t && b === 'ok') t = 'Компонент исправен — ток течёт как положено.';
    if (!t) t = b === 'open' || b === 'never' ? 'Ток не проходит.' : b === 'short' || b === 'always' ? 'Ток проходит всегда — пробой.' : 'Поведение отличается от нормы.';
    return t;
  }

  // ---------- Построение SVG ----------
  var W = 330, H = 150;
  var LOOP = 'M30 75 L30 25 L300 25 L300 125 L30 125 Z';
  function compBox(sym, x, y, w, h) {
    return '<g class="an-comp"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" class="an-cbg"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" class="an-heat" data-heat/>' +
      '<svg x="' + (x + 6) + '" y="' + (y + 4) + '" width="' + (w - 12) + '" height="' + (h - 8) + '" viewBox="0 0 160 80" class="an-sym">' + MC.symbol(sym).replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</svg></g>';
  }
  function lamp(x, y) {
    return '<g class="an-lamp"><circle cx="' + x + '" cy="' + y + '" r="24" class="an-glow" data-glow/><circle cx="' + x + '" cy="' + y + '" r="14" class="an-bulb" data-bulb/>' +
      '<path d="M' + (x - 7) + ' ' + (y - 7) + ' L' + (x + 7) + ' ' + (y + 7) + ' M' + (x + 7) + ' ' + (y - 7) + ' L' + (x - 7) + ' ' + (y + 7) + '" class="an-x"/></g>';
  }
  function battery(x, y, ac) {
    if (ac) return '<g><circle cx="' + x + '" cy="' + y + '" r="15" class="an-src"/><path d="M' + (x - 8) + ' ' + y + ' q4 -9 8 0 t8 0" class="an-wave"/></g>';
    return '<g><rect x="' + (x - 14) + '" y="' + (y - 18) + '" width="28" height="36" rx="4" class="an-src"/><text x="' + x + '" y="' + (y - 4) + '" class="an-t">+</text><text x="' + x + '" y="' + (y + 12) + '" class="an-t">−</text></g>';
  }
  function build(kind, comp) {
    var g = '', paths = {};
    var ac = (/heater|motor|valve|speaker|diode|led|bridge|xfmr|varistor/.test(kind) && comp.id !== 'fan') || (kind === 'switch' && /triac|relay|ubl|pressostat/.test(comp.id)) || kind === 'thermosw';
    if (kind === 'batt') {
      paths.main = LOOP;
      g += '<path d="' + LOOP + '" class="an-wire"/>' + lamp(300, 75) + compBox(comp.sym, 115, 5, 100, 40) + '<text x="165" y="80" class="an-cap">источник — сам аккумулятор</text>';
      g += '<path d="M30 125 L30 25" class="an-wire"/>';
    } else if (kind === 'strip') {
      paths.main = LOOP;
      g += '<path d="' + LOOP + '" class="an-wire"/>' + battery(30, 75, false) + '<text x="62" y="80" class="an-cap">тестер</text>';
      for (var li = 0; li < 6; li++) { var lx = 80 + li * 36; g += '<g><circle cx="' + lx + '" cy="25" r="13" class="an-cbg"/><circle cx="' + lx + '" cy="25" r="9" fill="#333" data-led="' + li + '"/><path d="M' + (lx - 5) + ' 19 L' + (lx + 5) + ' 25 L' + (lx - 5) + ' 31 Z" fill="#888"/></g>'; }
    } else if (kind === 'xfmr') {
      paths.main = 'M20 75 L20 25 L140 25 L140 125 L20 125 Z';
      paths.sec = 'M190 125 L190 25 L310 25 L310 125 Z';
      paths.insul = 'M140 75 L190 75';
      g += '<path d="' + paths.main + '" class="an-wire"/><path d="' + paths.sec + '" class="an-wire"/>' + battery(20, 75, true) + lamp(310, 75) +
        '<g class="an-comp"><rect x="138" y="30" width="54" height="90" rx="6" class="an-cbg"/><rect x="138" y="30" width="54" height="90" rx="6" class="an-heat" data-heat/>' +
        '<path d="M150 38 q-10 7 0 14 q-10 7 0 14 q-10 7 0 14 q-10 7 0 14 q-10 7 0 14" class="an-coil"/><path d="M180 38 q10 7 0 14 q10 7 0 14 q10 7 0 14 q10 7 0 14 q10 7 0 14" class="an-coil"/>' +
        '<line x1="162" y1="34" x2="162" y2="116" class="an-core"/><line x1="168" y1="34" x2="168" y2="116" class="an-core"/></g>' +
        '<text x="80" y="145" class="an-cap">первичная (сеть)</text><text x="250" y="145" class="an-cap">вторичная (выход)</text>';
    } else if (kind === 'osc' || kind === 'pwm') {
      g += '<rect x="20" y="20" width="290" height="110" rx="8" class="an-cbg"/><path d="" class="an-sine" data-sine/><text x="165" y="145" class="an-cap">' + (kind === 'pwm' ? 'импульсы на затвор ключа (выход ШИМ)' : 'сигнал на выводах кварца') + '</text>';
    } else {
      paths.main = LOOP;
      g += '<path d="' + LOOP + '" class="an-wire"/>' + battery(30, 75, ac) + lamp(300, 75);
      var cx = 115, cw = 100;
      if (kind === 'varistor') {
        paths.side = 'M200 25 L200 125';
        g += '<path d="' + paths.side + '" class="an-wire thin"/>' + compBox(comp.sym, 170, 50, 60, 50) +
          '<g class="an-fuse"><rect x="80" y="17" width="44" height="16" rx="4" class="an-cbg"/><line x1="84" y1="25" x2="120" y2="25" class="an-fwire" data-fwire/></g><text x="102" y="13" class="an-cap">предохр.</text>';
      } else if (kind === 'wires') {
        paths.short = 'M165 25 L165 125';
        g += '<path d="' + paths.short + '" class="an-wire short" data-shortw/>' + '<text x="165" y="18" class="an-cap">жила 1</text><text x="165" y="142" class="an-cap">жила 2</text>';
      } else if (kind === 'reg') {
        g += compBox(comp.sym, cx, 5, cw, 40) + '<text x="300" y="112" class="an-volt" data-volt>5.0 V</text><text x="62" y="80" class="an-cap">12 В</text>';
      } else if (kind === 'magnetron') {
        g += compBox(comp.sym, cx, 5, cw, 40) + '<g data-waves><path d="M150 60 q8 -8 16 0 t16 0" class="an-mw"/><path d="M140 78 q12 -10 24 0 t24 0 t12 0" class="an-mw"/><path d="M132 96 q16 -12 32 0 t32 0 t16 0" class="an-mw"/></g>';
      } else {
        g += compBox(comp.sym, cx, 5, cw, 40);
      }
      if (kind === 'heater' || kind === 'motor' || kind === 'magnetron' || kind === 'cap' && comp.id === 'hvcap') {
        paths.leak = 'M165 45 L165 112';
        g += '<path d="' + paths.leak + '" class="an-wire leakw" data-leakw/><g data-gnd><line x1="152" y1="114" x2="178" y2="114" class="an-gnd"/><line x1="157" y1="119" x2="173" y2="119" class="an-gnd"/><line x1="162" y1="124" x2="168" y2="124" class="an-gnd"/></g>';
      }
      if (kind === 'motor') g += '<g data-rotor transform="translate(165 85)"><circle r="16" class="an-rotor"/><path d="M-12 0 L12 0 M0 -12 L0 12" class="an-rotor-l"/></g>';
      if (kind === 'valve') g += '<g data-drops><circle cx="160" cy="70" r="3" class="an-drop"/><circle cx="168" cy="84" r="3" class="an-drop"/><circle cx="162" cy="98" r="3" class="an-drop"/></g>';
      if (kind === 'speaker') g += '<path d="M190 60 q10 15 0 30 M200 52 q16 23 0 46" class="an-sound" data-sound/>';
      if (kind === 'cap') g += '<g><rect x="130" y="52" width="70" height="12" rx="4" class="an-barbg"/><rect x="130" y="52" width="0" height="12" rx="4" class="an-bar" data-bar/><text x="165" y="80" class="an-cap" data-qtx>заряд 0%</text></g>' +
        '<g data-sw><line x1="30" y1="40" x2="30" y2="25" class="an-swl"/></g>';
      if (kind === 'switch' || kind === 'thermosw') {
        paths.ctrl = 'M165 112 L165 45';
        if (kind === 'switch') g += '<path d="' + paths.ctrl + '" class="an-wire ctrl" data-ctrlw/><text x="165" y="125" class="an-cap ctrlc">управление</text>';
      }
      if (kind === 'bridge') { paths.main = 'M30 75 L30 25 L115 25 M115 125 L30 125 L30 75'; paths.load = 'M215 25 L300 25 L300 125 L215 125'; g += '<text x="72" y="142" class="an-cap">вход ~</text><text x="258" y="142" class="an-cap">выход = (нагрузка)</text>'; }
    }
    // контейнеры точек
    Object.keys(paths).forEach(function (k) { g += '<g data-dots="' + k + '"></g>'; });
    g += '<g data-fx></g>';
    return { svg: '<svg viewBox="0 0 ' + W + ' ' + H + '" class="an-svg">' + g + '<path id="anp-hidden" d="" style="display:none"/></svg>', paths: paths, ac: ac };
  }

  // ---------- Контроллер анимации ----------
  function Anim() { this.sim = {}; this.raf = null; this.key = null; }
  Anim.prototype.reset = function () {
    this.sim = { t: 0, q: 0, conn: false, temp: 0.2, load: 0.3, blown: false, ctrl: false, surge: 0, off: {}, last: performance.now() };
  };
  Anim.prototype.mount = function (host, comp, state) {
    var key = comp.id + ':' + state.id + ':' + (comp.variantIndex || 0);
    if (key !== this.key) { this.reset(); this.key = key; }
    this.comp = comp; this.state = state; this.kind = KIND[comp.id] || 'res'; this.beh = behavior(comp, state);
    if (this.beh === 'open' && (this.kind === 'fuse' || this.kind === 'tfuse')) this.sim.blown = true;
    var B = build(this.kind, comp);
    this.B = B;
    var ctl = '';
    var k = this.kind;
    if (k === 'cap') ctl = '<button data-act="charge">' + (this.sim.conn ? '⏏ Отключить источник' : '▶ Зарядить') + '</button><button data-act="discharge">⟲ Разрядить</button>';
    if (k === 'switch') ctl = '<button data-act="ctrl" class="' + (this.sim.ctrl ? 'on' : '') + '">' + (this.sim.ctrl ? '✓ ' : '') + (CTRL[comp.id] || 'Управление') + '</button>';
    if (k === 'batt') ctl = '<button data-act="ctrl" class="' + (this.sim.ctrl ? 'on' : '') + '">' + (this.sim.ctrl ? '✓ ' : '') + 'Подключить нагрузку</button>';
    if (k === 'strip') ctl = '<button data-act="ctrl" class="' + (this.sim.ctrl ? 'on' : '') + '">' + (this.sim.ctrl ? '✓ ' : '') + 'Включить тестер</button>';
    if (k === 'varistor') ctl = '<button data-act="surge">⚡ Скачок напряжения</button>';
    if (k === 'fuse') ctl = '<label class="an-sl">Нагрузка<input type="range" min="0" max="100" value="' + Math.round(this.sim.load * 100) + '" data-sl="load"></label>' + (this.beh === 'ok' ? '<button data-act="restore">↺ Новый</button>' : '');
    if (k === 'tfuse' || k === 'ntc' || k === 'ptc' || k === 'thermosw') ctl = '<label class="an-sl">🌡 Нагрев<input type="range" min="0" max="100" value="' + Math.round(this.sim.temp * 100) + '" data-sl="temp"></label>' + (k === 'tfuse' && this.beh === 'ok' ? '<button data-act="restore">↺ Новый</button>' : '');
    host.innerHTML = '<div class="an-head">⚡ Как течёт ток</div>' + B.svg + '<div class="an-ctl">' + ctl + '</div><div class="an-msg" data-msg></div>';
    this.host = host;
    this.svg = host.querySelector('svg');
    this.pathEls = {};
    var self = this;
    Object.keys(B.paths).forEach(function (n) {
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', B.paths[n]); p.style.display = 'none'; self.svg.appendChild(p);
      self.pathEls[n] = { el: p, len: p.getTotalLength(), dots: [] };
      var grp = self.svg.querySelector('[data-dots="' + n + '"]');
      var count = Math.max(4, Math.round(self.pathEls[n].len / 26));
      for (var i = 0; i < count; i++) {
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', 3.2); c.setAttribute('class', 'an-dot' + (n === 'leak' || n === 'insul' || n === 'short' ? ' red' : n === 'ctrl' ? ' ctrl' : ''));
        grp.appendChild(c); self.pathEls[n].dots.push(c);
      }
    });
    host.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      e.stopPropagation();
      var s = self.sim, a = b.getAttribute('data-act');
      if (a === 'charge') s.conn = !s.conn;
      if (a === 'discharge') { s.q = 0; s.conn = false; }
      if (a === 'ctrl') s.ctrl = !s.ctrl;
      if (a === 'surge') s.surge = 1.6;
      if (a === 'restore') { s.blown = false; s.load = 0.3; s.temp = 0.2; }
      self.mount(host, self.comp, self.state);
    };
    host.oninput = function (e) {
      var sl = e.target.getAttribute('data-sl'); if (!sl) return;
      self.sim[sl] = e.target.value / 100;
    };
    if (!this.raf) this.loop();
  };
  Anim.prototype.loop = function () {
    var self = this;
    function frame(now) {
      if (!self.host || !self.host.isConnected) { self.raf = null; return; }
      var dt = Math.min(0.05, (now - self.sim.last) / 1000); self.sim.last = now; self.sim.t += dt;
      self.step(dt);
      self.raf = requestAnimationFrame(frame);
    }
    this.raf = requestAnimationFrame(frame);
  };

  // Основной расчёт кадра: ток в каждой ветви, лампа, нагрев, эффекты
  Anim.prototype.step = function (dt) {
    var s = this.sim, b = this.beh, k = this.kind, t = s.t;
    var I = { main: 0, side: 0, leak: 0, short: 0, sec: 0, insul: 0, ctrl: 0, load: 0 };
    var lampB = 0, heat = 0, ac = this.B.ac, msgExtra = '';
    var sinv = Math.sin(t * Math.PI); // переменка: период 2 с
    var flick = Math.random() < 0.5 ? 0 : 1;
    function base(level) { return level; }
    if (k === 'res' || k === 'heater' || k === 'valve' || k === 'speaker' || k === 'motor') {
      var lv = { ok: 1, open: 0, short: 2.2, drift: 0.5, low: 1.6, hot: 1.4, jitter: flick, leak: 1, jam: 1.9, jerky: 0.6 + 0.6 * (Math.sin(t * 7) > 0 ? 1 : 0), mech: 1, weak: 0.6 }[b];
      if (lv === undefined) lv = b === 'ok' ? 1 : 0;
      I.main = lv; lampB = Math.min(1.4, lv);
      heat = b === 'short' ? 1 : b === 'hot' || b === 'jam' ? 0.75 : b === 'low' ? 0.5 : k === 'heater' && lv > 0 ? 0.6 : 0;
      if (b === 'leak') I.leak = 0.7;
    } else if (k === 'ntc' || k === 'ptc') {
      var T = s.temp;
      var g = k === 'ntc' ? 0.25 + 1.2 * T : (T < 0.6 ? 1 : Math.max(0.03, 1 - (T - 0.6) * 4));
      if (b === 'open') g = 0; else if (b === 'short') g = 2; else if (b === 'drift') g = k === 'ntc' ? 0.08 + 0.45 * T : g * 0.4; else if (b === 'jitter') g = g * flick;
      I.main = g; lampB = Math.min(1.4, g); heat = T * 0.7;
      msgExtra = k === 'ntc' ? ' Температура ' + Math.round(-10 + T * 110) + ' °C.' : ' Температура ' + Math.round(20 + T * 120) + ' °C.';
    } else if (k === 'fuse' || k === 'tfuse') {
      var drive = k === 'fuse' ? s.load : s.temp;
      if (!s.blown && b === 'ok' && drive > 0.82) { s.blown = true; s.flash = 0.6; }
      I.main = s.blown ? 0 : (k === 'fuse' ? 0.3 + drive * 1.6 : 1); lampB = Math.min(1.4, I.main);
      heat = s.blown ? 0 : (k === 'fuse' ? Math.max(0, drive - 0.5) * 2 : drive * 0.8);
      if (s.blown && b === 'ok') msgExtra = ' Сгорел — защитил схему от перегрузки!';
    } else if (k === 'cap') {
      var qmax = b === 'dry' ? 0.3 : b === 'short' || b === 'open' ? 0 : 1;
      var tau = b === 'dry' ? 0.25 : 1.4;
      var leakR = b === 'leak' ? 0.35 : 0.01;
      if (b === 'short') { I.main = s.conn ? 2 : 0; heat = s.conn ? 0.9 : 0; s.q = 0; }
      else if (b === 'open') { I.main = 0; s.q = 0; }
      else {
        var ich = s.conn ? Math.max(0, (qmax - s.q) / tau) : 0;
        s.q = Math.max(0, Math.min(qmax, s.q + (ich - leakR * s.q) * dt));
        I.main = s.conn ? ich * 1.3 + (b === 'leak' ? 0.35 : 0) : 0;
      }
      lampB = Math.min(1.4, I.main);
      var bar = this.svg.querySelector('[data-bar]'); if (bar) bar.setAttribute('width', 70 * s.q);
      var qt = this.svg.querySelector('[data-qtx]'); if (qt) qt.textContent = 'заряд ' + Math.round(s.q * 100) + '%' + (b === 'dry' && s.q > 0.25 ? ' (больше не берёт)' : '');
      var sw = this.svg.querySelector('[data-sw] line'); if (sw) sw.setAttribute('x2', s.conn ? 30 : 42);
    } else if (k === 'diode' || k === 'led') {
      var fwd = sinv > 0;
      var mag = Math.abs(sinv);
      if (b === 'ok' || b === 'weak') I.main = fwd ? mag : 0;
      else if (b === 'short') I.main = sinv * 1.2;
      else if (b === 'leak') I.main = fwd ? mag : sinv * 0.3;
      else I.main = 0;
      ac = false;
      lampB = k === 'led' ? 0 : Math.abs(I.main);
      if (k === 'led') { var gl = this.svg.querySelector('[data-heat]'); var on = (b === 'ok' ? 1 : b === 'weak' ? 0.25 : 0) * (fwd ? mag : 0); if (gl) { gl.style.fill = 'rgba(255,60,40,' + (on * 0.85).toFixed(2) + ')'; } heat = -1; }
      msgExtra = fwd ? ' Сейчас прямой полупериод.' : ' Сейчас обратный полупериод.';
    } else if (k === 'bridge') {
      var m2 = Math.abs(sinv);
      ac = false;
      if (b === 'ok') { I.main = sinv; I.load = m2; }
      else if (b === 'open') { I.main = sinv > 0 ? sinv : 0; I.load = sinv > 0 ? m2 : 0; }
      else { I.main = sinv * (sinv > 0 ? 2.2 : 1); I.load = sinv > 0 ? 0 : m2; heat = sinv > 0 ? 1 : 0; }
      lampB = I.load;
      I.main = I.main; // направление на входе
    } else if (k === 'switch') {
      var c = s.ctrl;
      I.ctrl = c ? 0.8 : 0;
      var cond = { ok: c ? 1 : 0, always: 1, never: 0, gateshort: 0, jitter: c ? flick : 0, weak: c ? 0.3 : 0 }[b];
      if (cond === undefined) cond = c ? 1 : 0;
      if (b === 'gateshort' && c) I.ctrl = 1.5;
      I.main = cond; lampB = cond;
      var cw = this.svg.querySelector('[data-ctrlw]'); if (cw) cw.classList.toggle('on', c);
    } else if (k === 'batt') {
      var lvb = { ok: 1, weak: 0.4, nogo: 0, short: 0, cellshort: 0.65, ntcopen: 1, mech: 1, open: 0, trip: 0, always: 1 }[b];
      if (lvb === undefined) lvb = b === 'ok' ? 1 : 0;
      I.main = s.ctrl ? lvb : 0; lampB = I.main; heat = b === 'short' ? 0.8 : b === 'mech' ? 0.3 : 0;
      if (!s.ctrl) msgExtra = ' Нажмите «Подключить нагрузку».';
    } else if (k === 'strip') {
      var on2 = s.ctrl && b !== 'open';
      I.main = on2 ? 1 : 0;
      for (var q = 0; q < 6; q++) {
        var led = this.svg.querySelector('[data-led="' + q + '"]'); if (!led) continue;
        var br = !on2 ? 0 : b === 'short' && q === 4 ? 0 : b === 'short' ? 1.2 : b === 'weak' && q === 2 ? 0.3 : 1;
        led.style.fill = br ? (b === 'weak' && q === 2 ? 'rgba(120,150,255,' + (0.4 + br).toFixed(2) + ')' : 'rgba(255,240,190,' + Math.min(1, br).toFixed(2) + ')') : '#333';
      }
      if (!s.ctrl) msgExtra = ' Нажмите «Включить тестер».';
    } else if (k === 'thermosw') {
      var hot = s.temp > 0.6;
      var cond2 = b === 'ok' ? (hot ? 0 : 1) : b === 'always' ? 1 : 0;
      I.main = cond2; lampB = cond2; heat = s.temp * 0.8;
      msgExtra = ' Температура ' + Math.round(20 + s.temp * 110) + ' °C (порог ~85 °C).';
    } else if (k === 'xfmr') {
      var lvp = { ok: 0.8, open: 0, hot: 1.8, insul: 1, leak: 1.2 }[b]; if (lvp === undefined) lvp = 0.8;
      var lvs = { ok: 1, open: 0, hot: 0.35, insul: 1.3, leak: 0.8 }[b]; if (lvs === undefined) lvs = 1;
      I.main = lvp; I.sec = lvs; lampB = lvs * (b === 'insul' ? (0.6 + 0.6 * flick) : 1);
      I.insul = b === 'insul' ? 1 : 0; heat = b === 'hot' ? 0.9 : b === 'insul' ? 0.5 : 0.1;
    } else if (k === 'varistor') {
      s.surge = Math.max(0, (s.surge || 0) - dt);
      if (b === 'short') { s.blown = true; }
      I.main = s.blown ? 0 : 1 + (s.surge > 0 ? 1.5 : 0); I.side = s.blown ? 0 : s.surge > 0 ? 2.2 : 0;
      lampB = s.blown ? 0 : 1; heat = s.surge > 0 ? 0.8 : 0;
      var fw = this.svg.querySelector('[data-fwire]'); if (fw) fw.classList.toggle('blown', !!s.blown);
      if (s.surge > 0) msgExtra = ' Импульс ушёл через варистор, нагрузка защищена.';
    } else if (k === 'reg') {
      var out = { ok: 5.0, inshort: 0, passthru: 12, open: 0, never: 0 }[b]; if (out === undefined) out = 5;
      if (this.comp.id === 'tl431') out = { ok: 2.5, inshort: 0, passthru: 12 }[b] !== undefined ? { ok: 2.5, inshort: 0, passthru: 12 }[b] : 2.5;
      I.main = b === 'inshort' ? 2.2 : out > 0 ? (out > 6 ? 1.4 : 0.8) : 0; lampB = out > 6 ? 1.4 : out > 0 ? 0.8 : 0; heat = b === 'inshort' ? 1 : 0;
      var vt = this.svg.querySelector('[data-volt]'); if (vt) { vt.textContent = out.toFixed(1) + ' V'; vt.classList.toggle('bad', out > 6 || out === 0); }
    } else if (k === 'osc') {
      var amp = b === 'ok' ? 40 : 0, d = 'M25 75';
      for (var x = 0; x <= 280; x += 4) d += ' L' + (25 + x) + ' ' + (75 + amp * Math.sin((x / 18) + t * 12)).toFixed(1);
      var sn = this.svg.querySelector('[data-sine]'); if (sn) sn.setAttribute('d', d);
      heat = -1;
    } else if (k === 'pwm') {
      var on = b === 'ok' || (b === 'hiccup' && (t % 1.6) < 0.45);
      var dp = 'M25 110', period = 28, duty = 0.38, ph = (t * 60) % period;
      for (var px = 0; px <= 280; px += 2) {
        var hi = on && ((px + ph) % period) < period * duty;
        dp += ' L' + (25 + px) + ' ' + (hi ? 40 : 110);
      }
      var sp = this.svg.querySelector('[data-sine]'); if (sp) sp.setAttribute('d', dp);
      heat = -1;
    } else if (k === 'magnetron') {
      var lvm = { ok: 1, open: 0, leak: 0.8, weak: 1 }[b]; if (lvm === undefined) lvm = 1;
      I.main = lvm; lampB = 0; I.leak = b === 'leak' ? 0.8 : 0; heat = lvm ? 0.7 : 0;
      var wv = this.svg.querySelector('[data-waves]');
      if (wv) { var op = b === 'ok' ? 1 : b === 'weak' ? 0.25 : 0; wv.style.opacity = (op * (0.5 + 0.5 * Math.sin(t * 8))).toFixed(2); }
    } else if (k === 'wires') {
      if (b === 'short') { I.main = 1.8; I.short = 1.8; lampB = 0; } else if (b === 'open') { I.main = 0; } else if (b === 'jitter') { I.main = flick; lampB = flick; } else { I.main = 1; lampB = 1; }
      var sh = this.svg.querySelector('[data-shortw]'); if (sh) sh.style.opacity = b === 'short' ? 1 : 0;
    }
    if (ac && k !== 'xfmr') I.main *= Math.sin(t * Math.PI * 1.2) >= 0 ? 1 : -1;
    if (k === 'xfmr') { var sg = Math.sin(t * Math.PI * 1.2) >= 0 ? 1 : -1; I.main *= sg; I.sec *= sg; }

    // точки тока
    var self = this;
    Object.keys(this.pathEls).forEach(function (n) {
      var P = self.pathEls[n];
      var cur = n === 'main' ? I.main : n === 'side' ? I.side : n === 'leak' ? I.leak : n === 'short' ? I.short : n === 'sec' ? I.sec : n === 'insul' ? I.insul : n === 'ctrl' ? I.ctrl : n === 'load' ? I.load : 0;
      if (k === 'bridge' && n === 'main') cur = I.main;
      s.off[n] = (s.off[n] || 0) + cur * 60 * dt;
      var sp = P.len / P.dots.length;
      var vis = Math.abs(cur) > 0.02;
      P.dots.forEach(function (dot, i) {
        if (!vis) { dot.style.opacity = 0; return; }
        var d = ((s.off[n] + i * sp) % P.len + P.len) % P.len;
        var pt = P.el.getPointAtLength(d);
        dot.setAttribute('cx', pt.x.toFixed(1)); dot.setAttribute('cy', pt.y.toFixed(1));
        dot.style.opacity = Math.min(1, 0.35 + Math.abs(cur) * 0.5).toFixed(2);
        dot.setAttribute('r', (2.4 + Math.min(2, Math.abs(cur)) * 1.2).toFixed(1));
      });
    });
    // лампа
    var bulb = this.svg.querySelector('[data-bulb]'), glow = this.svg.querySelector('[data-glow]');
    var lb = Math.max(0, Math.min(1.4, Math.abs(lampB)));
    if (bulb) bulb.style.fill = lb > 0.02 ? 'rgba(255,214,90,' + (0.25 + lb * 0.55).toFixed(2) + ')' : '#2a3130';
    if (glow) glow.style.opacity = (lb * 0.55).toFixed(2);
    var xx = this.svg.querySelector('.an-x'); if (xx) xx.style.opacity = lb > 0.02 ? 0 : 0.8;
    // нагрев
    var hr = this.svg.querySelector('[data-heat]');
    if (hr && heat >= 0) hr.style.fill = 'rgba(255,90,40,' + (heat * 0.5).toFixed(2) + ')';
    // мотор
    var rot = this.svg.querySelector('[data-rotor]');
    if (rot) { var spd = b === 'jam' || b === 'open' ? 0 : Math.abs(I.main) * (b === 'jerky' ? 1 : 1); s.ang = (s.ang || 0) + spd * 360 * dt; rot.setAttribute('transform', 'translate(165 85) rotate(' + s.ang.toFixed(1) + ')'); }
    var drops = this.svg.querySelector('[data-drops]'); if (drops) drops.style.opacity = Math.abs(I.main) > 0.5 ? (0.5 + 0.5 * Math.sin(t * 10)).toFixed(2) : 0;
    var snd = this.svg.querySelector('[data-sound]'); if (snd) snd.style.opacity = Math.abs(I.main) > 0.2 && b !== 'short' ? (0.4 + 0.6 * Math.abs(Math.sin(t * 9))).toFixed(2) : 0;
    var lw = this.svg.querySelector('[data-leakw]'); if (lw) lw.style.opacity = I.leak > 0 ? 1 : 0;
    var gn = this.svg.querySelector('[data-gnd]'); if (gn) gn.style.opacity = I.leak > 0 ? 1 : 0.25;
    var fwire = this.svg.querySelector('[data-fwire]'); if (fwire && k === 'fuse') fwire.classList.toggle('blown', !!s.blown);
    // сообщение (обновлять редко)
    s.mt = (s.mt || 0) - dt;
    if (s.mt <= 0) {
      s.mt = 0.4;
      var el = this.host.querySelector('[data-msg]');
      var bad = !(b === 'ok' || (b === 'mech'));
      var cm = (CMSG[this.comp.id] || {})[b];
      if (el) { el.textContent = (cm || msgFor(k, (k === 'fuse' || k === 'tfuse') && b === 'open' ? 'open' : b, s)) + msgExtra; el.className = 'an-msg ' + (b === 'ok' ? 'good' : bad ? 'bad' : ''); }
    }
  };

  MC.Anim = Anim;
  MC.animKind = function (id) { return KIND[id] || 'res'; };
})();
