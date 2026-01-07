'use client'

import { useState } from 'react'
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
  variant?: 'default' | 'light'
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

export default function WeatherLocationBadge({ size = 'md', variant = 'default', className = '' }: WeatherLocationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTapped, setIsTapped] = useState(false)
  const { weather, isLoading } = useWeather()

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const textSize = size === 'sm' ? 'text-xs' : 'caption'
  const colorClass = variant === 'light' ? 'text-white/90' : 'text-golden'

  const isActive = isHovered || isTapped

  const handleTap = () => {
    setIsTapped(prev => !prev)
  }

  return (
    <div
      className={`inline-flex items-center gap-2 ${colorClass} cursor-default select-none -m-3 p-3 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleTap}
    >
      {/* Icon container */}
      <div className="relative">
        {!isActive || isLoading ? (
          <SunIcon className={iconSize} />
        ) : (
          <WeatherIcon condition={weather?.condition || 'clear'} className={iconSize} />
        )}
      </div>

      {/* Text container */}
      <div className="relative overflow-hidden">
        {!isActive || isLoading ? (
          <span className={`${textSize} tracking-wide uppercase whitespace-nowrap`}>
            Oceanside, California
          </span>
        ) : weather ? (
          <span className={`${textSize} tracking-wide uppercase whitespace-nowrap flex items-center gap-1.5`}>
            <span>{weather.temperature}°F</span>
            <span className="opacity-50">•</span>
            <span>{weather.description}</span>
          </span>
        ) : null}
      </div>
    </div>
  )
}
