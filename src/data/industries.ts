import type { Industry } from '../types'

export const industries: Industry[] = [
  {
    id: 'marine-shipping',
    name: 'Marine Shipping',
    icon: 'Ship',
    description: 'Vessel fleet operators and ship managers trust Alka Traders for urgent OEM spare parts, navigation electronics, and engine room consumables — delivered to port or direct to vessel.',
    painPoints: [
      'Critical equipment failure mid-voyage with no local supplier',
      'Long lead times from OEMs causing extended vessel downtime',
      'Inconsistent quality from unauthorized aftermarket parts',
      'Complex customs clearance across multiple jurisdictions',
    ],
    productCount: 30,
  },
  {
    id: 'shipyards',
    name: 'Shipyards & Drydocks',
    icon: 'Anchor',
    description: 'Drydock and repair facilities rely on our broad inventory of structural, hydraulic, and electrical components to minimize vessel downtime during overhaul.',
    painPoints: [
      'Tight drydock schedules with no room for delayed parts',
      'Bulk sourcing coordination across multiple trades simultaneously',
      'Hydraulic system integration requiring matched component sets',
      'Cost overruns from fragmented supplier management',
    ],
    productCount: 12,
  },
  {
    id: 'oil-gas',
    name: 'Oil & Gas',
    icon: 'Flame',
    description: 'Upstream and downstream operators trust our certified stock of explosion-proof equipment, instrumentation, and control systems for both offshore and onshore facilities.',
    painPoints: [
      'ATEX/IECEx certification requirements limiting supplier options',
      'Remote offshore locations with infrequent supply vessel schedules',
      'Emergency shutdown component failures causing production loss',
      'Counterfeit part risk in high-value instrumentation',
    ],
    productCount: 14,
  },
  {
    id: 'power-generation',
    name: 'Power Generation',
    icon: 'Zap',
    description: 'Power plant procurement teams source turbine components, protection relays, switchgear, and transformer parts through Alka Traders\'s verified global network.',
    painPoints: [
      'Aging infrastructure with discontinued OEM parts',
      'Grid compliance requiring specific relay and protection settings',
      'Seasonal peak demand requiring pre-positioned spares inventory',
      'Multi-brand coordination across ABB, Siemens, and GE equipment',
    ],
    productCount: 14,
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: 'Factory',
    description: 'Production line managers and maintenance engineers reduce downtime by sourcing automation components, drive systems, and industrial sensors through a single procurement contact.',
    painPoints: [
      'Line stoppage costs exceeding $10,000 per minute',
      'Obsolescence management across mixed-vintage automation systems',
      'MRO inventory carrying costs vs. stock-out risk balancing',
      'Single-supplier dependency for mission-critical parts',
    ],
    productCount: 46,
  },
  {
    id: 'chemical-processing',
    name: 'Chemical Processing',
    icon: 'FlaskConical',
    description: 'Chemical plant procurement requires compliance-grade sourcing. We supply corrosion-resistant fittings, ATEX-rated equipment, and SIL-certified instrumentation.',
    painPoints: [
      'SIL certification documentation requiring full traceability',
      'Corrosion-resistant material specifications limiting suppliers',
      'Batch production schedules intolerant of delivery delays',
      'Regulatory inspection readiness requiring certified components',
    ],
    productCount: 4,
  },
]

export const industryIds = industries.map(i => i.id)
