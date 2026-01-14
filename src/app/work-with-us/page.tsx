'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FooterV2 } from '@/components/landing-v2/sections/FooterV2'
import {
  CheckCircle2,
  Sparkles,
  Heart,
  Calendar,
  DollarSign,
  GraduationCap,
  Users,
  Star,
  Building2,
  Clock,
  Wifi,
  Coffee,
  Camera,
  Send,
  Loader2,
  ChevronDown,
  ArrowRight,
  X
} from 'lucide-react'

// Types
type CareerPath = 'employee' | 'booth' | 'training'

interface PathFormData {
  name: string
  email: string
  phone: string
  experience: string
  specialty: string[]
  message: string
  instagram?: string
  currentBusiness?: string
  desiredStartDate?: string
}

// Custom easing curve
const smoothEase = [0.23, 1, 0.32, 1] as const

// Navigation items
const navItems = [
  { label: 'Services', href: '/#services' },
  { label: 'Team', href: '/#team' },
  { label: 'Reviews', href: '/#reviews' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Find Us', href: '/#find-us' },
  { label: 'Work With Us', href: '/work-with-us', active: true }
]

// Employee Benefits Data
const employeeBenefits = [
  { icon: Calendar, title: 'Flexible Scheduling', description: 'Build your own schedule around your life.' },
  { icon: DollarSign, title: 'Competitive Pay', description: 'Commission-based with guaranteed minimums.' },
  { icon: GraduationCap, title: 'Ongoing Training', description: 'Continuous education at no cost to you.' },
  { icon: Heart, title: 'Health & Wellness', description: 'Wellness programs and work-life balance.' },
  { icon: Users, title: 'Team Community', description: 'A supportive team that lifts each other up.' },
  { icon: Star, title: 'Career Growth', description: 'Clear pathways to advance your career.' }
]

// Booth Rental Amenities
const boothAmenities = [
  { icon: Building2, text: 'Private or semi-private stations' },
  { icon: Wifi, text: 'High-speed WiFi included' },
  { icon: Coffee, text: 'Complimentary beverages' },
  { icon: Camera, text: 'Ring light & photo area' },
  { icon: Clock, text: '24/7 studio access' },
  { icon: Star, text: 'Premium product discounts' }
]

// Specialties for form
const specialties = [
  'Lash Extensions', 'Lash Lifts', 'Brow Lamination', 'Microblading',
  'Permanent Makeup', 'Facials/Skincare', 'Waxing', 'Nails', 'Injectables', 'Other'
]

// Inline Form Component
function PathForm({
  path,
  onSubmit,
  isSubmitting,
  isSubmitted
}: {
  path: CareerPath
  onSubmit: (data: PathFormData, path: CareerPath) => void
  isSubmitting: boolean
  isSubmitted: CareerPath | null
}) {
  const [formData, setFormData] = useState<PathFormData>({
    name: '', email: '', phone: '', experience: '', specialty: [], message: '',
    instagram: '', currentBusiness: '', desiredStartDate: ''
  })

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '')
    if (phoneNumber.length < 4) return phoneNumber
    if (phoneNumber.length < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' ? formatPhoneNumber(value) : value
    }))
  }

  const toggleSpecialty = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specialty: prev.specialty.includes(spec)
        ? prev.specialty.filter(s => s !== spec)
        : [...prev.specialty, spec]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData, path)
  }

  if (isSubmitted === path) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="font-display text-xl font-medium text-charcoal mb-2">
          {path === 'training' ? 'You\'re on the list!' : 'Application Received!'}
        </h3>
        <p className="text-charcoal/70 text-sm">
          {path === 'training'
            ? 'We\'ll notify you as soon as enrollment opens.'
            : 'We\'ll review your application and reach out soon.'}
        </p>
      </motion.div>
    )
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-sage/30 bg-white focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all text-sm"

  // Custom form content based on path
  const formConfig = {
    employee: {
      title: 'Apply to Join Our Team',
      subtitle: 'Tell us about yourself and your experience',
      buttonText: 'Submit Application',
      showExperience: true,
      showSpecialties: true,
      messagePlaceholder: 'Tell us about your goals, why you want to join LashPop, and what makes you a great fit...'
    },
    booth: {
      title: 'Inquire About Booth Rental',
      subtitle: 'Let\'s find the perfect space for your business',
      buttonText: 'Request Info',
      showExperience: true,
      showSpecialties: true,
      showCurrentBusiness: true,
      showStartDate: true,
      messagePlaceholder: 'Tell us about your current business, clientele, and what you\'re looking for in a space...'
    },
    training: {
      title: 'Join the Waitlist',
      subtitle: 'Be first to know when enrollment opens',
      buttonText: 'Join Waitlist',
      showExperience: true,
      showInstagram: true,
      messagePlaceholder: 'What are you hoping to learn? Any specific techniques you\'re interested in?'
    }
  }

  const config = formConfig[path]

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="mb-6">
        <h4 className="font-display text-lg font-medium text-charcoal">{config.title}</h4>
        <p className="text-sm text-charcoal/60">{config.subtitle}</p>
      </div>

      {/* Name & Email Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Full name *"
          className={inputClass}
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Email *"
          className={inputClass}
        />
      </div>

      {/* Phone & Experience Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="Phone *"
          className={inputClass}
        />
        {config.showExperience && (
          <select
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            className={`${inputClass} appearance-none bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat`}
          >
            <option value="">Experience level</option>
            <option value="new">New to the industry</option>
            <option value="1-2">1-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5+">5+ years</option>
          </select>
        )}
      </div>

      {/* Booth-specific fields */}
      {path === 'booth' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            name="currentBusiness"
            value={formData.currentBusiness}
            onChange={handleChange}
            placeholder="Current business name (if any)"
            className={inputClass}
          />
          <input
            type="text"
            name="desiredStartDate"
            value={formData.desiredStartDate}
            onChange={handleChange}
            placeholder="Desired start date"
            className={inputClass}
          />
        </div>
      )}

      {/* Training-specific: Instagram */}
      {path === 'training' && (
        <input
          type="text"
          name="instagram"
          value={formData.instagram}
          onChange={handleChange}
          placeholder="Instagram handle (optional)"
          className={inputClass}
        />
      )}

      {/* Specialties - for employee and booth */}
      {(path === 'employee' || path === 'booth') && (
        <div>
          <label className="block text-xs font-medium text-charcoal/70 mb-2">
            Specialties
          </label>
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => toggleSpecialty(spec)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                  formData.specialty.includes(spec)
                    ? 'bg-rust text-cream'
                    : 'bg-ivory border border-sage/30 text-charcoal/70 hover:border-dusty-rose'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        rows={3}
        placeholder={config.messagePlaceholder}
        className={`${inputClass} resize-none`}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-full font-medium text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 hover:shadow-lg"
        style={{ backgroundColor: '#ac4d3c', color: 'rgb(240, 224, 219)' }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {config.buttonText}
          </>
        )}
      </button>
    </motion.form>
  )
}

