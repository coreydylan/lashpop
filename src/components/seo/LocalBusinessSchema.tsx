'use client';

import React from 'react';

interface LocalBusinessSchemaProps {
  totalReviews?: number;
  averageRating?: number;
}

export default function LocalBusinessSchema({
  totalReviews,
  averageRating,
}: LocalBusinessSchemaProps) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    '@id': 'https://lashpopstudios.com/#business',
    name: 'LashPop Studios',
    description: 'Award-winning lash extension studio in Oceanside, CA',
    url: 'https://lashpopstudios.com',
    telephone: '+1-760-212-0448',
    email: 'hello@lashpopstudios.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '429 S Coast Hwy',
      addressLocality: 'Oceanside',
      addressRegion: 'CA',
      postalCode: '92054',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 33.1959,
      longitude: -117.3795,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
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
      },
    ],
    priceRange: '$$',
    areaServed: [
      {
        '@type': 'City',
        name: 'Oceanside',
      },
      {
        '@type': 'City',
        name: 'Carlsbad',
      },
      {
        '@type': 'City',
        name: 'Vista',
      },
      {
        '@type': 'City',
        name: 'Encinitas',
      },
      {
        '@type': 'City',
        name: 'San Marcos',
      },
      {
        '@type': 'City',
        name: 'Escondido',
      },
    ],
    sameAs: [
      'https://www.instagram.com/lashpopstudios',
      'https://www.facebook.com/lashpopstudios',
    ],
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
