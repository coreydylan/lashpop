import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  getServiceBySlug,
  getServiceCategoriesForLanding,
  getServicesByCategory,
} from '@/actions/services';
import { getAssetsByServiceSlug } from '@/actions/dam';
import { ServiceDetailClient } from './ServiceDetailClient';

const SITE_URL = 'https://lashpopstudios.com';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (service) {
    return {
      title: `${service.name} | LashPop Studios`,
      description: service.description || `Book ${service.name} at LashPop Studios in Oceanside, CA.`,
      alternates: { canonical: `${SITE_URL}/services/${service.slug}` },
      openGraph: {
        title: `${service.name} | LashPop Studios`,
        description: service.description || `Book ${service.name} at LashPop Studios in Oceanside, CA.`,
        url: `${SITE_URL}/services/${service.slug}`,
        type: 'website',
        images: service.imageUrl ? [{ url: service.imageUrl, alt: service.name }] : undefined,
      },
    };
  }

  const categories = await getServiceCategoriesForLanding();
  const category = categories.find((item) => item.slug === slug);

  if (category) {
    const description =
      category.description ||
      `Explore ${category.name.toLowerCase()} services at LashPop Studios in Oceanside, CA.`;

    return {
      title: `${category.name} Services in Oceanside, CA | LashPop Studios`,
      description,
      alternates: { canonical: `${SITE_URL}/services/${category.slug}` },
      openGraph: {
        title: `${category.name} Services | LashPop Studios`,
        description,
        url: `${SITE_URL}/services/${category.slug}`,
        type: 'website',
      },
    };
  }

  return {
    title: 'Service Not Found | LashPop Studios',
    robots: { index: false, follow: false },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (service) {
    const gallery = await getAssetsByServiceSlug(slug);

    return <ServiceDetailClient service={service} gallery={gallery} />;
  }

  const categories = await getServiceCategoriesForLanding();
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const categoryServices = await getServicesByCategory(category.slug);

  return (
    <main className="min-h-screen bg-ivory px-6 py-16 text-charcoal md:px-10 md:py-24">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-12 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/55">
          <Link href="/" className="transition-colors hover:text-terracotta">Home</Link>
          <span aria-hidden="true" className="mx-3">/</span>
          <Link href="/services" className="transition-colors hover:text-terracotta">Services</Link>
          <span aria-hidden="true" className="mx-3">/</span>
          <span aria-current="page">{category.name}</span>
        </nav>

        <header className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-terracotta">
            LashPop Studios
          </p>
          <h1 className="font-display text-5xl leading-none tracking-tight sm:text-6xl md:text-7xl">
            {category.name}
          </h1>
          {category.tagline && (
            <p className="mt-6 font-display text-2xl text-charcoal/80">{category.tagline}</p>
          )}
          {category.description && (
            <p className="mt-5 max-w-2xl text-base leading-7 text-charcoal/65">
              {category.description}
            </p>
          )}
        </header>

        <section aria-labelledby="available-services" className="mt-14 border-t border-charcoal/15 pt-8">
          <h2 id="available-services" className="sr-only">Available {category.name} services</h2>
          {categoryServices.length > 0 ? (
            <div className="grid gap-px overflow-hidden rounded-2xl border border-charcoal/10 bg-charcoal/10 sm:grid-cols-2">
              {categoryServices.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className="group flex min-h-40 flex-col bg-white p-6 transition-colors hover:bg-warm-sand/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-terracotta"
                >
                  <h3 className="font-display text-2xl leading-tight transition-colors group-hover:text-terracotta">
                    {item.name}
                  </h3>
                  {item.subtitle && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-charcoal/60">
                      {item.subtitle}
                    </p>
                  )}
                  <span className="mt-auto pt-7 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/55">
                    View service
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-charcoal/10 bg-white p-8">
              <p className="text-charcoal/70">
                Availability for this category changes seasonally. Contact LashPop for the current menu.
              </p>
              <Link href="/#find-us" className="mt-5 inline-block font-semibold text-terracotta hover:underline">
                Contact the studio
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