export default function WorkWithUsPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<CareerPath | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState<CareerPath | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 68, left: 0 })
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Update menu position when opened
  useEffect(() => {
    if (isMobileMenuOpen && menuButtonRef.current) {
      const menuWidth = 140
      const rightPadding = 20
      setMenuPosition({
        top: 68,
        left: window.innerWidth - menuWidth - rightPadding
      })
    }
  }, [isMobileMenuOpen])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside as any)
    }, 10)
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [isMobileMenuOpen])

  const handleFormSubmit = async (data: PathFormData, path: CareerPath) => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(path)
  }

  const pathCards = [
    {
      id: 'employee' as CareerPath,
      icon: Users,
      title: 'Join as an Employee',
      description: 'Full support, training, and benefits. Perfect for those who want structure and growth.',
      image: '/lashpop-images/culture/team-working.jpg'
    },
    {
      id: 'booth' as CareerPath,
      icon: Building2,
      title: 'Booth Rental',
      description: 'Run your own business in our beautiful space. Independence with community.',
      image: '/lashpop-images/culture/team-front-desk.jpeg'
    },
    {
      id: 'training' as CareerPath,
      icon: GraduationCap,
      title: 'LashPop Pro Training',
      description: 'Master award-winning techniques. Comprehensive program coming soon.',
      image: '/lashpop-images/culture/team-lounge.jpg',
      badge: 'Coming Soon'
    }
  ]

  return (
    <div className="min-h-screen bg-ivory">
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 hidden md:block glass backdrop-blur-md shadow-lg ${
          isScrolled ? 'py-4' : 'py-6'
        }`}
      >
        <div className="w-full px-6 md:px-12">
          <div className="flex items-center justify-between">
            <Link href="/" className="relative flex items-center transition-all duration-300 h-8">
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2">
                <Image
                  src="/lashpop-images/branding/logo-terracotta.png"
                  alt="LashPop Studios"
                  width={120}
                  height={40}
                  className="w-auto h-8 transition-all duration-300"
                  priority
                />
              </motion.div>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`caption hover:opacity-80 transition-colors duration-300 leading-none flex items-center h-8 ${
                    (item as { active?: boolean }).active ? 'font-medium' : ''
                  }`}
                  style={{ color: '#b14e33' }}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/#services"
                className="btn ml-4 text-cream transition-colors duration-300 hover:opacity-90"
                style={{ backgroundColor: '#b14e33' }}
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 md:hidden transition-all duration-300 ${
          isScrolled || isMobileMenuOpen ? 'bg-ivory/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-5 flex items-center justify-between" style={{ height: '60px' }}>
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/lashpop-images/branding/logo-terracotta.png"
              alt="LashPop Studios"
              width={96}
              height={32}
              className="h-6 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/#services"
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-white text-[10px] font-sans font-semibold tracking-wide uppercase"
              style={{ backgroundColor: '#b14e33' }}
            >
              Book
            </Link>
            <button
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`flex-shrink-0 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-all duration-150 ${
                isMobileMenuOpen ? 'bg-terracotta-light/10' : 'active:bg-warm-sand/40'
              }`}
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 transition-all duration-200 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ backgroundColor: '#b14e33' }} />
              <span className={`block w-5 h-0.5 transition-all duration-200 ${isMobileMenuOpen ? 'opacity-0' : ''}`} style={{ backgroundColor: '#b14e33' }} />
              <span className={`block w-5 h-0.5 transition-all duration-200 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ backgroundColor: '#b14e33' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          ref={menuRef}
          className="fixed z-[9999] rounded-xl overflow-hidden md:hidden"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            minWidth: 140,
            background: 'rgba(250, 246, 242, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(161, 151, 129, 0.12)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div className="py-1.5">
            {navItems.map((item) => {
              const isActive = (item as { active?: boolean }).active
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    w-full flex items-center justify-between gap-3 px-4 py-2.5
                    text-left transition-colors duration-150
                    ${isActive ? 'bg-terracotta/8' : 'active:bg-warm-sand/50'}
                  `}
                >
                  <span className={`text-[11px] font-sans font-medium tracking-wide ${isActive ? 'text-terracotta' : 'text-terracotta/70'}`}>
                    {item.label.toUpperCase()}
                  </span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-terracotta/60" />}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16 md:h-20" />

      {/* HERO + PATH CARDS - ONE COHESIVE SECTION */}
      <section className="relative min-h-[calc(100vh-5rem)] md:min-h-0 bg-gradient-to-b from-cream/50 via-ivory to-ivory">
        {/* Background Image - Desktop */}
        <div className="hidden md:block absolute top-0 right-0 w-1/3 h-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-ivory/80 to-ivory z-10" />
          <Image
            src="/lashpop-images/culture/team-hallway.jpeg"
            alt=""
            fill
            className="object-cover object-center opacity-40"
            priority
          />
        </div>

        <div className="relative z-10 container max-w-6xl px-5 md:px-8 py-10 md:py-16">
          {/* Hero Content */}
          <motion.div
            className="max-w-2xl mb-10 md:mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: smoothEase }}
          >
            <p className="text-xs md:text-sm font-medium tracking-[0.2em] uppercase mb-3" style={{ color: '#ac4d3c' }}>
              Join Our Team
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-medium mb-4 md:mb-6" style={{ color: '#3d3632' }}>
              Find Your Place at LashPop
            </h1>
            <p className="text-base md:text-lg font-light leading-relaxed" style={{ color: '#3d3632' }}>
              Three paths to be part of something special. Choose what fits you best.
            </p>
          </motion.div>

          {/* Mobile Hero Image */}
          <motion.div
            className="md:hidden mb-8 -mx-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src="/lashpop-images/culture/team-hallway.jpeg"
                alt="LashPop team"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/30 to-transparent" />
            </div>
          </motion.div>

          {/* Path Cards */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {pathCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: smoothEase, delay: 0.1 + index * 0.1 }}
                className="flex flex-col"
              >
                <button
                  onClick={() => setActiveSection(activeSection === card.id ? null : card.id)}
                  className={`w-full text-left group relative overflow-hidden transition-all duration-300 ${
                    activeSection === card.id
                      ? 'shadow-xl md:ring-2 md:ring-rust/50 rounded-t-2xl rounded-b-none md:rounded-2xl'
                      : 'hover:shadow-lg rounded-2xl'
                  }`}
                >
                  {/* Card Image */}
                  <div className="relative h-32 md:h-40 overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/40 to-transparent" />

                    {/* Badge */}
                    {card.badge && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-rust/90 text-cream text-[10px] font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {card.badge}
                      </span>
                    )}

                    {/* Icon */}
                    <div className="absolute bottom-3 left-3">
                      <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                        <card.icon className="w-5 h-5" style={{ color: '#ac4d3c' }} />
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 bg-white">
                    <h3 className="font-display text-base md:text-lg font-medium text-charcoal mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs md:text-sm text-charcoal/70 mb-3 line-clamp-2">
                      {card.description}
                    </p>
                    <span
                      className="text-xs font-medium flex items-center gap-1 transition-colors"
                      style={{ color: '#ac4d3c' }}
                    >
                      {activeSection === card.id ? 'Close' : 'Learn more'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeSection === card.id ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </button>

                {/* Mobile Inline Content + Form - shows within card on mobile only */}
                <AnimatePresence>
                  {activeSection === card.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: smoothEase }}
                      className="md:hidden overflow-hidden bg-white rounded-b-2xl shadow-lg"
                    >
                      <div className="p-4 space-y-5">
                        {/* Employee Mobile Content */}
                        {card.id === 'employee' && (
                          <>
                            <div>
                              <p className="text-xs font-medium tracking-[0.15em] uppercase mb-2" style={{ color: '#ac4d3c' }}>
                                Employee Benefits
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {employeeBenefits.map((benefit) => (
                                  <div key={benefit.title} className="flex gap-2 p-2.5 rounded-xl bg-ivory/50">
                                    <benefit.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ac4d3c' }} />
                                    <div>
                                      <h4 className="font-medium text-xs text-charcoal">{benefit.title}</h4>
                                      <p className="text-[10px] text-charcoal/60 leading-tight">{benefit.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-cream/50 to-peach/20 rounded-xl p-4">
                              <h4 className="font-display font-medium text-sm mb-3 text-charcoal">How to Join</h4>
                              <div className="flex flex-col gap-2">
                                {['Apply below', 'Meet the team', 'Skills check', 'Welcome!'].map((step, i) => (
                                  <div key={step} className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-rust/10 flex items-center justify-center text-[10px] font-medium" style={{ color: '#ac4d3c' }}>
                                      {i + 1}
                                    </span>
                                    <span className="text-xs text-charcoal/80">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Booth Mobile Content */}
                        {card.id === 'booth' && (
                          <>
                            <div>
                              <p className="text-xs font-medium tracking-[0.15em] uppercase mb-2" style={{ color: '#ac4d3c' }}>
                                Booth Rental
                              </p>
                              <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-ivory/50 border border-sage/10">
                                  <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-display font-medium text-sm text-charcoal">Station Rental</h4>
                                    <span className="text-xs font-medium" style={{ color: '#ac4d3c' }}>From $600/mo</span>
                                  </div>
                                  <p className="text-[10px] text-charcoal/60 mb-2">Semi-private workspace in our shared studio.</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {['Dedicated space', 'Shared amenities', 'Flexible hours'].map(item => (
                                      <span key={item} className="inline-flex items-center gap-1 text-[10px] text-charcoal/70">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-ivory/50 border border-sage/10">
                                  <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-display font-medium text-sm text-charcoal">Private Room</h4>
                                    <span className="text-xs font-medium" style={{ color: '#ac4d3c' }}>From $1,200/mo</span>
                                  </div>
                                  <p className="text-[10px] text-charcoal/60 mb-2">Your own private space within LashPop.</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {['Private room', 'Personal setup', 'Premium amenities'].map(item => (
                                      <span key={item} className="inline-flex items-center gap-1 text-[10px] text-charcoal/70">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {boothAmenities.map((amenity) => (
                                <div key={amenity.text} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-ivory/30 text-center">
                                  <amenity.icon className="w-4 h-4" style={{ color: '#ac4d3c' }} />
                                  <span className="text-[9px] text-charcoal/70 leading-tight">{amenity.text}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Training Mobile Content */}
                        {card.id === 'training' && (
                          <>
                            <div>
                              <p className="text-base italic mb-3" style={{ color: '#cc947f' }}>
                                Master the award-winning LashPop way
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-ivory/50">
                                  <h4 className="font-medium text-xs text-charcoal mb-2">What You&apos;ll Learn</h4>
                                  <ul className="space-y-1">
                                    {['Signature lash techniques', 'Client consultation', 'Business fundamentals', 'Building clientele'].map(item => (
                                      <li key={item} className="flex items-start gap-1.5 text-[10px] text-charcoal/70">
                                        <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="p-3 rounded-xl bg-ivory/50">
                                  <h4 className="font-medium text-xs text-charcoal mb-2">What&apos;s Included</h4>
                                  <ul className="space-y-1">
                                    {['Hands-on training', 'Professional starter kit', 'Certification', 'Ongoing mentorship'].map(item => (
                                      <li key={item} className="flex items-start gap-1.5 text-[10px] text-charcoal/70">
                                        <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-cream/50 to-peach/20 rounded-xl p-3 text-center">
                              <p className="text-sm font-display text-charcoal">Be first in line</p>
                              <p className="text-[10px] text-charcoal/60">Limited spots for inaugural cohort</p>
                            </div>
                          </>
                        )}

                        {/* Form */}
                        <PathForm
                          path={card.id}
                          onSubmit={handleFormSubmit}
                          isSubmitting={isSubmitting}
                          isSubmitted={isSubmitted}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPANDABLE SECTIONS WITH INLINE FORMS - Desktop only */}

      {/* Employee Section */}
      <AnimatePresence>
        {activeSection === 'employee' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: smoothEase }}
            className="hidden md:block overflow-hidden bg-white border-t border-sage/10"
          >
            <div className="container max-w-6xl px-5 md:px-8 py-10 md:py-14">
              <div className="grid lg:grid-cols-2 gap-10 md:gap-14">
                {/* Left: Benefits */}
                <div>
                  <p className="text-xs font-medium tracking-[0.15em] uppercase mb-2" style={{ color: '#ac4d3c' }}>
                    Employee Benefits
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-medium mb-6" style={{ color: '#3d3632' }}>
                    More Than Just a Job
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {employeeBenefits.map((benefit) => (
                      <div key={benefit.title} className="flex gap-3 p-3 rounded-xl bg-ivory/50">
                        <benefit.icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ac4d3c' }} />
                        <div>
                          <h4 className="font-medium text-sm text-charcoal">{benefit.title}</h4>
                          <p className="text-xs text-charcoal/60">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* How to Join Steps - Mobile */}
                  <div className="lg:hidden bg-gradient-to-br from-cream/50 to-peach/20 rounded-2xl p-5 mb-8">
                    <h4 className="font-display font-medium mb-4 text-charcoal">How to Join</h4>
                    <div className="flex flex-col gap-3">
                      {['Apply below', 'Meet the team', 'Skills check', 'Welcome!'].map((step, i) => (
                        <div key={step} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-rust/10 flex items-center justify-center text-xs font-medium" style={{ color: '#ac4d3c' }}>
                            {i + 1}
                          </span>
                          <span className="text-sm text-charcoal/80">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image - Desktop */}
                  <div className="hidden lg:block relative rounded-2xl overflow-hidden h-64">
                    <Image
                      src="/lashpop-images/culture/team-front-desk.jpeg"
                      alt="LashPop team"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex gap-2">
                        {['Apply', 'Interview', 'Skills check', 'Welcome!'].map((step, i) => (
                          <div key={step} className="flex-1 text-center">
                            <div className="text-lg font-display text-white/90 mb-1">0{i + 1}</div>
                            <div className="text-[10px] text-white/70">{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Form */}
                <div className="bg-ivory/30 rounded-2xl p-5 md:p-8">
                  <PathForm
                    path="employee"
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                    isSubmitted={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Booth Rental Section */}
      <AnimatePresence>
        {activeSection === 'booth' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: smoothEase }}
            className="hidden md:block overflow-hidden bg-white border-t border-sage/10"
          >
            <div className="container max-w-6xl px-5 md:px-8 py-10 md:py-14">
              <div className="grid lg:grid-cols-2 gap-10 md:gap-14">
                {/* Left: Info */}
                <div>
                  <p className="text-xs font-medium tracking-[0.15em] uppercase mb-2" style={{ color: '#ac4d3c' }}>
                    Booth Rental
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-medium mb-6" style={{ color: '#3d3632' }}>
                    Your Business, Our Beautiful Space
                  </h2>

                  {/* Pricing Options */}
                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-ivory/50 border border-sage/10">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-display font-medium text-charcoal">Station Rental</h4>
                        <span className="text-sm font-medium" style={{ color: '#ac4d3c' }}>From $600/mo</span>
                      </div>
                      <p className="text-xs text-charcoal/60 mb-2">Semi-private workspace in our shared studio.</p>
                      <div className="flex flex-wrap gap-2">
                        {['Dedicated space', 'Shared amenities', 'Flexible hours'].map(item => (
                          <span key={item} className="inline-flex items-center gap-1 text-[10px] text-charcoal/70">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-ivory/50 border border-sage/10">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-display font-medium text-charcoal">Private Room</h4>
                        <span className="text-sm font-medium" style={{ color: '#ac4d3c' }}>From $1,200/mo</span>
                      </div>
                      <p className="text-xs text-charcoal/60 mb-2">Your own private space within LashPop.</p>
                      <div className="flex flex-wrap gap-2">
                        {['Private room', 'Personal setup', 'Premium amenities'].map(item => (
                          <span key={item} className="inline-flex items-center gap-1 text-[10px] text-charcoal/70">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                    {boothAmenities.map((amenity) => (
                      <div key={amenity.text} className="flex items-center gap-2 p-2 rounded-lg bg-ivory/30">
                        <amenity.icon className="w-4 h-4 flex-shrink-0" style={{ color: '#ac4d3c' }} />
                        <span className="text-[10px] text-charcoal/70">{amenity.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Photo Gallery */}
                  <div className="grid grid-cols-4 gap-2">
                    {['/lashpop-images/culture/team-front-desk.jpeg', '/lashpop-images/culture/team-lounge.jpg', '/lashpop-images/culture/team-working.jpg', '/lashpop-images/culture/team-reception.jpg'].map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden">
                        <Image src={img} alt="" width={150} height={150} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Form */}
                <div className="bg-ivory/30 rounded-2xl p-5 md:p-8">
                  <PathForm
                    path="booth"
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                    isSubmitted={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Training Section - Desktop only, mobile shows inline in card */}
      <AnimatePresence>
        {activeSection === 'training' && (
          <div className="hidden md:block">
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: smoothEase }}
            className="overflow-hidden bg-white border-t border-sage/10"
          >
            <div className="container max-w-6xl px-5 md:px-8 py-10 md:py-14">
              <div className="grid lg:grid-cols-2 gap-10 md:gap-14">
                {/* Left: Info */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rust/10 text-xs font-medium mb-4" style={{ color: '#ac4d3c' }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    Coming Soon
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-medium mb-2" style={{ color: '#3d3632' }}>
                    LashPop Pro
                  </h2>
                  <p className="text-base italic mb-6" style={{ color: '#cc947f' }}>
                    Master the award-winning LashPop way
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-ivory/50">
                      <h4 className="font-medium text-sm text-charcoal mb-2">What You&apos;ll Learn</h4>
                      <ul className="space-y-1.5">
                        {['Signature lash techniques', 'Client consultation', 'Business fundamentals', 'Building clientele'].map(item => (
                          <li key={item} className="flex items-start gap-2 text-xs text-charcoal/70">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-ivory/50">
                      <h4 className="font-medium text-sm text-charcoal mb-2">What&apos;s Included</h4>
                      <ul className="space-y-1.5">
                        {['Hands-on training', 'Professional starter kit', 'Certification', 'Ongoing mentorship'].map(item => (
                          <li key={item} className="flex items-start gap-2 text-xs text-charcoal/70">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative rounded-2xl overflow-hidden h-48">
                    <Image
                      src="/lashpop-images/culture/team-lounge.jpg"
                      alt="LashPop training"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white font-display text-lg">Be first in line</p>
                      <p className="text-white/70 text-xs">Limited spots for inaugural cohort</p>
                    </div>
                  </div>
                </div>

                {/* Right: Form */}
                <div className="bg-gradient-to-br from-cream/50 to-peach/20 rounded-2xl p-5 md:p-8">
                  <PathForm
                    path="training"
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                    isSubmitted={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* WHY LASHPOP SECTION */}
      <section className="py-14 md:py-20 px-5 md:px-8 bg-gradient-to-b from-ivory to-cream/30">
        <div className="container max-w-6xl">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl md:text-3xl font-medium mb-3" style={{ color: '#ac4d3c' }}>
              Why LashPop?
            </h2>
            <p className="text-charcoal/70 max-w-xl mx-auto text-sm md:text-base">
              A place where talent thrives, creativity flows, and everyone supports each other.
            </p>
          </motion.div>

          {/* Feature Images */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-10">
            <motion.div
              className="relative rounded-2xl overflow-hidden h-52 md:h-64"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Image src="/lashpop-images/culture/team-working.jpg" alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-display text-lg">A team that grows together</p>
              </div>
            </motion.div>
            <motion.div
              className="relative rounded-2xl overflow-hidden h-52 md:h-64"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Image src="/lashpop-images/culture/team-lounge.jpg" alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-display text-lg">Community like family</p>
              </div>
            </motion.div>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { icon: Users, title: 'Real Community', desc: 'Not just coworkers—a family that celebrates wins together.' },
              { icon: Sparkles, title: 'Cross-Promotion', desc: 'When one wins, we all win. Active client referrals.' },
              { icon: Heart, title: 'Fun Environment', desc: 'Good music, great energy, a space you want to be in.' },
              { icon: Star, title: 'Brand Power', desc: 'Benefit from established reputation and marketing.' },
              { icon: GraduationCap, title: 'Continuous Learning', desc: 'Regular training and skill-sharing sessions.' },
              { icon: Building2, title: 'Business Support', desc: 'Guidance, social media support, growth strategies.' }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="flex gap-3 p-4 rounded-xl bg-white/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="w-10 h-10 rounded-full bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5" style={{ color: '#ac4d3c' }} />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-charcoal mb-0.5">{item.title}</h3>
                  <p className="text-xs text-charcoal/60">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <FooterV2 />
    </div>
  )
}
