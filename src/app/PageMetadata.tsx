import React from "react"
import {Helmet} from "react-helmet-async"

export interface Props {
  readonly title?: string
  readonly description?: string
  readonly imageUrl?: string
  readonly pathname?: string
}

const PageMetadata: React.FC<Props> = ({title, description, imageUrl, pathname = "/"}) => {
  const defaultTitle = "TxTracer"
  const siteName = "TxTracer | TON"
  const defaultDescription =
    "TxTracer is a web app for tracing and analyzing TON blockchain transactions. It offers tools to visualize execution, inspect contracts, and debug smart contracts with a code editor and user-friendly interface."
  const siteUrl = "https://txtracer.ton.org"
  const defaultImageUrl = `${siteUrl}/assets/cover.png`

  const pageTitle = title ? `${title} | ${defaultTitle}` : siteName
  const pageDescription = description || defaultDescription
  const pageImage = imageUrl || defaultImageUrl
  const pageUrl = `${siteUrl}${pathname}`

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:image:width" content="1280" />
      <meta property="og:image:height" content="640" />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  )
}

export default PageMetadata
