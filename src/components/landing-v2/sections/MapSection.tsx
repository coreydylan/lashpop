'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { DEFAULT_STUDIO_SETTINGS, type StudioSettings } from '@/types/studio'
import { getPublicImageBlur } from '@/lib/image-blur'

interface MapSectionProps {
  studio?: StudioSettings
}

// Studio-provided values are inserted into a Mapbox popup via innerHTML.
// They're trusted (admin-controlled) but HTML-escape anyway as defense in depth.
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch] as string))
}

export function MapSection({ studio = DEFAULT_STUDIO_SETTINGS }: MapSectionProps) {
  // Mapbox wants [lng, lat]; StudioSettings stores them named.
  const studioLocation: [number, number] = [studio.coordinates.lng, studio.coordinates.lat]
  const directionsUrl = studio.social.google ?? DEFAULT_STUDIO_SETTINGS.social.google!

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<import('mapbox-gl').Map | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapInitializedRef = useRef(false)

  // Use IntersectionObserver for lazy loading the map
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100% 0px 100% 0px' }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Only initialize if container exists, visible, and map not yet initialized
    if (!mapContainer.current || !isInView || mapInitializedRef.current) return

    // Mark as initialized to prevent re-runs
    mapInitializedRef.current = true

    let isMounted = true

    const initMap = async () => {
      try {
        // Dynamically import mapbox-gl
        const mapboxgl = await import('mapbox-gl')

        // Load CSS dynamically if not already loaded
        if (!document.getElementById('mapbox-gl-css')) {
          const link = document.createElement('link')
          link.id = 'mapbox-gl-css'
          link.rel = 'stylesheet'
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css'
          document.head.appendChild(link)
        }

        if (!isMounted || !mapContainer.current) return

        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (!mapboxToken) {
          console.warn('NEXT_PUBLIC_MAPBOX_TOKEN is not set — map will not render')
          return
        }
        mapboxgl.default.accessToken = mapboxToken

        // Initialize map
        const newMap = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: studioLocation,
          zoom: 14,
          interactive: true,
          scrollZoom: false, // Disable scroll zoom by default to prevent page scroll blocking
          cooperativeGestures: true // Requires two fingers to move map on mobile, allows page scroll
        })

        // Custom styling via map load event to match theme
        newMap.on('style.load', () => {
          // Set water color
          newMap.setPaintProperty('water', 'fill-color', '#e8f4f8') // ocean-mist like

          // Set land/background color (cream)
          const creamColor = '#fbf9f5'
          // Check if background layer exists (it's a specific layer type, not always present as 'background' ID)
          if (newMap.getLayer('background')) {
            newMap.setPaintProperty('background', 'background-color', creamColor)
          }

          // Also try to target landuse layers if available for more coverage
          if (newMap.getLayer('landuse')) {
            newMap.setPaintProperty('landuse', 'fill-color', creamColor)
          }
          if (newMap.getLayer('land')) {
            newMap.setPaintProperty('land', 'background-color', creamColor)
          }

          // Colorize roads
          if (newMap.getLayer('road-simple')) {
            newMap.setPaintProperty('road-simple', 'line-color', '#ffffff')
          }

          // Adjust poi labels color
          const labelLayers = ['poi-label', 'road-label', 'waterway-label']
          labelLayers.forEach(layer => {
            if (newMap.getLayer(layer)) {
              newMap.setPaintProperty(layer, 'text-color', '#ac4d3c') // terracotta color
            }
          })
        })

        map.current = newMap

        // Add navigation controls
        newMap.addControl(new mapboxgl.default.NavigationControl(), 'top-right')

        // Handle load event
        newMap.on('load', () => {
          if (isMounted) {
            setMapLoaded(true)
            newMap.resize()
          }
        })

        // Add custom marker
        const el = document.createElement('div')
        el.className = 'custom-marker'
        el.style.width = '40px'
        el.style.height = '40px'
        el.style.backgroundImage = 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'%23d4907e\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 0C7.31 0 3.5 3.81 3.5 8.5c0 6.5 8.5 15.5 8.5 15.5s8.5-9 8.5-15.5C20.5 3.81 16.69 0 12 0zm0 12c-1.93 0-3.5-1.57-3.5-3.5S10.07 5 12 5s3.5 1.57 3.5 3.5S13.93 12 12 12z\'/%3E%3C/svg%3E")'
        el.style.backgroundSize = 'cover'
        el.style.cursor = 'pointer'

        // Add marker with popup
        const marker = new mapboxgl.default.Marker(el)
          .setLngLat(studioLocation)
          .setPopup(
            new mapboxgl.default.Popup({ offset: 25 })
              .setHTML(`
                <div style="text-align: center; padding: 10px;">
                  <h3 style="margin: 0 0 5px; color: #3d3632;">${escapeHtml(studio.name)}</h3>
                  <p style="margin: 0 0 10px; color: #3d3632; font-size: 14px;">${escapeHtml(studio.address.city)}, ${escapeHtml(studio.address.state)}</p>
                  <a
                    href="${escapeHtml(directionsUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="color: #d4907e; text-decoration: none; font-weight: 500;"
                  >
                    Get Directions →
                  </a>
                </div>
              `)
          )
          .addTo(newMap)

        // Open popup on marker click
        el.addEventListener('click', () => {
          marker.togglePopup()
        })
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initMap()

    // Cleanup function
    return () => {
      isMounted = false
      if (map.current) {
        map.current.remove()
        map.current = null
        setMapLoaded(false)
      }
    }
  }, [isInView])

  return (
    <section ref={sectionRef} id="find-us" className="relative bg-ivory md:mt-0 -mt-[60px]">
      {/* Two-column layout: Photo first on mobile, Map left / Photo right on desktop */}
      <div className="flex flex-col md:flex-row md:h-[600px]">
        {/* Storefront Photo - Shows first on mobile, right side on desktop */}
        <div className="relative w-full h-[50dvh] md:h-full md:w-1/2 md:order-2">
          <Image
            src="/lashpop-images/storefront.jpeg"
            alt={`${studio.name} storefront`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            placeholder="blur"
            blurDataURL={getPublicImageBlur('/lashpop-images/storefront.jpeg')}
          />
        </div>

        {/* Map Container - Shows second on mobile, left side on desktop */}
        <div className="relative w-full h-[60dvh] md:h-full md:w-1/2 md:order-1">
          <div ref={mapContainer} className="w-full h-full" />

          {/* Loading state */}
          {!mapLoaded && (
            <div className="absolute inset-0 bg-warm-sand/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto border-2 border-dusty-rose border-t-transparent rounded-full" />
                <p className="caption text-charcoal mt-4">Loading map...</p>
              </div>
            </div>
          )}

          {/* Address Card Overlay - Desktop only */}
          <div className="hidden md:block absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-sm">
            <h3 className="heading-4 text-charcoal mb-3">{studio.name}</h3>
            <address className="body-text text-charcoal not-italic mb-4">
              {studio.address.street}<br />
              {studio.address.city}, {studio.address.state} {studio.address.zip}
            </address>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-medium" style={{ color: '#2f2a26' }}>Open Daily</span>
                <span
                  aria-hidden="true"
                  className="flex-1 self-end"
                  style={{
                    height: 4,
                    marginBottom: '0.45em',
                    backgroundImage: 'radial-gradient(circle, rgba(204,148,127,0.4) 1px, transparent 1.5px)',
                    backgroundSize: '7px 4px',
                    backgroundRepeat: 'repeat-x',
                  }}
                />
                <span className="font-medium tabular-nums whitespace-nowrap" style={{ color: '#cc947f' }}>
                  8:00 AM – 7:30 PM
                </span>
              </div>
              <p className="caption text-charcoal text-sm">
                By Appointment Only
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-sage/10">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-terracotta hover:text-terracotta/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="caption-bold">Get Directions</span>
              </a>
            </div>
          </div>
        </div>

        {/* Address Card - Mobile only, below the map */}
        <div className="md:hidden bg-ivory px-4 py-4">
          <div className="bg-white/95 backdrop-blur-sm px-5 py-4 rounded-2xl shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="heading-4 text-charcoal leading-tight">{studio.name}</h3>
                <address className="caption text-charcoal not-italic mt-1">
                  {studio.address.street}, {studio.address.city}, {studio.address.state} {studio.address.zip}
                </address>
              </div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-terracotta hover:text-terracotta/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="caption-bold">Directions</span>
              </a>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm" style={{ color: '#2f2a26' }}>Open Daily</span>
                <span
                  aria-hidden="true"
                  className="flex-1 self-end"
                  style={{
                    height: 4,
                    marginBottom: '0.45em',
                    backgroundImage: 'radial-gradient(circle, rgba(204,148,127,0.4) 1px, transparent 1.5px)',
                    backgroundSize: '7px 4px',
                    backgroundRepeat: 'repeat-x',
                  }}
                />
                <span className="font-medium text-sm tabular-nums whitespace-nowrap" style={{ color: '#cc947f' }}>
                  8:00 AM – 7:30 PM
                </span>
              </div>
              <p className="caption text-charcoal text-xs">
                By Appointment Only
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
