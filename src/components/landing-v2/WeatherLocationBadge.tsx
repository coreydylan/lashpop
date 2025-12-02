'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeather, WeatherCondition } from '@/hooks/useWeather'
import {
  SunIcon,
  CloudIcon,
  PartlyCloudyIcon,
  RainIcon,
  ThunderstormIcon,
  FogIcon,
  SnowIcon,
  ClearNightIcon
} from '@/components/icons/DesertIcons'

interface WeatherLocationBadgeProps {
  size?: 'sm' | 'md'
  className?: string
}

// Map weather conditions to icons
function WeatherIcon({ condition, className }: { condition: WeatherCondition; className?: string }) {
  const iconProps = { className }

  switch (condition) {
    case 'clear':
      return <SunIcon {...iconProps} />
    case 'clear-night':
      return <ClearNightIcon {...iconProps} />
    case 'partly-cloudy':
      return <PartlyCloudyIcon {...iconProps} />
    case 'cloudy':
      return <CloudIcon {...iconProps} />
    case 'fog':
      return <FogIcon {...iconProps} />
    case 'rain':
      return <RainIcon {...iconProps} />
    case 'thunderstorm':
      return <ThunderstormIcon {...iconProps} />
    case 'snow':
      return <SnowIcon {...iconProps} />
    default:
      return <SunIcon {...iconProps} />
  }
}

export default function WeatherLocationBadge({ size = 'md', className = '' }: WeatherLocationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { weather, isLoading } = useWeather()

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const textSize = size === 'sm' ? 'text-xs' : 'caption'

  return (
    <motion.div
      className={`inline-flex items-center gap-2 text-golden cursor-default select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
    >
      {/* Icon container with animation */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {!isHovered || isLoading ? (
            // Default sun icon with subtle pulse animation on hover
            <motion.div
              key="sun"
              initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              exit={{ opacity: 0, scale: 0.8, rotate: 30 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative"
            >
              <motion.div
                animate={isHovered && !isLoading ? {
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <SunIcon className={iconSize} />
              </motion.div>
            </motion.div>
          ) : (
            // Weather icon with entrance animation
            <motion.div
              key="weather"
              initial={{ opacity: 0, scale: 0.5, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 10 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <WeatherIcon condition={weather?.condition || 'clear'} className={iconSize} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Text container with smooth width animation */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!isHovered || isLoading ? (
            <motion.span
              key="location"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className={`${textSize} tracking-wide uppercase whitespace-nowrap`}
            >
              Oceanside, California
            </motion.span>
          ) : weather ? (
            <motion.span
              key="weather-info"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className={`${textSize} tracking-wide uppercase whitespace-nowrap flex items-center gap-1.5`}
            >
              <span>{weather.temperature}°F</span>
              <span className="opacity-50">•</span>
              <span>{weather.description}</span>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
