import Image from 'next/image'

// Standard size logos for consistent display
export const YelpLogo = () => (
  <div className="relative w-20 h-8">
    <Image
      src="/lashpop-images/168812.png"
      alt="Yelp Logo"
      fill
      className="object-contain object-left"
    />
  </div>
)

export const GoogleLogo = () => (
  <div className="relative w-8 h-8">
    <Image
      src="/lashpop-images/google-logo-g-suite-google.jpg"
      alt="Google Logo"
      fill
      className="object-contain object-left"
    />
  </div>
)

export const VagaroLogo = () => (
  <div className="relative w-24 h-8">
    <Image
      src="/lashpop-images/Vagaro_Logo.png"
      alt="Vagaro Logo"
      fill
      className="object-contain object-left"
    />
  </div>
)

// Compact versions for small spaces like the hero chip
// Using the actual logo images but sized appropriately for small display
export const GoogleLogoCompact = () => (
  <div className="relative w-4 h-4">
    <Image
      src="/lashpop-images/google-logo-g-suite-google.jpg"
      alt="Google"
      fill
      className="object-contain rounded-sm"
    />
  </div>
)

export const YelpLogoCompact = () => (
  <div className="relative h-4" style={{ width: '16px' }}>
    <Image
      src="/lashpop-images/168812.png"
      alt="Yelp"
      fill
      className="object-contain object-center"
    />
  </div>
)

export const VagaroLogoCompact = () => (
  <div className="relative h-4" style={{ width: '20px' }}>
    <Image
      src="/lashpop-images/Vagaro_Logo.png"
      alt="Vagaro"
      fill
      className="object-contain object-center"
    />
  </div>
)
