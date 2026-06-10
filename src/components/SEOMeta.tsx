import { Helmet } from "react-helmet-async";

const SITE_URL = "https://wrigleyvillebuddies.com";

interface SEOMetaProps {
  title: string;
  description: string;
  image?: string;
  /** Path (e.g. "/eats") or full URL. Used for canonical + og:url. */
  url?: string;
  noindex?: boolean;
  /** Optional structured data (JSON-LD) object or array. */
  jsonLd?: object | object[];
}

function toAbsolute(input: string) {
  if (/^https?:\/\//i.test(input)) return input;
  return `${SITE_URL}${input.startsWith("/") ? input : `/${input}`}`;
}

/**
 * Presentational SEO wrapper. Renders <title>, meta description,
 * canonical, Open Graph, Twitter, and optional JSON-LD into <head>.
 */
export function SEOMeta({ title, description, image, url, noindex, jsonLd }: SEOMetaProps) {
  const ogImage = toAbsolute(image ?? "/og-image.png");
  const canonical = url ? toAbsolute(url) : undefined;
  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {jsonLdItems.map((item, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(item)}</script>
      ))}
    </Helmet>
  );
}

export default SEOMeta;
