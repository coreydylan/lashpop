'use client'

import { motion } from 'framer-motion'
import { WaveShape } from '../icons/DesertIcons'

export function ContactSection() {
  return (
    <section id="contact" className="relative py-[var(--space-xl)] bg-warm-sand/30">
      {/* Top wave decoration */}
      <div className="absolute top-0 left-0 right-0 rotate-180">
        <WaveShape className="w-full h-16 text-cream" fill="rgb(250,247,241)" />
      </div>
      
      <div className="container relative">
        <div className="max-w-4xl mx-auto">
          {/* Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-[var(--space-lg)]"
          >
            <span className="caption text-golden">Ready to begin?</span>
            <h2 className="h2 text-dune mt-2 mb-6">
              Your transformation awaits
            </h2>
            <p className="body-lg text-dune/70 max-w-2xl mx-auto mb-8">
              Book your appointment and experience the LashPop difference. 
              Where every visit feels like a mini retreat.
            </p>
            <button className="btn btn-primary">
              Book Appointment
            </button>
          </motion.div>
          
          {/* Contact Info Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-[var(--space-lg)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <h4 className="caption text-terracotta mb-2">Visit</h4>
              <p className="body text-dune/70">
                429 S Coast Hwy<br />
                Oceanside, CA 92054
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <h4 className="caption text-terracotta mb-2">Hours</h4>
              <p className="body text-dune/70">
                8a-7:30p every day<br />
                by appointment only
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <h4 className="caption text-terracotta mb-2">Connect</h4>
              <p className="body text-dune/70">
                +1 (760) 212-0448<br />
                @lashpopstudios
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}







