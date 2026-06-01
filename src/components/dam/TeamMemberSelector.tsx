"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, ChevronLeft } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  imageUrl: string
}

interface TeamMemberSelectorProps {
  teamMembers: TeamMember[]
  selectedId?: string
  onSelect: (memberId: string) => void
}

export function TeamMemberSelector({ teamMembers, selectedId, onSelect }: TeamMemberSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (memberId: string) => {
    onSelect(memberId)
    setIsOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Add Team Member Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border ${
          isOpen
            ? "bg-cream text-dusty-rose border-cream"
            : "bg-cream/20 hover:bg-cream/30 text-cream border-cream/30"
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">Add Team Member</span>
      </button>

      {/* Team Member Options - Horizontal scroll */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="team-options"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {/* Back button */}
            <button
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-cream/20 hover:bg-cream/30 text-cream transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Team Members */}
            {teamMembers.map((member, index) => {
              const isSelected = selectedId === member.id
              return (
                <motion.button
                  key={member.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  onClick={() => handleSelect(member.id)}
                  disabled={isSelected}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full font-medium transition-all shadow-sm ${
                    isSelected
                      ? "bg-cream/20 text-cream/60 cursor-not-allowed"
                      : "bg-ocean-mist text-cream hover:shadow-md"
                  }`}
                >
                  <span className="text-sm whitespace-nowrap">
                    {member.name}
                    {isSelected && " ✓"}
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
