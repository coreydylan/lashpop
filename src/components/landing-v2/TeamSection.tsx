"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Instagram, Award, Star, X } from 'lucide-react';
import { useRef } from 'react';

// Mock team data - replace with your actual team data
const teamMembers = [
  {
    id: '1',
    name: 'Ashley Petersen',
    role: 'Master Lash Artist',
    specialties: ['Volume Extensions', 'Mega Volume'],
    services: ['Lashes'],
    image: '/lashpop-images/team/ashley-petersen.jpeg',
    instagram: '@ashley.lashes',
    bio: 'With over 8 years of experience, Ashley specializes in creating dramatic volume sets that last.',
    certifications: ['Russian Volume Certified', 'Lash Lift Expert'],
  },
  {
    id: '2',
    name: 'Grace Ramos',
    role: 'Senior Lash Artist',
    specialties: ['Classic Extensions', 'Natural Looks'],
    services: ['Lashes'],
    image: '/lashpop-images/team/grace-ramos.jpg',
    instagram: '@grace.beauty',
    bio: 'Grace is known for her natural, elegant lash designs perfect for everyday wear.',
    certifications: ['Classic Lash Certified', 'Brow Lamination'],
  },
  {
    id: '3',
    name: 'Elena Castellanos',
    role: 'Volume Specialist',
    specialties: ['Hybrid Sets', 'Custom Designs'],
    services: ['Lashes'],
    image: '/lashpop-images/team/elena-castellanos.jpeg',
    instagram: '@elena.artistry',
    bio: 'Elena creates bespoke lash designs tailored to each client\'s unique eye shape.',
    certifications: ['Volume Master', 'Color Lash Specialist'],
  },
  {
    id: '4',
    name: 'Emily Rogers',
    role: 'Lash Artist',
    specialties: ['Lash Lifts', 'Tinting'],
    services: ['Lashes'],
    image: '/lashpop-images/team/emily-rogers.jpeg',
    instagram: '@emily.lashes',
    bio: 'Emily specializes in enhancing natural lashes with lifts and tints for a mascara-free look.',
    certifications: ['Lash Lift Certified', 'Tint Specialist'],
  },
  {
    id: '5',
    name: 'Haley Walker',
    role: 'Senior Artist',
    specialties: ['Classic Sets', 'Volume'],
    services: ['Lashes'],
    image: '/lashpop-images/team/haley-walker.jpg',
    instagram: '@haley.beauty',
    bio: 'Haley brings fresh creativity and attention to detail to every lash application.',
    certifications: ['Classic Certified', 'Safety & Sanitation'],
  },
  {
    id: '6',
    name: 'Evie Ells',
    role: 'Lash Artist',
    specialties: ['Classic Application', 'Volume Sets'],
    services: ['Lashes'],
    image: '/lashpop-images/team/evie-ells.jpeg',
    instagram: '@evie.lashes',
    bio: 'Evie is dedicated to creating beautiful, long-lasting lash looks for every client.',
    certifications: ['Lash Fundamentals', 'Client Care'],
  },
];

export default function TeamSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedMember, setSelectedMember] = useState<typeof teamMembers[0] | null>(null);

  return (
    <section ref={ref} className="py-20 lg:py-32 bg-ivory">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-wide uppercase text-gray-900 mb-6">
              Meet Your Artists
            </h2>
            <p className="text-lg md:text-xl font-sans font-light text-gray-600 max-w-3xl mx-auto">
              Our talented team of lash artists brings years of experience and passion
              to create your perfect look.
            </p>
          </motion.div>

          {/* Team Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                onClick={() => setSelectedMember(member)}
                className="group cursor-pointer"
              >
                {/* Arch Card */}
                <div className="bg-white rounded-[20px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-terracotta/10">
                  {/* Service Tags - Outside arch, inside card */}
                  <div className="px-4 pt-4 pb-2 flex flex-wrap gap-1.5">
                    {member.services.map((service) => (
                      <span
                        key={service}
                        className="text-sm md:text-xs font-sans font-medium uppercase tracking-wider px-3 py-1 bg-terracotta-light/90 text-white rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>

                  {/* Arch Image Container */}
                  <div className="relative px-4">
                    <div className="relative h-72 overflow-hidden rounded-t-[80px] rounded-b-lg bg-stone-100">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-5 text-center">
                    {/* Name */}
                    <h3 className="text-2xl font-display font-medium text-gray-900 mb-2">
                      {member.name}
                    </h3>

                    {/* Separator Line */}
                    <div className="w-16 h-px bg-terracotta/30 mx-auto mb-2" />

                    {/* Title/Role */}
                    <p className="font-sans font-normal text-gray-500 mb-4">
                      {member.role}
                    </p>

                    {/* Specialty Tags */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {member.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="text-sm md:text-xs font-sans font-light px-3 py-1.5 bg-ivory border border-terracotta/20 text-gray-600 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mt-12"
          >
            <button className="px-8 py-3 border-2 border-terracotta text-terracotta rounded-lg font-sans font-medium uppercase tracking-wide hover:bg-terracotta hover:text-white transition-all">
              View All Team Members
            </button>
          </motion.div>
        </div>
      </div>

      {/* Team Member Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative h-64 bg-gray-100">
                <Image
                  src={selectedMember.image}
                  alt={selectedMember.name}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-3xl font-display font-semibold text-gray-900 mb-2">
                    {selectedMember.name}
                  </h3>
                  <div className="w-16 h-px bg-terracotta/30 mb-3" />
                  <p className="text-xl font-sans font-normal text-terracotta mb-4">
                    {selectedMember.role}
                  </p>
                  <p className="font-sans font-light text-gray-600 leading-relaxed mb-4">
                    {selectedMember.bio}
                  </p>
                </div>

                {/* Certifications */}
                <div className="mb-6">
                  <h4 className="text-lg font-display font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-terracotta" />
                    Certifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="px-3 py-1 bg-terracotta/10 text-terracotta font-sans font-light rounded-full text-sm"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-6">
                  <h4 className="text-lg font-display font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-terracotta" />
                    Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-3 py-1 bg-ivory border border-terracotta/20 text-gray-700 font-sans font-light rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Instagram */}
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-sans font-normal rounded-lg hover:shadow-lg transition-all">
                    <Instagram className="w-5 h-5" />
                    {selectedMember.instagram}
                  </button>
                  <button className="px-4 py-2 bg-terracotta text-white font-sans font-medium rounded-lg hover:bg-terracotta-light transition-colors">
                    Book with {selectedMember.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}