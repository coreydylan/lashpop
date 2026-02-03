'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { DevModeProvider } from '@/contexts/DevModeContext'
import { Navigation } from '@/components/sections/Navigation'
import { MobileHeader } from '@/components/landing-v2/MobileHeader'
import { FooterV2 } from '@/components/landing-v2/sections/FooterV2'
import { submitWorkWithUsForm, type CareerPath } from '@/actions/work-with-us'
import { TeamCarousel } from '@/components/work-with-us/TeamCarousel'
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
  Coffee,
  Camera,
  Send,
  Loader2,
  ChevronDown,
  Share2,
  MapPin,
  Percent,
  Megaphone
} from 'lucide-react'

// Slot Machine Price Component
function SlotMachinePrice({ value, className }: { value: number; className?: string }) {
  const digits = value.toString().split('')

  return (
    <span className={`inline-flex items-baseline ${className || ''}`} style={{ color: '#cc947f' }}>
      <span className="mr-0.5">$</span>
      <span className="inline-flex overflow-hidden">
        {digits.map((digit, index) => (
          <span key={index} className="relative inline-block" style={{ width: '0.6em' }}>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`${index}-${digit}`}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.03
                }}
                className="inline-block"
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </span>
        ))}
      </span>
      <span className="text-[0.6em] ml-0.5 opacity-70">/day</span>
    </span>
  )
}

// Types
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

// Employee Benefits Data
const employeeBenefits = [
  { icon: Calendar, title: 'Flexible Scheduling', description: 'Build your own schedule around your life.' },
  { icon: DollarSign, title: 'Competitive Pay', description: 'Commission-based with guaranteed minimums.' },
  { icon: GraduationCap, title: 'Ongoing Training', description: 'Continuous education at no cost to you.' },
  { icon: Users, title: 'Team Community', description: 'A supportive team that lifts each other up.' },
  { icon: Star, title: 'Career Growth', description: 'Clear pathways to advance your career.' },
  { icon: Share2, title: 'Client Referrals', description: 'Cross-promotion and referrals within the team.' },
  { icon: Megaphone, title: 'Marketing Support', description: 'Social media and marketing assistance provided.' },
  { icon: Camera, title: 'Team Photoshoots', description: 'Professional photography sessions included.' },
  { icon: Sparkles, title: 'Complimentary Lashes', description: 'One free lash service per month.' },
  { icon: MapPin, title: 'Coastal Location', description: 'Walkable to beach, coffee shops & restaurants.' },
  { icon: Coffee, title: 'Break Room Perks', description: 'Coffee and tea bar available.' },
  { icon: Percent, title: 'Employee Discount', description: '30% off all retail products.' }
]

// Booth Rental Benefits
const boothBenefits = [
  { icon: Heart, title: 'Collaborative Atmosphere', description: 'Positive, supportive studio culture.' },
  { icon: Share2, title: 'Client Referrals', description: 'Cross-promotion on our website, booking & socials.' },
  { icon: Megaphone, title: 'Marketing Support', description: 'Business, social media, and marketing guidance.' },
  { icon: Camera, title: 'Team Photoshoots', description: 'Professional photography sessions included.' },
  { icon: Users, title: 'Team Events', description: 'Community gatherings and team bonding.' },
  { icon: Calendar, title: 'Flexible Options', description: 'Part-time and full-time availability.' },
  { icon: MapPin, title: 'Coastal Location', description: 'Walkable to beach, coffee shops & restaurants.' },
  { icon: GraduationCap, title: 'Education Opportunities', description: 'Access to training and skill development.' },
  { icon: Star, title: 'Career Development', description: 'Grow your business with our support.' },
  { icon: Clock, title: '24/7 Studio Access', description: 'Work on your own schedule, anytime.' },
  { icon: Building2, title: 'Locked Personal Storage', description: 'Secure space for your supplies.' },
  { icon: Coffee, title: 'Break Room Perks', description: 'Coffee and tea bar available.' },
  { icon: Percent, title: 'Employee Discount', description: '30% off all retail products.' },
  { icon: Sparkles, title: 'Ring Light & Photo Area', description: 'Professional setup for content creation.' }
]

// Booth Rental Pricing
const getBoothPricing = (days: number) => {
  if (days >= 5) return { station: 55, private: 65 }
  if (days === 4) return { station: 65, private: 75 }
  if (days === 3) return { station: 70, private: 80 }
  return { station: 75, private: 85 } // 1-2 days
}

