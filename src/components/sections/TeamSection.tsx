'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import { teamMembers, teamValues } from '@/data/team'
import { Instagram, Calendar, Heart, Award } from 'lucide-react'

export function TeamSection() {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null)
  const [selectedMember, setSelectedMember] = useState<typeof teamMembers[0] | null>(null)
  
  return (
    <section className="py-[var(--space-section)] bg-gradient-to-b from-[rgb(254,254,254)] to-[rgb(255,248,243)]">
      <div className="max-width-content section-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-block)]"
        >
          <span className="heading-script gradient-text">Meet the Artists</span>
          <h2 className="heading-primary mt-4">
            The Hands Behind the Magic
          </h2>
          <p className="body-large mt-6 max-w-3xl mx-auto text-[rgb(74,74,74)]">
            Each of our artists brings their own unique touch to the LashPop experience. 
            Trained, certified, and passionate about making you feel your most beautiful.
          </p>
        </motion.div>
        
        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-[var(--space-block)]">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onHoverStart={() => setHoveredMember(member.id)}
              onHoverEnd={() => setHoveredMember(null)}
              onClick={() => setSelectedMember(member)}
              className="group cursor-pointer"
            >
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Image Container */}
                <div className="relative h-80 rounded-2xl overflow-hidden mb-6">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Hover Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: hoveredMember === member.id ? 1 : 0,
                      y: hoveredMember === member.id ? 0 : 20
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-0 left-0 right-0 p-6 text-white"
                  >
                    <p className="text-sm italic mb-3 leading-relaxed">
                      &ldquo;{member.quote}&rdquo;
                    </p>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        <span>{member.availability}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Instagram className="w-3 h-3" />
                        <span>{member.instagram}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Member Info */}
                <div className="text-center space-y-2">
                  <h3 className="heading-tertiary text-[rgb(74,74,74)]">
                    {member.name}
                  </h3>
                  <p className="text-[rgb(232,180,184)] font-medium">
                    {member.role}
                  </p>
                  
                  {/* Specialties */}
                  <div className="flex flex-wrap justify-center gap-2 pt-3">
                    {member.specialties.slice(0, 2).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 glass-soft rounded-full text-xs"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
        
        {/* Team Values */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="mt-[var(--space-block)]"
        >
          <h3 className="heading-secondary text-center mb-8">
            What Sets Our Team Apart
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="glass-soft rounded-2xl p-6 text-center hover-glow"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(255,192,203)] to-[rgb(232,180,184)] flex items-center justify-center mx-auto mb-4">
                  {index === 0 && <Award className="w-6 h-6 text-white" />}
                  {index === 1 && <Heart className="w-6 h-6 text-white" />}
                  {index === 2 && <Calendar className="w-6 h-6 text-white" />}
                  {index === 3 && <Instagram className="w-6 h-6 text-white" />}
                </div>
                <h4 className="font-medium text-[rgb(74,74,74)] mb-2">
                  {value.title}
                </h4>
                <p className="text-sm text-[rgb(74,74,74)]/70">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-[var(--space-block)]"
        >
          <p className="body-large mb-6 text-[rgb(74,74,74)]">
            Ready to meet your perfect lash artist?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-gradient-to-r from-[rgb(232,180,184)] to-[rgb(255,192,203)] text-white rounded-full font-medium hover-glow"
          >
            Book a consultation
          </motion.button>
        </motion.div>
      </div>
      
      {/* Member Detail Modal */}
      {selectedMember && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedMember(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
                  <Image
                    src={selectedMember.image}
                    alt={selectedMember.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              <div className="md:w-2/3 space-y-4">
                <div>
                  <h3 className="heading-tertiary">{selectedMember.name}</h3>
                  <p className="text-[rgb(232,180,184)] font-medium">{selectedMember.role}</p>
                </div>
                
                <p className="text-[rgb(74,74,74)] leading-relaxed">
                  {selectedMember.bio}
                </p>
                
                <div>
                  <h4 className="font-medium mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-[rgba(232,180,184,0.2)] to-[rgba(255,192,203,0.2)] rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="flex-1 px-6 py-3 glass-soft rounded-full font-medium hover:bg-[rgb(255,248,243)] transition-colors"
                  >
                    Close
                  </button>
                  <button className="flex-1 px-6 py-3 bg-gradient-to-r from-[rgb(232,180,184)] to-[rgb(255,192,203)] text-white rounded-full font-medium hover-glow">
                    Book with {selectedMember.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}