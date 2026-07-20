import type { Testimonial, Office, TimelineEvent, TeamMember, FAQItem } from '../types'

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Capt. R. Krishnamurthy',
    role: 'Chief Engineer, MV Pacific Fortune',
    company: 'Pacific Bulk Carriers',
    avatar: 'CK',
    text: 'We had a critical hydraulic pump failure mid-voyage. Alka Traders located an OEM-equivalent unit, cleared customs, and had it at our next port in 26 hours. That\'s not service — that\'s operational capability.',
    rating: 5,
  },
  {
    id: 't2',
    name: 'Sarah J. Hoffmann',
    role: 'Global Procurement Manager',
    company: 'Rheinstahl Industrial GmbH',
    avatar: 'SH',
    text: 'Our previous supplier managed 3 vendors. Alka Traders replaced all three. Consolidated invoicing, better pricing, faster delivery, and a single point of accountability. The ROI was immediate.',
    rating: 5,
  },
  {
    id: 't3',
    name: 'Dinesh Patel',
    role: 'Head of Sourcing',
    company: 'Reliance Engineering Works',
    avatar: 'DP',
    text: 'When our ABB drive failed during a critical production run, Alka Traders\'s emergency procurement team had a genuine OEM replacement delivered within 18 hours. No substitutes, no compromise.',
    rating: 5,
  },
]

export const offices: Office[] = [
  {
    city: 'Mumbai',
    country: 'India',
    address: '301, Trade Centre, Bandra Kurla Complex, Mumbai 400051',
    timezone: 'Asia/Kolkata',
    phone: '+91 22 6123 4000',
    email: 'mumbai@alkatraders.com',
    coordinates: [19.0760, 72.8777],
  },
  {
    city: 'Dubai',
    country: 'UAE',
    address: 'Office 704, JLT Cluster H, Dubai 114532',
    timezone: 'Asia/Dubai',
    phone: '+971 4 568 9200',
    email: 'dubai@alkatraders.com',
    coordinates: [25.2048, 55.2708],
  },
  {
    city: 'Singapore',
    country: 'Singapore',
    address: '1 Raffles Place, #20-01 One Raffles Place, Singapore 048616',
    timezone: 'Asia/Singapore',
    phone: '+65 6234 8900',
    email: 'singapore@alkatraders.com',
    coordinates: [1.2848, 103.8515],
  },
  {
    city: 'Rotterdam',
    country: 'Netherlands',
    address: 'Wijnhaven 107, 3011 WN Rotterdam, Netherlands',
    timezone: 'Europe/Amsterdam',
    phone: '+31 10 890 1234',
    email: 'rotterdam@alkatraders.com',
    coordinates: [51.9244, 4.4777],
  },
]

export const timelineEvents: TimelineEvent[] = [
  { year: '2010', title: 'Founded in Mumbai', description: 'Alka Traders established as a marine procurement specialist serving the Indian coastal fleet.' },
  { year: '2013', title: 'Singapore Office Opens', description: 'Strategic expansion into Southeast Asia\'s largest maritime hub.' },
  { year: '2016', title: '100+ Brand Partnerships', description: 'Crossed 100 authorized brand partnerships across marine and industrial sectors.' },
  { year: '2019', title: 'Dubai & Rotterdam Hubs', description: 'Opened procurement hubs in Dubai (MENA) and Rotterdam (Europe) for 24/7 coverage.' },
  { year: '2022', title: '10,000+ Products', description: 'Catalog crossed 10,000 line items across 6 major categories.' },
  { year: '2024', title: 'Global Operations', description: 'Serving 50+ countries with a network of 200+ brand partners and 4 operational hubs.' },
]

export const teamMembers: TeamMember[] = [
  { name: 'Arjun Mehta', role: 'CEO & Founder', initials: 'AM' },
  { name: 'Priya Sharma', role: 'Global Procurement Director', initials: 'PS' },
  { name: 'Marcus Chen', role: 'Head of Singapore Operations', initials: 'MC' },
  { name: 'Fatima Al-Rashid', role: 'Regional Director, MENA', initials: 'FA' },
  { name: 'Lars van der Berg', role: 'Head of European Operations', initials: 'LV' },
  { name: 'Rajesh Kumar', role: 'Supply Chain Manager', initials: 'RK' },
]

export const faqItems: FAQItem[] = [
  {
    question: 'How quickly do you respond?',
    answer: 'Our standard response time is within 4 business hours for all RFQs. For emergency requests marked as Same Day, our dedicated team activates within 30 minutes and maintains contact until delivery is confirmed.',
  },
  {
    question: 'Do you verify product authenticity?',
    answer: 'Every product we source comes with full traceability documentation. We only supply OEM and authorized distributor stock. If you require specific certificates of conformity, test reports, or material certificates, we provide them with every shipment.',
  },
  {
    question: 'Can you handle emergency orders?',
    answer: 'Yes. Our emergency procurement line operates 24/7. We maintain pre-positioned inventory hubs in Singapore, Dubai, Rotterdam, and Mumbai specifically for critical-path deliveries. We\'ve successfully fulfilled emergency orders within 18 hours of RFQ submission.',
  },
  {
    question: 'What regions do you ship to?',
    answer: 'We operate in 50+ countries across all major maritime routes and industrial corridors. Our primary hubs cover Asia-Pacific, Middle East, Europe, Africa, and the Americas. We handle all customs documentation, export licensing, and freight logistics.',
  },
]
