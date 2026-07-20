import type { Brand } from '../types'

export const brands: Brand[] = [
  { id: 'abb', name: 'ABB', slug: 'abb', sectors: ['Marine', 'Industrial', 'Automation'], productCount: 12 },
  { id: 'siemens', name: 'Siemens', slug: 'siemens', sectors: ['Marine', 'Industrial', 'Automation'], productCount: 11 },
  { id: 'parker', name: 'Parker Hannifin', slug: 'parker', sectors: ['Marine', 'Industrial', 'Hydraulic'], productCount: 10 },
  { id: 'bosch', name: 'Bosch Rexroth', slug: 'bosch', sectors: ['Industrial', 'Hydraulic', 'Automation'], productCount: 12 },
  { id: 'schneider', name: 'Schneider Electric', slug: 'schneider', sectors: ['Industrial', 'Automation'], productCount: 8 },
  { id: 'danfoss', name: 'Danfoss', slug: 'danfoss', sectors: ['Marine', 'Industrial'], productCount: 5 },
  { id: 'honeywell', name: 'Honeywell', slug: 'honeywell', sectors: ['Marine', 'Industrial', 'Automation'], productCount: 5 },
  { id: 'emerson', name: 'Emerson', slug: 'emerson', sectors: ['Industrial', 'Automation'], productCount: 3 },
  { id: 'festo', name: 'Festo', slug: 'festo', sectors: ['Industrial', 'Pneumatic'], productCount: 8 },
  { id: 'smc', name: 'SMC', slug: 'smc', sectors: ['Industrial', 'Pneumatic'], productCount: 8 },
  { id: 'grundfos', name: 'Grundfos', slug: 'grundfos', sectors: ['Marine', 'Industrial'], productCount: 3 },
  { id: 'atlas', name: 'Atlas Copco', slug: 'atlas', sectors: ['Industrial', 'Pneumatic'], productCount: 3 },
  { id: 'wartsila', name: 'Wärtsilä', slug: 'wartsila', sectors: ['Marine'], productCount: 1 },
  { id: 'alfa-laval', name: 'Alfa Laval', slug: 'alfa-laval', sectors: ['Marine', 'Industrial'], productCount: 2 },
  { id: 'kongsberg', name: 'Kongsberg', slug: 'kongsberg', sectors: ['Marine'], productCount: 2 },
  { id: 'skf', name: 'SKF', slug: 'skf', sectors: ['Industrial'], productCount: 1 },
  { id: 'ifm', name: 'IFM', slug: 'ifm', sectors: ['Industrial', 'Automation'], productCount: 2 },
  { id: 'pepperl', name: 'Pepperl+Fuchs', slug: 'pepperl', sectors: ['Industrial', 'Automation'], productCount: 1 },
  { id: 'sick', name: 'Sick AG', slug: 'sick', sectors: ['Industrial', 'Automation'], productCount: 1 },
  { id: 'omron', name: 'Omron', slug: 'omron', sectors: ['Industrial', 'Automation'], productCount: 1 },
  { id: 'phoenix', name: 'Phoenix Contact', slug: 'phoenix', sectors: ['Industrial', 'Automation'], productCount: 3 },
  { id: 'rittal', name: 'Rittal', slug: 'rittal', sectors: ['Industrial'], productCount: 1 },
]

export const brandMarqueeItems = [
  'ABB', 'Siemens', 'Parker Hannifin', 'Bosch Rexroth', 'Schneider Electric',
  'Danfoss', 'Honeywell', 'Emerson', 'Festo', 'SMC', 'Grundfos', 'Atlas Copco',
  'Wärtsilä', 'MAN Energy', 'Alfa Laval', 'Kongsberg', 'Yokogawa',
  'Endress+Hauser', 'Pepperl+Fuchs', 'Phoenix Contact',
]

export const brandMarqueeItems2 = [
  'Rockwell Automation', 'Mitsubishi Electric', 'Omron', 'Fuji Electric',
  'ABB', 'Siemens', 'Parker Hannifin', 'Bosch Rexroth', 'Eaton', 'Legrand',
  'Weidmüller', 'Rittal', 'Allen-Bradley', 'Turck', 'IFM', 'Balluff',
  'Sick AG', 'Keyence', 'Banner Engineering', 'Beckhoff',
]
