import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'product' | 'article'
  productPrice?: number
  productCurrency?: string
  productAvailability?: string
  ogImageAlt?: string
  jsonLd?: Record<string, any>[]
}

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://alkatraders.co'
const SITE_NAME = 'Alka Traders'
const DEFAULT_DESCRIPTION = 'Marine & industrial equipment supplier — ship spares, surplus machinery, electrical automation, hydraulic systems, and emergency procurement. Serving Singapore, Dubai, Rotterdam, Mumbai.'
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/alka-traders-logo.jpeg`

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  productPrice,
  productCurrency = 'USD',
  productAvailability,
  ogImageAlt,
  jsonLd,
}: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL
  const ogImageUrl = ogImage ? `${BASE_URL}${ogImage}` : DEFAULT_OG_IMAGE

  // Build default JSON-LD for Organization
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Alka Traders',
    url: BASE_URL,
    logo: DEFAULT_OG_IMAGE,
    description: 'Alka Traders is a globally connected marine and industrial equipment supplier. We supply OEM spares, surplus machinery, electrical automation components, hydraulic systems, and emergency procurement parts for the maritime and industrial sectors worldwide.',
    foundingDate: '2000',
    numberOfEmployees: '50-100',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '301, Trade Centre, BKC',
      addressLocality: 'Mumbai',
      addressRegion: 'Maharashtra',
      postalCode: '400051',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 19.076,
      longitude: 72.8777,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-97269-00547',
        contactType: 'sales',
        areaServed: ['IN', 'AE', 'SG', 'NL', 'US', 'GB', 'DE', 'JP'],
        availableLanguage: ['English', 'Hindi'],
      },
      {
        '@type': 'ContactPoint',
        email: 'info@alkatraders.com',
        contactType: 'customer service',
        areaServed: ['IN', 'AE', 'SG', 'NL'],
      },
    ],
    areaServed: [
      { '@type': 'Country', name: 'India' },
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'Country', name: 'Singapore' },
      { '@type': 'Country', name: 'Netherlands' },
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'United Kingdom' },
    ],
    knowsAbout: [
      'Marine Equipment',
      'Ship Spares',
      'Industrial Automation',
      'Hydraulic Systems',
      'Pneumatic Systems',
      'Electrical Components',
      'Emergency Procurement',
      'OEM Spare Parts',
      'Surplus Industrial Equipment',
      'ABB VFD',
      'Siemens PLC',
      'Parker Hydraulics',
      'Bosch Rexroth Pumps',
    ],
  }

  // Build product JSON-LD if on product page
  const productJsonLd = ogType === 'product' && productPrice
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description: description,
        image: ogImageUrl,
        brand: {
          '@type': 'Brand',
          name: 'Alka Traders',
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: productCurrency,
          price: productPrice,
          availability: productAvailability || 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'Alka Traders',
          },
        },
      }
    : null

  const allJsonLd = [
    organizationJsonLd,
    ...(productJsonLd ? [productJsonLd] : []),
    ...(jsonLd || []),
  ]

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || DEFAULT_DESCRIPTION} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || DEFAULT_DESCRIPTION} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={ogImageAlt || `${SITE_NAME} — Marine & Industrial Equipment`} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || DEFAULT_DESCRIPTION} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Product-specific OG tags */}
      {ogType === 'product' && productPrice && (
        <>
          <meta property="product:price:amount" content={String(productPrice)} />
          <meta property="product:price:currency" content={productCurrency} />
        </>
      )}

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(allJsonLd.length === 1 ? allJsonLd[0] : allJsonLd)}
      </script>
    </Helmet>
  )
}
