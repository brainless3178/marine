import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
}

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://alkatraders.com'
const SITE_NAME = 'Alka Traders'
const DEFAULT_DESCRIPTION = 'Marine & industrial equipment supplier — ship spares, surplus machinery, electrical automation, hydraulic systems, and emergency procurement. Serving Singapore, Dubai, Rotterdam, Mumbai.'

export function SEO({ title, description, canonical, ogImage }: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL
  const ogImageUrl = ogImage ? `${BASE_URL}${ogImage}` : `${BASE_URL}/images/alka-traders-logo.jpg`

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
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImageUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || DEFAULT_DESCRIPTION} />
      <meta name="twitter:image" content={ogImageUrl} />
    </Helmet>
  )
}
