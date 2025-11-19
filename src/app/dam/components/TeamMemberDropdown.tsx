"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check, User } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  imageUrl: string
  cropCloseUpCircleUrl?: string | null
}

interface TeamMemberDropdownProps {
  teamMembers: TeamMember[]
  selectedId?: string
  onSelect: (memberId: string | undefined) => void
}

export function TeamMemberDropdown({
  teamMembers,
  selectedId,
  onSelect
}: TeamMemberDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedMember = teamMembers.find((m) => m.id === selectedId)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (memberId: string) => {
    if (selectedId === memberId) {
      // Deselect if clicking the same member
      onSelect(undefined)
    } else {
      onSelect(memberId)
    }
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 arch-full border-2 transition-all touch-manipulation ${
          isOpen
            ? "border-dusty-rose ring-2 ring-dusty-rose/20 shadow-lg"
            : selectedMember
            ? "border-sage/40 bg-warm-sand/30 hover:border-sage/60"
            : "border-sage/20 hover:border-sage/40 bg-warm-sand/20"
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedMember ? (
            <>
              {/* Selected member image */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-warm-sand/40 flex-shrink-0">
                {!selectedMember.imageUrl || selectedMember.imageUrl.includes('placeholder') ? (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <User className="w-6 h-6 text-sage/40" />
                  </div>
                ) : selectedMember.cropCloseUpCircleUrl ? (
                  // Use pre-cropped image if available
                  <img
                    src={selectedMember.cropCloseUpCircleUrl}
                    alt={selectedMember.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = '<svg class="w-6 h-6 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'
                      }
                    }}
                  />
                ) : (
                  // Use original image with object-fit
                  <img
                    src={selectedMember.imageUrl}
                    alt={selectedMember.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = '<svg class="w-6 h-6 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'
                      }
                    }}
                  />
                )}
              </div>
              <span className="body text-dune font-medium truncate">
                {selectedMember.name}
              </span>
            </>
          ) : (
            <>
              {/* Placeholder */}
              <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-sage" />
              </div>
              <span className="body text-sage">Select team member</span>
            </>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-sage transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-cream arch-full border-2 border-sage/20 shadow-2xl z-50 max-h-80 overflow-y-auto"
          >
            {/* Clear selection option */}
            {selectedId && (
              <>
                <button
                  onClick={() => {
                    onSelect(undefined)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-sand/30 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-sage" />
                  </div>
                  <span className="body text-sage flex-1">Clear selection</span>
                </button>
                <div className="h-px bg-sage/10 mx-2" />
              </>
            )}

            {/* Team members list */}
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left ${
                  selectedId === member.id
                    ? "bg-dusty-rose/10"
                    : "hover:bg-warm-sand/30"
                }`}
              >
                {/* Member image */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-warm-sand/40 flex-shrink-0 shadow-sm">
                  {!member.imageUrl || member.imageUrl.includes('placeholder') ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-sage/40" />
                    </div>
                  ) : member.cropCloseUpCircleUrl ? (
                    // Use pre-cropped image if available
                    <img
                      src={member.cropCloseUpCircleUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="absolute inset-0 w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>'
                        }
                      }}
                    />
                  ) : (
                    // Use original image with object-fit
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="absolute inset-0 w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>'
                        }
                      }}
                    />
                  )}
                </div>
                <span className="body text-dune font-medium flex-1 truncate">
                  {member.name}
                </span>
                {selectedId === member.id && (
                  <Check className="w-5 h-5 text-dusty-rose flex-shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
