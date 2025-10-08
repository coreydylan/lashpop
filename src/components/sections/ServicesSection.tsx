'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import { StarIcon, MoonIcon, SunIcon, WaveIcon } from '../icons/DesertIcons'

const services = [
  {
    id: 'classic',
    icon: <MoonIcon className="w-8 h-8" />,
    title: 'Classic',
    subtitle: 'Natural enhancement',
    description: 'One extension per natural lash for a subtle, elegant look.',
    duration: '90 min',
    price: '$120+',
    image: '/lashpop-images/services/classic-lash.png',
    color: 'sage'
  },
  {
    id: 'hybrid',
    icon: <StarIcon className="w-8 h-8" />,
    title: 'Hybrid',
    subtitle: 'Perfect balance',
    description: 'A blend of classic and volume for natural fullness.',
    duration: '120 min', 
    price: '$150+',
    image: '/lashpop-images/services/hybrid-lash.png',
    color: 'dusty-rose'
  },
  {
    id: 'volume',
    icon: <SunIcon className="w-8 h-8" />,
    title: 'Volume',
    subtitle: 'Full glamour',
    description: 'Multiple fine extensions per lash for dramatic impact.',
    duration: '150 min',
    price: '$180+',
    image: '/lashpop-images/services/volume-lash.png',
    color: 'golden'
  },
  {
    id: 'lift',
    icon: <WaveIcon className="w-8 h-8" />,
    title: 'Lash Lift',
    subtitle: 'Natural curl',
    description: 'Semi-permanent curl and tint for your natural lashes.',
    duration: '45 min',
    price: '$85+',
    image: '/lashpop-images/services/lash-lift.png',
    color: 'ocean-mist'
  }
]

export function ServicesSection() {
  const [hoveredService, setHoveredService] = useState<string | null>(null)
  
  return (
    <section className="py-[var(--space-xl)] bg-warm-sand/20">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-lg)]"
        >
          <span className="caption text-terracotta">Our Services</span>
          <h2 className="h2 text-dune mt-2">
            Artistry tailored to you
          </h2>
        </motion.div>
        
        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
              className="group relative"
            >
              <div className="relative h-full">
                {/* Card */}
                <div className="bg-cream arch-full p-8 h-full flex flex-col items-center text-center transition-all duration-500 hover:shadow-xl">
                  {/* Icon */}
                  <motion.div
                    animate={{ 
                      scale: hoveredService === service.id ? 1.1 : 1,
                      rotate: hoveredService === service.id ? 360 : 0
                    }}
                    transition={{ duration: 0.5 }}
                    className={`text-${service.color} mb-4`}
                  >
                    {service.icon}
                  </motion.div>
                  
                  {/* Content */}
                  <h3 className="h3 text-dune mb-2">{service.title}</h3>
                  <p className="caption text-terracotta mb-4">{service.subtitle}</p>
                  <p className="body text-dune/70 mb-6 flex-grow">
                    {service.description}
                  </p>
                  
                  {/* Details */}
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between items-center py-2 border-t border-sage/10">
                      <span className="caption text-dune/60">Duration</span>
                      <span className="text-sm font-light">{service.duration}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-sage/10">
                      <span className="caption text-dune/60">Starting at</span>
                      <span className="text-lg font-light text-terracotta">{service.price}</span>
                    </div>
                  </div>
                  
                  {/* Hidden image on hover */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: hoveredService === service.id ? 1 : 0,
                      scale: hoveredService === service.id ? 1 : 0.8
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 arch-full overflow-hidden pointer-events-none"
                  >
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover opacity-10"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-[var(--space-lg)]"
        >
          <p className="body-lg text-dune/70 mb-6">
            Not sure which service is right for you?
          </p>
          <button className="btn btn-primary">
            Book a Consultation
          </button>
        </motion.div>
      </div>
    </section>
  )
}