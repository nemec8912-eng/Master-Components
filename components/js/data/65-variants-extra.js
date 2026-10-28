/* Номиналы для компонентов из 25-semi-extra.js (подключается после 60-variants.js). */
MC.variants.zener_smd = [
  { label: 'SMD-стабилитрон 5,1 В, SOD-123', m: ['SOD123'] },
  { label: 'SMD-стабилитрон 12 В, SOD-80 (MiniMELF)', m: ['MELF'] },
  { label: 'SMD-стабилитрон 15 В, SOT-23', m: ['SOT23'] },
  { label: 'SMD-стабилитрон 18 В, SOD-323', m: ['SOD123'], s: { diode: 1.02 } }
];
MC.variants.pwm_uc = [
  { label: 'UC3842 (запуск 16 В, до 100%)', m: ['UC3842'] },
  { label: 'UC3843 (запуск 8,4 В, до 100%)', m: ['UC3843'] },
  { label: 'UC3844 (запуск 16 В, до 50%)', m: ['UC3844'] },
  { label: 'UC3845 (запуск 8,4 В, до 50%)', m: ['UC3845'] }
];
MC.variants.pwm_sw = [
  { label: 'VIPer22A (DIP-8)', m: ['VIPer22A'] },
  { label: 'VIPer12A (DIP-8)', m: ['VIPer12A'] },
  { label: 'TNY266PN (DIP-8C)', m: ['TNY266PN'], s: { diode: 0.98 } },
  { label: 'TNY268PN (DIP-8C)', m: ['TNY268PN'], s: { diode: 0.98 } },
  { label: 'TOP245PN (DIP-8C)', m: ['TOP245PN'], s: { diode: 0.96 } }
];
MC.variants.pwm_ncp = [
  { label: 'NCP1203 (DIP-8)', m: ['NCP1203'] },
  { label: 'NCP1200 (DIP-8)', m: ['NCP1200'] },
  { label: 'NCP1271 (DIP-8)', m: ['NCP1271'], s: { diode: 1.02 } }
];
MC.variants.opto_triac = [
  { label: 'MOC3021 (без детектора нуля)', m: ['MOC3021'] },
  { label: 'MOC3063 (с детектором нуля)', m: ['MOC3063'] },
  { label: 'MOC3041 (с детектором нуля)', m: ['MOC3041'] }
];
MC.variants.opto_fast = [
  { label: 'Оптопара 6N137', m: ['6N137'] },
  { label: 'Оптопара HCPL-2601', m: ['HCPL2601'], s: { diode: 1.01 } }
];
MC.variants.opto_drv = [
  { label: 'Драйвер TLP250', m: ['TLP250'] },
  { label: 'Драйвер TLP350', m: ['TLP350'] },
  { label: 'Драйвер HCPL-3120', m: ['A3120'], s: { diode: 1.02 } }
];
