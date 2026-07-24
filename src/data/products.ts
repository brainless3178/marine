import type { Product } from '../types'
import { getProductImageUrl } from '../lib/utils'

/**
 * Compute a deterministic price from a product ID.
 */
export function getProductPrice(id: string) {
  return ((id.charCodeAt(id.length - 1) * 37 + id.charCodeAt(id.length - 2) * 13) % 900) + 100
}

/**
 * Compute a deterministic condition & description for each product.
 */
function enrichProduct(base: Omit<Product, 'description' | 'condition' | 'price' | 'salePrice' | 'onSale' | 'inStock' | 'stockCount' | 'images' | 'customLabel' | 'isNewArrival' | 'makeOffer'> & { id: string }): Product {
  const id = base.id
  const code = id.charCodeAt(id.length - 1)
  const price = getProductPrice(id)
  const hasSale = code % 5 === 0
  const isNew = code % 7 === 0
  const conditions = ['reconditioned', 'used', 'new', 'refurbished', 'unused'] as const
  const condition = conditions[code % 5]

  return {
    ...base,
    filename: base.filename.includes('/') ? base.filename : `products/${base.filename}`,
    description: `${base.name} — ${condition === 'new' ? 'Brand new, factory-sealed' : condition === 'unused' ? 'New old stock, never used' : condition === 'reconditioned' ? 'Fully serviced, tested & working' : condition === 'refurbished' ? 'Professionally refurbished to working order' : 'Previously used, fully inspected and tested'} marine & industrial equipment. SKU: ${base.sku}.`,
    condition,
    price,
    salePrice: hasSale ? Math.round(price * 0.85) : undefined,
    onSale: hasSale,
    inStock: base.availability !== 'out-of-stock',
    stockCount: base.availability === 'emergency' ? 1 : (code % 12) + 1,
    images: [
      { url: getProductImageUrl(base.filename), alt: `${base.name} - Main View`, label: 'Main' },
    ],
    isNewArrival: isNew,
    makeOffer: true,
    customLabel: hasSale ? 'SALE' : isNew ? 'NEW' : undefined,
    customLabelColor: hasSale ? '#dc2626' : isNew ? '#159a67' : undefined,
  }
}

