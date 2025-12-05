/**
 * SEO Utilities for SaaS
 * Pure TypeScript utilities for SEO implementation
 */

/**
 * Generate structured data for breadcrumbs
 */
export const generateBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * Generate Product schema for SaaS features
 */
export const generateProductSchema = (
  name: string,
  description: string,
  image: string,
  price?: number
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price.toString(),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    }),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };
};

/**
 * Generate Article schema for blog posts
 */
export const generateArticleSchema = (
  title: string,
  description: string,
  image: string,
  publishedDate: string,
  author: string
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    datePublished: publishedDate,
    author: {
      '@type': 'Person',
      name: author,
    },
  };
};

/**
 * Generate Event schema
 */
export const generateEventSchema = (
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  location: string
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    location: {
      '@type': 'Place',
      name: location,
    },
  };
};

/**
 * Generate Local Business schema
 */
export const generateLocalBusinessSchema = (
  name: string,
  address: string,
  phone: string,
  website: string,
  image: string
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    image,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
    },
    telephone: phone,
    url: website,
  };
};

/**
 * Generate Review schema
 */
export const generateReviewSchema = (
  reviewText: string,
  rating: number,
  reviewerName: string,
  itemReviewed: string
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewBody: reviewText,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Person',
      name: reviewerName,
    },
    itemReviewed: {
      '@type': 'Thing',
      name: itemReviewed,
    },
  };
};

/**
 * Generate dynamic meta tags for cards/previews
 */
export const generateCardMeta = (
  title: string,
  description: string,
  image?: string
) => {
  return {
    'og:title': title,
    'og:description': description,
    ...(image && { 'og:image': image }),
    'twitter:title': title,
    'twitter:description': description,
    ...(image && { 'twitter:image': image }),
  };
};

/**
 * SEO-friendly image component props interface
 */
export interface SeoImageProps {
  src: string;
  alt: string; // Required for SEO
  title?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Generate canonical URL helper
 */
export const getCanonicalUrl = (baseUrl: string, path: string) => {
  return `${baseUrl}${path}`.replace(/\/$/, '');
};

/**
 * Generate hreflang tags for multilingual SEO
 */
export const generateHrefLangTags = (
  currentUrl: string,
  alternateVersions: Record<string, string>
) => {
  return Object.entries(alternateVersions).map(([locale, url]) => ({
    rel: 'alternate',
    hrefLang: locale,
    href: url,
  }));
};

/**
 * Sanitize URL for SEO compliance
 */
export const sanitizeUrl = (url: string): string => {
  return url
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
};

/**
 * Generate keyword list from content
 */
export const extractKeywords = (text: string, count: number = 5): string[] => {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const frequency: Record<string, number> = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([word]) => word);
};

/**
 * Calculate reading time in minutes
 */
export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Format date for schema.org format
 */
export const formatDateForSchema = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Generate SEO-friendly slug from title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .slice(0, 75); // Limit slug length
};

/**
 * Validate meta description length (optimal: 120-160 characters)
 */
export const validateMetaDescription = (description: string): boolean => {
  return description.length >= 120 && description.length <= 160;
};

/**
 * Validate meta title length (optimal: 30-60 characters)
 */
export const validateMetaTitle = (title: string): boolean => {
  return title.length >= 30 && title.length <= 60;
};

/**
 * Get SEO score for content
 */
export const calculateSeoScore = (content: {
  title: string;
  description: string;
  headings: number;
  images: number;
  links: number;
  wordCount: number;
}): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 100;

  // Title validation
  if (!validateMetaTitle(content.title)) {
    issues.push('Meta title should be between 30-60 characters');
    score -= 10;
  }

  // Description validation
  if (!validateMetaDescription(content.description)) {
    issues.push('Meta description should be between 120-160 characters');
    score -= 10;
  }

  // Heading validation
  if (content.headings === 0) {
    issues.push('Page should contain at least one H1 heading');
    score -= 15;
  }

  // Image validation
  if (content.images === 0) {
    issues.push('Page should contain at least one image');
    score -= 10;
  }

  // Word count validation
  if (content.wordCount < 300) {
    issues.push('Content should be at least 300 words');
    score -= 15;
  }

  return { score: Math.max(0, score), issues };
};
