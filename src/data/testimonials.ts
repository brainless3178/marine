import type { Testimonial, Office, TimelineEvent, FAQItem } from '../types'

export const testimonials: Testimonial[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Verified Buyer',
    role: '',
    company: '',
    avatar: 'VB',
    text: 'EL PEDIDO FUE ENVIADO A TIEMPO, MUY BIEN EMPACADO Y CORRESPONDE CON LO OBSERVADO EN LAS IMAGENES QUE FUERON EXHIBIDAS EN LA PAGINA, VENDEDOR AMPLIAMENTE RECOMENDADO',
    rating: 5,
  },
  {
    id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Verified Buyer',
    role: '',
    company: '',
    avatar: 'VB',
    text: 'Absolutt super proffesional we hit a bumb in the road they reaction was lightning fast i will do moore business with these guys',
    rating: 5,
  },
  {
    id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Verified Buyer',
    role: '',
    company: '',
    avatar: 'VB',
    text: 'Excellent communication with the Sellers. I\'d happily purchase from them again.',
    rating: 5,
  },
]

export const offices: Office[] = [
  {
    city: 'BHAVNAGAR',
    country: 'India',
    address: 'PLOT - 7 ALANG HOUSE, MOTITALAV ROAD, KHUMBHARWADA',
    timezone: 'Asia/Kolkata',
    phone: '+91 87990 95041',
    email: 'sales@alkatraders.co',
    coordinates: [21.7645, 72.1519],
  },
]

export const timelineEvents: TimelineEvent[] = [
  { year: '1990', title: 'Founded in Bhavnagar, Gujarat', description: 'Alka Traders began its journey in Bhavnagar, Gujarat as a marine procurement specialist serving the Indian coastal fleet.' },
  { year: '2013', title: '100+ Brand Partnerships', description: 'Crossed 100 authorized brand partnerships across marine and industrial sectors.' },
  { year: '2016', title: '10,000+ Products', description: 'Catalog crossed 10,000 line items across 6 major categories.' },
  { year: '2019', title: 'Global Expansion', description: 'Expanded global reach serving customers in 30+ countries worldwide.' },
  { year: '2022', title: 'Modern Headquarters', description: 'Consolidated operations into a modern headquarters facility in Bhavnagar, Gujarat.' },
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