// Specialties for form
const specialties = [
  'Lash Extensions', 'Lash Lifts', 'Brows', 'Microblading',
  'Permanent Makeup', 'Skincare', 'Waxing', 'Injectables', 'Other'
]

// Inline Form Component
function PathForm({
  path,
  onSubmit,
  isSubmitting,
  isSubmitted,
  boothDays
}: {
  path: CareerPath
  onSubmit: (data: PathFormData, path: CareerPath, boothDays?: number) => void
  isSubmitting: boolean
  isSubmitted: CareerPath | null
  boothDays?: number
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
    onSubmit(formData, path, path === 'booth' ? boothDays : undefined)
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
        style={{ backgroundColor: '#cc947f', color: 'rgb(240, 224, 219)' }}
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

// Slider styles
const sliderStyles = `
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    transition: background 0.15s ease-out;
  }
  input[type="range"]::-webkit-slider-runnable-track {
    height: 3px;
    border-radius: 2px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #cc947f;
    border: none;
    margin-top: -5.5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    transition: transform 0.1s ease-out, box-shadow 0.15s ease-out;
  }
  input[type="range"]:active::-webkit-slider-thumb {
    transform: scale(1.1);
  }
  input[type="range"]::-moz-range-track {
    height: 3px;
    border-radius: 2px;
  }
  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #cc947f;
    border: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
`

export default function WorkWithUsPage() {
  const [activeSection, setActiveSection] = useState<CareerPath | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState<CareerPath | null>(null)
  const [boothDays, setBoothDays] = useState(3)

  const boothPricing = getBoothPricing(boothDays)

  const handleFormSubmit = async (data: PathFormData, path: CareerPath, boothDaysValue?: number) => {
    setIsSubmitting(true)
    try {
      const result = await submitWorkWithUsForm({
        ...data,
        boothDays: boothDaysValue
      }, path)

      if (result.success) {
        setIsSubmitted(path)
      } else {
        console.error('Form submission failed:', result.error)
        // Could add error state/toast here
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const pathCards: Array<{
    id: CareerPath
    icon: typeof Users
    title: string
    description: string
    image: string
    badge?: string
  }> = [
    {
      id: 'employee',
      icon: Users,
      title: 'Join as an Employee',
      description: 'Full support, training, and benefits. Perfect for those who want structure and growth.',
      image: '/lashpop-images/culture/join-our-team.webp'
    },
    {
      id: 'booth',
      icon: Building2,
      title: 'Booth Rental',
      description: 'Run your own business in our beautiful space. Independence with community.',
      image: '/lashpop-images/culture/booth-rental.webp'
    },
    {
      id: 'training',
      icon: GraduationCap,
      title: 'LashPop Pro Training',
      description: 'Master award-winning techniques. Comprehensive training program.',
      image: '/lashpop-images/culture/training.webp'
    }
  ]

  return (
    <DevModeProvider>
    <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
    <div className="min-h-screen bg-ivory">
      {/* Shared Navigation Components */}
      <Navigation />
      <MobileHeader />

      {/* Spacer */}
      <div className="h-16 md:h-20" />

      {/* HERO + PATH CARDS - ONE COHESIVE SECTION */}
      <section className="relative min-h-[calc(100vh-5rem)] md:min-h-0 bg-gradient-to-b from-cream/50 via-ivory to-ivory">
        <div className="relative z-10 container max-w-6xl px-5 md:px-8 py-10 md:py-16">
          {/* Hero Content */}
          <motion.div
            className="max-w-2xl mb-10 md:mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: smoothEase }}
          >
            <p className="text-xs md:text-sm font-medium tracking-[0.2em] uppercase mb-3" style={{ color: '#cc947f' }}>
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
                      className={`object-cover transition-transform duration-500 group-hover:scale-105 ${card.id === 'employee' ? 'object-top' : card.id === 'booth' ? 'object-top' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/40 to-transparent" />

                    {/* Badge */}
                    {card.badge && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1" style={{ backgroundColor: '#dbb2a4', color: '#ac4d3c' }}>
                        <Sparkles className="w-3 h-3" />
                        {card.badge}
                      </span>
                    )}

                    {/* Icon */}
                    <div className="absolute bottom-3 left-3">
                      <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                        <card.icon className="w-5 h-5" style={{ color: '#cc947f' }} />
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
                      style={{ color: '#cc947f' }}
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
                              <p className="text-xs font-medium tracking-[0.15em] uppercase mb-2" style={{ color: '#cc947f' }}>
                                Employee Benefits
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {employeeBenefits.map((benefit) => (
                                  <div key={benefit.title} className="flex gap-2 p-2.5 rounded-xl bg-ivory/50">
                                    <benefit.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#cc947f' }} />
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
                                {['Apply', 'Coffee Date', 'Skills Check', 'Welcome'].map((step, i) => (
                                  <div key={step} className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-rust/10 flex items-center justify-center text-[10px] font-medium" style={{ color: '#cc947f' }}>
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
                              <p className="text-xs font-medium tracking-[0.15em] uppercase mb-2" style={{ color: '#cc947f' }}>
                                Booth Rental
                              </p>

                              {/* Days Slider */}
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] text-charcoal/60">Days per week</span>
                                  <span className="text-[10px] font-medium" style={{ color: '#cc947f' }}>
                                    {boothDays === 5 ? '5+' : boothDays} {boothDays === 1 ? 'day' : 'days'}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={boothDays}
                                  onChange={(e) => setBoothDays(parseInt(e.target.value))}
                                  className="w-full"
                                  style={{
                                    background: `linear-gradient(to right, #cc947f 0%, #cc947f ${(boothDays - 1) * 25}%, #e5ded9 ${(boothDays - 1) * 25}%, #e5ded9 100%)`,
                                    height: '3px',
                                    borderRadius: '2px'
                                  }}
                                />
                                <div className="flex justify-between mt-1 px-0.5">
                                  {[1, 2, 3, 4, '5+'].map((num) => (
                                    <span key={num} className="text-[9px] text-charcoal/40">{num}</span>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-xl bg-ivory/50 border border-sage/10">
                                  <h4 className="font-display font-medium text-xs text-charcoal mb-1">Main Space</h4>
                                  <SlotMachinePrice value={boothPricing.station} className="text-base font-medium" />
                                  <p className="text-[9px] text-charcoal/50 mt-1">Semi-private workspace</p>
                                </div>
                                <div className="p-3 rounded-xl bg-ivory/50 border border-sage/10">
                                  <h4 className="font-display font-medium text-xs text-charcoal mb-1">Private Room</h4>
                                  <SlotMachinePrice value={boothPricing.private} className="text-base font-medium" />
                                  <p className="text-[9px] text-charcoal/50 mt-1">Your own private space</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium tracking-[0.15em] uppercase mb-2" style={{ color: '#cc947f' }}>
                                Benefits
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {boothBenefits.map((benefit) => (
                                  <div key={benefit.title} className="flex gap-2 p-2.5 rounded-xl bg-ivory/50">
                                    <benefit.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#cc947f' }} />
                                    <div>
                                      <h4 className="font-medium text-xs text-charcoal">{benefit.title}</h4>
                                      <p className="text-[10px] text-charcoal/60 leading-tight">{benefit.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
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
                                    {['Lash foundations & technique', 'Client experience from start to finish', 'Safety, sanitation & industry standards', 'How to build and retain a clientele', 'Business foundations'].map(item => (
                                      <li key={item} className="flex items-start gap-1.5 text-[10px] text-charcoal/70">
                                        <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#cc947f' }} />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="p-3 rounded-xl bg-ivory/50">
                                  <h4 className="font-medium text-xs text-charcoal mb-2">What You&apos;ll Get</h4>
                                  <ul className="space-y-1">
                                    {['Full starter kit ($250 value)', 'Training manual and business forms', '4 hours of hands-on training', 'LashPop merchandise ($100 value)', 'LashPop Pro certification', 'Ongoing support', '3 follow-up shadow sessions'].map(item => (
                                      <li key={item} className="flex items-start gap-1.5 text-[10px] text-charcoal/70">
                                        <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#cc947f' }} />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-cream/50 to-peach/20 rounded-xl p-3 text-center">
                              <p className="text-sm font-display text-charcoal">Enroll with a friend for special pricing!</p>
                            </div>
                          </>
                        )}

                        {/* Form */}
                        <PathForm
                          path={card.id}
                          onSubmit={handleFormSubmit}
                          isSubmitting={isSubmitting}
                          isSubmitted={isSubmitted}
                          boothDays={boothDays}
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
                  <p className="text-xs font-medium tracking-[0.15em] uppercase mb-2" style={{ color: '#cc947f' }}>
                    Employee Benefits
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-medium mb-6" style={{ color: '#3d3632' }}>
                    More Than Just a Job
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {employeeBenefits.map((benefit) => (
                      <div key={benefit.title} className="flex gap-3 p-3 rounded-xl bg-ivory/50">
                        <benefit.icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#cc947f' }} />
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
                      {['Apply', 'Coffee Date', 'Skills Check', 'Welcome'].map((step, i) => (
                        <div key={step} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-rust/10 flex items-center justify-center text-xs font-medium" style={{ color: '#cc947f' }}>
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
                        {['Apply', 'Coffee Date', 'Skills Check', 'Welcome'].map((step, i) => (
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
                    boothDays={boothDays}
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
                  <p className="text-xs font-medium tracking-[0.15em] uppercase mb-2" style={{ color: '#cc947f' }}>
                    Booth Rental
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-medium mb-6" style={{ color: '#3d3632' }}>
                    Your Business, Our Beautiful Space
                  </h2>

                  {/* Days Slider */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-charcoal/60">Days per week</span>
                      <span className="text-xs font-medium" style={{ color: '#cc947f' }}>
                        {boothDays === 5 ? '5+' : boothDays} {boothDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={boothDays}
                      onChange={(e) => setBoothDays(parseInt(e.target.value))}
                      className="w-full"
                      style={{
                        background: `linear-gradient(to right, #cc947f 0%, #cc947f ${(boothDays - 1) * 25}%, #e5ded9 ${(boothDays - 1) * 25}%, #e5ded9 100%)`,
                        height: '3px',
                        borderRadius: '2px'
                      }}
                    />
                    <div className="flex justify-between mt-1.5 px-0.5">
                      {[1, 2, 3, 4, '5+'].map((num) => (
                        <span key={num} className="text-[10px] text-charcoal/40">{num}</span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Options */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-ivory/50 border border-sage/10">
                      <h4 className="font-display font-medium text-sm text-charcoal mb-1">Main Space</h4>
                      <SlotMachinePrice value={boothPricing.station} className="text-xl font-medium" />
                      <p className="text-xs text-charcoal/50 mt-1">Semi-private workspace</p>
                    </div>

                    <div className="p-4 rounded-xl bg-ivory/50 border border-sage/10">
                      <h4 className="font-display font-medium text-sm text-charcoal mb-1">Private Room</h4>
                      <SlotMachinePrice value={boothPricing.private} className="text-xl font-medium" />
                      <p className="text-xs text-charcoal/50 mt-1">Your own private space</p>
                    </div>
                  </div>

                  {/* Benefits Grid */}
                  <p className="text-xs font-medium tracking-[0.15em] uppercase mb-3" style={{ color: '#cc947f' }}>
                    Benefits
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {boothBenefits.map((benefit) => (
                      <div key={benefit.title} className="flex gap-3 p-3 rounded-xl bg-ivory/50">
                        <benefit.icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#cc947f' }} />
                        <div>
                          <h4 className="font-medium text-sm text-charcoal">{benefit.title}</h4>
                          <p className="text-xs text-charcoal/60">{benefit.description}</p>
                        </div>
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
                    boothDays={boothDays}
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
                        {['Lash foundations & technique', 'Client experience from start to finish', 'Safety, sanitation & industry standards', 'How to build and retain a clientele', 'Business foundations'].map(item => (
                          <li key={item} className="flex items-start gap-2 text-xs text-charcoal/70">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#cc947f' }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-ivory/50">
                      <h4 className="font-medium text-sm text-charcoal mb-2">What You&apos;ll Get</h4>
                      <ul className="space-y-1.5">
                        {['Full starter kit ($250 value)', 'Training manual and business forms', '4 hours of hands-on training', 'LashPop merchandise ($100 value)', 'LashPop Pro certification', 'Ongoing support', '3 follow-up shadow sessions'].map(item => (
                          <li key={item} className="flex items-start gap-2 text-xs text-charcoal/70">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#cc947f' }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative rounded-2xl overflow-hidden h-48">
                    <Image
                      src="/lashpop-images/culture/training.webp"
                      alt="LashPop training"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white font-display text-lg">Enroll with a friend for special pricing!</p>
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
                    boothDays={boothDays}
                  />
                </div>
              </div>
            </div>
          </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* Team Photo Carousel */}
      <TeamCarousel />

      {/* WHY LASHPOP SECTION - The LashPop Way */}
      <section className="py-14 md:py-24 bg-gradient-to-b from-ivory to-cream/30">

        {/* Hero Quote Block */}
        <div className="container max-w-4xl px-5 md:px-8 mb-14 md:mb-20">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs md:text-sm font-medium tracking-[0.2em] uppercase mb-4" style={{ color: '#cc947f' }}>
              The LashPop Way
            </p>
            <blockquote className="font-display text-2xl md:text-4xl font-medium leading-relaxed mb-6" style={{ color: '#3d3632' }}>
              &ldquo;When our team members thrive, our entire salon flourishes.&rdquo;
            </blockquote>
            <p className="text-charcoal/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              We prioritize the well-being and success of our team while cultivating a supportive, positive environment.
              Empowering our team to achieve their goals and live balanced lives translates to exceptional service and studio culture.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-charcoal/50">
              <span className="w-8 h-px bg-charcoal/20" />
              <span className="italic">Founded 2016 in Emily&apos;s living room</span>
              <span className="w-8 h-px bg-charcoal/20" />
            </div>
          </motion.div>
        </div>

        {/* Core Values Grid */}
        <div className="container max-w-6xl px-5 md:px-8 mb-14 md:mb-20">
          <motion.div
            className="text-center mb-8 md:mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-xl md:text-2xl font-medium" style={{ color: '#3d3632' }}>
              Our Core Values
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[
              {
                title: 'Results First',
                desc: 'We provide the best product, experience, and customer service in every session.',
                icon: Star
              },
              {
                title: 'Sweat the Details',
                desc: 'From lash application to studio design, we pay attention to every detail.',
                icon: Sparkles
              },
              {
                title: 'Clients Are Friends',
                desc: 'We treat our customers like friends — relatable, upbeat, and empathetic.',
                icon: Heart
              },
              {
                title: 'No Woman Left Behind',
                desc: 'We\'re a team that supports, helps, and encourages each other in the studio.',
                icon: Users
              },
              {
                title: 'Don\'t Bat an Eye(lash)',
                desc: 'Mishaps don\'t shake us. We handle any situation with confidence and poise.',
                icon: CheckCircle2
              },
              {
                title: 'Positive Vibes Only',
                desc: 'We actively cultivate uplifting energy. Vent sessions saved for team meetings.',
                icon: Sparkles
              },
              {
                title: 'Professional & Friendly',
                desc: 'Friendliness never negates professionalism. We bring both, always.',
                icon: Star
              },
              {
                title: 'Stand-Up Humans',
                desc: 'We live with integrity in and out of the studio.',
                icon: Heart
              },
              {
                title: 'Work-Life Rhythm',
                desc: 'Embrace the balance between hustle and relaxation.',
                icon: Clock
              }
            ].map((value, i) => (
              <motion.div
                key={value.title}
                className="group p-4 md:p-5 rounded-2xl bg-white/60 hover:bg-white transition-all duration-300 hover:shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-dusty-rose/15 flex items-center justify-center flex-shrink-0 group-hover:bg-dusty-rose/25 transition-colors">
                    <value.icon className="w-4 h-4" style={{ color: '#cc947f' }} />
                  </div>
                  <div>
                    <h3 className="font-display font-medium text-sm md:text-base text-charcoal mb-1">
                      {value.title}
                    </h3>
                    <p className="text-xs md:text-sm text-charcoal/60 leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The Experience Promise */}
        <div className="container max-w-4xl px-5 md:px-8">
          <motion.div
            className="relative rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/lashpop-images/culture/team-lounge.jpg"
                alt="LashPop studio"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-charcoal/70" />
            </div>

            {/* Content */}
            <div className="relative z-10 py-12 md:py-16 px-6 md:px-12 text-center">
              <p className="text-xs font-medium tracking-[0.2em] uppercase mb-4 text-white/60">
                The Client Experience
              </p>
              <blockquote className="font-display text-xl md:text-3xl font-medium leading-relaxed mb-6 text-white">
                &ldquo;Every client leaves feeling effortlessly beautiful — and with a much shorter morning routine.&rdquo;
              </blockquote>
              <p className="text-white/70 text-sm md:text-base max-w-xl mx-auto mb-8">
                We&apos;re committed to creating lasting impressions. A clean, organized, aesthetically pleasing space
                where clients feel empowered, inspired, confident, and beautiful.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
                {['Friendliness', 'Excellence', 'Patience', 'Professionalism', 'Positivity'].map((word) => (
                  <span
                    key={word}
                    className="text-xs md:text-sm font-medium tracking-wide text-white/80 px-3 py-1.5 rounded-full border border-white/20"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Final tagline */}
          <motion.p
            className="text-center mt-8 text-charcoal/50 text-sm italic"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            We really care — and we prove it by personally getting to know each of our clients.
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <FooterV2 />
    </div>
    </DevModeProvider>
  )
}
