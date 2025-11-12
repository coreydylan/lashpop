import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LashPop Studios - Luxury Lashes, Tailored to You',
  description: 'Experience luxury lash services in Los Angeles. From classic to mega volume, discover your perfect lash look with our expert artists.',
  keywords: 'lash extensions, eyelash extensions, volume lashes, classic lashes, mega volume, lash lift, Los Angeles, beauty studio',
  openGraph: {
    title: 'LashPop Studios - Luxury Lashes, Tailored to You',
    description: 'Experience luxury lash services in Los Angeles. Book your appointment today.',
    images: ['/images/og-image.jpg'],
    url: 'https://lashpopstudios.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LashPop Studios',
    description: 'Luxury lash services in Los Angeles',
    images: ['/images/twitter-card.jpg'],
  },
};

export default function LandingV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}