import { Metadata } from 'next';

const baseUrl = 'https://nesternity.cyth.app';
const siteName = 'Nesternity';
const description =
  'Nesternity is a modern SaaS CRM dashboard for teams and projects. Manage invoices, budgets, proposals, and team collaboration all in one place.';

export const seoConfig = {
  baseUrl,
  siteName,
  description,
  logo: `${baseUrl}/nesternity_W.png`,
  author: 'Nesternity Team',
  email: 'support@nesternity.cyth.app',
  twitterHandle: '@nesternity',
  linkedinUrl: 'https://www.linkedin.com/company/nesternity',
  twitterUrl: 'https://twitter.com/nesternity',
};

export const generateMetadata = (
  title: string,
  description: string,
  path: string = '',
  ogImage: string = seoConfig.logo
): Metadata => {
  const url = path ? `${baseUrl}${path}` : baseUrl;

  return {
    title,
    description,
    keywords: [
      'CRM',
      'project management',
      'team collaboration',
      'invoicing',
      'budget tracking',
      'SaaS',
      'dashboard',
      'freelancer',
      'business management',
      'proposal management',
      'contract management',
      'client management',
    ],
    authors: [{ name: seoConfig.author, url: baseUrl }],
    creator: seoConfig.author,
    publisher: siteName,
    formatDetection: {
      email: true,
      telephone: true,
      address: true,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
        {
          url: `${baseUrl}/nesternity_l.png`,
          width: 1200,
          height: 630,
          alt: siteName,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: seoConfig.twitterHandle,
      creator: seoConfig.twitterHandle,
      title,
      description,
      images: [ogImage],
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/nesternity_W.png',
    },
    alternates: {
      canonical: url,
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: siteName,
    },
    category: 'Business',
    classification: 'Business Software',
  };
};

export const getStructuredData = (type: 'organization' | 'software' | 'faq' | 'breadcrumb', data?: any) => {
  const baseSchema = {
    '@context': 'https://schema.org',
  };

  switch (type) {
    case 'organization':
      return {
        ...baseSchema,
        '@type': 'Organization',
        name: siteName,
        url: baseUrl,
        logo: seoConfig.logo,
        description: seoConfig.description,
        email: seoConfig.email,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          email: seoConfig.email,
        },
        sameAs: [seoConfig.twitterUrl, seoConfig.linkedinUrl],
      };

    case 'software':
      return {
        ...baseSchema,
        '@type': 'SoftwareApplication',
        name: siteName,
        description: seoConfig.description,
        url: baseUrl,
        image: seoConfig.logo,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '150',
        },
      };

    case 'faq':
      return {
        ...baseSchema,
        '@type': 'FAQPage',
        mainEntity: data?.faqs?.map((faq: any) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })) || [],
      };

    case 'breadcrumb':
      return {
        ...baseSchema,
        '@type': 'BreadcrumbList',
        itemListElement: data?.items?.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })) || [],
      };

    default:
      return baseSchema;
  }
};
