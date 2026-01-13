import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getServiceBySlug } from '@/actions/services';
import { getAssetsByServiceSlug } from '@/actions/dam';
import { ServiceDetailClient } from './ServiceDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return {
      title: 'Service Not Found | Lash Pop',
    };
  }

  return {
    title: `${service.name} | Lash Pop`,
    description: service.description || `Book ${service.name} at Lash Pop`,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const gallery = await getAssetsByServiceSlug(slug);

  return <ServiceDetailClient service={service} gallery={gallery} />;
}
