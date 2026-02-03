"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import type { PhotoPair, LashStyle } from "./types"

// Blur placeholder for smooth image loading
const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAcI/8QAIhAAAQMEAgIDAAAAAAAAAAAAAQIDBAUGEQASIQcxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQACAwEBAAAAAAAAAAAAAAABAgADESEE/9oADAMBAAIRAxEAPwC08j0+mVqm0eo02owZkCpR0TYr8d5LjT7TgCkLQoHCkqBBBHBBHJJFj8fUiDT+P7cZp0GOxAbpkJLLLSUNttBhGkJSAAlKR4AAAHjnOc0xWzGvBFy6mf/2Q=="

// Lash/Eye icon for tap indicator
const LashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="w-6 h-6"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Eye shape */}
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    {/* Pupil */}
    <circle cx="12" cy="12" r="3" />
    {/* Top lashes */}
    <path d="M12 5V2" />
    <path d="M8 6L6.5 3.5" />
    <path d="M16 6L17.5 3.5" />
    <path d="M5 8.5L2.5 7" />
    <path d="M19 8.5L21.5 7" />
  </svg>
)

interface PhotoComparisonRoundProps {
  pair: PhotoPair
  onSelect: (selectedStyle: LashStyle) => void
  disabled?: boolean
}

export function PhotoComparisonRound({
  pair,
  onSelect,
  disabled = false,
}: PhotoComparisonRoundProps) {
  // Get the display URL for a photo (prefer cropUrl, fallback to filePath)
  const getPhotoUrl = (photo: PhotoPair["left"]) => {
    return photo.cropUrl || photo.filePath
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - static, doesn't animate between rounds */}
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-xl md:text-2xl font-display font-medium text-charcoal">
          Which look speaks to you?
        </h2>
        <p className="text-xs md:text-sm text-charcoal/70 mt-1 max-w-sm mx-auto">
          Tap the lash style you prefer
        </p>
      </div>

      {/* Photo Comparison */}
      <div className="flex-1 grid grid-cols-2 gap-3 md:gap-4 min-h-0">
        {/* Left Photo */}
        <motion.button
          initial={{ opacity: 0, x: -20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            delay: 0.15,
            duration: 0.5,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          whileHover={disabled ? {} : { scale: 1.03, y: -4 }}
          whileTap={disabled ? {} : { scale: 0.97 }}
          onClick={() => !disabled && onSelect(pair.leftStyle)}
          disabled={disabled}
          className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-shadow hover:shadow-xl"
        >
          <Image
            src={getPhotoUrl(pair.left)}
            alt="Left option"
            fill
            priority
            sizes="(max-width: 768px) 45vw, 200px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {/* Selection overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dusty-rose/0 via-transparent to-dusty-rose/0 group-hover:from-dusty-rose/15 group-hover:to-dusty-rose/5 transition-all duration-300" />
          {/* Border glow on hover */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-dusty-rose/40 transition-colors duration-300" />
        </motion.button>

        {/* Right Photo */}
        <motion.button
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.5,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          whileHover={disabled ? {} : { scale: 1.03, y: -4 }}
          whileTap={disabled ? {} : { scale: 0.97 }}
          onClick={() => !disabled && onSelect(pair.rightStyle)}
          disabled={disabled}
          className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-shadow hover:shadow-xl"
        >
          <Image
            src={getPhotoUrl(pair.right)}
            alt="Right option"
            fill
            priority
            sizes="(max-width: 768px) 45vw, 200px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {/* Selection overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dusty-rose/0 via-transparent to-dusty-rose/0 group-hover:from-dusty-rose/15 group-hover:to-dusty-rose/5 transition-all duration-300" />
          {/* Border glow on hover */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-dusty-rose/40 transition-colors duration-300" />
        </motion.button>
      </div>

      {/* Helper text - static */}
      <div className="text-center mt-3 shrink-0">
        <p className="text-[11px] text-charcoal/50">
          Don&apos;t overthink it - go with your gut!
        </p>
      </div>
    </div>
  )
}

// Animation variant for selection feedback
export function PhotoSelectionFeedback({
  selectedSide,
  onComplete,
}: {
  selectedSide: "left" | "right"
  onComplete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      {/* Ripple effect */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0.8 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{
          duration: 0.6,
          ease: "easeOut"
        }}
        className={`absolute w-24 h-24 rounded-full bg-dusty-rose/30 ${
          selectedSide === "left" ? "left-[25%]" : "right-[25%]"
        }`}
        style={{
          top: "50%",
          transform: "translateY(-50%)"
        }}
      />

      {/* Check icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
        className={`w-16 h-16 rounded-full bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center shadow-xl ${
          selectedSide === "left" ? "ml-[-25%]" : "mr-[-25%]"
        }`}
      >
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <motion.path d="M5 12l5 5L20 7" />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}
