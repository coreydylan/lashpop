'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import { Award, FileCheck, GraduationCap, Trophy, BookOpen, ShieldCheck } from 'lucide-react'
import type { TeamMemberCredential } from '@/db/schema/team_members'

const PLACEHOLDER_IMAGE = '/placeholder-team.svg'

const TYPE_ICON: Record<string, typeof Award> = {
  license: FileCheck,
  certification: Award,
  training: BookOpen,
  education: GraduationCap,
  award: Trophy,
}

interface CredentialsMember {
  id: number
  name: string
  role: string
  image: string
  credentials?: TeamMemberCredential[]
}

interface CredentialsSectionProps {
  teamMembers: CredentialsMember[]
}

function firstNameOf(name: string) {
  return name.split(' ')[0]
}

export function CredentialsSection({ teamMembers }: CredentialsSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-15%' })

  const membersWithCredentials = teamMembers.filter(
    (m) => Array.isArray(m.credentials) && m.credentials.length > 0
  )

  if (membersWithCredentials.length === 0) return null

  return (
    <div
      ref={ref}
      className="px-4 md:px-8 lg:px-12"
      style={{ backgroundColor: '#e9d1c8' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5" style={{ color: '#cc947f' }} />
            <span
              className="text-xs md:text-sm uppercase tracking-[0.2em] font-medium"
              style={{ color: '#cc947f' }}
            >
              Licensed & Certified
            </span>
          </div>
          <h2
            className="text-2xl md:text-5xl font-display font-medium tracking-wide mb-4"
            style={{ color: '#cc947f' }}
          >
            Credentials
          </h2>
          <div className="w-24 h-px bg-terracotta/30 mx-auto mb-6" />
          <p
            className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-pretty"
            style={{ color: '#cc947f' }}
          >
            Every artist at LashPop Studios is a licensed, trained professional. Here are the
            credentials behind our team.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {membersWithCredentials.map((member, idx) => {
            const first = firstNameOf(member.name)
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(idx, 8) * 0.04,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="relative bg-ivory rounded-2xl border border-terracotta/10 shadow-sm hover:shadow-lg transition-shadow duration-300 p-4 md:p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0 bg-cream border border-terracotta/10">
                    <Image
                      src={member.image || PLACEHOLDER_IMAGE}
                      alt={member.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized={
                        !!member.image && member.image.includes('ssl.cf2.rackcdn.com')
                      }
                    />
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-serif text-xl md:text-2xl leading-tight"
                      style={{ color: '#3d3632' }}
                    >
                      {first}
                    </h3>
                    <p className="text-xs md:text-sm font-medium mt-0.5 text-dusty-rose">
                      {member.role}
                    </p>
                  </div>
                </div>

                {/* Credentials list */}
                <ul className="mt-4 space-y-2">
                  {member.credentials!.map((cred, cIdx) => {
                    const Icon = TYPE_ICON[cred.type] || Award
                    return (
                      <li
                        key={cIdx}
                        className="flex items-start gap-2.5 text-sm leading-snug"
                        style={{ color: '#3d3632' }}
                      >
                        <Icon
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          style={{ color: '#cc947f' }}
                        />
                        <span>
                          <span className="font-medium">{cred.name}</span>
                          {cred.issuer && (
                            <span className="text-charcoal/60"> &middot; {cred.issuer}</span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
