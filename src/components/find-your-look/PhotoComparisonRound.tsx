"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { PhotoPair, LashStyle } from "./types"
import { QuizBlurFadeImage } from "./QuizBlurFadeImage"
import { getQuizPhotoUrl } from "./quiz-image-preloader"

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
  onSkip: () => void
  disabled?: boolean
}

export function PhotoComparisonRound({
  pair,
  onSelect,
  onSkip,
  disabled = false,
}: PhotoComparisonRoundProps) {
  const [feedbackSide, setFeedbackSide] = useState<"left" | "right" | null>(null)

  const handleSelect = (side: "left" | "right", style: LashStyle) => {
    if (disabled || feedbackSide) return
    setFeedbackSide(side)
    window.setTimeout(() => {
      onSelect(style)
    }, 550)
  }

  const isLocked = disabled || feedbackSide !== null

  return (
    <div
      className="h-full flex flex-col"
      data-photo-pair={`${pair.left.assetId}:${pair.right.assetId}`}
    >
      {/* Header - static, doesn't animate between rounds */}
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-xl md:text-2xl font-display font-medium text-charcoal">
          Tap the look you love more
        </h2>
      </div>

      {/* Photo Comparison */}
      <div
        className="grid flex-none grid-cols-2 gap-3 min-h-0 md:flex-1 md:gap-4"
        data-quiz-photo-grid
      >
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
          whileHover={isLocked ? {} : { scale: 1.03, y: -4 }}
          whileTap={isLocked ? {} : { scale: 0.97 }}
          onClick={() => handleSelect("left", pair.leftStyle)}
          disabled={isLocked}
          aria-pressed={feedbackSide === "left"}
          data-lash-style={pair.leftStyle}
          data-quiz-photo-src={getQuizPhotoUrl(pair.left)}
          className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-md disabled:cursor-not-allowed transition-shadow hover:shadow-xl bg-cream"
        >
          <QuizBlurFadeImage
            src={getQuizPhotoUrl(pair.left)}
            alt="Left option"
            priority
            sizes="(max-width: 768px) 45vw, 200px"
            className="group-hover:scale-105"
          />
          {/* Selection overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dusty-rose/0 via-transparent to-dusty-rose/0 group-hover:from-dusty-rose/15 group-hover:to-dusty-rose/5 transition-all duration-300" />
          {/* Border glow on hover */}
          <div
            className={`absolute inset-0 rounded-2xl border-2 transition-colors duration-200 ${
              feedbackSide === "left"
                ? "border-dusty-rose/80"
                : "border-transparent group-hover:border-dusty-rose/40"
            }`}
          />
          <AnimatePresence>
            {feedbackSide === "left" && <PhotoSelectedIndicator key="left-selected" />}
          </AnimatePresence>
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
          whileHover={isLocked ? {} : { scale: 1.03, y: -4 }}
          whileTap={isLocked ? {} : { scale: 0.97 }}
          onClick={() => handleSelect("right", pair.rightStyle)}
          disabled={isLocked}
          aria-pressed={feedbackSide === "right"}
          data-lash-style={pair.rightStyle}
          data-quiz-photo-src={getQuizPhotoUrl(pair.right)}
          className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-md disabled:cursor-not-allowed transition-shadow hover:shadow-xl bg-cream"
        >
          <QuizBlurFadeImage
            src={getQuizPhotoUrl(pair.right)}
            alt="Right option"
            priority
            sizes="(max-width: 768px) 45vw, 200px"
            className="group-hover:scale-105"
          />
          {/* Selection overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dusty-rose/0 via-transparent to-dusty-rose/0 group-hover:from-dusty-rose/15 group-hover:to-dusty-rose/5 transition-all duration-300" />
          {/* Border glow on hover */}
          <div
            className={`absolute inset-0 rounded-2xl border-2 transition-colors duration-200 ${
              feedbackSide === "right"
                ? "border-dusty-rose/80"
                : "border-transparent group-hover:border-dusty-rose/40"
            }`}
          />
          <AnimatePresence>
            {feedbackSide === "right" && <PhotoSelectedIndicator key="right-selected" />}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Neither button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        onClick={() => !isLocked && onSkip()}
        disabled={isLocked}
        className="mt-3 min-h-11 self-center rounded-full border border-dusty-rose/40 bg-cream/50 px-6 py-2.5 text-sm font-medium text-charcoal/70 shadow-sm transition-[background-color,border-color,color,transform] hover:border-dusty-rose hover:bg-cream hover:text-charcoal active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
      >
        Neither of these
      </motion.button>

    </div>
  )
}

function PhotoSelectedIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="pointer-events-none absolute inset-0 flex items-start justify-end bg-charcoal/10 p-3"
    >
      <motion.div
        initial={{ scale: 0.85, y: -4 }}
        animate={{ scale: 1, y: 0 }}
        transition={{
          duration: 0.22,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        data-quiz-selection-indicator
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-dusty-rose/70 bg-cream text-terracotta shadow-md"
      >
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <motion.path
            d="M5 12l5 5L20 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}
