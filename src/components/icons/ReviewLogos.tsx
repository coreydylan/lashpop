import Image from 'next/image'

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
