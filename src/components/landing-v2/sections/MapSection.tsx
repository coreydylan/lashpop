'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import {
  BusinessLocationSettings,
  BusinessHoursSettings,
  BrandingSettings,
  defaultSiteSettings
} from '@/db/schema/site_settings'

export function MapSection() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<import('mapbox-gl').Map | null>(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapInitializedRef = useRef(false)

  // Settings state
  const [location, setLocation] = useState<BusinessLocationSettings>(defaultSiteSettings.business.location)
  const [hours, setHours] = useState<BusinessHoursSettings>(defaultSiteSettings.business.hours)
  const [branding, setBranding] = useState<BrandingSettings>(defaultSiteSettings.branding)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Fetch settings
  useEffect(() => {
    fetch('/api/admin/website/site-settings')
      .then(res => res.json())
      .then(settings => {
        if (settings.business?.location) setLocation(settings.business.location)
        if (settings.business?.hours) setHours(settings.business.hours)
        if (settings.branding) setBranding(settings.branding)
        setSettingsLoaded(true)
      })
      .catch(err => {
        console.error('Error fetching map settings:', err)
        setSettingsLoaded(true) // Use defaults on error
      })
  }, [])

  useEffect(() => {
    // Only initialize if container exists, visible, settings loaded, and map not yet initialized
    if (!mapContainer.current || !isInView || mapInitializedRef.current || !settingsLoaded) return

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
        mapboxgl.default.accessToken = location.mapboxAccessToken || 'pk.eyJ1IjoiY29yZXlkeWxhbiIsImEiOiJjbWk5a2E1Z2YwbjNsMmtvZzBxeTZxNnhqIn0.b92WsE5LmoVB7wVXNQGeiw'

        // Get coordinates from settings
        const studioLocation: [number, number] = [location.coordinates.lng, location.coordinates.lat]

        // Initialize map
        const newMap = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: studioLocation,
          zoom: 14,
          interactive: true,
          scrollZoom: false,
          cooperativeGestures: true
        })

        // Custom styling via map load event to match theme
        newMap.on('style.load', () => {
          // Set water color
          newMap.setPaintProperty('water', 'fill-color', '#e8f4f8')

          // Set land/background color (cream)
          const creamColor = '#fbf9f5'
          if (newMap.getLayer('background')) {
            newMap.setPaintProperty('background', 'background-color', creamColor)
          }
          if (newMap.getLayer('landuse')) {
            newMap.setPaintProperty('landuse', 'fill-color', creamColor)
          }
          if (newMap.getLayer('land')) {
            newMap.setPaintProperty('land', 'background-color', creamColor)
          }
          if (newMap.getLayer('road-simple')) {
            newMap.setPaintProperty('road-simple', 'line-color', '#ffffff')
          }
          const labelLayers = ['poi-label', 'road-label', 'waterway-label']
          labelLayers.forEach(layer => {
            if (newMap.getLayer(layer)) {
              newMap.setPaintProperty(layer, 'text-color', '#8a7c69')
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
                  <h3 style="margin: 0 0 5px; color: #4a4a4a;">${branding.companyName}</h3>
                  <p style="margin: 0 0 10px; color: #666; font-size: 14px;">${location.city}, ${location.state}</p>
                  <a
                    href="${location.googleMapsUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="color: #d4907e; text-decoration: none; font-weight: 500;"
                  >
                    Get Directions
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
  }, [isInView, settingsLoaded, location, branding])

  return (
    <section ref={ref} className="relative h-[100dvh] md:h-auto">
      {/* Map Container - Full viewport height on mobile, fixed on desktop */}
      <motion.div
        className="relative w-full h-full md:h-[600px]"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div ref={mapContainer} className="w-full h-full" />

        {/* Loading state */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-warm-sand/20 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 mx-auto border-2 border-dusty-rose border-t-transparent rounded-full"
              />
              <p className="caption text-dune/60 mt-4">Loading map...</p>
            </div>
          </div>
        )}

        {/* Address Card Overlay - Desktop */}
        <motion.div
          className="hidden md:block absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-sm"
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="heading-4 text-dune mb-3">{branding.companyName}</h3>
          <address className="body-text text-dune/70 not-italic mb-4">
            {location.streetAddress}<br />
            {location.city}, {location.state} {location.zipCode}
          </address>
          <div className="space-y-1">
            <p className="caption text-dune/70">
              <span className="caption-bold">Open Daily:</span> {hours.regularHours.replace('every day', '').trim()}
            </p>
            {hours.appointmentOnly && (
              <p className="caption text-dune/50 text-sm">
                {hours.specialNote || 'By Appointment Only'}
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-sage/10">
            <a
              href={location.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-dusty-rose hover:text-dusty-rose/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="caption-bold">Get Directions</span>
            </a>
          </div>
        </motion.div>

        {/* Address Card Overlay - Mobile */}
        <motion.div
          className="md:hidden absolute bottom-32 left-4 right-4 bg-white/95 backdrop-blur-sm px-5 py-4 rounded-2xl shadow-xl z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="heading-4 text-dune leading-tight">{branding.companyName}</h3>
              <address className="caption text-dune/70 not-italic mt-1">
                {location.fullAddress || `${location.streetAddress}, ${location.city}, ${location.state} ${location.zipCode}`}
              </address>
            </div>
            <a
              href={location.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-dusty-rose hover:text-dusty-rose/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="caption-bold">Directions</span>
            </a>
          </div>
          <div className="mt-2">
            <p className="caption text-dune/70">
              <span className="caption-bold">Open Daily</span> {hours.regularHours.replace('every day', '').trim()}
            </p>
            {hours.appointmentOnly && (
              <p className="caption text-dune/50 text-xs mt-0.5">
                {hours.specialNote || 'By Appointment Only'}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
