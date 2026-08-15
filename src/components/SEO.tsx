import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: string;
  ogSiteName?: string;
  ogLocale?: string;
  canonicalUrl?: string;
}

const SEO = ({
  title,
  description = "VAW Technologies (Varts World) - Best website development and digital marketing agency in Kerala. Premium web applications, AI solutions, SEO & growth marketing.",
  keywords = "best website development agency in kerala, best digital marketing agency in kerala, web development Kerala, digital marketing agency Kerala, VAW Technologies, Varts World, web design Kollam, app development Kerala",
  ogImage = "/og/home.png",
  ogImageAlt = "VAW Technologies - Best Website Development & Digital Marketing Agency in Kerala",
  ogType = "website",
  ogSiteName = "VAW Technologies",
  ogLocale = "en_US",
  canonicalUrl,
}: SEOProps) => {
  useEffect(() => {
    // Update Document Title
    const fullTitle = title.includes("VAW") ? title : `${title} | VAW Technologies`;
    document.title = fullTitle;

    // Update Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update Meta Keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute("content", keywords);
    } else {
      const meta = document.createElement("meta");
      meta.name = "keywords";
      meta.content = keywords;
      document.head.appendChild(meta);
    }

    // Update Meta tags helper
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      const tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (tag) {
        tag.setAttribute("content", content);
      } else {
        const meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    const siteOrigin = "https://vaw.tech";
    const absoluteOgImage = ogImage.startsWith("http") ? ogImage : `${siteOrigin}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;
    const pageUrl = canonicalUrl || `${siteOrigin}${window.location.pathname}`;

    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", absoluteOgImage, true);
    updateMetaTag("og:image:alt", ogImageAlt, true);
    updateMetaTag("og:type", ogType, true);
    updateMetaTag("og:site_name", ogSiteName, true);
    updateMetaTag("og:locale", ogLocale, true);
    updateMetaTag("og:url", pageUrl, true);

    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", absoluteOgImage);
    updateMetaTag("twitter:image:alt", ogImageAlt);

    // Update Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", pageUrl);
    } else {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", pageUrl);
      document.head.appendChild(canonical);
    }
  }, [title, description, keywords, ogImage, ogImageAlt, ogType, ogSiteName, ogLocale, canonicalUrl]);

  return null;
};

export default SEO;
