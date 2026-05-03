import { Helmet } from "react-helmet-async";

interface SEOMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

/**
 * Presentational SEO wrapper. Renders <title>, meta description,
 * Open Graph and Twitter card tags into <head> via react-helmet-async.
 * No side effects, no hooks, no auth.
 */
export function SEOMeta({ title, description, image, url }: SEOMetaProps) {
  const ogImage = image ?? "/og-image.png";
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

export default SEOMeta;
