#!/usr/bin/env node
/**
 * Generate category-specific product images for all 255 products.
 * Each image is 600x600 (1:1) with category-appropriate equipment visuals.
 */

import sharp from 'sharp'
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'

const IMAGES_DIR = join(process.cwd(), 'public', 'images')
const SIZE = 600

// ── Product definitions (first 100) ──
const products = [
  // Marine Equipment (prod-001 to prod-030)
  { id: 'prod-001', name: 'Marine GPS Navigator', brand: 'ABB', category: 'marine' },
  { id: 'prod-002', name: 'Deck Crane Hydraulic Motor', brand: 'Parker', category: 'marine' },
  { id: 'prod-003', name: 'VHF Marine Radio', brand: 'Siemens', category: 'marine' },
  { id: 'prod-004', name: 'Radar Antenna Unit', brand: 'Honeywell', category: 'marine' },
  { id: 'prod-005', name: 'ECDIS Navigation Display', brand: 'ABB', category: 'marine' },
  { id: 'prod-006', name: 'Marine Diesel Engine Sensor', brand: 'Bosch Rexroth', category: 'marine' },
  { id: 'prod-007', name: 'Lifeboat Release Mechanism', brand: 'Siemens', category: 'marine' },
  { id: 'prod-008', name: 'Anchor Windlass Motor', brand: 'ABB', category: 'marine' },
  { id: 'prod-009', name: 'Bilge Water Separator', brand: 'Danfoss', category: 'marine' },
  { id: 'prod-010', name: 'Marine Exhaust Gas Monitor', brand: 'Emerson', category: 'marine' },
  { id: 'prod-011', name: 'Bow Thruster Control Panel', brand: 'Schneider Electric', category: 'marine' },
  { id: 'prod-012', name: 'Marine Fire Detection System', brand: 'Honeywell', category: 'marine' },
  { id: 'prod-013', name: 'Hatch Cover Hydraulic Cylinder', brand: 'Parker', category: 'marine' },
  { id: 'prod-014', name: 'Marine Ballast Pump', brand: 'Grundfos', category: 'marine' },
  { id: 'prod-015', name: 'Steering Gear Actuator', brand: 'Bosch Rexroth', category: 'marine' },
  { id: 'prod-016', name: 'Marine Alarm Monitoring System', brand: 'ABB', category: 'marine' },
  { id: 'prod-017', name: 'Deck Floodlight LED', brand: 'Schneider Electric', category: 'marine' },
  { id: 'prod-018', name: 'Marine Air Compressor', brand: 'Atlas Copco', category: 'marine' },
  { id: 'prod-019', name: 'Ship Bell Alarm System', brand: 'Siemens', category: 'marine' },
  { id: 'prod-020', name: 'Marine Fuel Purifier', brand: 'Alfa Laval', category: 'marine' },
  { id: 'prod-021', name: 'Life Jacket Light', brand: 'ABB', category: 'marine' },
  { id: 'prod-022', name: 'Marine Propeller Shaft Seal', brand: 'Bosch Rexroth', category: 'marine' },
  { id: 'prod-023', name: 'Gyro Compass Unit', brand: 'Kongsberg', category: 'marine' },
  { id: 'prod-024', name: 'Marine Seawater Pump', brand: 'Grundfos', category: 'marine' },
  { id: 'prod-025', name: 'Deck Crane Limit Switch', brand: 'Honeywell', category: 'marine' },
  { id: 'prod-026', name: 'Marine Intercom System', brand: 'Siemens', category: 'marine' },
  { id: 'prod-027', name: 'Cargo Hold Ventilation Fan', brand: 'ABB', category: 'marine' },
  { id: 'prod-028', name: 'Marine Sewage Treatment Unit', brand: 'Wärtsilä', category: 'marine' },
  { id: 'prod-029', name: 'Bridge Wing Console', brand: 'Kongsberg', category: 'marine' },
  { id: 'prod-030', name: 'Marine Oil Water Separator', brand: 'Alfa Laval', category: 'marine' },
  // Electrical Automation (prod-031 to prod-058)
  { id: 'prod-031', name: 'Variable Speed Drive 2.2kW', brand: 'ABB', category: 'electrical' },
  { id: 'prod-032', name: 'PLC CPU Module S7-1500', brand: 'Siemens', category: 'electrical' },
  { id: 'prod-033', name: 'Contactor 40A 3-Pole', brand: 'Schneider Electric', category: 'electrical' },
  { id: 'prod-034', name: 'Circuit Breaker MCCB 250A', brand: 'Schneider Electric', category: 'electrical' },
  { id: 'prod-035', name: 'Frequency Inverter 7.5kW', brand: 'Siemens', category: 'electrical' },
  { id: 'prod-036', name: 'Motor Protection Relay', brand: 'ABB', category: 'electrical' },
  { id: 'prod-037', name: 'Soft Starter 45kW', brand: 'ABB', category: 'electrical' },
  { id: 'prod-038', name: 'Power Factor Controller', brand: 'Schneider Electric', category: 'electrical' },
  { id: 'prod-039', name: 'Industrial HMI Panel 15 inch', brand: 'Siemens', category: 'electrical' },
  { id: 'prod-040', name: 'Temperature Controller PID', brand: 'Honeywell', category: 'electrical' },
  { id: 'prod-041', name: 'Modular PLC I/O Module', brand: 'Siemens', category: 'electrical' },
  { id: 'prod-042', name: 'DIN Rail Power Supply 24V', brand: 'Phoenix Contact', category: 'electrical' },
  { id: 'prod-043', name: 'Industrial Ethernet Switch', brand: 'Siemens', category: 'electrical' },
  { id: 'prod-044', name: 'Contactron Motor Starter', brand: 'Phoenix Contact', category: 'electrical' },
  { id: 'prod-045', name: 'Servo Drive Unit 3kW', brand: 'Bosch Rexroth', category: 'electrical' },
  { id: 'prod-046', name: 'Molded Case Circuit Breaker', brand: 'ABB', category: 'electrical' },
  { id: 'prod-047', name: 'Digital Power Meter', brand: 'Schneider Electric', category: 'electrical' },
  { id: 'prod-048', name: 'Variable Frequency Drive 15kW', brand: 'Danfoss', category: 'electrical' },
  { id: 'prod-049', name: 'Safety Relay Module', brand: 'Pilz', category: 'electrical' },
  { id: 'prod-050', name: 'Panel Mount Ammeter', brand: 'Honeywell', category: 'electrical' },
  { id: 'prod-051', name: 'Industrial Relay Module 8CH', brand: 'Omron', category: 'electrical' },
  { id: 'prod-052', name: 'Thermal Overload Relay', brand: 'Schneider Electric', category: 'electrical' },
  { id: 'prod-053', name: 'AC Drive Module 55kW', brand: 'Siemens', category: 'electrical' },
  { id: 'prod-054', name: 'Smart MCC Panel Section', brand: 'ABB', category: 'electrical' },
  { id: 'prod-055', name: 'Surge Protection Device Type2', brand: 'Phoenix Contact', category: 'electrical' },
  { id: 'prod-056', name: 'Industrial UPS 3kVA', brand: 'Emerson', category: 'electrical' },
  { id: 'prod-057', name: 'Motor Soft Starter 132kW', brand: 'Siemens', category: 'electrical' },
  { id: 'prod-058', name: 'Capacitor Bank 50kVAR', brand: 'ABB', category: 'electrical' },
  // Hydraulic Systems (prod-059 to prod-083)
  { id: 'prod-059', name: 'Axial Piston Pump 75cc', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-060', name: 'Hydraulic Cylinder 100mm Bore', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-061', name: 'Directional Control Valve', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-062', name: 'Hydraulic Power Unit 15kW', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-063', name: 'Gear Pump 40cc', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-064', name: 'Hydraulic Filter Element 10um', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-065', name: 'Proportional Pressure Valve', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-066', name: 'Hydraulic Accumulator 4L', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-067', name: 'Vane Pump 25cc', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-068', name: 'Counterbalance Valve', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-069', name: 'Hydraulic Hose Assembly 1m', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-070', name: 'Flow Control Valve', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-071', name: 'Hydraulic Motor 500cc/rev', brand: 'Danfoss', category: 'hydraulic' },
  { id: 'prod-072', name: 'Pressure Relief Valve 250bar', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-073', name: 'Hydraulic Tank 200L', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-074', name: 'Hydraulic Manifold Block 6-Port', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-075', name: 'Check Valve Pilot Operated', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-076', name: 'Hydraulic Cartridge Valve', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-077', name: 'Solenoid Valve 24VDC 3/2', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-078', name: 'Hydraulic Quick Coupling Set', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-079', name: 'Radial Piston Pump 100cc', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-080', name: 'Hydraulic Oil Cooler 5kW', brand: 'Danfoss', category: 'hydraulic' },
  { id: 'prod-081', name: 'Proportional Flow Valve', brand: 'Bosch Rexroth', category: 'hydraulic' },
  { id: 'prod-082', name: 'Hydraulic Test Gauge 400bar', brand: 'Parker', category: 'hydraulic' },
  { id: 'prod-083', name: 'Hydraulic Power Pack 5.5kW', brand: 'Parker', category: 'hydraulic' },
  // Pneumatic Systems (prod-084 to prod-100)
  { id: 'prod-084', name: 'Pneumatic Cylinder ISO 15552', brand: 'Festo', category: 'pneumatic' },
  { id: 'prod-085', name: 'Air Solenoid Valve 5/2', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-086', name: 'FRL Unit with Gauge', brand: 'Festo', category: 'pneumatic' },
  { id: 'prod-087', name: 'Pneumatic Gripper Parallel', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-088', name: 'Air Dryer Regenerative', brand: 'Atlas Copco', category: 'pneumatic' },
  { id: 'prod-089', name: 'Pneumatic Rotary Actuator', brand: 'Festo', category: 'pneumatic' },
  { id: 'prod-090', name: 'Quick Exhaust Valve', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-091', name: 'Pneumatic Air Gun', brand: 'Festo', category: 'pneumatic' },
  { id: 'prod-092', name: 'Air Preparation Unit Mini', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-093', name: 'Pneumatic Tubing 8mm Blue', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-094', name: 'Flow Sensor Pneumatic', brand: 'Festo', category: 'pneumatic' },
  { id: 'prod-095', name: 'Vacuum Generator Multi Stage', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-096', name: 'Pneumatic Silencer Muffler', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-097', name: 'Rodless Cylinder Guided', brand: 'Festo', category: 'pneumatic' },
  { id: 'prod-098', name: 'Pneumatic Push-In Fitting Set', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-099', name: 'Air Receiver Tank 100L', brand: 'Atlas Copco', category: 'pneumatic' },
  { id: 'prod-100', name: 'Pneumatic Timer Valve', brand: 'Festo', category: 'pneumatic' },
  // Pneumatic cont. (prod-101 to prod-105)
  { id: 'prod-101', name: 'Pressure Switch Pneumatic', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-102', name: 'Pneumatic Slide Table Cylinder', brand: 'Festo', category: 'pneumatic' },
  { id: 'prod-103', name: 'Quick Connect Coupling Set', brand: 'SMC', category: 'pneumatic' },
  { id: 'prod-104', name: 'Pneumatic Filter Element 5um', brand: 'Festo', category: 'pneumatic' },
  { id: 'prod-105', name: 'Micro Pneumatic Cylinder', brand: 'SMC', category: 'pneumatic' },
  // Industrial Spare Parts (prod-106 to prod-120)
  { id: 'prod-106', name: '3-Phase Induction Motor 15kW', brand: 'ABB', category: 'spares' },
  { id: 'prod-107', name: 'Deep Groove Ball Bearing 6205', brand: 'SKF', category: 'spares' },
  { id: 'prod-108', name: 'Flexible Coupling 28mm', brand: 'Siemens', category: 'spares' },
  { id: 'prod-109', name: 'Inductive Proximity Sensor M18', brand: 'IFM', category: 'spares' },
  { id: 'prod-110', name: 'Industrial Encoder Incremental', brand: 'Pepperl+Fuchs', category: 'spares' },
  { id: 'prod-111', name: 'AC Servo Motor 2kW', brand: 'Siemens', category: 'spares' },
  { id: 'prod-112', name: 'Thermal Overload Bimetal Relay', brand: 'ABB', category: 'spares' },
  { id: 'prod-113', name: 'Timing Belt HTD 5M-450', brand: 'Gates', category: 'spares' },
  { id: 'prod-114', name: 'Stainless Steel Coupling Jaw', brand: 'Siemens', category: 'spares' },
  { id: 'prod-115', name: 'Photoelectric Sensor Retro', brand: 'Sick', category: 'spares' },
  { id: 'prod-116', name: 'Vibration Sensor Industrial', brand: 'IFM', category: 'spares' },
  { id: 'prod-117', name: 'NTN Bearing 6310-2RS', brand: 'NTN', category: 'spares' },
  { id: 'prod-118', name: 'Fluorescent Tube Guard IP65', brand: 'Rittal', category: 'spares' },
  { id: 'prod-119', name: 'Conveyor Rollers 50mm Ø', brand: 'Interroll', category: 'spares' },
  { id: 'prod-120', name: 'Power Cable 3G2.5mm 10m', brand: 'Lapp', category: 'spares' },
  // Surplus Inventory (prod-121 to prod-133)
  { id: 'prod-121', name: 'Unused ABB VFD ACS580', brand: 'ABB', category: 'surplus' },
  { id: 'prod-122', name: 'New Old Stock Siemens PLC S7-300', brand: 'Siemens', category: 'surplus' },
  { id: 'prod-123', name: 'Surplus Hydraulic Pump A10VSO', brand: 'Bosch Rexroth', category: 'surplus' },
  { id: 'prod-124', name: 'Overstock Schneider MCCB 630A', brand: 'Schneider Electric', category: 'surplus' },
  { id: 'prod-125', name: 'Unopened Parker Valve Kit', brand: 'Parker', category: 'surplus' },
  { id: 'prod-126', name: 'Unused Atlas Air Compressor', brand: 'Atlas Copco', category: 'surplus' },
  { id: 'prod-127', name: 'Surplus Festo Cylinder DSBC', brand: 'Festo', category: 'surplus' },
  { id: 'prod-128', name: 'Overstock Honeywell Sensor Kit', brand: 'Honeywell', category: 'surplus' },
  { id: 'prod-129', name: 'New Danfoss Compressor SC15', brand: 'Danfoss', category: 'surplus' },
  { id: 'prod-130', name: 'Surplus Grundfos Pump CRN', brand: 'Grundfos', category: 'surplus' },
  { id: 'prod-131', name: 'Unused Emerson Valve Positioner', brand: 'Emerson', category: 'surplus' },
  { id: 'prod-132', name: 'Overstock SMC Pneumatic Set', brand: 'SMC', category: 'surplus' },
  { id: 'prod-133', name: 'Surplus Siemens HMI TP1500', brand: 'Siemens', category: 'surplus' },
  // Lifting & Handling (prod-134 to prod-143)
  { id: 'prod-134', name: 'Overhead Bridge Crane 5 Ton', brand: 'Demag', category: 'lifting' },
  { id: 'prod-135', name: 'Electric Chain Hoist 2 Ton', brand: 'Kito', category: 'lifting' },
  { id: 'prod-136', name: 'Manual Pallet Jack 2500kg', brand: 'Toyota', category: 'lifting' },
  { id: 'prod-137', name: 'Forklift Counterbalance 3 Ton', brand: 'Toyota', category: 'lifting' },
  { id: 'prod-138', name: 'Jib Crane Floor Mounted 1 Ton', brand: 'Demag', category: 'lifting' },
  { id: 'prod-139', name: 'Hydraulic Scissor Lift Table', brand: 'Southworth', category: 'lifting' },
  { id: 'prod-140', name: 'Wire Rope Sling Set 3m', brand: 'Crosby', category: 'lifting' },
  { id: 'prod-141', name: 'Vacuum Lifting Pad 500kg', brand: 'Schmalz', category: 'lifting' },
  { id: 'prod-142', name: 'Gantry Crane Adjustable 2 Ton', brand: 'Spanco', category: 'lifting' },
  { id: 'prod-143', name: 'Lifting Beam Spreader 4 Point', brand: 'Caldwell', category: 'lifting' },
  // Tools & Equipment (prod-144 to prod-153)
  { id: 'prod-144', name: 'Industrial Heat Gun 2000W', brand: 'Bosch', category: 'tools' },
  { id: 'prod-145', name: 'Digital Multimeter True RMS', brand: 'Fluke', category: 'tools' },
  { id: 'prod-146', name: 'Battery Powered Impact Wrench', brand: 'Makita', category: 'tools' },
  { id: 'prod-147', name: 'Angle Grinder 7 inch 2000W', brand: 'Bosch', category: 'tools' },
  { id: 'prod-148', name: 'Thermal Imaging Camera', brand: 'Flir', category: 'tools' },
  { id: 'prod-149', name: 'Bench Grinder 8 inch', brand: 'Delta', category: 'tools' },
  { id: 'prod-150', name: 'Cordless Drill Driver 18V', brand: 'Makita', category: 'tools' },
  { id: 'prod-151', name: 'Pipe Threading Machine 1/2-2 inch', brand: 'Ridgid', category: 'tools' },
  { id: 'prod-152', name: 'Ultrasonic Thickness Gauge', brand: 'Olympus', category: 'tools' },
  { id: 'prod-153', name: 'Hydraulic Crimping Tool 400mm²', brand: 'Klingspor', category: 'tools' },
  // Safety Equipment (prod-154 to prod-163)
  { id: 'prod-154', name: 'Full Body Fall Arrest Harness', brand: '3M', category: 'safety' },
  { id: 'prod-155', name: 'Gas Detector Multi-Gas', brand: 'Honeywell', category: 'safety' },
  { id: 'prod-156', name: 'Fire Extinguisher CO2 5kg', brand: 'Amerex', category: 'safety' },
  { id: 'prod-157', name: 'Safety Helmet Industrial Grade', brand: 'MSA', category: 'safety' },
  { id: 'prod-158', name: 'Welding Shield Auto-Darkening', brand: 'Lincoln', category: 'safety' },
  { id: 'prod-159', name: 'Emergency Eye Wash Station', brand: 'Bradley', category: 'safety' },
  { id: 'prod-160', name: 'High Visibility Safety Vest Class 2', brand: '3M', category: 'safety' },
  { id: 'prod-161', name: 'Safety Goggles Anti-Fog', brand: 'Uvex', category: 'safety' },
  { id: 'prod-162', name: 'Life Buoy Ring 30 inch', brand: 'Mustang', category: 'safety' },
  { id: 'prod-163', name: 'Confined Space Tripod Kit', brand: '3M', category: 'safety' },
  // Hand Tools (prod-164 to prod-173)
  { id: 'prod-164', name: 'Combination Wrench Set 8-24mm', brand: 'Snap-On', category: 'hand-tools' },
  { id: 'prod-165', name: 'Socket Set 1/2 Drive 40 Piece', brand: 'Proto', category: 'hand-tools' },
  { id: 'prod-166', name: 'Adjustable Wrench 12 inch', brand: 'Bahco', category: 'hand-tools' },
  { id: 'prod-167', name: 'Ball Peen Hammer 16oz', brand: 'Stanley', category: 'hand-tools' },
  { id: 'prod-168', name: 'Pliers Set 4 Piece Insulated', brand: 'Klein', category: 'hand-tools' },
  { id: 'prod-169', name: 'Torque Wrench 1/2 Drive 20-250Nm', brand: 'Proto', category: 'hand-tools' },
  { id: 'prod-170', name: 'Precision Screwdriver Set 12pc', brand: 'Wiha', category: 'hand-tools' },
  { id: 'prod-171', name: 'Hacksaw Frame Heavy Duty', brand: 'Stanley', category: 'hand-tools' },
  { id: 'prod-172', name: 'Pipe Wrench 24 inch', brand: 'Ridgid', category: 'hand-tools' },
  { id: 'prod-173', name: 'Chisel Set Cold 6 Piece', brand: 'Proto', category: 'hand-tools' },
  // Ship Navigation (prod-174 to prod-181)
  { id: 'prod-174', name: 'Autopilot System Marine', brand: 'Simrad', category: 'ship-navigation' },
  { id: 'prod-175', name: 'Chart Plotter GPS 12 inch', brand: 'Furuno', category: 'ship-navigation' },
  { id: 'prod-176', name: 'Marine Radar Scanner 24NM', brand: 'Furuno', category: 'ship-navigation' },
  { id: 'prod-177', name: 'AIS Transceiver Class A', brand: 'Comnav', category: 'ship-navigation' },
  { id: 'prod-178', name: 'Magnetic Compass Steering', brand: 'Sestrel', category: 'ship-navigation' },
  { id: 'prod-179', name: 'GPS Receiver Antenna', brand: 'Garmin', category: 'ship-navigation' },
  { id: 'prod-180', name: 'Depth Sounder Transducer', brand: 'Furuno', category: 'ship-navigation' },
  { id: 'prod-181', name: 'Wind Sensor Anemometer Marine', brand: 'Raymarine', category: 'ship-navigation' },
  // Marine Pumps (prod-182 to prod-189)
  { id: 'prod-182', name: 'Bilge Pump Submersible 2000GPH', brand: 'Rule', category: 'marine-pumps' },
  { id: 'prod-183', name: 'Ballast Pump Centrifugal 4 inch', brand: 'Grundfos', category: 'marine-pumps' },
  { id: 'prod-184', name: 'Seawater Cooling Pump Bronze', brand: 'Jabsco', category: 'marine-pumps' },
  { id: 'prod-185', name: 'Deck Washdown Pump 12V', brand: 'Shurflo', category: 'marine-pumps' },
  { id: 'prod-186', name: 'Fuel Transfer Pump 12V 30GPH', brand: 'Flojet', category: 'marine-pumps' },
  { id: 'prod-187', name: 'Fresh Water Pressure Pump', brand: 'Jabsco', category: 'marine-pumps' },
  { id: 'prod-188', name: 'Desalination Pump High Pressure', brand: 'Katadyn', category: 'marine-pumps' },
  { id: 'prod-189', name: 'Emergency Fire Pump Diesel', brand: 'Grundfos', category: 'marine-pumps' },
  // Engine Spare Parts (prod-190 to prod-199)
  { id: 'prod-190', name: 'Diesel Engine Piston Ring Set', brand: 'MAN', category: 'engine-spare' },
  { id: 'prod-191', name: 'Cylinder Head Gasket Set', brand: 'Caterpillar', category: 'engine-spare' },
  { id: 'prod-192', name: 'Engine Valve Intake & Exhaust Set', brand: 'MAN', category: 'engine-spare' },
  { id: 'prod-193', name: 'Connecting Rod Bearing Set', brand: 'Caterpillar', category: 'engine-spare' },
  { id: 'prod-194', name: 'Engine Liner Cylinder Sleeve', brand: 'Wartsila', category: 'engine-spare' },
  { id: 'prod-195', name: 'Crankshaft Main Bearing Set', brand: 'MAN', category: 'engine-spare' },
  { id: 'prod-196', name: 'Oil Pump Gear Complete', brand: 'Cummins', category: 'engine-spare' },
  { id: 'prod-197', name: 'Water Pump Impeller Marine', brand: 'Jabsco', category: 'engine-spare' },
  { id: 'prod-198', name: 'Injection Pump Element', brand: 'Bosch', category: 'engine-spare' },
  { id: 'prod-199', name: 'Turbocharger Repair Kit', brand: 'Holset', category: 'engine-spare' },
  // Engine Parts (prod-200 to prod-209)
  { id: 'prod-200', name: 'Fuel Injector Common Rail', brand: 'Bosch', category: 'engine-parts' },
  { id: 'prod-201', name: 'Turbocharger Complete TPS48', brand: 'Holset', category: 'engine-parts' },
  { id: 'prod-202', name: 'Heat Exchanger Shell & Tube', brand: 'Alfa Laval', category: 'engine-parts' },
  { id: 'prod-203', name: 'Intercooler Charge Air Cooler', brand: 'MAN', category: 'engine-parts' },
  { id: 'prod-204', name: 'Engine Control Module ECU', brand: 'Caterpillar', category: 'engine-parts' },
  { id: 'prod-205', name: 'Starter Motor Marine 24V', brand: 'Delco Remy', category: 'engine-parts' },
  { id: 'prod-206', name: 'Alternator Marine 150A 24V', brand: 'Delco Remy', category: 'engine-parts' },
  { id: 'prod-207', name: 'Fuel Cooler Engine Bypass', brand: 'MAN', category: 'engine-parts' },
  { id: 'prod-208', name: 'EGR Valve Complete', brand: 'Cummins', category: 'engine-parts' },
  { id: 'prod-209', name: 'Oil Cooler Engine Plate Type', brand: 'Caterpillar', category: 'engine-parts' },
  // Motors & Components (prod-210 to prod-219)
  { id: 'prod-210', name: 'AC Induction Motor 7.5kW 3-Phase', brand: 'ABB', category: 'motor' },
  { id: 'prod-211', name: 'Servo Motor 1.5kW with Encoder', brand: 'Siemens', category: 'motor' },
  { id: 'prod-212', name: 'Helical Gearbox Ratio 20:1', brand: 'Sew Eurodrive', category: 'motor' },
  { id: 'prod-213', name: 'DC Motor 2kW 180V', brand: 'Baldor', category: 'motor' },
  { id: 'prod-214', name: 'Brake Motor 3kW Disc Brake', brand: 'Siemens', category: 'motor' },
  { id: 'prod-215', name: 'Worm Gearbox Reduction 40:1', brand: 'Sew Eurodrive', category: 'motor' },
  { id: 'prod-216', name: 'Explosion Proof Motor 5kW', brand: 'ABB', category: 'motor' },
  { id: 'prod-217', name: 'Stepper Motor NEMA 34 5Nm', brand: 'Oriental Motor', category: 'motor' },
  { id: 'prod-218', name: 'Motor Starter Combination 7.5kW', brand: 'Schneider Electric', category: 'motor' },
  { id: 'prod-219', name: 'Variable Frequency Drive 11kW', brand: 'Danfoss', category: 'motor' },
  // Ship Machinery (prod-220 to prod-227)
  { id: 'prod-220', name: 'Anchor Windlass Hydraulic', brand: 'Parker', category: 'ship-machinery' },
  { id: 'prod-221', name: 'Mooring Winch Electric 10 Ton', brand: 'Robbins', category: 'ship-machinery' },
  { id: 'prod-222', name: 'Steering Gear Rack & Pinion', brand: 'Rolls Royce', category: 'ship-machinery' },
  { id: 'prod-223', name: 'Bow Thruster Tunnel 10kW', brand: 'Sleipner', category: 'ship-machinery' },
  { id: 'prod-224', name: 'Propeller CP Pitch 4-Blade', brand: 'Kamewa', category: 'ship-machinery' },
  { id: 'prod-225', name: 'Stern Tube Seal Assembly', brand: 'Wartsila', category: 'ship-machinery' },
  { id: 'prod-226', name: 'Deck Crane Knuckle Boom 3 Ton', brand: 'Palfinger', category: 'ship-machinery' },
  { id: 'prod-227', name: 'Capstan Mooring Drum 5 Ton', brand: 'Robbins', category: 'ship-machinery' },
  // Hydraulic Pumps (prod-228 to prod-235)
  { id: 'prod-228', name: 'Axial Piston Pump Variable 100cc', brand: 'Bosch Rexroth', category: 'hydraulic-pumps' },
  { id: 'prod-229', name: 'External Gear Pump 50cc', brand: 'Parker', category: 'hydraulic-pumps' },
  { id: 'prod-230', name: 'Vane Pump Variable 35cc', brand: 'Parker', category: 'hydraulic-pumps' },
  { id: 'prod-231', name: 'Radial Piston Pump Fixed 200cc', brand: 'Bosch Rexroth', category: 'hydraulic-pumps' },
  { id: 'prod-232', name: 'Hydraulic Hand Pump 700bar', brand: 'Enerpac', category: 'hydraulic-pumps' },
  { id: 'prod-233', name: 'Screw Pump Progressive Cavity', brand: 'Netzsch', category: 'hydraulic-pumps' },
  { id: 'prod-234', name: 'Hydraulic Power Pack 20kW', brand: 'Parker', category: 'hydraulic-pumps' },
  { id: 'prod-235', name: 'Piston Pump Repair Kit', brand: 'Bosch Rexroth', category: 'hydraulic-pumps' },
  // Rigging & Lashing (prod-236 to prod-245)
  { id: 'prod-236', name: 'Lifting Sling Round 3 Ton 2m', brand: 'Lift-All', category: 'rigging' },
  { id: 'prod-237', name: 'Chain Sling Grade 80 8mm 2m', brand: 'Pewag', category: 'rigging' },
  { id: 'prod-238', name: 'Shackle Screw Pin 2 Ton', brand: 'Crosby', category: 'rigging' },
  { id: 'prod-239', name: 'Ratchet Tie Down 5m 500kg', brand: 'Kinedyne', category: 'rigging' },
  { id: 'prod-240', name: 'Wire Rope Clip Galvanized 10mm', brand: 'Crosby', category: 'rigging' },
  { id: 'prod-241', name: 'Hoist Ring Swivel 1 Ton', brand: 'Jergens', category: 'rigging' },
  { id: 'prod-242', name: 'Turnbuckle Jaw & Jaw 12mm', brand: 'Crosby', category: 'rigging' },
  { id: 'prod-243', name: 'Load Binder Lever Type 5 Ton', brand: 'Kinedyne', category: 'rigging' },
  { id: 'prod-244', name: 'Lifting Eye Bolt Forged 1 Ton', brand: 'Crosby', category: 'rigging' },
  { id: 'prod-245', name: 'Cargo Net Lifting 2m x 2m', brand: 'Lift-All', category: 'rigging' },
  // Other Business & Industrial (prod-246 to prod-255)
  { id: 'prod-246', name: 'Industrial Vacuum Cleaner 30L', brand: 'Nilfisk', category: 'other' },
  { id: 'prod-247', name: 'Workshop Workbench Steel 1800mm', brand: 'Lista', category: 'other' },
  { id: 'prod-248', name: 'Industrial Fan Wall Mount 24 inch', brand: 'Big Ass Fans', category: 'other' },
  { id: 'prod-249', name: 'Storage Cabinet Heavy Duty 12 Door', brand: 'Lista', category: 'other' },
  { id: 'prod-250', name: 'Pallet Racking System 2 Ton Bay', brand: 'Rackline', category: 'other' },
  { id: 'prod-251', name: 'Air Compressor Screw 7.5kW 10bar', brand: 'Atlas Copco', category: 'other' },
  { id: 'prod-252', name: 'Water Jet Cutter 4000bar', brand: 'KMT', category: 'other' },
  { id: 'prod-253', name: 'Industrial Scale Floor 2000kg', brand: 'Mettler', category: 'other' },
  { id: 'prod-254', name: 'Label Printer Industrial Thermal', brand: 'Zebra', category: 'other' },
  { id: 'prod-255', name: 'Industrial Dehumidifier 50L/day', brand: 'Munters', category: 'other' },
]

/**
 * Generate an SVG illustration for a marine equipment product with a nautical theme.
 */
function marineSVG(name, brand, idx) {
  const hue = (idx * 37 + 200) % 360
  const bgLight = `hsl(${hue}, 30%, 92%)`
  const bgDark = `hsl(${hue}, 40%, 82%)`
  const accent = `hsl(${hue}, 60%, 35%)`
  const accentLight = `hsl(${hue}, 50%, 65%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="metallic" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#d1d5db"/>
      <stop offset="50%" style="stop-color:#9ca3af"/>
      <stop offset="100%" style="stop-color:#6b7280"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Subtle grid pattern -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" opacity="0.3"/>
  <line x1="0" y1="200" x2="${SIZE}" y2="200" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <line x1="0" y1="400" x2="${SIZE}" y2="400" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <line x1="200" y1="0" x2="200" y2="${SIZE}" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <line x1="400" y1="0" x2="400" y2="${SIZE}" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <!-- Equipment body -->
  <rect x="150" y="130" width="300" height="260" rx="24" fill="url(#metallic)" filter="url(#shadow)"/>
  <rect x="170" y="150" width="260" height="60" rx="8" fill="rgba(0,0,0,0.15)"/>
  <!-- Screen / display -->
  <rect x="190" y="165" width="220" height="30" rx="4" fill="${accentLight}" opacity="0.8"/>
  <text x="300" y="185" font-family="monospace" font-size="11" fill="white" text-anchor="middle" font-weight="bold">${brand}</text>
  <!-- Control panel elements -->
  <circle cx="220" cy="270" r="20" fill="${accent}" opacity="0.7"/>
  <circle cx="220" cy="270" r="4" fill="white"/>
  <circle cx="300" cy="270" r="30" fill="${accent}" opacity="0.5"/>
  <circle cx="300" cy="270" r="6" fill="white"/>
  <circle cx="380" cy="270" r="15" fill="${accent}" opacity="0.8"/>
  <circle cx="380" cy="270" r="3" fill="white"/>
  <!-- Bottom connectors -->
  <rect x="200" y="340" width="20" height="30" rx="3" fill="#4b5563"/>
  <rect x="290" y="340" width="20" height="30" rx="3" fill="#4b5563"/>
  <rect x="380" y="340" width="20" height="30" rx="3" fill="#4b5563"/>
  <!-- LED indicators -->
  <circle cx="195" cy="370" r="4" fill="#22c55e"/>
  <circle cx="215" cy="370" r="4" fill="#3b82f6"/>
  <circle cx="235" cy="370" r="4" fill="#f59e0b"/>
  <!-- Marine wave accent -->
  <path d="M80 420 Q140 390 200 420 Q260 450 320 420 Q380 390 440 420 Q500 450 550 420" stroke="${accentLight}" stroke-width="2" fill="none" opacity="0.4"/>
  <!-- Product label -->
  <text x="300" y="470" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="490" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <!-- Brand badge -->
  <rect x="240" y="515" width="120" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="533" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">MARINE EQUIPMENT</text>
</svg>`
}

/**
 * Generate an SVG illustration for an electrical automation product with a tech theme.
 */
function electricalSVG(name, brand, idx) {
  const hue = (idx * 47 + 220) % 360
  const bgLight = `hsl(${hue}, 20%, 95%)`
  const bgDark = `hsl(${hue}, 25%, 85%)`
  const accent = `hsl(${hue}, 65%, 40%)`
  const accentLight = `hsl(${hue}, 55%, 70%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="chassis" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#374151"/>
      <stop offset="100%" style="stop-color:#1f2937"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.3"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Circuit board trace pattern -->
  <g opacity="0.12" stroke="${accent}" stroke-width="1.5" fill="none">
    <path d="M50 100 L150 100 L150 200"/>
    <path d="M450 100 L400 100 L400 250 L350 250"/>
    <path d="M100 400 L200 400 L200 350"/>
    <path d="M500 350 L450 350 L450 450"/>
    <path d="M80 250 L120 250 L120 300"/>
    <path d="M480 200 L420 200 L420 150"/>
    <circle cx="150" cy="200" r="3" fill="${accent}"/>
    <circle cx="400" cy="250" r="3" fill="${accent}"/>
    <circle cx="200" cy="350" r="3" fill="${accent}"/>
    <circle cx="450" cy="450" r="3" fill="${accent}"/>
    <circle cx="120" cy="300" r="3" fill="${accent}"/>
    <circle cx="420" cy="150" r="3" fill="${accent}"/>
  </g>
  <!-- DIN rail enclosure -->
  <rect x="140" y="120" width="320" height="280" rx="16" fill="url(#chassis)" filter="url(#shadow)"/>
  <!-- Ventilation slots -->
  <g fill="#111827" opacity="0.3">
    <rect x="165" y="135" width="270" height="4" rx="2"/>
    <rect x="165" y="145" width="270" height="4" rx="2"/>
    <rect x="165" y="155" width="270" height="4" rx="2"/>
  </g>
  <!-- Display screen -->
  <rect x="180" y="175" width="240" height="50" rx="6" fill="#0f172a"/>
  <rect x="185" y="180" width="230" height="40" rx="4" fill="#1e293b"/>
  <text x="300" y="204" font-family="monospace" font-size="12" fill="${accentLight}" text-anchor="middle" font-weight="bold">${brand}</text>
  <!-- LED status array -->
  <g>
    <rect x="195" y="245" width="8" height="20" rx="2" fill="#22c55e"/>
    <rect x="213" y="245" width="8" height="20" rx="2" fill="#22c55e"/>
    <rect x="231" y="245" width="8" height="20" rx="2" fill="#f59e0b"/>
    <rect x="249" y="245" width="8" height="20" rx="2" fill="#3b82f6"/>
  </g>
  <!-- Terminal blocks -->
  <g fill="#4b5563" stroke="#6b7280" stroke-width="1">
    <rect x="175" y="290" width="40" height="25" rx="3"/>
    <rect x="225" y="290" width="40" height="25" rx="3"/>
    <rect x="275" y="290" width="40" height="25" rx="3"/>
    <rect x="325" y="290" width="40" height="25" rx="3"/>
    <rect x="375" y="290" width="40" height="25" rx="3"/>
  </g>
  <g fill="#9ca3af" font-family="monospace" font-size="8" text-anchor="middle">
    <text x="195" y="306">L1</text>
    <text x="245" y="306">L2</text>
    <text x="295" y="306">L3</text>
    <text x="345" y="306">N</text>
    <text x="395" y="306">PE</text>
  </g>
  <!-- More DIN rail components -->
  <rect x="175" y="335" width="50" height="35" rx="4" fill="#374151" stroke="#4b5563" stroke-width="1"/>
  <rect x="235" y="335" width="50" height="35" rx="4" fill="#374151" stroke="#4b5563" stroke-width="1"/>
  <rect x="295" y="335" width="50" height="35" rx="4" fill="#374151" stroke="#4b5563" stroke-width="1"/>
  <rect x="355" y="335" width="50" height="35" rx="4" fill="#374151" stroke="#4b5563" stroke-width="1"/>
  <!-- Power indicator -->
  <circle cx="405" cy="365" r="4" fill="#22c55e"/>
  <!-- Product label -->
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <!-- Category badge -->
  <rect x="230" y="505" width="140" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">ELECTRICAL AUTOMATION</text>
</svg>`
}

/**
 * Generate an SVG illustration for a hydraulic product with an industrial fluid power theme.
 */
function hydraulicSVG(name, brand, idx) {
  const hue = (idx * 43 + 10) % 360
  const bgLight = `hsl(${hue}, 25%, 90%)`
  const bgDark = `hsl(${hue}, 30%, 78%)`
  const accent = `hsl(${hue}, 55%, 32%)`
  const accentLight = `hsl(${hue}, 45%, 60%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="pumpBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6b7280"/>
      <stop offset="100%" style="stop-color:#374151"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Hydraulic circuit lines -->
  <g stroke="${accentLight}" stroke-width="2" fill="none" opacity="0.25">
    <path d="M80 200 L130 200 L130 300 L180 300"/>
    <path d="M420 200 L470 200 L470 300 L420 300"/>
    <path d="M200 160 L200 120 L400 120 L400 160"/>
    <circle cx="130" cy="200" r="4" fill="${accentLight}"/>
    <circle cx="180" cy="300" r="4" fill="${accentLight}"/>
    <circle cx="470" cy="200" r="4" fill="${accentLight}"/>
    <circle cx="420" cy="300" r="4" fill="${accentLight}"/>
  </g>
  <!-- Main pump/valve body -->
  <rect x="175" y="140" width="250" height="240" rx="20" fill="url(#pumpBody)" filter="url(#shadow)"/>
  <!-- Top flange -->
  <rect x="200" y="130" width="200" height="20" rx="4" fill="#4b5563"/>
  <circle cx="240" cy="140" r="4" fill="#6b7280"/>
  <circle cx="360" cy="140" r="4" fill="#6b7280"/>
  <!-- Pressure gauge face -->
  <circle cx="300" cy="220" r="45" fill="#1e293b"/>
  <circle cx="300" cy="220" r="38" fill="#f8fafc"/>
  <!-- Gauge markings -->
  <g stroke="#1e293b" stroke-width="1.5" opacity="0.6">
    <line x1="300" y1="190" x2="300" y2="200"/>
    <line x1="326" y1="205" x2="320" y2="212"/>
    <line x1="332" y1="220" x2="322" y2="220"/>
    <line x1="274" y1="205" x2="280" y2="212"/>
    <line x1="268" y1="220" x2="278" y2="220"/>
  </g>
  <!-- Gauge needle -->
  <line x1="300" y1="220" x2="315" y2="195" stroke="#ef4444" stroke-width="2"/>
  <circle cx="300" cy="220" r="5" fill="#1e293b"/>
  <!-- Brand label on device -->
  <rect x="225" y="285" width="150" height="30" rx="6" fill="#1f2937"/>
  <text x="300" y="305" font-family="sans-serif" font-size="11" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <!-- Bottom ports -->
  <rect x="220" y="340" width="16" height="25" rx="3" fill="#dc2626"/>
  <rect x="282" y="340" width="16" height="25" rx="3" fill="#2563eb"/>
  <rect x="344" y="340" width="16" height="25" rx="3" fill="#dc2626"/>
  <rect x="300" y="365" width="4" height="8" fill="#4b5563"/>
  <!-- Pressure relief valves left/right -->
  <rect x="140" y="250" width="35" height="20" rx="4" fill="#6b7280" stroke="#4b5563" stroke-width="1"/>
  <rect x="425" y="250" width="35" height="20" rx="4" fill="#6b7280" stroke="#4b5563" stroke-width="1"/>
  <!-- Hydraulic fluid drops -->
  <ellipse cx="160" cy="380" rx="3" ry="5" fill="#dc2626" opacity="0.4"/>
  <ellipse cx="440" cy="375" rx="3" ry="5" fill="#2563eb" opacity="0.4"/>
  <!-- Product label -->
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <!-- Category badge -->
  <rect x="235" y="505" width="130" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">HYDRAULIC SYSTEM</text>
</svg>`
}

/**
 * Generate an SVG illustration for a pneumatic product with a clean air-power theme.
 */
function pneumaticSVG(name, brand, idx) {
  const hue = (idx * 53 + 180) % 360
  const bgLight = `hsl(${hue}, 20%, 94%)`
  const bgDark = `hsl(${hue}, 25%, 84%)`
  const accent = `hsl(${hue}, 60%, 35%)`
  const accentLight = `hsl(${hue}, 50%, 68%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="cylinderBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#d1d5db"/>
      <stop offset="40%" style="stop-color:#f3f4f6"/>
      <stop offset="60%" style="stop-color:#f3f4f6"/>
      <stop offset="100%" style="stop-color:#d1d5db"/>
    </linearGradient>
    <linearGradient id="rodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#9ca3af"/>
      <stop offset="50%" style="stop-color:#e5e7eb"/>
      <stop offset="100%" style="stop-color:#9ca3af"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.2"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Air flow lines -->
  <g stroke="${accentLight}" stroke-width="1.5" fill="none" opacity="0.2" stroke-dasharray="6 4">
    <path d="M80 250 L150 250"/>
    <path d="M450 250 L520 250"/>
    <path d="M300 120 L300 170"/>
    <path d="M300 390 L300 440"/>
  </g>
  <!-- Pneumatic cylinder body (horizontal) -->
  <rect x="150" y="160" width="300" height="160" rx="40" fill="url(#cylinderBody)" filter="url(#shadow)"/>
  <!-- Cylinder head bolts -->
  <circle cx="175" cy="200" r="5" fill="#6b7280"/>
  <circle cx="175" cy="280" r="5" fill="#6b7280"/>
  <circle cx="425" cy="200" r="5" fill="#6b7280"/>
  <circle cx="425" cy="280" r="5" fill="#6b7280"/>
  <!-- Piston rod (extending right) -->
  <rect x="430" y="225" width="100" height="30" rx="4" fill="url(#rodGrad)"/>
  <circle cx="535" cy="240" r="22" fill="#6b7280"/>
  <circle cx="535" cy="240" r="14" fill="#9ca3af"/>
  <!-- Brand plate on cylinder -->
  <rect x="220" y="215" width="160" height="50" rx="6" fill="#374151"/>
  <text x="300" y="238" font-family="sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <text x="300" y="253" font-family="sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">PNEUMATIC</text>
  <!-- Port connections -->
  <rect x="195" y="330" width="12" height="20" rx="3" fill="#3b82f6"/>
  <rect x="215" y="330" width="12" height="20" rx="3" fill="#3b82f6"/>
  <rect x="195" y="355" width="20" height="5" rx="2" fill="#60a5fa" opacity="0.5"/>
  <rect x="215" y="355" width="20" height="5" rx="2" fill="#60a5fa" opacity="0.5"/>
  <!-- Air exhaust dots -->
  <g fill="${accentLight}" opacity="0.3">
    <circle cx="165" cy="370" r="3"/>
    <circle cx="175" cy="385" r="2.5"/>
    <circle cx="185" cy="375" r="2"/>
  </g>
  <!-- Product label -->
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <!-- Category badge -->
  <rect x="235" y="505" width="130" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">PNEUMATIC SYSTEM</text>
</svg>`
}

/**
 * Generate an SVG illustration for industrial spare parts (bearings, sensors, couplings).
 */
function sparePartsSVG(name, brand, idx) {
  const hue = (idx * 29 + 340) % 360
  const bgLight = `hsl(${hue}, 15%, 93%)`
  const bgDark = `hsl(${hue}, 20%, 83%)`
  const accent = `hsl(${hue}, 50%, 38%)`
  const accentLight = `hsl(${hue}, 40%, 65%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="steelRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e5e7eb"/>
      <stop offset="50%" style="stop-color:#9ca3af"/>
      <stop offset="100%" style="stop-color:#6b7280"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.2"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Mechanical/gear background elements -->
  <g opacity="0.08" stroke="${accent}" stroke-width="1" fill="none" transform="translate(80,80)">
    <circle cx="220" cy="220" r="80"/>
    <circle cx="220" cy="220" r="60"/>
    <circle cx="220" cy="220" r="40"/>
    <line x1="220" y1="140" x2="220" y2="300"/>
    <line x1="140" y1="220" x2="300" y2="220"/>
  </g>
  <!-- Main bearing/mechanical component body -->
  <circle cx="300" cy="240" r="95" fill="url(#steelRing)" filter="url(#shadow)"/>
  <circle cx="300" cy="240" r="75" fill="#1e293b"/>
  <circle cx="300" cy="240" r="55" fill="url(#steelRing)"/>
  <circle cx="300" cy="240" r="35" fill="#1e293b"/>
  <!-- Ball bearings in raceway -->
  <g fill="#e5e7eb" stroke="#6b7280" stroke-width="0.5">
    <circle cx="300" cy="175" r="8"/>
    <circle cx="355" cy="195" r="8"/>
    <circle cx="370" cy="250" r="8"/>
    <circle cx="345" cy="300" r="8"/>
    <circle cx="300" cy="315" r="8"/>
    <circle cx="255" cy="300" r="8"/>
    <circle cx="230" cy="250" r="8"/>
    <circle cx="245" cy="195" r="8"/>
  </g>
  <!-- Brand label plate -->
  <rect x="250" y="375" width="100" height="28" rx="5" fill="#374151"/>
  <text x="300" y="393" font-family="sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <!-- Spec label -->
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <!-- Category badge -->
  <rect x="220" y="505" width="160" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">INDUSTRIAL SPARE PARTS</text>
</svg>`
}

/**
 * Generate an SVG illustration for surplus / overstock inventory items.
 */
function surplusSVG(name, brand, idx) {
  const hue = (idx * 31 + 80) % 360
  const bgLight = `hsl(${hue}, 18%, 92%)`
  const bgDark = `hsl(${hue}, 22%, 80%)`
  const accent = `hsl(${hue}, 55%, 35%)`
  const accentLight = `hsl(${hue}, 45%, 62%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#d1d5db"/>
      <stop offset="100%" style="stop-color:#9ca3af"/>
    </linearGradient>
    <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accentLight}"/>
      <stop offset="100%" style="stop-color:${accent}"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="3" dy="5" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Warehouse shelf lines -->
  <g stroke="${accentLight}" stroke-width="1" opacity="0.15">
    <line x1="50" y1="130" x2="550" y2="130"/>
    <line x1="50" y1="420" x2="550" y2="420"/>
  </g>
  <!-- Box/crate main body -->
  <rect x="150" y="150" width="300" height="260" rx="12" fill="url(#boxGrad)" filter="url(#shadow)"/>
  <!-- Box flaps (top) -->
  <path d="M150 150 L170 120 L320 120 L300 150" fill="#b0b8c4"/>
  <path d="M300 150 L320 120 L440 120 L450 150" fill="#a0a8b4"/>
  <!-- Sealed / overstock label tag -->
  <rect x="240" y="170" width="120" height="30" rx="15" fill="url(#sealGrad)"/>
  <text x="300" y="189" font-family="sans-serif" font-size="10" fill="white" text-anchor="middle" font-weight="bold">SURPLUS STOCK</text>
  <!-- Brand label on box -->
  <rect x="210" y="225" width="180" height="40" rx="6" fill="white" opacity="0.9"/>
  <text x="300" y="250" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${brand}</text>
  <!-- Barcode lines -->
  <g fill="#1e293b" opacity="0.5">
    <rect x="220" y="290" width="4" height="30"/>
    <rect x="228" y="290" width="8" height="30"/>
    <rect x="240" y="290" width="3" height="30"/>
    <rect x="247" y="290" width="6" height="30"/>
    <rect x="258" y="290" width="10" height="30"/>
    <rect x="275" y="290" width="4" height="30"/>
    <rect x="283" y="290" width="7" height="30"/>
    <rect x="295" y="290" width="3" height="30"/>
    <rect x="302" y="290" width="9" height="30"/>
    <rect x="315" y="290" width="5" height="30"/>
    <rect x="324" y="290" width="8" height="30"/>
    <rect x="336" y="290" width="4" height="30"/>
    <rect x="345" y="290" width="6" height="30"/>
    <rect x="355" y="290" width="10" height="30"/>
    <rect x="370" y="290" width="5" height="30"/>
  </g>
  <!-- Extra tape stripe -->
  <rect x="150" y="360" width="300" height="8" fill="${accentLight}" opacity="0.4"/>
  <!-- Product label -->
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <!-- Category badge -->
  <rect x="235" y="505" width="130" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">SURPLUS INVENTORY</text>
</svg>`
}

/**
 * Generate an SVG illustration for lifting & handling equipment (cranes, hoists, jacks).
 */
function liftingSVG(name, brand, idx) {
  const hue = (idx * 41 + 45) % 360
  const bgLight = `hsl(${hue}, 20%, 91%)`
  const bgDark = `hsl(${hue}, 25%, 79%)`
  const accent = `hsl(${hue}, 60%, 32%)`
  const accentLight = `hsl(${hue}, 48%, 62%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="50%" style="stop-color:#d97706"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
    <linearGradient id="steelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#6b7280"/>
      <stop offset="100%" style="stop-color:#374151"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="5" stdDeviation="5" flood-opacity="0.3"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Overhead beam -->
  <rect x="100" y="100" width="400" height="24" rx="4" fill="url(#beamGrad)" filter="url(#shadow)"/>
  <rect x="100" y="100" width="400" height="6" rx="2" fill="rgba(255,255,255,0.2)"/>
  <!-- Support columns -->
  <rect x="120" y="124" width="16" height="50" rx="2" fill="#4b5563"/>
  <rect x="464" y="124" width="16" height="50" rx="2" fill="#4b5563"/>
  <!-- Hoist trolley -->
  <rect x="260" y="110" width="60" height="30" rx="6" fill="#374151"/>
  <circle cx="275" cy="130" r="6" fill="#6b7280"/>
  <circle cx="305" cy="130" r="6" fill="#6b7280"/>
  <!-- Chain/hoist cable -->
  <line x1="290" y1="140" x2="290" y2="240" stroke="#6b7280" stroke-width="3"/>
  <line x1="290" y1="140" x2="290" y2="240" stroke="#9ca3af" stroke-width="1" stroke-dasharray="6 4"/>
  <!-- Hook -->
  <path d="M290 240 Q290 265 270 265 Q250 265 250 250 Q250 240 260 240" stroke="#9ca3af" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Load block being lifted (cargo box) -->
  <rect x="230" y="280" width="120" height="80" rx="6" fill="url(#steelGrad)" filter="url(#shadow)"/>
  <rect x="230" y="280" width="120" height="10" rx="3" fill="rgba(255,255,255,0.15)"/>
  <text x="290" y="325" font-family="sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">CARGO</text>
  <!-- Brand label -->
  <rect x="240" y="400" width="100" height="24" rx="5" fill="#374151"/>
  <text x="290" y="416" font-family="sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <!-- Product label -->
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <!-- Category badge -->
  <rect x="225" y="505" width="150" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">LIFTING &amp; HANDLING</text>
</svg>`
}

/**
 * Generate an SVG illustration for tools & equipment (power tools, gauges, instruments).
 */
function toolsSVG(name, brand, idx) {
  const hue = (idx * 33 + 140) % 360
  const bgLight = `hsl(${hue}, 18%, 94%)`
  const bgDark = `hsl(${hue}, 22%, 84%)`
  const accent = `hsl(${hue}, 55%, 36%)`
  const accentLight = `hsl(${hue}, 45%, 64%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="toolBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1f2937"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
    <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f97316"/>
      <stop offset="50%" style="stop-color:#ea580c"/>
      <stop offset="100%" style="stop-color:#f97316"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="5" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Pegboard / tool wall dots -->
  <g opacity="0.08" fill="${accent}">
    ${Array.from({length: 6}, (_, i) => i).map(i => 
      Array.from({length: 6}, (_, j) => j)
        .map(j => `<circle cx="${80 + j * 80}" cy="${60 + i * 80}" r="4"/>`)
        .join('\n    ')
    ).join('')}
  </g>
  <!-- Power tool body (drill / grinder shape) -->
  <rect x="130" y="140" width="200" height="140" rx="20" fill="url(#toolBody)" filter="url(#shadow)"/>
  <!-- Motor housing detail -->
  <rect x="140" y="170" width="180" height="50" rx="8" fill="#374151"/>
  <g fill="#1e293b" opacity="0.5">
    <rect x="150" y="180" width="30" height="4" rx="2"/>
    <rect x="150" y="190" width="30" height="4" rx="2"/>
    <rect x="150" y="200" width="30" height="4" rx="2"/>
    <rect x="190" y="180" width="30" height="4" rx="2"/>
    <rect x="190" y="190" width="30" height="4" rx="2"/>
    <rect x="190" y="200" width="30" height="4" rx="2"/>
    <rect x="230" y="180" width="30" height="4" rx="2"/>
    <rect x="230" y="190" width="30" height="4" rx="2"/>
    <rect x="230" y="200" width="30" height="4" rx="2"/>
    <rect x="270" y="180" width="30" height="4" rx="2"/>
    <rect x="270" y="190" width="30" height="4" rx="2"/>
    <rect x="270" y="200" width="30" height="4" rx="2"/>
  </g>
  <!-- Handle -->
  <rect x="340" y="160" width="100" height="30" rx="8" fill="url(#handleGrad)"/>
  <rect x="340" y="230" width="100" height="30" rx="8" fill="url(#handleGrad)"/>
  <!-- Grip ridges -->
  <g fill="rgba(0,0,0,0.15)">
    <rect x="350" y="168" width="4" height="14" rx="2"/>
    <rect x="362" y="168" width="4" height="14" rx="2"/>
    <rect x="374" y="168" width="4" height="14" rx="2"/>
    <rect x="386" y="168" width="4" height="14" rx="2"/>
    <rect x="350" y="238" width="4" height="14" rx="2"/>
    <rect x="362" y="238" width="4" height="14" rx="2"/>
    <rect x="374" y="238" width="4" height="14" rx="2"/>
    <rect x="386" y="238" width="4" height="14" rx="2"/>
  </g>
  <!-- Trigger area -->
  <rect x="310" y="195" width="20" height="30" rx="4" fill="#4b5563"/>
  <!-- Brand badge -->
  <rect x="180" y="300" width="100" height="24" rx="5" fill="#374151"/>
  <text x="230" y="316" font-family="sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <!-- Product label -->
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <!-- Category badge -->
  <rect x="225" y="505" width="150" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">TOOLS &amp; EQUIPMENT</text>
</svg>`
}

/**
 * Generate an SVG illustration for safety equipment (harness, helmet, extinguisher).
 */
function safetySVG(name, brand, idx) {
  const hue = (idx * 19 + 360) % 360
  const bgLight = `hsl(${hue}, 18%, 93%)`
  const bgDark = `hsl(${hue}, 22%, 83%)`
  const accent = `hsl(${hue}, 55%, 38%)`
  const accentLight = `hsl(${hue}, 45%, 65%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ef4444"/>
      <stop offset="100%" style="stop-color:#dc2626"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Hard hat silhouette -->
  <path d="M170 190 Q170 130 300 110 Q430 130 430 190 L440 200 L160 200 Z" fill="#f59e0b" filter="url(#shadow)"/>
  <rect x="160" y="190" width="280" height="12" rx="4" fill="#d97706"/>
  <!-- Harness straps below -->
  <path d="M250 210 L250 320" stroke="#4b5563" stroke-width="8" stroke-linecap="round"/>
  <path d="M350 210 L350 320" stroke="#4b5563" stroke-width="8" stroke-linecap="round"/>
  <path d="M220 260 L380 260" stroke="#4b5563" stroke-width="6" stroke-linecap="round"/>
  <path d="M220 300 L380 300" stroke="#4b5563" stroke-width="6" stroke-linecap="round"/>
  <rect x="190" y="330" width="220" height="40" rx="6" fill="#374151"/>
  <text x="300" y="355" font-family="sans-serif" font-size="11" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <!-- Shield icon background -->
  <path d="M270 390 L330 390 L330 425 Q300 445 270 425 Z" fill="${accentLight}" opacity="0.3"/>
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <rect x="225" y="505" width="150" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">SAFETY EQUIPMENT</text>
</svg>`
}

/**
 * Generate an SVG illustration for hand tools (wrenches, hammers, pliers).
 */
function handToolsSVG(name, brand, idx) {
  const hue = (idx * 23 + 120) % 360
  const bgLight = `hsl(${hue}, 15%, 94%)`
  const bgDark = `hsl(${hue}, 20%, 84%)`
  const accent = `hsl(${hue}, 50%, 36%)`
  const accentLight = `hsl(${hue}, 40%, 64%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="toolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d1d5db"/>
      <stop offset="50%" style="stop-color:#9ca3af"/>
      <stop offset="100%" style="stop-color:#6b7280"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="5" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Pegboard dots -->
  <g fill="${accentLight}" opacity="0.08">
    <circle cx="100" cy="100" r="3"/><circle cx="200" cy="100" r="3"/><circle cx="300" cy="100" r="3"/><circle cx="400" cy="100" r="3"/><circle cx="500" cy="100" r="3"/>
    <circle cx="100" cy="200" r="3"/><circle cx="200" cy="200" r="3"/><circle cx="400" cy="200" r="3"/><circle cx="500" cy="200" r="3"/>
    <circle cx="100" cy="300" r="3"/><circle cx="200" cy="300" r="3"/><circle cx="400" cy="300" r="3"/><circle cx="500" cy="300" r="3"/>
    <circle cx="100" cy="400" r="3"/><circle cx="200" cy="400" r="3"/><circle cx="400" cy="400" r="3"/><circle cx="500" cy="400" r="3"/>
  </g>
  <!-- Open-end wrench (diagonal) -->
  <g transform="rotate(-30, 300, 240)" filter="url(#shadow)">
    <rect x="260" y="140" width="80" height="220" rx="12" fill="url(#toolGrad)"/>
    <path d="M250 130 L220 100 L240 90 L270 120 Z" fill="url(#toolGrad)"/>
    <path d="M350 130 L380 100 L360 90 L330 120 Z" fill="url(#toolGrad)"/>
    <circle cx="300" cy="350" r="15" fill="#4b5563"/>
  </g>
  <!-- Hammer head -->
  <g transform="translate(180, 200) rotate(20)">
    <rect x="0" y="0" width="120" height="40" rx="6" fill="#6b7280" filter="url(#shadow)"/>
    <rect x="-10" y="35" width="30" height="120" rx="4" fill="#b45309"/>
  </g>
  <rect x="225" y="400" width="130" height="28" rx="5" fill="#374151"/>
  <text x="290" y="418" font-family="sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <rect x="235" y="505" width="130" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">HAND TOOLS</text>
</svg>`
}

/**
 * Generate an SVG illustration for engine spare parts (pistons, rings, sleeves).
 */
function engineSpareSVG(name, brand, idx) {
  const hue = (idx * 27 + 280) % 360
  const bgLight = `hsl(${hue}, 15%, 92%)`
  const bgDark = `hsl(${hue}, 20%, 82%)`
  const accent = `hsl(${hue}, 50%, 35%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#e5e7eb"/>
      <stop offset="100%" style="stop-color:#6b7280"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="5" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Piston cross-section -->
  <rect x="180" y="130" width="240" height="260" rx="10" fill="url(#metalGrad)" filter="url(#shadow)"/>
  <!-- Piston rings -->
  <rect x="190" y="150" width="220" height="6" rx="2" fill="#1e293b" opacity="0.6"/>
  <rect x="190" y="165" width="220" height="6" rx="2" fill="#1e293b" opacity="0.6"/>
  <rect x="195" y="180" width="210" height="6" rx="2" fill="#1e293b" opacity="0.4"/>
  <!-- Connecting rod -->
  <rect x="280" y="280" width="40" height="100" rx="6" fill="#4b5563"/>
  <circle cx="300" cy="290" r="16" fill="#6b7280"/>
  <circle cx="300" cy="290" r="8" fill="#374151"/>
  <circle cx="300" cy="370" r="14" fill="#6b7280"/>
  <circle cx="300" cy="370" r="6" fill="#374151"/>
  <!-- Cylinder wall hint -->
  <line x1="160" y1="120" x2="160" y2="400" stroke="#9ca3af" stroke-width="3" stroke-dasharray="8 4" opacity="0.4"/>
  <line x1="440" y1="120" x2="440" y2="400" stroke="#9ca3af" stroke-width="3" stroke-dasharray="8 4" opacity="0.4"/>
  <rect x="240" y="420" width="120" height="26" rx="5" fill="#374151"/>
  <text x="300" y="437" font-family="sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <rect x="210" y="505" width="180" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">ENGINE SPARE PARTS</text>
</svg>`
}

/**
 * Generate an SVG illustration for engine parts (turbo, injectors, heat exchangers).
 */
function enginePartsSVG(name, brand, idx) {
  const hue = (idx * 29 + 160) % 360
  const bgLight = `hsl(${hue}, 15%, 94%)`
  const bgDark = `hsl(${hue}, 20%, 84%)`
  const accent = `hsl(${hue}, 50%, 35%)`
  const accentLight = `hsl(${hue}, 40%, 62%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="turboGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9ca3af"/>
      <stop offset="100%" style="stop-color:#4b5563"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="5" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Turbocharger center housing -->
  <circle cx="300" cy="240" r="80" fill="url(#turboGrad)" filter="url(#shadow)"/>
  <circle cx="300" cy="240" r="55" fill="#6b7280"/>
  <circle cx="300" cy="240" r="30" fill="#374151"/>
  <!-- Compressor wheel blades -->
  <g fill="#9ca3af" opacity="0.6">
    <path d="M300 210 Q320 220 330 240 L300 240 Z"/>
    <path d="M330 240 Q320 260 300 270 L300 240 Z"/>
    <path d="M300 270 Q280 260 270 240 L300 240 Z"/>
    <path d="M270 240 Q280 220 300 210 L300 240 Z"/>
    <path d="M315 218 L340 230 L310 240 Z"/>
    <path d="M340 250 L315 262 L300 240 Z"/>
    <path d="M285 262 L260 250 L300 240 Z"/>
    <path d="M260 230 L285 218 L300 240 Z"/>
  </g>
  <!-- Exhaust inlet/outlet -->
  <rect x="220" y="325" width="40" height="30" rx="4" fill="#4b5563"/>
  <rect x="340" y="325" width="40" height="30" rx="4" fill="#4b5563"/>
  <!-- Oil inlet line -->
  <rect x="140" y="230" width="50" height="8" rx="3" fill="#6b7280"/>
  <!-- Heat fins on exhaust -->
  <g fill="#374151" opacity="0.4">
    <rect x="225" y="355" width="30" height="3" rx="1"/>
    <rect x="225" y="362" width="30" height="3" rx="1"/>
    <rect x="345" y="355" width="30" height="3" rx="1"/>
    <rect x="345" y="362" width="30" height="3" rx="1"/>
  </g>
  <rect x="240" y="400" width="120" height="26" rx="5" fill="#374151"/>
  <text x="300" y="417" font-family="sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <rect x="225" y="505" width="150" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">ENGINE PARTS</text>
</svg>`
}

/**
 * Generate an SVG illustration for motors & components (electric motor cutaway).
 */
function motorSVG(name, brand, idx) {
  const hue = (idx * 31 + 200) % 360
  const bgLight = `hsl(${hue}, 15%, 93%)`
  const bgDark = `hsl(${hue}, 20%, 83%)`
  const accent = `hsl(${hue}, 55%, 35%)`
  const accentLight = `hsl(${hue}, 45%, 62%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="motorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="5" stdDeviation="6" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Motor body -->
  <rect x="150" y="130" width="300" height="260" rx="30" fill="url(#motorGrad)" filter="url(#shadow)"/>
  <!-- Cooling fins -->
  <g fill="rgba(255,255,255,0.12)">
    <rect x="140" y="145" width="320" height="6" rx="2"/>
    <rect x="140" y="160" width="320" height="6" rx="2"/>
    <rect x="140" y="175" width="320" height="6" rx="2"/>
    <rect x="140" y="190" width="320" height="6" rx="2"/>
    <rect x="140" y="330" width="320" height="6" rx="2"/>
    <rect x="140" y="345" width="320" height="6" rx="2"/>
    <rect x="140" y="360" width="320" height="6" rx="2"/>
    <rect x="140" y="375" width="320" height="6" rx="2"/>
  </g>
  <!-- Terminal box -->
  <rect x="250" y="215" width="100" height="70" rx="8" fill="#1e3a8a"/>
  <rect x="260" y="225" width="80" height="20" rx="4" fill="#e5e7eb"/>
  <text x="300" y="239" font-family="sans-serif" font-size="10" fill="#1e293b" text-anchor="middle" font-weight="bold">${brand}</text>
  <rect x="270" y="252" width="60" height="4" rx="2" fill="#6b7280"/>
  <rect x="270" y="260" width="60" height="4" rx="2" fill="#6b7280"/>
  <!-- Shaft extending -->
  <rect x="420" y="245" width="80" height="30" rx="4" fill="#9ca3af"/>
  <circle cx="505" cy="260" r="4" fill="#6b7280"/>
  <!-- Fan cover at rear -->
  <circle cx="175" cy="260" r="45" fill="#374151" opacity="0.4"/>
  <circle cx="175" cy="260" r="35" fill="none" stroke="#6b7280" stroke-width="2" opacity="0.3"/>
  <text x="300" y="460" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="480" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <rect x="215" y="505" width="170" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="523" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">MOTORS &amp; COMPONENTS</text>
</svg>`
}

/**
 * Generate an SVG illustration for rigging & lashing (shackles, slings, hooks).
 */
function riggingSVG(name, brand, idx) {
  const hue = (idx * 37 + 40) % 360
  const bgLight = `hsl(${hue}, 18%, 92%)`
  const bgDark = `hsl(${hue}, 22%, 82%)`
  const accent = `hsl(${hue}, 55%, 33%)`
  const accentLight = `hsl(${hue}, 45%, 60%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="5" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Large shackle shape -->
  <path d="M180 200 L180 350 Q180 400 300 400 Q420 400 420 350 L420 200" stroke="#6b7280" stroke-width="24" fill="none" stroke-linecap="round" filter="url(#shadow)"/>
  <!-- Shackle pin -->
  <rect x="175" y="340" width="250" height="16" rx="6" fill="#4b5563"/>
  <circle cx="210" cy="210" r="10" fill="#9ca3af"/>
  <!-- Chain link hint -->
  <path d="M270 140 L270 180 Q270 190 280 190 L320 190 Q330 190 330 180 L330 140" stroke="#9ca3af" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.5"/>
  <rect x="240" y="435" width="120" height="26" rx="5" fill="#374151"/>
  <text x="300" y="452" font-family="sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <text x="300" y="490" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <rect x="225" y="518" width="150" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="536" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">RIGGING &amp; LASHING</text>
</svg>`
}

/**
 * Generate an SVG illustration for other business & industrial (warehouse, scale, workbench).
 */
function otherBusinessSVG(name, brand, idx) {
  const hue = (idx * 33 + 300) % 360
  const bgLight = `hsl(${hue}, 15%, 93%)`
  const bgDark = `hsl(${hue}, 20%, 83%)`
  const accent = `hsl(${hue}, 50%, 35%)`
  const accentLight = `hsl(${hue}, 40%, 62%)`

  return `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgLight}"/>
      <stop offset="100%" style="stop-color:${bgDark}"/>
    </linearGradient>
    <linearGradient id="shelfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#d1d5db"/>
      <stop offset="100%" style="stop-color:#9ca3af"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="5" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg${idx})" rx="12"/>
  <!-- Warehouse building outline -->
  <polygon points="100,150 300,80 500,150" fill="#64748b" opacity="0.15"/>
  <rect x="100" y="150" width="400" height="200" fill="url(#shelfGrad)" filter="url(#shadow)"/>
  <!-- Bay door -->
  <rect x="215" y="180" width="170" height="110" rx="4" fill="#374151"/>
  <rect x="225" y="190" width="150" height="60" rx="3" fill="#1e293b" opacity="0.5"/>
  <line x1="300" y1="180" x2="300" y2="290" stroke="#4b5563" stroke-width="2"/>
  <!-- Shelving inside -->
  <g stroke="#6b7280" stroke-width="2" opacity="0.4">
    <line x1="105" y1="220" x2="210" y2="220"/>
    <line x1="105" y1="260" x2="210" y2="260"/>
    <line x1="390" y1="220" x2="495" y2="220"/>
    <line x1="390" y1="260" x2="495" y2="260"/>
  </g>
  <rect x="225" y="370" width="150" height="28" rx="5" fill="#374151"/>
  <text x="300" y="388" font-family="sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle" font-weight="bold">${brand}</text>
  <text x="300" y="430" font-family="sans-serif" font-size="13" fill="#1e293b" text-anchor="middle" font-weight="bold">${escapeXml(name)}</text>
  <text x="300" y="450" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${brand}</text>
  <rect x="210" y="475" width="180" height="28" rx="14" fill="${accent}" opacity="0.15"/>
  <text x="300" y="493" font-family="sans-serif" font-size="9" fill="${accent}" text-anchor="middle" font-weight="bold">BUSINESS &amp; INDUSTRIAL</text>
</svg>`
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function generate() {
  console.log('🖼️  Generating category-specific product images for all 255 products...\n')

  let success = 0
  let errors = 0

  for (const [idx, p] of products.entries()) {
    // Use the product ID number (e.g., prod-134 -> 134) instead of array index
    const num = parseInt(p.id.split('-')[1], 10)
    const filename = `product-${String(num).padStart(3, '0')}`
    const jpgPath = join(IMAGES_DIR, `${filename}.jpg`)
    const webpPath = join(IMAGES_DIR, `${filename}.webp`)

    try {
      const svg = p.category === 'electrical'
        ? electricalSVG(p.name, p.brand, idx)
        : p.category === 'hydraulic' || p.category === 'hydraulic-pumps'
        ? hydraulicSVG(p.name, p.brand, idx)
        : p.category === 'pneumatic'
        ? pneumaticSVG(p.name, p.brand, idx)
        : p.category === 'spares'
        ? sparePartsSVG(p.name, p.brand, idx)
        : p.category === 'surplus'
        ? surplusSVG(p.name, p.brand, idx)
        : p.category === 'lifting'
        ? liftingSVG(p.name, p.brand, idx)
        : p.category === 'tools'
        ? toolsSVG(p.name, p.brand, idx)
        : p.category === 'safety'
        ? safetySVG(p.name, p.brand, idx)
        : p.category === 'hand-tools'
        ? handToolsSVG(p.name, p.brand, idx)
        : p.category === 'engine-spare'
        ? engineSpareSVG(p.name, p.brand, idx)
        : p.category === 'engine-parts'
        ? enginePartsSVG(p.name, p.brand, idx)
        : p.category === 'motor'
        ? motorSVG(p.name, p.brand, idx)
        : p.category === 'rigging'
        ? riggingSVG(p.name, p.brand, idx)
        : p.category === 'other'
        ? otherBusinessSVG(p.name, p.brand, idx)
        : marineSVG(p.name, p.brand, idx) // catch-all for marine, ship-navigation, marine-pumps, ship-machinery

      const buffer = Buffer.from(svg)

      // Generate JPEG at high quality
      await sharp(buffer)
        .resize(SIZE, SIZE)
        .jpeg({ quality: 85, progressive: true })
        .toFile(jpgPath)

      // Generate WebP
      await sharp(buffer)
        .resize(SIZE, SIZE)
        .webp({ quality: 85, effort: 4 })
        .toFile(webpPath)

      success++
      if ((num) % 10 === 0 || num === 1 || num === 50) {
        const sizeKB = (await import('node:fs/promises')).stat(jpgPath).then(s => (s.size / 1024).toFixed(0))
        console.log(`  ✓ ${filename}.jpg (${await sizeKB}KB) - ${p.category}: ${p.name}`)
      }
    } catch (err) {
      errors++
      console.error(`  ✗ ${filename}: ${err.message}`)
    }
  }

  console.log(`\n✅ Done: ${success}/${products.length} images generated (${errors} errors)`)
}

generate().catch(console.error)
