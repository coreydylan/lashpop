'use client'

import { motion } from 'framer-motion'

export function MapSection() {
  return (
    <section id="location" className="py-[var(--space-xl)] bg-gradient-to-b from-warm-sand/10 to-cream">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="caption text-golden">Visit Us</span>
          <h2 className="h2 text-dune mt-2">
            Come See Us
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="aspect-square rounded-2xl overflow-hidden"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3349.8!2d-117.3796!3d33.1958!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDExJzQ0LjkiTiAxMTfCsDIyJzQ2LjYiVw!5e0!3m2!1sen!2sus!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-light text-dune mb-2">Address</h3>
              <p className="body text-dune/70">
                429 South Coast Highway<br />
                Oceanside, CA 92054
              </p>
            </div>

            <div>
              <h3 className="text-xl font-light text-dune mb-2">Hours</h3>
              <div className="space-y-1 body text-dune/70">
                <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
                <p>Saturday: 10:00 AM - 6:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-light text-dune mb-2">Contact</h3>
              <p className="body text-dune/70">
                Phone: (760) 212-0448<br />
                Email: hello@lashpopstudios.com
              </p>
            </div>

            <div>
              <h3 className="text-xl font-light text-dune mb-2">Parking</h3>
              <p className="body text-dune/70">
                Free street parking available along Coast Highway and nearby side streets.
              </p>
            </div>

            <div className="pt-4">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=429+South+Coast+Highway+Oceanside+CA+92054"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Get Directions
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
