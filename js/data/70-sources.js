/* Источники значений: даташиты производителей, сервис-мануалы, справочные таблицы.
   Показываются во вкладке «Справочник» каждого компонента. */
(function () {
  var FLUKE = ['Fluke: проверка диодов мультиметром (кремний 0,5–0,8 В, обратно OL)', 'https://www.fluke.com/en-us/learn/blog/digital-multimeters/how-to-test-diodes'];
  var PEAK = ['Peak Electronic Design: таблица типовых ESR электролитов', 'https://www.peakelec.co.uk/downloads/esrguide-en.pdf'];
  var ELX = ['Electrolux, Service Manual 599 72 89-03: характеристики компонентов стиральных машин', 'https://shop.electroluxarabia.com/Content/files/OTHERS/599/728/903EN.pdf'];
  var ELX2 = ['Electrolux, Service Bulletin 599 70 65-97: моторы и тахогенераторы', 'https://shop.electroluxarabia.com/Content/files/OTHERS/599/706/597EN.pdf'];
  var WP1 = ['Whirlpool, tech sheet W11279380 (СВЧ): нормы сопротивлений', 'https://www.whirlpool.com/content/dam/global/documents/201901/tech-sheet-w11279380-revC.pdf'];
  var WP2 = ['Whirlpool, tech sheet W10434230 (СВЧ): нормы сопротивлений', 'https://s3.amazonaws.com/sm-backend-production-attachments/techsheet-w10434230-reva.pdf'];
  var COLOR = ['Panasonic: цветовая маркировка резисторов (IEC 60062)', 'https://industrial.panasonic.com/kr/ds/ss/technical/b27'];
  var CAPCODE = ['Коды керамических конденсаторов (151, 102, 104…)', 'https://industrialmonitordirect.com/blogs/knowledgebase/ceramic-capacitor-marking-codes-reading-151-102-104-more'];

  MC.sources = {
    resistor: [COLOR],
    pot: [COLOR],
    ecap: [PEAK],
    ccap: [CAPCODE],
    fcap: [CAPCODE],
    choke: [['Bourns SDR1307-101KL: 100 мкГн ±10%, DCR ≤ 0,18 Ом (RS)', 'https://uk.rs-online.com/p/surface-mount-inductors/1729744'], ['Bourns SDR1307-470KL: 47 мкГн, DCR ≤ 82 мОм (RS)', 'https://uk.rs-online.com/web/p/surface-mount-inductors/1808991'], ['Bourns SDR1307-100ML: 10 мкГн, DCR ≤ 21 мОм (element14)', 'https://sg.element14.com/bourns/sdr1307-100ml/inductor-10uh-20-5-6a-smd/dp/2329000']],
    varistor: [['Bourns MOV-14D471K: 470 В, диск 14 мм (Digi-Key)', 'https://www.digikey.ie/en/products/detail/bourns-inc/MOV-14D471K/2799087']],
    ntc: [['Даташит серии MF72: 5D-9 — 5 Ом / 3 А, 10D-9 — 10 Ом / 2 А, допуск ±10%', 'https://static.chipdip.ru/lib/558/DOC045558991.pdf']],
    ptc: [],
    fuse: [['Littelfuse 215 (5×20, T): холодное сопротивление по номиналам', 'https://littelfuse.com/%7E/media/electronics/datasheets/fuses/littelfuse_fuse_215_datasheet.pdf.pdf']],
    tfuse: [['SEFUSE SF152E — 157 °C, 10 А', 'https://www.ebay.com/p/2256335892'], ['SEFUSE SF139E — 142 °C, 10 А', 'https://www.ebay.de/itm/274603944605']],
    quartz: [],
    diode: [FLUKE, ['Vishay 1N4001…1N4007: даташит', 'https://assets.rs-online.com/v1698967669/Datasheets/13e6e46c15cf22864bd07ab7e9c4439c.pdf']],
    schottky: [FLUKE, ['SR560: 5 А 60 В (Farnell)', 'https://uk.farnell.com/multicomp-pro/sr560/schottky-rectifier-5a-60v-do-201aa/dp/2675411']],
    zener: [FLUKE, ['Vishay BZX55: даташит', 'https://static.chipdip.ru/lib/224/DOC000224555.pdf']],
    bridge: [FLUKE, ['KBP307: 3 А 1000 В', 'https://ifuturetech.org/?p=27563']],
    led: [['Kingbright L-53ID: красный 5 мм, Vf 2 В при 20 мА (RS)', 'https://hkcn.rs-online.com/web/p/leds/2285972'], FLUKE],
    npn: [['onsemi BC546–BC548: даташит (цоколёвка TO-92)', 'https://www.onsemi.com/download/data-sheet/pdf/bc546-d.pdf'], FLUKE],
    pnp: [FLUKE],
    mosfet: [['Vishay IRF740: 400 В 10 А, TO-220', 'https://datasheets.globalspec.com/ds/vishay-intertechnology/irf740pbf/cae72d06-18d6-4baa-8439-73f891b9fc42'], FLUKE],
    igbt: [['onsemi FGA25N120ANTD: даташит', 'https://www.onsemi.com/pdf/datasheet/fga25n120antdtu-d.pdf']],
    triac: [['Проверка симистора мультиметром (G–T1 ≈ 0,13 В в режиме диода, T1–T2 OL)', 'https://tte-lisa.ac.uk/wp-content/uploads/vle_content/Phase2/electrical/CAROUSEL4/Resource/TRIAC%20test%20with%20multimeter.pdf'], ['BT136: даташит', 'https://manualmachine.com/philips/bt136m600e/3952847-datasheet']],
    scr: [['BT151: цоколёвка и параметры', 'https://components101.com/thyristors/bt151-scr-datasheet-pinout-equivalents'], FLUKE],
    opto: [['Sharp PC817: даташит', 'https://www.alldatasheet.com/datasheet-pdf/pdf/43371/SHARP/PC817.html'], FLUKE],
    reg78: [['ST L78xx: даташит (5 В: 4,8–5,2 В)', 'https://protostack.com.au/download/l7805.pdf']],
    tl431: [['TI TL431: даташит (опорное 2,495 В)', 'https://hippo.feld.cvut.cz/katalog/pdf/TL431.PDF']],
    hall: [['A3144: цоколёвка и работа', 'https://microcontrollerslab.com/a3144-hall-effect-sensor-introduction-working-and-pinout/']],
    zener_smd: [FLUKE, ['Vishay BZX55: даташит (параметры стабилитронов)', 'https://static.chipdip.ru/lib/224/DOC000224555.pdf']],
    pwm_uc: [['TI UC384xA: даташит (пороги 16/10 В и 8,4/7,6 В)', 'https://ti.com/document-viewer/UC3843A/datasheet/GUID-537B5340-EE69-433A-8E41-F47304D5F068']],
    pwm_sw: [['ST VIPer22A: даташит (VDD 9–38 В, пуск 14,5 В)', 'https://www.st.com:443/resource/en/datasheet/viper22a-e.pdf'], ['VIPer22A: цоколёвка DIP-8 (1–2 SOURCE, 3 FB, 4 VDD, 5–8 DRAIN)', 'https://www.ic-online.com/de/blog/post/viper22a-ic-pinout-equivalent-circuits-and-real-world-applications'], ['Power Integrations TNY266: BYPASS 5,8 В', 'https://html.alldatasheet.net/html-pdf/139787/POWERINT/TNY266G/1164/3/TNY266G.html']],
    pwm_ncp: [['onsemi NCP1200: назначение выводов', 'https://html.alldatasheet.net/html-pdf/115077/ONSEMI/NCP1200P60/444/2/NCP1200P60.html']],
    opto_triac: [['MOC3021: цоколёвка и параметры', 'https://components101.com/ics/moc3021-triac-driven-optoisolator-pinout-equivalent-datasheet']],
    opto_fast: [['6N137: даташит', 'https://www.promelec.ru/fs/sources/ca/a8/5f/35/ad9595f2daa774198d5eaa40.pdf']],
    opto_drv: [['Toshiba TLP250: даташит (Vf 1,6 В при 10 мА, цоколёвка)', 'https://www.electrokit.com/upload/product/40300/40300270/4256.pdf']],
    tpi: [['Würth 750871111: даташит (индуктивность и сопротивления обмоток)', 'https://www.we-online.com/components/products/datasheet/750871111_valid_from_2026-11-12.pdf']],
    mains: [],
    relay: [['JQC-3FF: сопротивление катушек (5 В — 70 Ом, 12 В — 400 Ом, 24 В — 1600 Ом)', 'https://www.generationrobots.com/media/JQC-3FF-v1.pdf'], ['Hongfa HF115F-I 24 В: катушка 1440 Ом', 'https://rapidonline.com/hongfa-hf115f-i-024-1h3af-pcb-relay-24vdc-spst-no-16a-71-4609']],
    speaker: [['DC-сопротивление динамиков: 4 Ом → 3,1–4,0 Ом, 8 Ом → 5,7–8 Ом', 'https://soundcertified.com/what-will-2-4-8-ohm-impedance-speaker-measure-dc-resistance/']],
    heater: [ELX],
    ntcsensor: [ELX, ['Сопротивление датчиков температуры по маркам стиральных машин', 'https://guide.washerhouse.com/en/soprotivlenie-termodatchika-sm/']],
    pump: [ELX],
    valve: [ELX, ['Проверка заливного клапана (2–4 кОм)', 'https://guide.washerhouse.com/en/remont-vpusknogo-klapana-sm/']],
    wmotor: [ELX, ELX2],
    ubl: [['Whitegoods Help: устройство и проверка УБЛ (≈1000 Ом)', 'https://www.whitegoodshelp.co.uk/?p=17786']],
    pressostat: [['Проверка прессостата (Whirlpool)', 'https://www.appliancepartspros.com/b/?p=12091']],
    thermostat: [['KSD301: даташит', 'https://static.chipdip.ru/lib/639/DOC046639463.pdf']],
    compressor: [['Danfoss TL5G: даташит (обмотки 14,5/14,8 Ом при 25 °C)', 'https://assets.danfoss.com/documents/latest/67852/AI031286433759en-000202.pdf'], ['Danfoss FR6DL: спецификация (рабочая 7,1 Ом, пусковая 11,9 Ом)', 'https://digitalassets.reecegroup.com.au/m/569a1d02f0d265a5/original/Specification-Sheet-Danfoss-Compressor-FR6DL.pdf']],
    startrelay: [['Danfoss TLS6F: PTC-пускатель 103N0011, 25 Ом', 'https://digitalassets.reecegroup.com.au/m/5e0f41e98d3585da/original/Specification-Sheet-Danfoss-Compressor-TLS6F.pdf'], ['QP2-15 / QP2-12: PTC-пускатели 15 и 12 Ом', 'https://allfixelectrical.com.au/collections/major-appliance-parts/products/fridge-compressor-motor-ptc-start-relay-part-qp2-15c-a']],
    runcap: [['CBB60: даташит', 'https://www.promelec.ru/fs/sources/f3/66/b2/94/89e4109c617e6396a225ca3a.pdf']],
    magnetron: [WP1, WP2],
    mot: [WP1, WP2],
    hvdiode: [WP1, WP2],
    hvcap: [WP1, ['Конденсаторы СВЧ CH85: разрядный резистор 10 МОм ±20%', 'https://www.suntan.com.hk/pdf/Motor-Capacitors/TS11-Microwave-Ovens-Capacitor-CH85.pdf']],
    button: [],
    wires: []
  };

  // Пометки о точности значений
  MC.accuracy = {
    ptc: 'Значения — пример замера позистора, не привязанного к конкретной модели.',
    quartz: 'Мультиметром проверяется только пробой; номинальная частота — по маркировке.',
    mains: 'Значения — пример замера небольшого трансформатора 230/12 В: у разных моделей сопротивление первичной обмотки — от сотен Ом до единиц кОм.',
    button: 'Значения типовые для механического контакта (около 0 Ом замкнут, OL разомкнут).',
    wires: 'Значения типовые: медная жила длиной около 1 м — доли Ома.',
    pnp: 'Показания переходов зависят от тестового тока мультиметра.',
    hall: 'Показания защитных диодов микросхемы зависят от производителя и тестового тока мультиметра.',
    reg78: 'Показания защитных диодов микросхемы зависят от производителя и тестового тока мультиметра.',
    tl431: 'Показания в режиме ▶| зависят от производителя и тестового тока мультиметра.'
  };
  MC.accuracyCommon = 'Показания в режиме ▶| зависят от тестового тока мультиметра (обычно 0,5–1,5 мА): разброс ±0,05–0,1 В нормален. Значения неисправных состояний — пример замера, в реальности они могут отличаться.';
})();
