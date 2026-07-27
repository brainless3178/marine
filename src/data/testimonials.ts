import type { Testimonial, Office, TimelineEvent, FAQItem } from '../types'

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
  {
    id: 't4',
    name: 'noraedward',
    role: 'Verified Buyer',
    company: '',
    avatar: 'NE',
    text: 'Item: ROTHENBERGER ROLeak PRO LEAK DETECTOR GAS SNIFFER. Very helpful seller. They investigated the issue I had when the delivery company delivered my parcel to the wrong person. Was very quick to address the situation, keep me informed and get the parcel delivered to me. Would recommend.',
    rating: 5,
    productName: 'ROTHENBERGER ROLeak PRO LEAK DETECTOR GAS SNIFFER',
    productLink: '/products?search=ROTHENBERGER',
  },
  {
    id: 't5',
    name: 'b2esurplus',
    role: 'Verified Buyer — B2E Surplus',
    company: 'Back to Earth Surplus',
    avatar: 'BS',
    text: 'Item: RIDGID D223 PIPE THREADER RATCHET 1 INCH SQUARE DRIVE. Five star transaction. Good shipping. Good packaging. Item as described. Good quality product in good condition. Good appearance. Thank you for the good transaction! At B2E Surplus, we buy and sell a lot of similar merchandise. We are always interested in bulk lots and/or good deals on industrial supplies.',
    rating: 5,
    productName: 'RIDGID D223 PIPE THREADER RATCHET 1 INCH SQUARE DRIVE',
    productLink: '/products?search=RIDGID+D223',
  },
  {
    id: 't6',
    name: 'fuegocat77',
    role: 'Verified Buyer',
    company: '',
    avatar: 'FC',
    text: 'RECORD 91 1/2 C Pipe Vise received as pictured. Shipping was very fast and FREE, with unexpectedly quick delivery from India. Packaging could have been better — item shipped in corrugated cardboard box wrapped in duct tape. Vise itself was heavily covered in bubble wrap. Box was padded with pieces of Styrofoam on the sides and top, but not the bottom. As a result, the front mounting pad wore through the box, resulting in scraped paint. Nothing broken, so not an issue.',
    rating: 5,
    productName: 'RECORD 91 1/2 C PIPE VISE BENCH MOUNT PIPE CLAMP MADE IN E',
    productLink: '/products?search=RECORD+PIPE+VISE',
  },
]

export const offices: Office[] = [
  {
    city: 'BHAVNAGAR',
    country: 'India',
    address: 'PLOT - 7 ALANG HOUSE, MOTITALAV ROAD, KHUMBHARWADA',
    timezone: 'Asia/Kolkata',
    phone: '+91 97269 00547',
    email: 'info@alkatraders.com',
    coordinates: [21.7645, 72.1519],
  },
]

export const timelineEvents: TimelineEvent[] = [
  { year: '2010', title: 'Founded in Mumbai', description: 'Alka Traders established as a marine procurement specialist serving the Indian coastal fleet.' },
  { year: '2013', title: '100+ Brand Partnerships', description: 'Crossed 100 authorized brand partnerships across marine and industrial sectors.' },
  { year: '2016', title: '10,000+ Products', description: 'Catalog crossed 10,000 line items across 6 major categories.' },
  { year: '2019', title: 'Global Expansion', description: 'Expanded global reach serving customers in 30+ countries worldwide.' },
  { year: '2022', title: 'Bhavnagar Headquarters', description: 'Consolidated operations at our headquarters in Bhavnagar, Gujarat.' },
  { year: '2024', title: 'Global Operations', description: 'Serving 50+ countries with a network of 200+ brand partners from our Bhavnagar hub.' },
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
    answer: 'Yes. Our emergency procurement line operates 24/7. We maintain strategic inventory for critical-path deliveries from our Bhavnagar hub. We\'ve successfully fulfilled emergency orders within 18 hours of RFQ submission.',
  },
  {
    question: 'What regions do you ship to?',
    answer: 'We operate in 50+ countries across all major maritime routes and industrial corridors. Our primary hubs cover Asia-Pacific, Middle East, Europe, Africa, and the Americas. We handle all customs documentation, export licensing, and freight logistics.',
  },
]
