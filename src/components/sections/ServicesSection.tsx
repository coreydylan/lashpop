'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import { StarIcon, MoonIcon, SunIcon, WaveIcon } from '../icons/DesertIcons'

const services = [
  {
    id: 'classic',
    icon: <MoonIcon className="w-8 h-8" />,
    title: 'Classic Eyelash Extensions',
    subtitle: 'The most natural look',
    description: 'Your lash stylist will apply one individual extension to each of your natural eyelashes, determining the perfect length, shape, and curl for your eyes.',
    duration: '90 min',
    price: '$120+',
    image: '/lashpop-images/services/classic-lash.png',
    color: 'sage'
  },
  {
    id: 'hybrid',
    icon: <StarIcon className="w-8 h-8" />,
    title: 'Hybrid Eyelash Extensions',
    subtitle: 'A medium-full, textured look',
    description: 'Your lash stylist will apply a 50/50 blend of classic and volume lash extensions to each of your natural eyelashes, determining the perfect length, shape, and curl for your eyes.',
    duration: '120 min',
    price: '$150+',
    image: '/lashpop-images/services/hybrid-lash.png',
    color: 'dusty-rose'
  },
  {
    id: 'volume',
    icon: <SunIcon className="w-8 h-8" />,
    title: 'Volume Eyelash Extensions',
    subtitle: 'The most full and fluffy look',
    description: 'Your lash stylist will apply a volume extension (consists of multiple lightweight extensions in the form of a fan) to each of your natural eyelashes, determining the perfect length, shape, and curl for your eyes.',
    duration: '150 min',
    price: '$180+',
    image: '/lashpop-images/services/volume-lash.png',
    color: 'golden'
  },
  {
    id: 'lift',
    icon: <WaveIcon className="w-8 h-8" />,
    title: 'Lash Lift + Tint',
    subtitle: 'Your lashes, but better',
    description: 'Picture your natural lashes elegantly transformed as your lash stylist uses a perming solution to curl them, creating a stunning lifted look lasting 6-8 weeks. This service is recommended with and best complemented by a lash tint.',
    duration: '45 min',
    price: '$85+',
    image: '/lashpop-images/services/lash-lift.png',
    color: 'ocean-mist'
  }
]

export function ServicesSection() {
  const [hoveredService, setHoveredService] = useState<string | null>(null)
  
  return (
    <section className="relative pt-0 pb-[var(--space-xl)] bg-gradient-to-b from-transparent via-warm-sand/5 to-cream">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-lg)]"
        >
          <span className="caption text-terracotta">What We Offer</span>
          <h2 className="h2 text-dune mt-2">
            Our Services
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
            Ready to enhance your natural beauty?
          </p>
          <button className="btn btn-primary">
            Learn More
          </button>
        </motion.div>
      </div>
    </section>
  )
}