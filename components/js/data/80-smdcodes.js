/* Коды маркировки SMD-транзисторов и диодов (SOT-23).
   В таблицу внесены только коды, сверенные с даташитом производителя (ссылка в каждой строке).
   Один и тот же код у разных производителей может означать разные детали — сверяйте с платой и схемой. */
(function () {
  var ON3904 = ['onsemi MMBT3904L: даташит', 'https://www.onsemi.com/pdf/datasheet/mmbt3904lt1-d.pdf'];
  var DI3906 = ['Diodes Inc. MMBT3906: даташит', 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/4844/DS_3372_MMBT3906.pdf'];
  var NX847 = ['Nexperia BC847 series: даташит', 'https://sy-dep-epc-lpc.web.cern.ch/components/datasheets/epc-lpc%20(converters)/BC847_NPN%20BJT_Nexperia.pdf'];
  var BC817 = ['BC817 / BC818 (SOT-23): даташит', 'https://atta.szlcsc.com/upload/public/pdf/source/20260106/A5F550F9B1494906A9FFA59936F19829.pdf'];
  var NX99 = ['Nexperia BAV99: даташит', 'https://sy-dep-epc-lpc.web.cern.ch/components/datasheets/epc-lpc%20(converters)/BAV99-Fast%20Diode-Nexperia.pdf'];
  var DIOTEC = ['Diotec BAS16 / BAW56 / BAV70: даташит', 'https://static.chipdip.ru/lib/645/DOC053645871.pdf'];
  var DI54 = ['Diodes Inc. BAT54 / A / C / S: даташит', 'https://static.chipdip.ru/lib/393/DOC044393393.pdf'];
  var ON7002 = ['onsemi 2N7002L: карточка даташита', 'https://www.radiolocman.com/datasheet/data.html?di=46196'];
  var AO3400 = ['AO3400A: цоколёвка и маркировка (Alpha & Omega)', 'https://components101.com/mosfets/ao3400a-n-channel-mosfet-pinout-datasheet'];
  var BEC = '1 — база, 2 — эмиттер, 3 — коллектор';
  MC.smdCodes = [
    ['1AM', 'MMBT3904', 'NPN транзистор 40 В 0,2 А', BEC, 'onsemi', ON3904, 'npn'],
    ['2A', 'MMBT3906', 'PNP транзистор 40 В 0,2 А', BEC, 'Diodes Inc.', DI3906, 'pnp'],
    ['1E', 'BC847A', 'NPN транзистор 45 В 0,1 А', BEC, 'Nexperia', NX847, 'npn'],
    ['1F', 'BC847B', 'NPN транзистор 45 В 0,1 А', BEC, 'Nexperia', NX847, 'npn'],
    ['1G', 'BC847C', 'NPN транзистор 45 В 0,1 А', BEC, 'Nexperia', NX847, 'npn'],
    ['1H', 'BC847', 'NPN транзистор 45 В 0,1 А', BEC, 'Nexperia', NX847, 'npn'],
    ['6A', 'BC817-16', 'NPN транзистор 45 В 0,5 А', BEC, 'BC817 (SOT-23)', BC817, 'npn'],
    ['6B', 'BC817-25', 'NPN транзистор 45 В 0,5 А', BEC, 'BC817 (SOT-23)', BC817, 'npn'],
    ['6C', 'BC817-40', 'NPN транзистор 45 В 0,5 А', BEC, 'BC817 (SOT-23)', BC817, 'npn'],
    ['6E', 'BC818-16', 'NPN транзистор 25 В 0,5 А', BEC, 'BC818 (SOT-23)', BC817, 'npn'],
    ['6F', 'BC818-25', 'NPN транзистор 25 В 0,5 А', BEC, 'BC818 (SOT-23)', BC817, 'npn'],
    ['6G', 'BC818-40', 'NPN транзистор 25 В 0,5 А', BEC, 'BC818 (SOT-23)', BC817, 'npn'],
    ['702', '2N7002', 'N-канальный мосфет 60 В 0,115 А', '1 — затвор, 2 — исток, 3 — сток', 'onsemi', ON7002, 'mosfet'],
    ['A09T', 'AO3400A', 'N-канальный мосфет 30 В, RDS(on) < 32 мОм при 4,5 В', '1 — затвор, 2 — исток, 3 — сток', 'Alpha & Omega', AO3400, 'mosfet'],
    ['A7', 'BAV99', 'Два быстрых диода последовательно', '1 — анод D1, 2 — катод D2, 3 — катод D1 + анод D2', 'Nexperia', NX99, 'diode'],
    ['A1', 'BAW56', 'Два диода с общим анодом', 'Общий анод — вывод 3', 'Diotec', DIOTEC, 'diode'],
    ['A4', 'BAV70', 'Два диода с общим катодом', 'Общий катод — вывод 3', 'Diotec', DIOTEC, 'diode'],
    ['5D', 'BAS16', 'Одиночный быстрый диод', 'Анод — 1, катод — 3', 'Diotec', DIOTEC, 'diode'],
    ['KL1', 'BAT54', 'Диод Шоттки 30 В 0,2 А (VF 0,32 В при 1 мА)', 'Одиночный', 'Diodes Inc.', DI54, 'schottky'],
    ['KL2', 'BAT54A', 'Два диода Шоттки с общим анодом', 'Общий анод — вывод 3', 'Diodes Inc.', DI54, 'schottky'],
    ['KL3', 'BAT54C', 'Два диода Шоттки с общим катодом', 'Общий катод — вывод 3', 'Diodes Inc.', DI54, 'schottky'],
    ['KL4', 'BAT54S', 'Два диода Шоттки последовательно', 'Средняя точка — вывод 3', 'Diodes Inc.', DI54, 'schottky']
  ].map(function (r) { return { code: r[0], part: r[1], type: r[2], pins: r[3], mfr: r[4], src: r[5], comp: r[6] }; });
  MC.smdLookup = function (q) {
    q = String(q || '').toUpperCase().replace(/[^0-9A-ZА-Я]/g, '');
    if (!q) return [];
    return MC.smdCodes.filter(function (r) {
      var c = r.code.toUpperCase();
      return q === c || (q.length > c.length && q.indexOf(c) === 0) || (q.length >= 2 && c.indexOf(q) === 0) || r.part.toUpperCase().indexOf(q) >= 0;
    });
  };
})();
