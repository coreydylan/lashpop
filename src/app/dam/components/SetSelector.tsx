"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ChevronLeft } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  imageUrl: string
}

interface Set {
  id: string
  teamMemberId: string
  name?: string
  createdAt: Date
}

interface SetSelectorProps {
  activeSets: Set[]
  teamMembers: TeamMember[]
  onSetCreated: (set: Set) => void
  onSetStageClick: (setId: string, stage: "before" | "during" | "after") => void
}

export function SetSelector({
  activeSets,
  teamMembers,
  onSetCreated,
  onSetStageClick
}: SetSelectorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectingTeamMember, setSelectingTeamMember] = useState(false)

  const handleAddSet = () => {
    setIsAdding(true)
    setSelectingTeamMember(true)
  }

  const handleTeamMemberSelect = async (teamMember: TeamMember) => {
    try {
      const response = await fetch("/api/dam/sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          teamMemberId: teamMember.id
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create set")
      }

      const data = await response.json()
      onSetCreated(data.set)
      setIsAdding(false)
      setSelectingTeamMember(false)
    } catch (error) {
      console.error("Failed to create set:", error)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setSelectingTeamMember(false)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Add Set Button */}
      <button
        onClick={handleAddSet}
        className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border ${
          isAdding
            ? "bg-dusty-rose text-cream border-dusty-rose"
            : "bg-dusty-rose/10 hover:bg-dusty-rose/20 text-dusty-rose border-dusty-rose/30"
        }`}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Add Set</span>
      </button>

      {/* Team Member Selector for Set Creation */}
      <AnimatePresence mode="wait">
        {isAdding && selectingTeamMember && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {/* Team Members */}
            {teamMembers.map((member, index) => (
              <motion.button
                key={member.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                onClick={() => handleTeamMemberSelect(member)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md bg-dusty-rose text-cream"
              >
                {member.imageUrl && (
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-5 h-5 rounded-full object-cover border border-cream/30"
                  />
                )}
                <span className="text-sm whitespace-nowrap">
                  {member.name}
                </span>
              </motion.button>
            ))}

            {/* Cancel button */}
            <button
              onClick={handleCancel}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-terracotta/20 hover:bg-terracotta/30 text-terracotta transition-colors"
            >
              <span className="text-sm font-medium whitespace-nowrap">Cancel</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
