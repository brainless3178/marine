import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { VALID_LOCALES, LOCALE_TO_OG } from '../../lib/locale'
import type { Language } from '../../types'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'product' | 'article'
  productPrice?: number
  productCurrency?: string
  productAvailability?: string
  productSku?: string
  productBrand?: string
  productCategory?: string
  productCondition?: string
  ogImageAlt?: string
  keywords?: string
  jsonLd?: Record<string, any>[]
}

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://alkatraders.co'
const SITE_NAME = 'Alka Traders'
const DEFAULT_DESCRIPTION = 'Marine & industrial equipment supplier — ship spares, surplus machinery, electrical automation, hydraulic systems, and emergency procurement. Based in Bhavnagar, Gujarat, India.'
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/alka-traders-logo.jpeg`

/** Build absolute hreflang links for all supported locales. */
function buildHreflangLinks(_locale: Language, pathWithoutLocale: string): Array<{ hreflang: string; href: string }> {
  const links: Array<{ hreflang: string; href: string }> = []

  for (const lang of VALID_LOCALES) {
    const fullPath = lang === 'en' && (pathWithoutLocale === '' || pathWithoutLocale === '/')
      ? BASE_URL
      : `${BASE_URL}/${lang}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
    links.push({ hreflang: lang, href: fullPath })
  }

  // x-default points to English
  const defaultHref = pathWithoutLocale === '/' || pathWithoutLocale === ''
    ? BASE_URL
    : `${BASE_URL}/en${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
  links.push({ hreflang: 'x-default', href: defaultHref })

  return links
}

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  productPrice,
  productCurrency = 'USD',
  productAvailability,
  productSku,
  productBrand,
  productCategory,
  productCondition,
  ogImageAlt,
  keywords,
  jsonLd,
}: SEOProps) {
  const { pathname } = useLocation()
  const language = useStore((s) => s.language)

  // Derive the path without locale prefix
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  const isLocalePrefixed = firstSegment !== undefined && VALID_LOCALES.includes(firstSegment as Language)
  const pathWithoutLocale = isLocalePrefixed
    ? '/' + segments.slice(1).join('/')
    : pathname

  const fullTitle = `${title} | ${SITE_NAME}`
  const canonicalUrl = canonical
    ? `${BASE_URL}${canonical}`
    : isLocalePrefixed
      ? `${BASE_URL}/${language}${pathWithoutLocale === '/' && segments.length <= 1 ? '' : pathWithoutLocale}`
      : BASE_URL
  const ogImageUrl = ogImage ? `${BASE_URL}${ogImage}` : DEFAULT_OG_IMAGE
  const ogLocale = LOCALE_TO_OG[language] || 'en_US'
  const hreflangLinks = buildHreflangLinks(language, pathWithoutLocale)

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
      streetAddress: 'PLOT - 7 ALANG HOUSE, MOTITALAV ROAD, KHUMBHARWADA',
      addressLocality: 'BHAVNAGAR',
      addressRegion: 'GUJARAT',
      postalCode: '364001',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 21.7645,
      longitude: 72.1519,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-87990-95041',
        contactType: 'sales',
        areaServed: ['IN', 'AE', 'SG', 'NL', 'US', 'GB', 'DE', 'JP'],
        availableLanguage: ['English', 'Hindi'],
      },
      {
        '@type': 'ContactPoint',
        email: 'sales@alkatraders.co',
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
        ...(productSku ? { sku: productSku } : {}),
        ...(productCategory ? { category: productCategory } : {}),
        image: ogImageUrl,
        brand: {
          '@type': 'Brand',
          name: productBrand || 'Alka Traders',
        },
        ...(productCondition ? { itemCondition: productCondition } : {}),
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: productCurrency,
          price: productPrice,
          availability: productAvailability || 'https://schema.org/InStock',
          itemCondition: productCondition || 'https://schema.org/UsedCondition',
          priceValidUntil: '2027-12-31',
          seller: {
            '@type': 'Organization',
            name: 'Alka Traders',
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'IN',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 30,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
          },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: ['IN', 'AE', 'SG', 'NL', 'US', 'GB'],
            },
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: 0,
              currency: productCurrency,
            },
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
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang alternate links */}
      {hreflangLinks.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || DEFAULT_DESCRIPTION} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={ogImageAlt || `${SITE_NAME} — Marine & Industrial Equipment`} />
      <meta property="og:locale" content={ogLocale} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || DEFAULT_DESCRIPTION} />
      <meta name="twitter:image" content={ogImageUrl} />

      {ogType === 'product' && productPrice && (
        <>
          <meta property="product:price:amount" content={String(productPrice)} />
          <meta property="product:price:currency" content={productCurrency} />
        </>
      )}

      <script type="application/ld+json">
        {JSON.stringify(allJsonLd.length === 1 ? allJsonLd[0] : allJsonLd)}
      </script>
    </Helmet>
  )
}
