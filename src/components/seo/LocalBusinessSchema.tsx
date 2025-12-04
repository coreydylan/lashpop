'use client';

import React from 'react';

interface LocalBusinessSchemaProps {
  totalReviews?: number;
  averageRating?: number;
  businessInfo?: {
    name: string;
    description?: string;
    url: string;
    telephone: string;
    email: string;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    yelp?: string;
  };
  serviceAreas?: string[];
  openingHours?: {
    dayOfWeek: string[];
    opens: string;
    closes: string;
  };
}

// Default values for backward compatibility
const defaultBusinessInfo = {
  name: 'LashPop Studios',
  description: 'Award-winning lash extension studio in Oceanside, CA',
  url: 'https://lashpopstudios.com',
  telephone: '+1-760-212-0448',
  email: 'hello@lashpopstudios.com',
  streetAddress: '429 S Coast Hwy',
  city: 'Oceanside',
  state: 'CA',
  postalCode: '92054',
  country: 'US',
  latitude: 33.1959,
  longitude: -117.3795,
};

const defaultSocialLinks = {
  instagram: 'https://www.instagram.com/lashpopstudios',
  facebook: 'https://www.facebook.com/lashpopstudios',
};

const defaultServiceAreas = [
  'Oceanside',
  'Carlsbad',
  'Vista',
  'Encinitas',
  'San Marcos',
  'Escondido',
];

const defaultOpeningHours = {
  dayOfWeek: [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ],
  opens: '08:00',
  closes: '19:30',
};

export default function LocalBusinessSchema({
  totalReviews,
  averageRating,
  businessInfo = defaultBusinessInfo,
  socialLinks = defaultSocialLinks,
  serviceAreas = defaultServiceAreas,
  openingHours = defaultOpeningHours,
}: LocalBusinessSchemaProps) {
  // Build sameAs array from socialLinks
  const sameAsArray = Object.values(socialLinks).filter(
    (link): link is string => typeof link === 'string' && link.length > 0
  );

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    '@id': `${businessInfo.url}/#business`,
    name: businessInfo.name,
    ...(businessInfo.description && { description: businessInfo.description }),
    url: businessInfo.url,
    telephone: businessInfo.telephone,
    email: businessInfo.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessInfo.streetAddress,
      addressLocality: businessInfo.city,
      addressRegion: businessInfo.state,
      postalCode: businessInfo.postalCode,
      addressCountry: businessInfo.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: businessInfo.latitude,
      longitude: businessInfo.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: openingHours.dayOfWeek,
        opens: openingHours.opens,
        closes: openingHours.closes,
      },
    ],
    priceRange: '$$',
    areaServed: serviceAreas.map((city) => ({
      '@type': 'City',
      name: city,
    })),
    ...(sameAsArray.length > 0 && { sameAs: sameAsArray }),
    ...(totalReviews &&
      averageRating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: averageRating,
          reviewCount: totalReviews,
        },
      }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Lash and Brow Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Classic Lash Extensions',
            description: 'One extension applied to each natural lash',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Volume Lash Extensions',
            description: 'Multiple lightweight extensions applied to each natural lash',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Hybrid Lash Extensions',
            description: 'Combination of classic and volume techniques',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mega Volume',
            description: 'Ultra-dramatic volume lash extensions',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Lash Lift',
            description: 'Semi-permanent curl for natural lashes',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Lash Tint',
            description: 'Darkening of natural lashes',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Brow Lamination',
            description: 'Brow styling treatment for fuller-looking brows',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Brow Tinting',
            description: 'Semi-permanent brow coloring',
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
