import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
}

const SEO = ({
  title,
  description = "VAW Technologies - Premium website development, web applications, AI solutions, AR/VR projects, and digital marketing services. Leading tech agency in Kerala, India.",
  keywords = "VAW, Varts, virtual arts, Kerala dev, Kerala hackathon, india dev, web development, designing, marketing, App development, Ai tool development, Advertisement, tech agency kerala",
  ogImage = "/og/home.png",
  ogType = "website",
  canonicalUrl,
}: SEOProps) => {
  useEffect(() => {
    // Update Document Title
    document.title = `${title} | VAW`;

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

    updateMetaTag("og:title", `${title} | VAW`, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", ogImage, true);
    updateMetaTag("og:type", ogType, true);

    updateMetaTag("twitter:title", `${title} | VAW`);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", ogImage);

    // Update Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    const currentUrl = canonicalUrl || window.location.href;
    if (canonical) {
      canonical.setAttribute("href", currentUrl);
    } else {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", currentUrl);
      document.head.appendChild(canonical);
    }
  }, [title, description, keywords, ogImage, ogType, canonicalUrl]);

  return null;
};

export default SEO;
