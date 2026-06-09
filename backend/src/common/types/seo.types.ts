/**
 * Global SEO & FAQ blueprint — reuse for Cities, Teams, Venues, Events, etc.
 * Block `type` is a plain string so the Admin Dashboard can add sub-categories at runtime.
 */

export interface SEOBlock {
  type: string;
  title: string;
  body: string;
}

export interface SEOContent {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  blocks: SEOBlock[];
}

export interface FaqItem {
  question: string;
  answer: string;
  order?: number;
}
