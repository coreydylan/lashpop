# City Landing Pages for Local SEO

## Overview

Create city-specific landing pages to rank for "[service] in [city]" searches across North County San Diego.

## Target Cities

1. Carlsbad (adjacent, affluent)
2. Encinitas (strong local search volume)
3. Vista (inland, less competition)
4. San Marcos (inland)
5. Del Mar / Solana Beach (could combine)

## Implementation Approach

Instead of duplicating the entire landing page, inject a **city-specific section** that adds legitimate local value.

### URL Structure

```
/                           → Main landing page (no city context)
/lash-extensions-carlsbad   → Same page + Carlsbad section + Carlsbad meta
/lash-extensions-encinitas  → Same page + Encinitas section + Encinitas meta
/lash-extensions-vista      → Same page + Vista section + Vista meta
```

### Route Implementation

```tsx
// /src/app/[citySlug]/page.tsx

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { LandingPageV2Client } from '@/app/LandingPageV2Client'
import { CITY_DATA } from '@/config/city-data'

interface Props {
  params: { citySlug: string }
}

export async function generateStaticParams() {
  return Object.keys(CITY_DATA).map((slug) => ({ citySlug: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = CITY_DATA[params.citySlug]
  if (!city) return {}

  return {
    title: city.metaTitle,
    description: city.metaDescription,
    alternates: {
      canonical: `https://lashpopstudios.com/${params.citySlug}`,
    },
    openGraph: {
      title: city.metaTitle,
      description: city.metaDescription,
    },
  }
}

export default function CityLandingPage({ params }: Props) {
  const city = CITY_DATA[params.citySlug]
  if (!city) notFound()

  return <LandingPageV2Client cityContext={city} />
}
```

### City Data Structure

```tsx
// /src/config/city-data.ts

export interface CityContext {
  name: string
  slug: string
  driveTime: string
  localDescription: string
  nearbyLandmark: string
  mapOrigin: string // for Google Maps directions
  neighborhoods: string[]
  metaTitle: string
  metaDescription: string
}

export const CITY_DATA: Record<string, CityContext> = {
  'lash-extensions-carlsbad': {
    name: 'Carlsbad',
    slug: 'lash-extensions-carlsbad',
    driveTime: '12 minutes',
    localDescription: 'LashPop Studios is just a quick drive down the coast from Carlsbad. Our Oceanside location serves clients from Carlsbad Village, La Costa, and Bressi Ranch who want premium lash extensions without the drive to San Diego.',
    nearbyLandmark: 'the Carlsbad Premium Outlets',
    mapOrigin: 'Carlsbad+Village+CA',
    neighborhoods: ['Carlsbad Village', 'La Costa', 'Bressi Ranch', 'Aviara'],
    metaTitle: 'Lash Extensions in Carlsbad | LashPop Studios Oceanside',
    metaDescription: 'Premium lash extensions near Carlsbad, CA. Classic, hybrid & volume lashes by certified artists. Just 12 min from Carlsbad Village. Book today.',
  },
  'lash-extensions-encinitas': {
    name: 'Encinitas',
    slug: 'lash-extensions-encinitas',
    driveTime: '18 minutes',
    localDescription: 'Serving the Encinitas beach community with award-winning lash services. Our Oceanside studio is an easy drive up the 101 from Leucadia, Cardiff, and downtown Encinitas.',
    nearbyLandmark: 'Moonlight Beach',
    mapOrigin: 'Encinitas+CA',
    neighborhoods: ['Leucadia', 'Cardiff-by-the-Sea', 'Old Encinitas', 'New Encinitas'],
    metaTitle: 'Lash Extensions near Encinitas | LashPop Studios',
    metaDescription: 'Luxury lash extensions for Encinitas clients. Volume, classic & hybrid lashes. 18 min from downtown Encinitas. Expert lash artists. Book now.',
  },
  'lash-extensions-vista': {
    name: 'Vista',
    slug: 'lash-extensions-vista',
    driveTime: '15 minutes',
    localDescription: 'Vista residents love our convenient Oceanside location. Skip the inland salon chains and treat yourself to a premium lash experience at LashPop Studios.',
    nearbyLandmark: 'the Vista Village',
    mapOrigin: 'Vista+CA',
    neighborhoods: ['Vista Village', 'Shadowridge', 'Lake Vista'],
    metaTitle: 'Lash Extensions near Vista, CA | LashPop Studios',
    metaDescription: 'Professional lash extensions for Vista residents. Classic, hybrid & mega volume. Just 15 min drive. Experienced artists, beautiful studio. Book today.',
  },
  'lash-extensions-san-marcos': {
    name: 'San Marcos',
    slug: 'lash-extensions-san-marcos',
    driveTime: '20 minutes',
    localDescription: 'San Marcos clients choose LashPop for our expert artists and relaxing coastal studio. Worth the short drive from Cal State San Marcos and the San Marcos Highlands.',
    nearbyLandmark: 'Cal State San Marcos',
    mapOrigin: 'San+Marcos+CA',
    neighborhoods: ['San Marcos Highlands', 'Lake San Marcos', 'Twin Oaks Valley'],
    metaTitle: 'Lash Extensions near San Marcos | LashPop Studios',
    metaDescription: 'Premium lash extensions for San Marcos clients. 20 min from CSUSM. Classic, hybrid & volume lashes. Relaxing coastal studio. Book your appointment.',
  },
}
```

### City Section Component

```tsx
// /src/components/landing-v2/sections/CitySection.tsx

