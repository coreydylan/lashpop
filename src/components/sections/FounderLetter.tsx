'use client'

import { motion } from 'framer-motion'

export function FounderLetter() {
  return (
    <section className="relative bg-cream py-20 md:py-32 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-golden/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-blush/5 to-transparent rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Opening quote mark */}
        <motion.div
          className="text-golden/20 text-[120px] leading-none font-serif mb-[-60px] ml-[-20px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          &ldquo;
        </motion.div>

        {/* Letter content */}
        <motion.div
          className="space-y-6 text-sage-dark/90"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <p className="text-2xl md:text-3xl font-serif leading-relaxed text-sage-dark italic">
            Dear Beautiful Soul,
          </p>

          <p className="text-lg md:text-xl leading-relaxed font-light">
            When I founded LashPop Studios, I had a vision that went far beyond just beauty services. I imagined a sanctuary where every person who walks through our doors would be reminded of their inherent, effortless beauty&mdash;not just when they leave, but every single morning when they catch their reflection.
          </p>

          <p className="text-lg md:text-xl leading-relaxed font-light">
            You see, I believe that natural beauty isn&apos;t something we create&mdash;it&apos;s something we reveal. It&apos;s already there, waiting to be celebrated. My mission is to help you see yourself through new eyes, to redefine what&apos;s possible when we honor and enhance what nature has already gifted you.
          </p>

          <p className="text-lg md:text-xl leading-relaxed font-light">
            At LashPop, we&apos;re not just applying lashes or shaping brows. We&apos;re building trust, one careful stroke at a time. We&apos;re creating a retreat from the chaos of daily life&mdash;a space where you can truly recharge in whatever way feels right for you. Some days that might mean sharing laughter and stories; other days, it might mean peaceful silence and gentle care.
          </p>

          <p className="text-lg md:text-xl leading-relaxed font-light">
            Every detail of your experience here has been thoughtfully crafted with precision and care. Because when you leave our studio, I want you to carry more than just beautiful lashes or perfectly sculpted brows. I want you to carry peace of mind, confidence that radiates from within, and precious time reclaimed for the things that matter most in your life.
          </p>

          <p className="text-lg md:text-xl leading-relaxed font-light">
            This is our promise to you: to see you, to celebrate you, and to remind you that being authentically, naturally you is more than enough&mdash;it&apos;s absolutely beautiful.
          </p>

          <motion.div
            className="pt-8 space-y-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-lg md:text-xl font-light italic">With warmth and gratitude,</p>
            <p className="text-2xl md:text-3xl font-serif text-golden">Emily Rogers</p>
            <p className="text-sm uppercase tracking-wider text-sage-dark/70">Founder, LashPop Studios</p>
          </motion.div>
        </motion.div>

        {/* Decorative divider */}
        <motion.div
          className="mt-16 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center space-x-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-golden/30" />
            <div className="w-2 h-2 rounded-full bg-golden/40" />
            <div className="w-3 h-3 rounded-full bg-golden/60" />
            <div className="w-2 h-2 rounded-full bg-golden/40" />
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-golden/30" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}