"use client"

interface Service {
  name: string
  description: string
  priceStarting?: number
  durationMinutes?: number
}

interface ServiceSchemaProps {
  services: Service[]
}

export default function ServiceSchema({ services }: ServiceSchemaProps) {
  const schemaData = services.map((service) => {
    const schema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: service.name,
      description: service.description,
      provider: {
        "@type": "LocalBusiness",
        "@id": "https://lashpopstudios.com/#business",
        name: "LashPop Studios",
      },
      areaServed: {
        "@type": "City",
        name: "Oceanside",
      },
    }

    if (service.priceStarting) {
      schema.offers = {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          price: service.priceStarting,
          priceCurrency: "USD",
        },
      }
    }

    return schema
  })

  return (
    <>
      {schemaData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
