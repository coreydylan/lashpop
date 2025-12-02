'use client'

import { useState, useEffect } from 'react'

// Oceanside, CA coordinates
const OCEANSIDE_LAT = 33.1959
const OCEANSIDE_LON = -117.3795

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'thunderstorm'
  | 'snow'
  | 'clear-night'

interface WeatherData {
  temperature: number // Fahrenheit
  condition: WeatherCondition
  description: string
  isNight: boolean
}

interface UseWeatherResult {
  weather: WeatherData | null
  isLoading: boolean
  error: Error | null
}

// Map WMO weather codes to our conditions
// https://open-meteo.com/en/docs
function mapWeatherCode(code: number, isNight: boolean): { condition: WeatherCondition; description: string } {
  // Clear
  if (code === 0) {
    return {
      condition: isNight ? 'clear-night' : 'clear',
      description: isNight ? 'Clear night' : 'Sunny'
    }
  }

  // Mainly clear, partly cloudy
  if (code === 1 || code === 2) {
    return {
      condition: isNight ? 'clear-night' : 'partly-cloudy',
      description: code === 1 ? 'Mainly clear' : 'Partly cloudy'
    }
  }

  // Overcast
  if (code === 3) {
    return { condition: 'cloudy', description: 'Cloudy' }
  }

  // Fog
  if (code === 45 || code === 48) {
    return { condition: 'fog', description: 'Foggy' }
  }

  // Drizzle
  if (code >= 51 && code <= 57) {
    return { condition: 'rain', description: 'Drizzle' }
  }

  // Rain
  if (code >= 61 && code <= 67) {
    return { condition: 'rain', description: 'Rainy' }
  }

  // Snow
  if (code >= 71 && code <= 77) {
    return { condition: 'snow', description: 'Snowy' }
  }

  // Rain showers
  if (code >= 80 && code <= 82) {
    return { condition: 'rain', description: 'Showers' }
  }

  // Snow showers
  if (code >= 85 && code <= 86) {
    return { condition: 'snow', description: 'Snow showers' }
  }

  // Thunderstorm
  if (code >= 95 && code <= 99) {
    return { condition: 'thunderstorm', description: 'Thunderstorm' }
  }

  // Default fallback
  return {
    condition: isNight ? 'clear-night' : 'clear',
    description: 'Clear'
  }
}

export function useWeather(): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchWeather() {
      try {
        // Open-Meteo API - free, no API key required
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${OCEANSIDE_LAT}&longitude=${OCEANSIDE_LON}&current=temperature_2m,is_day,weather_code&temperature_unit=fahrenheit&timezone=America/Los_Angeles`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch weather data')
        }

        const data = await response.json()

        if (!isMounted) return

        const isNight = data.current.is_day === 0
        const { condition, description } = mapWeatherCode(data.current.weather_code, isNight)

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          condition,
          description,
          isNight
        })
        setIsLoading(false)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setIsLoading(false)
      }
    }

    fetchWeather()

    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return { weather, isLoading, error }
}
