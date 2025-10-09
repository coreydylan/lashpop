'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { LeafIcon, StarIcon } from '../icons/DesertIcons'

const values = [
  {
    icon: <LeafIcon className="w-6 h-6" />,
    title: 'Natural Beauty',
    description: 'Enhancing what nature gave you'
  },
  {
    icon: <StarIcon className="w-6 h-6" />,
    title: 'Artistry',
    description: 'Every lash placed with intention'
  },
  {
    icon: <LeafIcon className="w-6 h-6" />,
    title: 'Wellness',
    description: 'Beauty as self-care ritual'
  }
]

const team = [
  {
    name: 'Sarah',
    role: 'Owner & Master Artist',
    image: '/lashpop-images/team/savannah-scherer.jpeg'
  },
  {
    name: 'Emily',
    role: 'Senior Lash Artist',
    image: '/lashpop-images/team/emily-rogers.jpeg'
  },
  {
    name: 'Grace',
    role: 'Lash Artist',
    image: '/lashpop-images/team/grace-ramos.jpg'
  }
]

export function AboutSection() {
  return (
    <section id="about" className="py-[var(--space-xl)] bg-ocean-mist/10">
      <div className="container">
        {/* About Content */}
        <div className="grid lg:grid-cols-2 gap-[var(--space-lg)] items-center mb-[var(--space-xl)]">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <div className="aspect-[4/5] rounded-[0_200px_200px_0] overflow-hidden">
                <Image
                  src="/lashpop-images/studio/studio-lash-65.jpeg"
                  alt="LashPop Studio"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-sage/10 blur-3xl" />
            </div>
          </motion.div>
          
          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div>
              <span className="caption text-terracotta">About LashPop</span>
              <h2 className="h2 text-dune mt-2 mb-6">
                Your sanctuary for
                <span className="block italic text-dusty-rose">mindful beauty</span>
              </h2>
              <p className="body-lg text-dune/70 mb-4">
                Founded in 2016, LashPop Studios has become Oceanside&apos;s premier destination
                for lash artistry. We believe beauty should feel as good as it looks.
              </p>
              <p className="body text-dune/60">
                Our studio embodies the relaxed elegance of coastal California—where 
                desert meets ocean, and beauty meets wellness. Every appointment is 
                designed to be a moment of tranquility in your busy life.
              </p>
            </div>
            
            {/* Values */}
            <div className="space-y-4 pt-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="text-golden mt-1">{value.icon}</div>
                  <div>
                    <h4 className="font-normal text-dune mb-1">{value.title}</h4>
                    <p className="caption text-dune/60">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Team Section */}
        <div className="mt-[var(--space-xl)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-[var(--space-lg)]"
          >
            <span className="caption text-golden">Our Artists</span>
            <h3 className="h2 text-dune mt-2">
              Meet the hands behind the magic
            </h3>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="aspect-[3/4] rounded-[100px_100px_0_0] overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <h4 className="text-lg font-light text-dune">{member.name}</h4>
                <p className="caption text-dusty-rose">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