export const products: Product[] = [
  // MARINE EQUIPMENT
  enrichProduct({ id: 'prod-001', filename: 'product-001.jpg', name: 'Marine GPS Navigator', brand: 'ABB', sku: 'GPS-NAV-3200', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-002', filename: 'product-002.jpg', name: 'Deck Crane Hydraulic Motor', brand: 'Parker', sku: 'DCM-450-PK', category: 'marine', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-003', filename: 'product-003.jpg', name: 'VHF Marine Radio', brand: 'Siemens', sku: 'VHF-7800-SM', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-004', filename: 'product-004.jpg', name: 'Radar Antenna Unit', brand: 'Honeywell', sku: 'RAD-ANT-220', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-005', filename: 'product-005.jpg', name: 'ECDIS Navigation Display', brand: 'ABB', sku: 'ECDIS-9600', category: 'marine', industry: ['marine-shipping'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-006', filename: 'product-006.jpg', name: 'Marine Diesel Engine Sensor', brand: 'Bosch Rexroth', sku: 'MDS-SENS-44', category: 'marine', industry: ['marine-shipping', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-007', filename: 'product-007.jpg', name: 'Lifeboat Release Mechanism', brand: 'Siemens', sku: 'LRM-2200-SM', category: 'marine', industry: ['marine-shipping'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-008', filename: 'product-008.jpg', name: 'Anchor Windlass Motor', brand: 'ABB', sku: 'AWM-550-AB', category: 'marine', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-009', filename: 'product-009.jpg', name: 'Bilge Water Separator', brand: 'Danfoss', sku: 'BWS-150-DF', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-010', filename: 'product-010.jpg', name: 'Marine Exhaust Gas Monitor', brand: 'Emerson', sku: 'MEGM-880', category: 'marine', industry: ['marine-shipping', 'oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-011', filename: 'product-011.jpg', name: 'Bow Thruster Control Panel', brand: 'Schneider Electric', sku: 'BTP-3200-SE', category: 'marine', industry: ['marine-shipping'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-012', filename: 'product-012.jpg', name: 'Marine Fire Detection System', brand: 'Honeywell', sku: 'MFD-9000', category: 'marine', industry: ['marine-shipping', 'oil-gas'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-013', filename: 'product-013.jpg', name: 'Hatch Cover Hydraulic Cylinder', brand: 'Parker', sku: 'HHC-600-PK', category: 'marine', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-014', filename: 'product-014.jpg', name: 'Marine Ballast Pump', brand: 'Grundfos', sku: 'MBP-250-GF', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-015', filename: 'product-015.jpg', name: 'Steering Gear Actuator', brand: 'Bosch Rexroth', sku: 'SGA-400-BR', category: 'marine', industry: ['marine-shipping'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-016', filename: 'product-016.jpg', name: 'Marine Alarm Monitoring System', brand: 'ABB', sku: 'AMS-7700', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-017', filename: 'product-017.jpg', name: 'Deck Floodlight LED', brand: 'Schneider Electric', sku: 'DFL-LED-300', category: 'marine', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-018', filename: 'product-018.jpg', name: 'Marine Air Compressor', brand: 'Atlas Copco', sku: 'MAC-500-AC', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-019', filename: 'product-019.jpg', name: 'Ship Bell Alarm System', brand: 'Siemens', sku: 'SBAS-100-SM', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-020', filename: 'product-020.jpg', name: 'Marine Fuel Purifier', brand: 'Alfa Laval', sku: 'MFP-400-AL', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-021', filename: 'product-021.jpg', name: 'Life Jacket Light', brand: 'ABB', sku: 'LJL-LED-10', category: 'marine', industry: ['marine-shipping'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-022', filename: 'product-022.jpg', name: 'Marine Propeller Shaft Seal', brand: 'Bosch Rexroth', sku: 'MPSS-200-BR', category: 'marine', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-023', filename: 'product-023.jpg', name: 'Gyro Compass Unit', brand: 'Kongsberg', sku: 'GCU-6000', category: 'marine', industry: ['marine-shipping'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-024', filename: 'product-024.jpg', name: 'Marine Seawater Pump', brand: 'Grundfos', sku: 'MSP-350-GF', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-025', filename: 'product-025.jpg', name: 'Deck Crane Limit Switch', brand: 'Honeywell', sku: 'DCLS-55-HW', category: 'marine', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-026', filename: 'product-026.jpg', name: 'Marine Intercom System', brand: 'Siemens', sku: 'MIS-200-SM', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-027', filename: 'product-027.jpg', name: 'Cargo Hold Ventilation Fan', brand: 'ABB', sku: 'CHVF-400-AB', category: 'marine', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-028', filename: 'product-028.jpg', name: 'Marine Sewage Treatment Unit', brand: 'Wärtsilä', sku: 'MSTU-100-WT', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-029', filename: 'product-029.jpg', name: 'Bridge Wing Console', brand: 'Kongsberg', sku: 'BWC-5000', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-030', filename: 'product-030.jpg', name: 'Marine Oil Water Separator', brand: 'Alfa Laval', sku: 'MOWS-300-AL', category: 'marine', industry: ['marine-shipping', 'oil-gas'], availability: 'emergency', specs: {} }),

  // ELECTRICAL AUTOMATION
  enrichProduct({ id: 'prod-031', filename: 'product-031.jpg', name: 'Variable Speed Drive 2.2kW', brand: 'ABB', sku: 'ACS880-01-02A7', category: 'electrical', industry: ['manufacturing', 'power-generation'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-032', filename: 'product-032.jpg', name: 'PLC CPU Module S7-1500', brand: 'Siemens', sku: '6ES7511-1AK02', category: 'electrical', industry: ['manufacturing'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-033', filename: 'product-033.jpg', name: 'Contactor 40A 3-Pole', brand: 'Schneider Electric', sku: 'LC1D40M7C', category: 'electrical', industry: ['manufacturing', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-034', filename: 'product-034.jpg', name: 'Circuit Breaker MCCB 250A', brand: 'Schneider Electric', sku: 'NSX250F', category: 'electrical', industry: ['power-generation', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-035', filename: 'product-035.jpg', name: 'Frequency Inverter 7.5kW', brand: 'Siemens', sku: '6SL3224-0BE17', category: 'electrical', industry: ['manufacturing'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-036', filename: 'product-036.jpg', name: 'Motor Protection Relay', brand: 'ABB', sku: 'EF66-100-1SBL', category: 'electrical', industry: ['power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-037', filename: 'product-037.jpg', name: 'Soft Starter 45kW', brand: 'ABB', sku: 'PSTX470-600-70', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-038', filename: 'product-038.jpg', name: 'Power Factor Controller', brand: 'Schneider Electric', sku: 'VarSet-200', category: 'electrical', industry: ['power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-039', filename: 'product-039.jpg', name: 'Industrial HMI Panel 15 inch', brand: 'Siemens', sku: 'TP1500-Comfort', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-040', filename: 'product-040.jpg', name: 'Temperature Controller PID', brand: 'Honeywell', sku: 'DC1040-PT100', category: 'electrical', industry: ['chemical-processing', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-041', filename: 'product-041.jpg', name: 'Modular PLC I/O Module', brand: 'Siemens', sku: '6ES7131-6BH00', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-042', filename: 'product-042.jpg', name: 'DIN Rail Power Supply 24V', brand: 'Phoenix Contact', sku: 'QUINT4-PS', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-043', filename: 'product-043.jpg', name: 'Industrial Ethernet Switch', brand: 'Siemens', sku: 'SCALANCE-XC206', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-044', filename: 'product-044.jpg', name: 'Contactron Motor Starter', brand: 'Phoenix Contact', sku: 'EFFICIENT-250', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-045', filename: 'product-045.jpg', name: 'Servo Drive Unit 3kW', brand: 'Bosch Rexroth', sku: 'SEV-3000-BR', category: 'electrical', industry: ['manufacturing'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-046', filename: 'product-046.jpg', name: 'Molded Case Circuit Breaker', brand: 'ABB', sku: 'Tmax-XT2-250', category: 'electrical', industry: ['power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-047', filename: 'product-047.jpg', name: 'Digital Power Meter', brand: 'Schneider Electric', sku: 'PM8000-series', category: 'electrical', industry: ['power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-048', filename: 'product-048.jpg', name: 'Variable Frequency Drive 15kW', brand: 'Danfoss', sku: 'FC-102P1K5T4', category: 'electrical', industry: ['manufacturing'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-049', filename: 'product-049.jpg', name: 'Safety Relay Module', brand: 'Pilz', sku: 'PNOZ-X3-24VDC', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-050', filename: 'product-050.jpg', name: 'Panel Mount Ammeter', brand: 'Honeywell', sku: 'DAK-6000-AMP', category: 'electrical', industry: ['power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-051', filename: 'product-051.jpg', name: 'Industrial Relay Module 8CH', brand: 'Omron', sku: 'G2R-1-SN-24VDC', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-052', filename: 'product-052.jpg', name: 'Thermal Overload Relay', brand: 'Schneider Electric', sku: 'LRD3363C', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-053', filename: 'product-053.jpg', name: 'AC Drive Module 55kW', brand: 'Siemens', sku: 'G120C-PM250', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-054', filename: 'product-054.jpg', name: 'Smart MCC Panel Section', brand: 'ABB', sku: 'MNS-iS-4000', category: 'electrical', industry: ['manufacturing', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-055', filename: 'product-055.jpg', name: 'Surge Protection Device Type2', brand: 'Phoenix Contact', sku: 'VALVETRAB-275', category: 'electrical', industry: ['power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-056', filename: 'product-056.jpg', name: 'Industrial UPS 3kVA', brand: 'Emerson', sku: 'APC-SMT3000', category: 'electrical', industry: ['manufacturing', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-057', filename: 'product-057.jpg', name: 'Motor Soft Starter 132kW', brand: 'Siemens', sku: '3RT2036-2AK60', category: 'electrical', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-058', filename: 'product-058.jpg', name: 'Capacitor Bank 50kVAR', brand: 'ABB', sku: 'CLMD-50-AB', category: 'electrical', industry: ['power-generation'], availability: 'in-stock', specs: {} }),

  // HYDRAULIC SYSTEMS
  enrichProduct({ id: 'prod-059', filename: 'product-059.jpg', name: 'Axial Piston Pump 75cc', brand: 'Bosch Rexroth', sku: 'A10VSO-71-DFR1', category: 'hydraulic', industry: ['marine-shipping', 'oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-060', filename: 'product-060.jpg', name: 'Hydraulic Cylinder 100mm Bore', brand: 'Parker', sku: 'HCR-100-500-PK', category: 'hydraulic', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-061', filename: 'product-061.jpg', name: 'Directional Control Valve', brand: 'Bosch Rexroth', sku: '4WE6-E70-31', category: 'hydraulic', industry: ['manufacturing', 'oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-062', filename: 'product-062.jpg', name: 'Hydraulic Power Unit 15kW', brand: 'Parker', sku: 'HPU-15000-PK', category: 'hydraulic', industry: ['oil-gas', 'marine-shipping'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-063', filename: 'product-063.jpg', name: 'Gear Pump 40cc', brand: 'Bosch Rexroth', sku: 'CBN-F3040', category: 'hydraulic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-064', filename: 'product-064.jpg', name: 'Hydraulic Filter Element 10um', brand: 'Parker', sku: 'HC9600FKS13H', category: 'hydraulic', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-065', filename: 'product-065.jpg', name: 'Proportional Pressure Valve', brand: 'Bosch Rexroth', sku: 'DBE-6X-G24', category: 'hydraulic', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-066', filename: 'product-066.jpg', name: 'Hydraulic Accumulator 4L', brand: 'Parker', sku: 'PRM-4000-PK', category: 'hydraulic', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-067', filename: 'product-067.jpg', name: 'Vane Pump 25cc', brand: 'Parker', sku: 'T6DC-028-010', category: 'hydraulic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-068', filename: 'product-068.jpg', name: 'Counterbalance Valve', brand: 'Bosch Rexroth', sku: 'DZ10DP2-5X', category: 'hydraulic', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-069', filename: 'product-069.jpg', name: 'Hydraulic Hose Assembly 1m', brand: 'Parker', sku: '2SN-25-1000', category: 'hydraulic', industry: ['shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-070', filename: 'product-070.jpg', name: 'Flow Control Valve', brand: 'Bosch Rexroth', sku: '2FRM-16-31', category: 'hydraulic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-071', filename: 'product-071.jpg', name: 'Hydraulic Motor 500cc/rev', brand: 'Danfoss', sku: 'OMR-500-DF', category: 'hydraulic', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-072', filename: 'product-072.jpg', name: 'Pressure Relief Valve 250bar', brand: 'Parker', sku: 'DBDS-6-P1/315', category: 'hydraulic', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-073', filename: 'product-073.jpg', name: 'Hydraulic Tank 200L', brand: 'Bosch Rexroth', sku: 'TK-200-BR', category: 'hydraulic', industry: ['shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-074', filename: 'product-074.jpg', name: 'Hydraulic Manifold Block 6-Port', brand: 'Parker', sku: 'HMB-06-PK', category: 'hydraulic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-075', filename: 'product-075.jpg', name: 'Check Valve Pilot Operated', brand: 'Bosch Rexroth', sku: 'SL10PA2-5X', category: 'hydraulic', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-076', filename: 'product-076.jpg', name: 'Hydraulic Cartridge Valve', brand: 'Parker', sku: 'CD08-30-PK', category: 'hydraulic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-077', filename: 'product-077.jpg', name: 'Solenoid Valve 24VDC 3/2', brand: 'Bosch Rexroth', sku: '4WE5-C6X', category: 'hydraulic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-078', filename: 'product-078.jpg', name: 'Hydraulic Quick Coupling Set', brand: 'Parker', sku: 'Palmprint-60', category: 'hydraulic', industry: ['shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-079', filename: 'product-079.jpg', name: 'Radial Piston Pump 100cc', brand: 'Bosch Rexroth', sku: 'RP100-BR-31', category: 'hydraulic', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-080', filename: 'product-080.jpg', name: 'Hydraulic Oil Cooler 5kW', brand: 'Danfoss', sku: 'SK1-055-KK', category: 'hydraulic', industry: ['power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-081', filename: 'product-081.jpg', name: 'Proportional Flow Valve', brand: 'Bosch Rexroth', sku: '4WRPE-6-CB2', category: 'hydraulic', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-082', filename: 'product-082.jpg', name: 'Hydraulic Test Gauge 400bar', brand: 'Parker', sku: 'TG-400-PK', category: 'hydraulic', industry: ['shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-083', filename: 'product-083.jpg', name: 'Hydraulic Power Pack 5.5kW', brand: 'Parker', sku: 'HPU-5500-PK', category: 'hydraulic', industry: ['marine-shipping'], availability: 'emergency', specs: {} }),

  // PNEUMATIC SYSTEMS
  enrichProduct({ id: 'prod-084', filename: 'product-084.jpg', name: 'Pneumatic Cylinder ISO 15552', brand: 'Festo', sku: 'DSBC-63-200-PPVA', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-085', filename: 'product-085.jpg', name: 'Air Solenoid Valve 5/2', brand: 'SMC', sku: 'VFA5220-03', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-086', filename: 'product-086.jpg', name: 'FRL Unit with Gauge', brand: 'Festo', sku: 'MSB6-1Z', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-087', filename: 'product-087.jpg', name: 'Pneumatic Gripper Parallel', brand: 'SMC', sku: 'MHZ2-20D', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-088', filename: 'product-088.jpg', name: 'Air Dryer Regenerative', brand: 'Atlas Copco', sku: 'FD-410', category: 'pneumatic', industry: ['manufacturing', 'chemical-processing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-089', filename: 'product-089.jpg', name: 'Pneumatic Rotary Actuator', brand: 'Festo', sku: 'DRQD-25-90', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-090', filename: 'product-090.jpg', name: 'Quick Exhaust Valve', brand: 'SMC', sku: 'AQ2000-02', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-091', filename: 'product-091.jpg', name: 'Pneumatic Air Gun', brand: 'Festo', sku: 'MGP-40-AR', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-092', filename: 'product-092.jpg', name: 'Air Preparation Unit Mini', brand: 'SMC', sku: 'AC30-03-A', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-093', filename: 'product-093.jpg', name: 'Pneumatic Tubing 8mm Blue', brand: 'SMC', sku: 'TUB-8-BLU', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-094', filename: 'product-094.jpg', name: 'Flow Sensor Pneumatic', brand: 'Festo', sku: 'SFAB-10-10-1SA', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-095', filename: 'product-095.jpg', name: 'Vacuum Generator Multi Stage', brand: 'SMC', sku: 'ZU10-06-60', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-096', filename: 'product-096.jpg', name: 'Pneumatic Silencer Muffler', brand: 'SMC', sku: 'AN20-02-A', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-097', filename: 'product-097.jpg', name: 'Rodless Cylinder Guided', brand: 'Festo', sku: 'MFY-30-250', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-098', filename: 'product-098.jpg', name: 'Pneumatic Push-In Fitting Set', brand: 'SMC', sku: 'KQ2L-08-06A', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-099', filename: 'product-099.jpg', name: 'Air Receiver Tank 100L', brand: 'Atlas Copco', sku: 'ART-100-AC', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-100', filename: 'product-100.jpg', name: 'Pneumatic Timer Valve', brand: 'Festo', sku: 'VHEF-MS-L-1/8', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-101', filename: 'product-101.jpg', name: 'Pressure Switch Pneumatic', brand: 'SMC', sku: 'IS30-03-L', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-102', filename: 'product-102.jpg', name: 'Pneumatic Slide Table Cylinder', brand: 'Festo', sku: 'DGSL-16-80-PA', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-103', filename: 'product-103.jpg', name: 'Quick Connect Coupling Set', brand: 'SMC', sku: 'HRS-K310-08', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-104', filename: 'product-104.jpg', name: 'Pneumatic Filter Element 5um', brand: 'Festo', sku: 'LFMA-D-MIDI', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-105', filename: 'product-105.jpg', name: 'Micro Pneumatic Cylinder', brand: 'SMC', sku: 'CJPB6-4-DM', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),

  // INDUSTRIAL SPARE PARTS
  enrichProduct({ id: 'prod-106', filename: 'product-106.jpg', name: '3-Phase Induction Motor 15kW', brand: 'ABB', sku: 'M3AA-160LMB', category: 'spares', industry: ['manufacturing', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-107', filename: 'product-107.jpg', name: 'Deep Groove Ball Bearing 6205', brand: 'SKF', sku: '6205-2RS1', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-108', filename: 'product-108.jpg', name: 'Flexible Coupling 28mm', brand: 'Siemens', sku: 'FLDX-28-28', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-109', filename: 'product-109.jpg', name: 'Inductive Proximity Sensor M18', brand: 'IFM', sku: 'IF5291', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-110', filename: 'product-110.jpg', name: 'Industrial Encoder Incremental', brand: 'Pepperl+Fuchs', sku: 'AVM58-0R14RHG0', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-111', filename: 'product-111.jpg', name: 'AC Servo Motor 2kW', brand: 'Siemens', sku: '1FK7063-2AF71', category: 'spares', industry: ['manufacturing'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-112', filename: 'product-112.jpg', name: 'Thermal Overload Bimetal Relay', brand: 'ABB', sku: 'TF42-DA-2.5', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-113', filename: 'product-113.jpg', name: 'Timing Belt HTD 5M-450', brand: 'Gates', sku: '94395M45B15', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-114', filename: 'product-114.jpg', name: 'Stainless Steel Coupling Jaw', brand: 'Siemens', sku: 'R71-R-20-20', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-115', filename: 'product-115.jpg', name: 'Photoelectric Sensor Retro', brand: 'Sick', sku: 'W4S-3-P1170', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-116', filename: 'product-116.jpg', name: 'Vibration Sensor Industrial', brand: 'IFM', sku: 'VVB001', category: 'spares', industry: ['manufacturing', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-117', filename: 'product-117.jpg', name: 'NTN Bearing 6310-2RS', brand: 'NTN', sku: '6310-2RS1CM', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-118', filename: 'product-118.jpg', name: 'Fluorescent Tube Guard IP65', brand: 'Rittal', sku: 'SV-1500-FL', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-119', filename: 'product-119.jpg', name: 'Conveyor Rollers 50mm Ø', brand: 'Interroll', sku: 'R11100050050', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-120', filename: 'product-120.jpg', name: 'Power Cable 3G2.5mm 10m', brand: 'Lapp', sku: '0041261', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),

  // SURPLUS INVENTORY
  enrichProduct({ id: 'prod-121', filename: 'product-121.jpg', name: 'Unused ABB VFD ACS580', brand: 'ABB', sku: 'ACS580-01-12A4-4', category: 'surplus', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-122', filename: 'product-122.jpg', name: 'New Old Stock Siemens PLC S7-300', brand: 'Siemens', sku: '6ES7313-6BF03', category: 'surplus', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-123', filename: 'product-123.jpg', name: 'Surplus Hydraulic Pump A10VSO', brand: 'Bosch Rexroth', sku: 'A10VSO-140-DFR1', category: 'surplus', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-124', filename: 'product-124.jpg', name: 'Overstock Schneider MCCB 630A', brand: 'Schneider Electric', sku: 'NSX630F', category: 'surplus', industry: ['power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-125', filename: 'product-125.jpg', name: 'Unopened Parker Valve Kit', brand: 'Parker', sku: 'PVK-4300-PK', category: 'surplus', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-126', filename: 'product-126.jpg', name: 'Unused Atlas Air Compressor', brand: 'Atlas Copco', sku: 'GA-15-PLUS', category: 'surplus', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-127', filename: 'product-127.jpg', name: 'Surplus Festo Cylinder DSBC', brand: 'Festo', sku: 'DSBC-80-200', category: 'surplus', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-128', filename: 'product-128.jpg', name: 'Overstock Honeywell Sensor Kit', brand: 'Honeywell', sku: 'PK-HW-SENSOR', category: 'surplus', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-129', filename: 'product-129.jpg', name: 'New Danfoss Compressor SC15', brand: 'Danfoss', sku: 'SC15H-55', category: 'surplus', industry: ['marine-shipping'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-130', filename: 'product-130.jpg', name: 'Surplus Grundfos Pump CRN', brand: 'Grundfos', sku: 'CRN-32-6', category: 'surplus', industry: ['chemical-processing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-131', filename: 'product-131.jpg', name: 'Unused Emerson Valve Positioner', brand: 'Emerson', sku: 'DVC6200-HART', category: 'surplus', industry: ['oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-132', filename: 'product-132.jpg', name: 'Overstock SMC Pneumatic Set', brand: 'SMC', sku: 'SET-PN-PRO', category: 'surplus', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-133', filename: 'product-133.jpg', name: 'Surplus Siemens HMI TP1500', brand: 'Siemens', sku: 'TP1500-Comfort', category: 'surplus', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),

  // ── LIFTING & HANDLING ──
  enrichProduct({ id: 'prod-134', filename: 'product-134.jpg', name: 'Overhead Bridge Crane 5 Ton', brand: 'Demag', sku: 'OBC-5000-DM', category: 'lifting-handling', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-135', filename: 'product-135.jpg', name: 'Electric Chain Hoist 2 Ton', brand: 'Kito', sku: 'ECH-2000-KT', category: 'lifting-handling', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-136', filename: 'product-136.jpg', name: 'Manual Pallet Jack 2500kg', brand: 'Toyota', sku: 'MPJ-2500-TY', category: 'lifting-handling', industry: ['warehousing', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-137', filename: 'product-137.jpg', name: 'Forklift Counterbalance 3 Ton', brand: 'Toyota', sku: 'FCB-3000-TY', category: 'lifting-handling', industry: ['warehousing', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-138', filename: 'product-138.jpg', name: 'Jib Crane Floor Mounted 1 Ton', brand: 'Demag', sku: 'JCF-1000-DM', category: 'lifting-handling', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-139', filename: 'product-139.jpg', name: 'Hydraulic Scissor Lift Table', brand: 'Southworth', sku: 'HSLT-2000-SW', category: 'lifting-handling', industry: ['warehousing', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-140', filename: 'product-140.jpg', name: 'Wire Rope Sling Set 3m', brand: 'Crosby', sku: 'WRS-3000-CB', category: 'lifting-handling', industry: ['shipyards', 'construction'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-141', filename: 'product-141.jpg', name: 'Vacuum Lifting Pad 500kg', brand: 'Schmalz', sku: 'VLP-500-SZ', category: 'lifting-handling', industry: ['manufacturing'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-142', filename: 'product-142.jpg', name: 'Gantry Crane Adjustable 2 Ton', brand: 'Spanco', sku: 'GCA-2000-SP', category: 'lifting-handling', industry: ['shipyards', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-143', filename: 'product-143.jpg', name: 'Lifting Beam Spreader 4 Point', brand: 'Caldwell', sku: 'LBS-4P-CD', category: 'lifting-handling', industry: ['shipyards', 'construction'], availability: 'in-stock', specs: {} }),

  // ── TOOLS & EQUIPMENT ──
  enrichProduct({ id: 'prod-144', filename: 'product-144.jpg', name: 'Industrial Heat Gun 2000W', brand: 'Bosch', sku: 'HG-2000-BS', category: 'tools-equipment', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-145', filename: 'product-145.jpg', name: 'Digital Multimeter True RMS', brand: 'Fluke', sku: 'DMM-179-FL', category: 'tools-equipment', industry: ['manufacturing', 'electrical'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-146', filename: 'product-146.jpg', name: 'Battery Powered Impact Wrench', brand: 'Makita', sku: 'BIW-18V-MK', category: 'tools-equipment', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-147', filename: 'product-147.jpg', name: 'Angle Grinder 7 inch 2000W', brand: 'Bosch', sku: 'AG-7-2000-BS', category: 'tools-equipment', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-148', filename: 'product-148.jpg', name: 'Thermal Imaging Camera', brand: 'Flir', sku: 'TIC-E8-FL', category: 'tools-equipment', industry: ['manufacturing', 'electrical'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-149', filename: 'product-149.jpg', name: 'Bench Grinder 8 inch', brand: 'Delta', sku: 'BG-8-DL', category: 'tools-equipment', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-150', filename: 'product-150.jpg', name: 'Cordless Drill Driver 18V', brand: 'Makita', sku: 'CDD-18V-MK', category: 'tools-equipment', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-151', filename: 'product-151.jpg', name: 'Pipe Threading Machine 1/2-2 inch', brand: 'Ridgid', sku: 'PTM-535-RD', category: 'tools-equipment', industry: ['shipyards', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-152', filename: 'product-152.jpg', name: 'Ultrasonic Thickness Gauge', brand: 'Olympus', sku: 'UTG-38-OL', category: 'tools-equipment', industry: ['marine', 'oil-gas'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-153', filename: 'product-153.jpg', name: 'Hydraulic Crimping Tool 400mm²', brand: 'Klingspor', sku: 'HCT-400-KL', category: 'tools-equipment', industry: ['electrical', 'manufacturing'], availability: 'in-stock', specs: {} }),

  // ── SAFETY EQUIPMENT ──
  enrichProduct({ id: 'prod-154', filename: 'product-154.jpg', name: 'Full Body Fall Arrest Harness', brand: '3M', sku: 'FBH-500-3M', category: 'safety', industry: ['construction', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-155', filename: 'product-155.jpg', name: 'Gas Detector Multi-Gas', brand: 'Honeywell', sku: 'GD-MG-HW', category: 'safety', industry: ['oil-gas', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-156', filename: 'product-156.jpg', name: 'Fire Extinguisher CO2 5kg', brand: 'Amerex', sku: 'FEC-5-AM', category: 'safety', industry: ['marine', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-157', filename: 'product-157.jpg', name: 'Safety Helmet Industrial Grade', brand: 'MSA', sku: 'SH-V-GR-MSA', category: 'safety', industry: ['construction', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-158', filename: 'product-158.jpg', name: 'Welding Shield Auto-Darkening', brand: 'Lincoln', sku: 'WS-AD-LN', category: 'safety', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-159', filename: 'product-159.jpg', name: 'Emergency Eye Wash Station', brand: 'Bradley', sku: 'EWS-PB-BR', category: 'safety', industry: ['manufacturing', 'chemical'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-160', filename: 'product-160.jpg', name: 'High Visibility Safety Vest Class 2', brand: '3M', sku: 'HVV-C2-3M', category: 'safety', industry: ['construction', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-161', filename: 'product-161.jpg', name: 'Safety Goggles Anti-Fog', brand: 'Uvex', sku: 'SG-AF-UV', category: 'safety', industry: ['manufacturing', 'chemical'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-162', filename: 'product-162.jpg', name: 'Life Buoy Ring 30 inch', brand: 'Mustang', sku: 'LBR-30-MS', category: 'safety', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-163', filename: 'product-163.jpg', name: 'Confined Space Tripod Kit', brand: '3M', sku: 'CSTK-3M', category: 'safety', industry: ['marine', 'construction'], availability: 'in-stock', specs: {} }),

  // ── HAND TOOLS ──
  enrichProduct({ id: 'prod-164', filename: 'product-164.jpg', name: 'Combination Wrench Set 8-24mm', brand: 'Snap-On', sku: 'CWS-824-SO', category: 'hand-tools', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-165', filename: 'product-165.jpg', name: 'Socket Set 1/2 Drive 40 Piece', brand: 'Proto', sku: 'SS-1240-PR', category: 'hand-tools', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-166', filename: 'product-166.jpg', name: 'Adjustable Wrench 12 inch', brand: 'Bahco', sku: 'AW-12-BH', category: 'hand-tools', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-167', filename: 'product-167.jpg', name: 'Ball Peen Hammer 16oz', brand: 'Stanley', sku: 'BPH-16-ST', category: 'hand-tools', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-168', filename: 'product-168.jpg', name: 'Pliers Set 4 Piece Insulated', brand: 'Klein', sku: 'PS-4-KL', category: 'hand-tools', industry: ['electrical', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-169', filename: 'product-169.jpg', name: 'Torque Wrench 1/2 Drive 20-250Nm', brand: 'Proto', sku: 'TW-12250-PR', category: 'hand-tools', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-170', filename: 'product-170.jpg', name: 'Precision Screwdriver Set 12pc', brand: 'Wiha', sku: 'PSS-12-WH', category: 'hand-tools', industry: ['manufacturing', 'electrical'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-171', filename: 'product-171.jpg', name: 'Hacksaw Frame Heavy Duty', brand: 'Stanley', sku: 'HF-HD-ST', category: 'hand-tools', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-172', filename: 'product-172.jpg', name: 'Pipe Wrench 24 inch', brand: 'Ridgid', sku: 'PW-24-RD', category: 'hand-tools', industry: ['shipyards', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-173', filename: 'product-173.jpg', name: 'Chisel Set Cold 6 Piece', brand: 'Proto', sku: 'CS-6-PR', category: 'hand-tools', industry: ['manufacturing', 'construction'], availability: 'in-stock', specs: {} }),

  // ── SHIP NAVIGATION ──
  enrichProduct({ id: 'prod-174', filename: 'product-174.jpg', name: 'Autopilot System Marine', brand: 'Simrad', sku: 'AP-M-SR', category: 'ship-navigation', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-175', filename: 'product-175.jpg', name: 'Chart Plotter GPS 12 inch', brand: 'Furuno', sku: 'CP-12-FR', category: 'ship-navigation', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-176', filename: 'product-176.jpg', name: 'Marine Radar Scanner 24NM', brand: 'Furuno', sku: 'MRS-24-FR', category: 'ship-navigation', industry: ['marine'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-177', filename: 'product-177.jpg', name: 'AIS Transceiver Class A', brand: 'Comnav', sku: 'AIS-CA-CN', category: 'ship-navigation', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-178', filename: 'product-178.jpg', name: 'Magnetic Compass Steering', brand: 'Sestrel', sku: 'MCS-SR', category: 'ship-navigation', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-179', filename: 'product-179.jpg', name: 'GPS Receiver Antenna', brand: 'Garmin', sku: 'GPS-A-GM', category: 'ship-navigation', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-180', filename: 'product-180.jpg', name: 'Depth Sounder Transducer', brand: 'Furuno', sku: 'DST-520-FR', category: 'ship-navigation', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-181', filename: 'product-181.jpg', name: 'Wind Sensor Anemometer Marine', brand: 'Raymarine', sku: 'WS-AM-RM', category: 'ship-navigation', industry: ['marine'], availability: 'in-stock', specs: {} }),

  // ── MARINE PUMPS ──
  enrichProduct({ id: 'prod-182', filename: 'product-182.jpg', name: 'Bilge Pump Submersible 2000GPH', brand: 'Rule', sku: 'BPS-2000-RL', category: 'marine-pumps', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-183', filename: 'product-183.jpg', name: 'Ballast Pump Centrifugal 4 inch', brand: 'Grundfos', sku: 'BPC-4-GF', category: 'marine-pumps', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-184', filename: 'product-184.jpg', name: 'Seawater Cooling Pump Bronze', brand: 'Jabsco', sku: 'SWPCB-JB', category: 'marine-pumps', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-185', filename: 'product-185.jpg', name: 'Deck Washdown Pump 12V', brand: 'Shurflo', sku: 'DWP-12V-SF', category: 'marine-pumps', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-186', filename: 'product-186.jpg', name: 'Fuel Transfer Pump 12V 30GPH', brand: 'Flojet', sku: 'FTP-12V-FJ', category: 'marine-pumps', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-187', filename: 'product-187.jpg', name: 'Fresh Water Pressure Pump', brand: 'Jabsco', sku: 'FWPP-JB', category: 'marine-pumps', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-188', filename: 'product-188.jpg', name: 'Desalination Pump High Pressure', brand: 'Katadyn', sku: 'DP-HP-KT', category: 'marine-pumps', industry: ['marine'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-189', filename: 'product-189.jpg', name: 'Emergency Fire Pump Diesel', brand: 'Grundfos', sku: 'EFP-D-GF', category: 'marine-pumps', industry: ['marine'], availability: 'emergency', specs: {} }),

  // ── ENGINE SPARE PARTS ──
  enrichProduct({ id: 'prod-190', filename: 'product-190.jpg', name: 'Diesel Engine Piston Ring Set', brand: 'MAN', sku: 'DEPRS-MAN', category: 'engine-spare', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-191', filename: 'product-191.jpg', name: 'Cylinder Head Gasket Set', brand: 'Caterpillar', sku: 'CHGS-CAT', category: 'engine-spare', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-192', filename: 'product-192.jpg', name: 'Engine Valve Intake & Exhaust Set', brand: 'MAN', sku: 'EVIES-MAN', category: 'engine-spare', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-193', filename: 'product-193.jpg', name: 'Connecting Rod Bearing Set', brand: 'Caterpillar', sku: 'CRBS-CAT', category: 'engine-spare', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-194', filename: 'product-194.jpg', name: 'Engine Liner Cylinder Sleeve', brand: 'Wärtsilä', sku: 'ELCS-WRT', category: 'engine-spare', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-195', filename: 'product-195.jpg', name: 'Crankshaft Main Bearing Set', brand: 'MAN', sku: 'CMBS-MAN', category: 'engine-spare', industry: ['marine', 'power-generation'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-196', filename: 'product-196.jpg', name: 'Oil Pump Gear Complete', brand: 'Cummins', sku: 'OPGC-CM', category: 'engine-spare', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-197', filename: 'product-197.jpg', name: 'Water Pump Impeller Marine', brand: 'Jabsco', sku: 'WPIM-JB', category: 'engine-spare', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-198', filename: 'product-198.jpg', name: 'Injection Pump Element', brand: 'Bosch', sku: 'IPE-BS', category: 'engine-spare', industry: ['marine', 'power-generation'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-199', filename: 'product-199.jpg', name: 'Turbocharger Repair Kit', brand: 'Holset', sku: 'TRK-HT', category: 'engine-spare', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),

  // ── ENGINE PARTS ──
  enrichProduct({ id: 'prod-200', filename: 'product-200.jpg', name: 'Fuel Injector Common Rail', brand: 'Bosch', sku: 'FICR-BS', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-201', filename: 'product-201.jpg', name: 'Turbocharger Complete TPS48', brand: 'Holset', sku: 'TCTC-HL', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-202', filename: 'product-202.jpg', name: 'Heat Exchanger Shell & Tube', brand: 'Alfa Laval', sku: 'HEST-AL', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-203', filename: 'product-203.jpg', name: 'Intercooler Charge Air Cooler', brand: 'MAN', sku: 'ICAC-MAN', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-204', filename: 'product-204.jpg', name: 'Engine Control Module ECU', brand: 'Caterpillar', sku: 'ECM-CAT', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-205', filename: 'product-205.jpg', name: 'Starter Motor Marine 24V', brand: 'Delco Remy', sku: 'SMM-24V-DR', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-206', filename: 'product-206.jpg', name: 'Alternator Marine 150A 24V', brand: 'Delco Remy', sku: 'AM-150-DR', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-207', filename: 'product-207.jpg', name: 'Fuel Cooler Engine Bypass', brand: 'MAN', sku: 'FCEB-MAN', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-208', filename: 'product-208.jpg', name: 'EGR Valve Complete', brand: 'Cummins', sku: 'EGRV-CM', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-209', filename: 'product-209.jpg', name: 'Oil Cooler Engine Plate Type', brand: 'Caterpillar', sku: 'OCEP-CAT', category: 'engine-parts', industry: ['marine', 'power-generation'], availability: 'emergency', specs: {} }),

  // ── MOTORS & COMPONENTS ──
  enrichProduct({ id: 'prod-210', filename: 'product-210.jpg', name: 'AC Induction Motor 7.5kW 3-Phase', brand: 'ABB', sku: 'AIM-7.5-AB', category: 'motor-components', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-211', filename: 'product-211.jpg', name: 'Servo Motor 1.5kW with Encoder', brand: 'Siemens', sku: 'SM-1.5-SM', category: 'motor-components', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-212', filename: 'product-212.jpg', name: 'Helical Gearbox Ratio 20:1', brand: 'Sew Eurodrive', sku: 'HGR-20-SE', category: 'motor-components', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-213', filename: 'product-213.jpg', name: 'DC Motor 2kW 180V', brand: 'Baldor', sku: 'DCM-2KW-BD', category: 'motor-components', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-214', filename: 'product-214.jpg', name: 'Brake Motor 3kW Disc Brake', brand: 'Siemens', sku: 'BMD-3-SM', category: 'motor-components', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-215', filename: 'product-215.jpg', name: 'Worm Gearbox Reduction 40:1', brand: 'Sew Eurodrive', sku: 'WGR-40-SE', category: 'motor-components', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-216', filename: 'product-216.jpg', name: 'Explosion Proof Motor 5kW', brand: 'ABB', sku: 'EPM-5-AB', category: 'motor-components', industry: ['oil-gas', 'marine'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-217', filename: 'product-217.jpg', name: 'Stepper Motor NEMA 34 5Nm', brand: 'Oriental Motor', sku: 'SM-N34-5-OM', category: 'motor-components', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-218', filename: 'product-218.jpg', name: 'Motor Starter Combination 7.5kW', brand: 'Schneider Electric', sku: 'MSC-7.5-SE', category: 'motor-components', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-219', filename: 'product-219.jpg', name: 'Variable Frequency Drive 11kW', brand: 'Danfoss', sku: 'VFD-11-DF', category: 'motor-components', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),

  // ── SHIP MACHINERY ──
  enrichProduct({ id: 'prod-220', filename: 'product-220.jpg', name: 'Anchor Windlass Hydraulic', brand: 'Parker', sku: 'AWH-PK', category: 'ship-machinery', industry: ['marine', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-221', filename: 'product-221.jpg', name: 'Mooring Winch Electric 10 Ton', brand: 'Robbins', sku: 'MW-10T-RB', category: 'ship-machinery', industry: ['marine', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-222', filename: 'product-222.jpg', name: 'Steering Gear Rack & Pinion', brand: 'Rolls Royce', sku: 'SGRP-RR', category: 'ship-machinery', industry: ['marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-223', filename: 'product-223.jpg', name: 'Bow Thruster Tunnel 10kW', brand: 'Sleipner', sku: 'BTT-10-SL', category: 'ship-machinery', industry: ['marine'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-224', filename: 'product-224.jpg', name: 'Propeller CP Pitch 4-Blade', brand: 'Kamewa', sku: 'PCP4-KW', category: 'ship-machinery', industry: ['marine', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-225', filename: 'product-225.jpg', name: 'Stern Tube Seal Assembly', brand: 'Wärtsilä', sku: 'STSA-WRT', category: 'ship-machinery', industry: ['marine', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-226', filename: 'product-226.jpg', name: 'Deck Crane Knuckle Boom 3 Ton', brand: 'Palfinger', sku: 'DCKB-3-PF', category: 'ship-machinery', industry: ['marine', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-227', filename: 'product-227.jpg', name: 'Capstan Mooring Drum 5 Ton', brand: 'Robbins', sku: 'CMD-5-RB', category: 'ship-machinery', industry: ['marine', 'shipyards'], availability: 'in-stock', specs: {} }),

  // ── HYDRAULIC PUMPS ──
  enrichProduct({ id: 'prod-228', filename: 'product-228.jpg', name: 'Axial Piston Pump Variable 100cc', brand: 'Bosch Rexroth', sku: 'APPV-100-BR', category: 'hydraulic-pumps', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-229', filename: 'product-229.jpg', name: 'External Gear Pump 50cc', brand: 'Parker', sku: 'EGP-50-PK', category: 'hydraulic-pumps', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-230', filename: 'product-230.jpg', name: 'Vane Pump Variable 35cc', brand: 'Parker', sku: 'VPV-35-PK', category: 'hydraulic-pumps', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-231', filename: 'product-231.jpg', name: 'Radial Piston Pump Fixed 200cc', brand: 'Bosch Rexroth', sku: 'RPPF-200-BR', category: 'hydraulic-pumps', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-232', filename: 'product-232.jpg', name: 'Hydraulic Hand Pump 700bar', brand: 'Enerpac', sku: 'HHP-700-EP', category: 'hydraulic-pumps', industry: ['manufacturing', 'construction'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-233', filename: 'product-233.jpg', name: 'Screw Pump Progressive Cavity', brand: 'Netzsch', sku: 'SPPC-NT', category: 'hydraulic-pumps', industry: ['chemical', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-234', filename: 'product-234.jpg', name: 'Hydraulic Power Pack 20kW', brand: 'Parker', sku: 'HPP-20-PK', category: 'hydraulic-pumps', industry: ['manufacturing', 'marine'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-235', filename: 'product-235.jpg', name: 'Piston Pump Repair Kit', brand: 'Bosch Rexroth', sku: 'PPRK-BR', category: 'hydraulic-pumps', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),

  // ── RIGGING & LASHING ──
  enrichProduct({ id: 'prod-236', filename: 'product-236.jpg', name: 'Lifting Sling Round 3 Ton 2m', brand: 'Lift-All', sku: 'LSR-3T2M-LA', category: 'rigging', industry: ['shipyards', 'construction'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-237', filename: 'product-237.jpg', name: 'Chain Sling Grade 80 8mm 2m', brand: 'Pewag', sku: 'CS-G80-PW', category: 'rigging', industry: ['shipyards', 'construction'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-238', filename: 'product-238.jpg', name: 'Shackle Screw Pin 2 Ton', brand: 'Crosby', sku: 'SSP-2T-CB', category: 'rigging', industry: ['shipyards', 'construction'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-239', filename: 'product-239.jpg', name: 'Ratchet Tie Down 5m 500kg', brand: 'Kinedyne', sku: 'RTD-5M-KD', category: 'rigging', industry: ['logistics', 'transport'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-240', filename: 'product-240.jpg', name: 'Wire Rope Clip Galvanized 10mm', brand: 'Crosby', sku: 'WRC-10-CB', category: 'rigging', industry: ['shipyards', 'construction'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-241', filename: 'product-241.jpg', name: 'Hoist Ring Swivel 1 Ton', brand: 'Jergens', sku: 'HRS-1T-JG', category: 'rigging', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-242', filename: 'product-242.jpg', name: 'Turnbuckle Jaw & Jaw 12mm', brand: 'Crosby', sku: 'TBJJ-12-CB', category: 'rigging', industry: ['construction', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-243', filename: 'product-243.jpg', name: 'Load Binder Lever Type 5 Ton', brand: 'Kinedyne', sku: 'LBLT-5-KD', category: 'rigging', industry: ['logistics', 'transport'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-244', filename: 'product-244.jpg', name: 'Lifting Eye Bolt Forged 1 Ton', brand: 'Crosby', sku: 'LEB-1T-CB', category: 'rigging', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-245', filename: 'product-245.jpg', name: 'Cargo Net Lifting 2m x 2m', brand: 'Lift-All', sku: 'CNL-2M-LA', category: 'rigging', industry: ['logistics', 'shipyards'], availability: 'in-stock', specs: {} }),

  // ── OTHER BUSINESS & INDUSTRIAL ──
  enrichProduct({ id: 'prod-246', filename: 'product-246.jpg', name: 'Industrial Vacuum Cleaner 30L', brand: 'Nilfisk', sku: 'IVC-30-NF', category: 'other-business', industry: ['manufacturing', 'marine'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-247', filename: 'product-247.jpg', name: 'Workshop Workbench Steel 1800mm', brand: 'Lista', sku: 'WWS-1800-LS', category: 'other-business', industry: ['manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-248', filename: 'product-248.jpg', name: 'Industrial Fan Wall Mount 24 inch', brand: 'Big Ass Fans', sku: 'IFWM-24-BF', category: 'other-business', industry: ['manufacturing', 'warehousing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-249', filename: 'product-249.jpg', name: 'Storage Cabinet Heavy Duty 12 Door', brand: 'Lista', sku: 'SCHD-12-LS', category: 'other-business', industry: ['manufacturing', 'warehousing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-250', filename: 'product-250.jpg', name: 'Pallet Racking System 2 Ton Bay', brand: 'Rackline', sku: 'PRS-2T-RL', category: 'other-business', industry: ['warehousing', 'logistics'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-251', filename: 'product-251.jpg', name: 'Air Compressor Screw 7.5kW 10bar', brand: 'Atlas Copco', sku: 'ACS-7.5-AC', category: 'other-business', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-252', filename: 'product-252.jpg', name: 'Water Jet Cutter 4000bar', brand: 'KMT', sku: 'WJC-4000-KT', category: 'other-business', industry: ['manufacturing'], availability: 'emergency', specs: {} }),
  enrichProduct({ id: 'prod-253', filename: 'product-253.jpg', name: 'Industrial Scale Floor 2000kg', brand: 'Mettler', sku: 'ISF-2000-MT', category: 'other-business', industry: ['warehousing', 'logistics'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-254', filename: 'product-254.jpg', name: 'Label Printer Industrial Thermal', brand: 'Zebra', sku: 'LPIT-ZB', category: 'other-business', industry: ['warehousing', 'manufacturing'], availability: 'in-stock', specs: {} }),
  enrichProduct({ id: 'prod-255', filename: 'product-255.jpg', name: 'Industrial Dehumidifier 50L/day', brand: 'Munters', sku: 'IDH-50-MT', category: 'other-business', industry: ['warehousing', 'marine'], availability: 'in-stock', specs: {} }),
]

interface CategoryMeta {
  id: string
  name: string
  icon: string
}

const categoryMeta: CategoryMeta[] = [
  { id: 'marine', name: 'Marine Equipment', icon: 'Ship' },
  { id: 'electrical', name: 'Electrical Automation', icon: 'Zap' },
  { id: 'hydraulic', name: 'Hydraulic Systems', icon: 'Droplet' },
  { id: 'pneumatic', name: 'Pneumatic Systems', icon: 'Wind' },
  { id: 'spares', name: 'Industrial Spare Parts', icon: 'Settings' },
  { id: 'surplus', name: 'Surplus Inventory', icon: 'Warehouse' },
  { id: 'lifting-handling', name: 'Lifting & Handling', icon: 'ArrowUpFromLine' },
  { id: 'tools-equipment', name: 'Tools & Equipment', icon: 'Wrench' },
  { id: 'safety', name: 'Safety Equipment', icon: 'ShieldCheck' },
  { id: 'hand-tools', name: 'Hand Tools', icon: 'Hammer' },
  { id: 'ship-navigation', name: 'Ship Navigation', icon: 'Compass' },
  { id: 'marine-pumps', name: 'Marine Pumps', icon: 'Droplets' },
  { id: 'engine-spare', name: 'Engine Spare Parts', icon: 'Cog' },
  { id: 'engine-parts', name: 'Engine Parts', icon: 'Cog' },
  { id: 'motor-components', name: 'Motors & Components', icon: 'Zap' },
  { id: 'ship-machinery', name: 'Ship Machinery', icon: 'Ship' },
  { id: 'hydraulic-pumps', name: 'Hydraulic Pumps', icon: 'Droplet' },
  { id: 'rigging', name: 'Rigging & Lashing', icon: 'Anchor' },
  { id: 'other-business', name: 'Other Business & Industrial', icon: 'Package' },
]

/**
 * Auto-calculated from the products array so counts never go stale.
 */
function buildProductCategories() {
  const counts = new Map<string, number>()
  for (const p of products) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  }
  return categoryMeta.map((cat) => ({
    ...cat,
    count: counts.get(cat.id) ?? 0,
  }))
}

export const productCategories = buildProductCategories()
