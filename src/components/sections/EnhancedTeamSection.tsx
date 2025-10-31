'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import { teamMembers, teamValues, collectiveModelExplanation } from '@/data/teamComplete'
import { Instagram, Phone, Calendar, User, Briefcase, Star, ChevronRight, X, Users, Award, GraduationCap, Heart, Sparkles } from 'lucide-react'
import type { TeamMember } from '@/data/teamComplete'

export function EnhancedTeamSection() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [filter, setFilter] = useState<'all' | 'employee' | 'independent'>('all')
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const filteredMembers = teamMembers.filter(member =>
    filter === 'all' || member.type === filter
  )

  const getIconForValue = (iconName: string) => {
    switch(iconName) {
      case 'users': return <Users className="w-6 h-6 text-white" />
      case 'award': return <Award className="w-6 h-6 text-white" />
      case 'graduation-cap': return <GraduationCap className="w-6 h-6 text-white" />
      case 'heart': return <Heart className="w-6 h-6 text-white" />
      default: return <Star className="w-6 h-6 text-white" />
    }
  }

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
          <span className="heading-script gradient-text">Meet the Team</span>
          <h2 className="heading-primary mt-4">
            The Artists of LashPop Studios
          </h2>
          <p className="body-large mt-6 max-w-3xl mx-auto text-[rgb(74,74,74)]">
            Our collective brings together talented beauty professionals, each specializing in their craft.
            Whether employee or independent artist, all are hand-picked for excellence.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center gap-4 mb-[var(--space-block)]"
        >
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[rgb(232,180,184)] to-[rgb(255,192,203)] text-white'
                : 'glass-soft hover:bg-[rgb(255,248,243)]'
            }`}
          >
            All Artists ({teamMembers.length})
          </button>
          <button
            onClick={() => setFilter('employee')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              filter === 'employee'
                ? 'bg-gradient-to-r from-[rgb(232,180,184)] to-[rgb(255,192,203)] text-white'
                : 'glass-soft hover:bg-[rgb(255,248,243)]'
            }`}
          >
            LashPop Team ({teamMembers.filter(m => m.type === 'employee').length})
          </button>
          <button
            onClick={() => setFilter('independent')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              filter === 'independent'
                ? 'bg-gradient-to-r from-[rgb(232,180,184)] to-[rgb(255,192,203)] text-white'
                : 'glass-soft hover:bg-[rgb(255,248,243)]'
            }`}
          >
            Independent Artists ({teamMembers.filter(m => m.type === 'independent').length})
          </button>
        </motion.div>

        {/* Picture-Forward Team Grid - Seamless */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-[var(--space-block)]">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.03 }}
              className="relative aspect-[3/4] overflow-hidden cursor-pointer group border-[0.5px] border-white/10"
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setSelectedMember(member)}
            >
              {/* Background Image */}
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105"
              />

              {/* Bottom Gradient - Always Visible for Text Readability */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Bottom Info Container */}
              <div className="absolute bottom-0 left-0 right-0">
                {/* Basic Info - Always Visible */}
                <div className="p-3 text-white">
                  <h3 className="font-semibold text-sm leading-tight drop-shadow-lg">
                    {member.name}
                  </h3>
                  <p className="text-xs text-white/90 mt-0.5 drop-shadow-md">
                    {member.role}
                  </p>
                  {member.type === 'independent' && member.businessName && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/30 backdrop-blur-sm text-white/90">
                      {member.businessName}
                    </span>
                  )}
                </div>

                {/* Hover Content - Slides Up from Bottom */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: hoveredId === member.id ? 0 : '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[rgb(232,180,184)]/95 via-[rgb(255,192,203)]/50 to-transparent backdrop-blur-sm"
                >
                  <div className="p-3 space-y-2.5">
                    {/* Contact Row */}
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-white font-medium drop-shadow-sm">
                        {member.phone}
                      </p>
                      <div className="flex gap-1.5">
                        {member.instagram && (
                          <a
                            href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 bg-white/30 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
                          >
                            <Instagram className="w-3.5 h-3.5 text-white" />
                          </a>
                        )}
                        <a
                          href={`tel:${member.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 bg-white/30 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-white" />
                        </a>
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="space-y-0.5">
                      {member.specialties.slice(0, 2).map((specialty, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <Sparkles className="w-2.5 h-2.5 text-white/90" />
                          <span className="text-[10px] text-white font-medium">{specialty}</span>
                        </div>
                      ))}
                      {member.specialties.length > 2 && (
                        <span className="text-[10px] text-white/80 pl-4">
                          +{member.specialties.length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Book Button */}
                    <a
                      href={member.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block w-full text-center px-3 py-1.5 bg-white/95 text-[rgb(232,180,184)] rounded-full text-xs font-semibold hover:bg-white transition-colors shadow-sm"
                    >
                      Book Now
                    </a>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Collective Model Explanation - More Visual */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mb-[var(--space-block)] rounded-3xl overflow-hidden"
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[rgb(255,248,243)] via-[rgb(255,242,235)] to-[rgb(255,248,243)]" />

          {/* Content */}
          <div className="relative p-8 md:p-12">
            <h3 className="heading-tertiary text-center mb-2">{collectiveModelExplanation.title}</h3>
            <p className="text-[rgb(232,180,184)] text-center mb-6 font-medium">{collectiveModelExplanation.subtitle}</p>
            <p className="body-regular text-[rgb(74,74,74)] text-center max-w-3xl mx-auto mb-8">
              {collectiveModelExplanation.description}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {collectiveModelExplanation.points.map((point, index) => (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(255,192,203)] to-[rgb(232,180,184)] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-medium text-[rgb(74,74,74)] mb-2">{point.title}</h4>
                  <p className="text-sm text-[rgb(74,74,74)]/70">{point.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Team Values - Card Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="mt-[var(--space-block)]"
        >
          <h3 className="heading-secondary text-center mb-8">
            What Sets Our Collective Apart
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
                  {getIconForValue(value.icon)}
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
      </div>

      {/* Individual Artist Modal - Keep the same */}
      <AnimatePresence>
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
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header with Close */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  {selectedMember.type === 'independent' && selectedMember.businessName && (
                    <p className="text-sm text-[rgb(232,180,184)] font-medium mb-1">
                      {selectedMember.businessName}
                    </p>
                  )}
                  <h3 className="heading-tertiary">{selectedMember.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column - Image and Quick Info */}
                  <div className="space-y-6">
                    <div className="relative h-96 rounded-2xl overflow-hidden">
                      <Image
                        src={selectedMember.image}
                        alt={selectedMember.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Contact Card */}
                    <div className="glass-soft rounded-2xl p-6 space-y-4">
                      <h4 className="font-medium text-[rgb(74,74,74)]">Contact & Booking</h4>

                      <a
                        href={`tel:${selectedMember.phone}`}
                        className="flex items-center gap-3 p-3 bg-[rgb(255,248,243)] rounded-xl hover:bg-[rgb(255,242,235)] transition-colors"
                      >
                        <Phone className="w-5 h-5 text-[rgb(232,180,184)]" />
                        <span className="font-medium">{selectedMember.phone}</span>
                      </a>

                      {selectedMember.instagram && (
                        <a
                          href={`https://instagram.com/${selectedMember.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-[rgb(255,248,243)] rounded-xl hover:bg-[rgb(255,242,235)] transition-colors"
                        >
                          <Instagram className="w-5 h-5 text-[rgb(232,180,184)]" />
                          <span className="font-medium">{selectedMember.instagram}</span>
                        </a>
                      )}

                      <a
                        href={selectedMember.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-[rgb(232,180,184)] to-[rgb(255,192,203)] text-white rounded-full font-medium hover:shadow-lg transition-all"
                      >
                        <Calendar className="w-5 h-5" />
                        Book with {selectedMember.name.split(' ')[0]}
                      </a>
                    </div>
                  </div>

                  {/* Right Column - Details */}
                  <div className="space-y-6">
                    {/* Role and Type */}
                    <div>
                      <p className="text-[rgb(232,180,184)] font-medium text-lg">{selectedMember.role}</p>
                      {selectedMember.type === 'employee' ? (
                        <p className="text-sm text-[rgb(74,74,74)]/70 mt-1">LashPop Studios Team Member</p>
                      ) : (
                        <p className="text-sm text-[rgb(74,74,74)]/70 mt-1">Independent Beauty Professional</p>
                      )}
                    </div>

                    {/* Bio */}
                    {selectedMember.bio && (
                      <div>
                        <h4 className="font-medium text-[rgb(74,74,74)] mb-3">About</h4>
                        <p className="text-[rgb(74,74,74)] leading-relaxed">
                          {selectedMember.bio}
                        </p>
                      </div>
                    )}

                    {/* Quote */}
                    {selectedMember.quote && (
                      <blockquote className="italic text-[rgb(74,74,74)] pl-4 border-l-4 border-[rgb(232,180,184)]">
                        "{selectedMember.quote}"
                      </blockquote>
                    )}

                    {/* Specialties */}
                    <div>
                      <h4 className="font-medium text-[rgb(74,74,74)] mb-3">Specialties</h4>
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

                    {/* Favorite Services */}
                    {selectedMember.favoriteServices && (
                      <div>
                        <h4 className="font-medium text-[rgb(74,74,74)] mb-3">Favorite Services</h4>
                        <div className="space-y-2">
                          {selectedMember.favoriteServices.map((service, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-[rgb(232,180,184)]" />
                              <span className="text-sm text-[rgb(74,74,74)]">{service}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fun Fact */}
                    {selectedMember.funFact && (
                      <div className="glass-soft rounded-xl p-4">
                        <p className="text-sm font-medium text-[rgb(232,180,184)] mb-2">Fun Fact</p>
                        <p className="text-sm text-[rgb(74,74,74)]">{selectedMember.funFact}</p>
                      </div>
                    )}

                    {/* Availability */}
                    {selectedMember.availability && (
                      <div>
                        <h4 className="font-medium text-[rgb(74,74,74)] mb-2">Availability</h4>
                        <p className="text-sm text-[rgb(74,74,74)]/70">{selectedMember.availability}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}