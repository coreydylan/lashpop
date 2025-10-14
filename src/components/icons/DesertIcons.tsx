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



