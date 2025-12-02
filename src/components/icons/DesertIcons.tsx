export const SunIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

export const WaveIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2c0 2 2 2 2 2s2 0 2-2c0-1.1.9-2 2-2s2 .9 2 2c0 2 2 2 2 2s2 0 2-2c0-1.1.9-2 2-2s2 .9 2 2" />
  </svg>
)

export const PalmIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 8c0-2.76-1.34-5-3-5S7 5.24 7 8c0 1.66.67 3.16 1.76 4.24L12 16l3.24-3.76C16.33 11.16 17 9.66 17 8c0-2.76-1.34-5-3-5z" />
    <path d="M12 16v5" />
  </svg>
)

export const MoonIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export const StarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.09 6.42h6.75l-5.46 3.97 2.09 6.42L12 14.84l-5.46 3.97 2.09-6.42L3.16 8.42h6.75L12 2z" />
  </svg>
)

export const LeafIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
)

// Weather Icons for live weather display
export const CloudIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
  </svg>
)

export const PartlyCloudyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    {/* Sun behind */}
    <circle cx="10" cy="6" r="3" opacity="0.9" />
    <path d="M10 1v1.5M10 9.5V11M5.05 2.05l1.06 1.06M12.89 9.89l1.06 1.06M4 6H5.5M14.5 6H16M5.05 9.95l1.06-1.06M12.89 2.11l1.06 1.06"
          stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {/* Cloud in front */}
    <path d="M19.35 14.04A5.49 5.49 0 0 0 14 10a5.49 5.49 0 0 0-4.85 2.91A4.494 4.494 0 0 0 5 17.5C5 20 7 22 9.5 22h9c2.21 0 4-1.79 4-4 0-2.1-1.64-3.81-3.65-3.96z" />
  </svg>
)

export const RainIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.66 8A6.002 6.002 0 0 0 6 8.17A4.501 4.501 0 0 0 5.5 17h12c2.21 0 4-1.79 4-4a4 4 0 0 0-3.84-3.95z" />
    <path d="M7 19v2M11 19v2M15 19v2M9 21v2M13 21v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
)

export const ThunderstormIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.66 8A6.002 6.002 0 0 0 6 8.17A4.501 4.501 0 0 0 5.5 17h12c2.21 0 4-1.79 4-4a4 4 0 0 0-3.84-3.95z" />
    <path d="M12 17l-2 4h3l-1 3 3-5h-3l1-2z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
  </svg>
)

export const FogIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 10h18M5 14h14M7 18h10M4 6h16" />
  </svg>
)

export const SnowIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.66 8A6.002 6.002 0 0 0 6 8.17A4.501 4.501 0 0 0 5.5 17h12c2.21 0 4-1.79 4-4a4 4 0 0 0-3.84-3.95z" />
    <circle cx="8" cy="20" r="1" />
    <circle cx="12" cy="19" r="1" />
    <circle cx="16" cy="20" r="1" />
    <circle cx="10" cy="22" r="1" />
    <circle cx="14" cy="22" r="1" />
  </svg>
)

export const ClearNightIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
  </svg>
)

export const ArchShape = ({ className = "", fill = "currentColor" }: { className?: string, fill?: string }) => (
  <svg className={className} viewBox="0 0 200 100" preserveAspectRatio="none">
    <path d={`M 0,100 Q 100,0 200,100 L 200,100 L 0,100 Z`} fill={fill} opacity="0.1" />
  </svg>
)

export const WaveShape = ({ className = "", fill = "currentColor" }: { className?: string, fill?: string }) => (
  <svg className={className} viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
          fill={fill} opacity="0.3" />
  </svg>
)

export const CircleDecoration = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <circle cx="50" cy="50" r="20" fill="currentColor" opacity="0.1" />
  </svg>
)

export const DotPattern = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="100" height="100">
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.2" />
    </pattern>
    <rect width="100" height="100" fill="url(#dots)" />
  </svg>
)







