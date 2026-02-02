'use client'

import { useEffect, useRef, useState } from 'react'

// Studio location - Oceanside, CA (you can update with exact coordinates)
const STUDIO_LOCATION: [number, number] = [-117.3795, 33.1959]

// Google Maps directions link (shared from Google Maps)
const GOOGLE_MAPS_DIRECTIONS_URL = 'https://maps.app.goo.gl/mozm5VjGqw8qCuzL8'

export function MapSection() {
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
      { rootMargin: '-20%' }
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

        // Set Mapbox access token
        mapboxgl.default.accessToken = 'pk.eyJ1IjoiY29yZXlkeWxhbiIsImEiOiJjbWk5a2E1Z2YwbjNsMmtvZzBxeTZxNnhqIn0.b92WsE5LmoVB7wVXNQGeiw'

        // Initialize map
        const newMap = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: STUDIO_LOCATION,
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
          .setLngLat(STUDIO_LOCATION)
          .setPopup(
            new mapboxgl.default.Popup({ offset: 25 })
              .setHTML(`
                <div style="text-align: center; padding: 10px;">
                  <h3 style="margin: 0 0 5px; color: #3d3632;">LashPop Studios</h3>
                  <p style="margin: 0 0 10px; color: #3d3632; font-size: 14px;">Oceanside, CA</p>
                  <a
                    href="${GOOGLE_MAPS_DIRECTIONS_URL}"
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
    <section ref={sectionRef} id="find-us" className="relative bg-ivory">
      {/* Section Header - Above Map */}
      <div className="text-center py-8 md:py-12">
        <h2
          className="text-2xl md:text-5xl font-display font-medium tracking-wide mb-4 md:mb-6"
          style={{ color: '#ac4d3c' }}
        >
          Find Us
        </h2>
        <div className="w-24 h-px bg-terracotta/30 mx-auto" />
      </div>

      {/* Map Container - Full viewport height on mobile, fixed on desktop */}
      <div className="relative w-full h-[calc(100dvh-120px)] md:h-[600px]">
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

        {/* Address Card Overlay - Desktop */}
        <div className="hidden md:block absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-sm">
          <h3 className="heading-4 text-charcoal mb-3">LashPop Studios</h3>
          <address className="body-text text-charcoal not-italic mb-4">
            429 S Coast Hwy<br />
            Oceanside, CA 92054
          </address>
          <div className="space-y-1">
            <p className="caption text-charcoal">
              <span className="caption-bold">Open Daily:</span> 8:00 AM – 7:30 PM
            </p>
            <p className="caption text-charcoal text-sm">
              By Appointment Only
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-sage/10">
            <a
              href={GOOGLE_MAPS_DIRECTIONS_URL}
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

        {/* Address Card Overlay - Mobile, positioned at bottom of map */}
        <div className="md:hidden absolute bottom-32 left-4 right-4 bg-white/95 backdrop-blur-sm px-5 py-4 rounded-2xl shadow-xl z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="heading-4 text-charcoal leading-tight">LashPop Studios</h3>
              <address className="caption text-charcoal not-italic mt-1">
                429 S Coast Hwy, Oceanside, CA 92054
              </address>
            </div>
            <a
              href={GOOGLE_MAPS_DIRECTIONS_URL}
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
          <div className="mt-2">
            <p className="caption text-charcoal">
              <span className="caption-bold">Open Daily</span> 8A–7:30P
            </p>
            <p className="caption text-charcoal text-xs mt-0.5">
              By Appointment Only
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