'use client'

import { MapPin, Clock, Star } from 'lucide-react'
import type { CityContext } from '@/config/city-data'

interface CitySectionProps {
  city: CityContext
  reviews?: Array<{ author: string; text: string; rating: number }>
}

export function CitySection({ city, reviews }: CitySectionProps) {
  return (
    <section className="py-16 bg-cream/30">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: '#cc947f' }}>
            Serving {city.name} & North County
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-4" style={{ color: '#3d3632' }}>
            Lash Extensions near {city.name}
          </h2>
          <p className="text-charcoal/70 max-w-2xl mx-auto">
            {city.localDescription}
          </p>
        </div>

        {/* Quick Facts */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl">
            <Clock className="w-5 h-5" style={{ color: '#cc947f' }} />
            <div>
              <p className="font-medium text-charcoal">{city.driveTime}</p>
              <p className="text-sm text-charcoal/60">from downtown {city.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl">
            <MapPin className="w-5 h-5" style={{ color: '#cc947f' }} />
            <div>
              <p className="font-medium text-charcoal">429 S Coast Hwy</p>
              <p className="text-sm text-charcoal/60">Oceanside, CA 92054</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl">
            <Star className="w-5 h-5" style={{ color: '#cc947f' }} />
            <div>
              <p className="font-medium text-charcoal">5.0 Rating</p>
              <p className="text-sm text-charcoal/60">300+ reviews</p>
            </div>
          </div>
        </div>

        {/* Neighborhoods Served */}
        <div className="text-center mb-10">
          <p className="text-sm text-charcoal/60 mb-2">Serving clients from:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {city.neighborhoods.map((n) => (
              <span key={n} className="px-3 py-1 bg-white rounded-full text-sm text-charcoal/80">
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Embedded Map with Directions */}
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <iframe
            src={`https://www.google.com/maps/embed/v1/directions?key=YOUR_API_KEY&origin=${city.mapOrigin}&destination=429+S+Coast+Hwy+Oceanside+CA&mode=driving`}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </div>

        {/* Local Reviews (if available) */}
        {reviews && reviews.length > 0 && (
          <div className="mt-10">
            <h3 className="font-display text-xl font-medium text-charcoal mb-4 text-center">
              What {city.name} Clients Say
            </h3>
            {/* Review cards */}
          </div>
        )}
      </div>
    </section>
  )
}
```

### Schema Markup for City Pages

Add `areaServed` to the LocalBusiness schema when on a city page:

```json
{
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "name": "LashPop Studios",
  "areaServed": {
    "@type": "City",
    "name": "Carlsbad",
    "containedInPlace": {
      "@type": "State",
      "name": "California"
    }
  }
}
```

### Integration with Landing Page

Modify `LandingPageV2Client` to accept optional `cityContext`:

```tsx
interface LandingPageProps {
  cityContext?: CityContext
}

export function LandingPageV2Client({ cityContext }: LandingPageProps) {
  return (
    <>
      <HeroSection cityContext={cityContext} />
      {/* ... other sections ... */}

      {/* City section - only renders if cityContext provided */}
      {cityContext && <CitySection city={cityContext} />}

      {/* ... rest of page ... */}
    </>
  )
}
```

## Why This Isn't Doorway Spam

| Doorway Page (Bad) | This Approach (Good) |
|-------------------|---------------------|
| Same content, city name swapped | Same services (true), unique local section |
| No real local value | Filtered reviews, directions, local context |
| Exists only for SEO | Genuinely helps someone searching "[service] near [city]" |
| Thin content | Full landing page + additional local content |
| Multiple pages funneling to one destination | Each page IS the destination |

## Future Enhancements

1. **City-specific reviews**: Filter reviews table by client city/zip
2. **Dynamic drive times**: Use Google Maps API for real-time estimates
3. **Local testimonials**: Feature quotes from clients in each city
4. **City-specific offers**: "Carlsbad residents: mention this page for 10% off first visit"

## SEO Checklist for Each City Page

- [ ] Unique meta title with city name
- [ ] Unique meta description (150-160 chars)
- [ ] Unique H2 heading for city section
- [ ] Unique local description paragraph (100+ words)
- [ ] Embedded map with directions from that city
- [ ] areaServed schema markup
- [ ] Canonical URL set correctly
- [ ] Internal links from main pages
