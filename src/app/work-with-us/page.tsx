'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
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
  Menu,
  X
} from 'lucide-react'

// Types
type CareerPath = 'employee' | 'booth-renter' | 'training'

interface FormData {
  name: string
  email: string
  phone: string
  experience: string
  specialty: string[]
  preferredPath: CareerPath | ''
  message: string
  hearAboutUs: string
}

// Custom easing curve
const smoothEase = [0.23, 1, 0.32, 1] as const

// Section transition animation
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: smoothEase }
  }
}

// Stagger children animation
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: smoothEase }
  }
}

// Navigation items - links to home page sections
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
  {
    icon: Calendar,
    title: 'Flexible Scheduling',
    description: 'Build your own schedule around your life. Full-time, part-time, or somewhere in between.'
  },
  {
    icon: DollarSign,
    title: 'Competitive Pay',
    description: 'Commission-based compensation with guaranteed minimums and performance bonuses.'
  },
  {
    icon: GraduationCap,
    title: 'Ongoing Training',
    description: 'Continuous education, certifications, and skill development at no cost to you.'
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'We care about you. Access to wellness programs and work-life balance support.'
  },
  {
    icon: Users,
    title: 'Team Community',
    description: 'Join a supportive team that celebrates wins together and lifts each other up.'
  },
  {
    icon: Star,
    title: 'Career Growth',
    description: 'Clear pathways to advance your career, from junior artist to senior specialist.'
  }
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
  'Lash Extensions',
  'Lash Lifts',
  'Brow Lamination',
  'Microblading',
  'Permanent Makeup',
  'Facials/Skincare',
  'Waxing',
  'Nails',
  'Injectables',
  'Other'
]

export default function WorkWithUsPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    experience: '',
    specialty: [],
    preferredPath: '',
    message: '',
    hearAboutUs: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '')
    if (phoneNumber.length < 4) return phoneNumber
    if (phoneNumber.length < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialty: prev.specialty.includes(specialty)
        ? prev.specialty.filter(s => s !== specialty)
        : [...prev.specialty, specialty]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)

    // Reset after showing success
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        experience: '',
        specialty: [],
        preferredPath: '',
        message: '',
        hearAboutUs: ''
      })
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Desktop Navigation - matches main landing page */}
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
            {/* Logo */}
            <Link
              href="/"
              className="relative flex items-center transition-all duration-300 h-8"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2"
              >
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

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`caption hover:opacity-80 transition-colors duration-300 leading-none flex items-center h-8 ${
                    (item as any).active ? 'font-medium' : ''
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
          isScrolled || isMobileMenuOpen
            ? 'bg-ivory/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-5 flex items-center justify-between" style={{ height: '60px' }}>
          {/* Logo */}
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

          {/* Right side: Book Now + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/#services"
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-white text-[10px] font-sans font-semibold tracking-wide uppercase active:opacity-80 transition-all"
              style={{ backgroundColor: '#b14e33' }}
            >
              Book
            </Link>

            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex-shrink-0 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-all duration-150"
              aria-label="Menu"
            >
              <motion.span
                animate={{
                  rotate: isMobileMenuOpen ? 45 : 0,
                  y: isMobileMenuOpen ? 6 : 0
                }}
                className="block w-5 h-0.5"
                style={{ backgroundColor: '#b14e33' }}
              />
              <motion.span
                animate={{
                  opacity: isMobileMenuOpen ? 0 : 1
                }}
                className="block w-5 h-0.5"
                style={{ backgroundColor: '#b14e33' }}
              />
              <motion.span
                animate={{
                  rotate: isMobileMenuOpen ? -45 : 0,
                  y: isMobileMenuOpen ? -6 : 0
                }}
                className="block w-5 h-0.5"
                style={{ backgroundColor: '#b14e33' }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-cream z-30 md:hidden"
          >
            <div className="flex flex-col justify-center items-center h-full space-y-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-2xl font-light ${(item as any).active ? 'text-terracotta' : 'text-dune'}`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/#services"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn btn-primary mt-8"
                >
                  Book Now
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 px-6 md:px-8 bg-gradient-to-b from-cream/50 to-ivory overflow-hidden">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Text Content */}
            <motion.div
              className="text-center md:text-left order-2 md:order-1"
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
            >
              <p
                className="text-sm font-medium tracking-[0.2em] uppercase mb-4"
                style={{ color: '#ac4d3c' }}
              >
                Join Our Team
              </p>
              <h1
                className="font-display text-3xl md:text-5xl font-medium mb-6"
                style={{ color: '#3d3632' }}
              >
                Work With Us
              </h1>
              <p
                className="text-lg md:text-xl font-light leading-relaxed mb-8"
                style={{ color: '#3d3632' }}
              >
                Whether you&apos;re looking to grow as an employee, build your own business as a booth renter,
                or master new skills through our training programs—there&apos;s a place for you at LashPop.
              </p>
              <div className="w-16 h-px bg-terracotta/30 mx-auto md:mx-0" />
            </motion.div>

            {/* Hero Image */}
            <motion.div
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: smoothEase, delay: 0.2 }}
            >
              <div className="relative">
                {/* Decorative arch frame */}
                <div className="absolute -inset-4 md:-inset-6 rounded-t-full rounded-b-3xl bg-gradient-to-br from-dusty-rose/20 to-peach/30" />
                <div className="relative rounded-t-full rounded-b-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/lashpop-images/culture/team-hallway.jpeg"
                    alt="LashPop team members welcoming you from their studio rooms"
                    width={600}
                    height={750}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Career Paths Overview */}
      <section className="py-16 md:py-20 px-6 md:px-8 bg-ivory">
        <div className="container max-w-5xl">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <h2
              className="font-display text-2xl md:text-3xl font-medium mb-4"
              style={{ color: '#ac4d3c' }}
            >
              Choose Your Path
            </h2>
            <p className="text-charcoal/80 max-w-xl mx-auto">
              Three ways to be part of the LashPop family, each designed to match where you are in your career journey.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Employee Path Card */}
            <motion.button
              variants={staggerItem}
              onClick={() => setActiveSection(activeSection === 'employee' ? null : 'employee')}
              className={`text-left p-6 rounded-2xl transition-all duration-300 border-2 ${
                activeSection === 'employee'
                  ? 'border-rust bg-white shadow-lg'
                  : 'border-sage/20 bg-white/50 hover:border-dusty-rose/50 hover:bg-white'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-dusty-rose/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" style={{ color: '#ac4d3c' }} />
              </div>
              <h3 className="font-display text-xl font-medium text-charcoal mb-2">
                Become an Employee
              </h3>
              <p className="text-sm text-charcoal/70 mb-3">
                Join our team with full support, training, and benefits. Perfect for those who want structure and growth.
              </p>
              <span
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: '#ac4d3c' }}
              >
                Learn more
                <ChevronDown className={`w-4 h-4 transition-transform ${activeSection === 'employee' ? 'rotate-180' : ''}`} />
              </span>
            </motion.button>

            {/* Booth Rental Card */}
            <motion.button
              variants={staggerItem}
              onClick={() => setActiveSection(activeSection === 'booth' ? null : 'booth')}
              className={`text-left p-6 rounded-2xl transition-all duration-300 border-2 ${
                activeSection === 'booth'
                  ? 'border-rust bg-white shadow-lg'
                  : 'border-sage/20 bg-white/50 hover:border-dusty-rose/50 hover:bg-white'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-dusty-rose/20 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" style={{ color: '#ac4d3c' }} />
              </div>
              <h3 className="font-display text-xl font-medium text-charcoal mb-2">
                Booth Rental
              </h3>
              <p className="text-sm text-charcoal/70 mb-3">
                Run your own business in our beautiful space. Independence with community support.
              </p>
              <span
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: '#ac4d3c' }}
              >
                Learn more
                <ChevronDown className={`w-4 h-4 transition-transform ${activeSection === 'booth' ? 'rotate-180' : ''}`} />
              </span>
            </motion.button>

            {/* Training Card */}
            <motion.button
              variants={staggerItem}
              onClick={() => setActiveSection(activeSection === 'training' ? null : 'training')}
              className={`text-left p-6 rounded-2xl transition-all duration-300 border-2 ${
                activeSection === 'training'
                  ? 'border-rust bg-white shadow-lg'
                  : 'border-sage/20 bg-white/50 hover:border-dusty-rose/50 hover:bg-white'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-dusty-rose/20 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6" style={{ color: '#ac4d3c' }} />
              </div>
              <h3 className="font-display text-xl font-medium text-charcoal mb-2">
                LashPop Pro Training
              </h3>
              <p className="text-sm text-charcoal/70 mb-3">
                Master the award-winning LashPop techniques. Comprehensive training program coming soon.
              </p>
              <span
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: '#ac4d3c' }}
              >
                Learn more
                <ChevronDown className={`w-4 h-4 transition-transform ${activeSection === 'training' ? 'rotate-180' : ''}`} />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Employee Path Section */}
      <AnimatePresence>
        {activeSection === 'employee' && (
          <motion.section
            id="employee-path"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: smoothEase }}
            className="overflow-hidden bg-white"
          >
            <div className="py-16 md:py-20 px-6 md:px-8">
              <div className="container max-w-5xl">
                <div className="text-center mb-12">
                  <p
                    className="text-sm font-medium tracking-[0.15em] uppercase mb-3"
                    style={{ color: '#ac4d3c' }}
                  >
                    Employee Path
                  </p>
                  <h2
                    className="font-display text-2xl md:text-3xl font-medium mb-4"
                    style={{ color: '#3d3632' }}
                  >
                    What Being a LashPop Employee Means
                  </h2>
                  <p className="text-charcoal/80 max-w-2xl mx-auto">
                    More than just a job—it&apos;s a career with support, growth, and a team that feels like family.
                    We invest in you so you can focus on what you do best.
                  </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {employeeBenefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 rounded-2xl bg-ivory/50 border border-sage/10"
                    >
                      <benefit.icon
                        className="w-8 h-8 mb-4"
                        style={{ color: '#ac4d3c' }}
                      />
                      <h3 className="font-display text-lg font-medium text-charcoal mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-charcoal/70">
                        {benefit.description}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* How to Join */}
                <div className="bg-gradient-to-br from-cream/50 to-peach/30 rounded-2xl overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-8 md:p-10">
                      <h3
                        className="font-display text-xl font-medium mb-6"
                        style={{ color: '#3d3632' }}
                      >
                        How to Join
                      </h3>
                      <div className="space-y-4">
                        {[
                          { step: '01', text: 'Submit your application below' },
                          { step: '02', text: 'Meet with our team for a vibe check' },
                          { step: '03', text: 'Complete a skills assessment' },
                          { step: '04', text: 'Welcome to the family!' }
                        ].map((item) => (
                          <div key={item.step} className="flex items-center gap-4">
                            <div
                              className="text-2xl font-display font-light w-12"
                              style={{ color: '#ac4d3c' }}
                            >
                              {item.step}
                            </div>
                            <p className="text-sm text-charcoal/80">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <Image
                        src="/lashpop-images/culture/team-front-desk.jpeg"
                        alt="LashPop team at the front desk"
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
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
            id="booth-rental"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: smoothEase }}
            className="overflow-hidden bg-white"
          >
            <div className="py-16 md:py-20 px-6 md:px-8">
              <div className="container max-w-5xl">
                <div className="text-center mb-12">
                  <p
                    className="text-sm font-medium tracking-[0.15em] uppercase mb-3"
                    style={{ color: '#ac4d3c' }}
                  >
                    Booth Rental
                  </p>
                  <h2
                    className="font-display text-2xl md:text-3xl font-medium mb-4"
                    style={{ color: '#3d3632' }}
                  >
                    Your Business, Our Beautiful Space
                  </h2>
                  <p className="text-charcoal/80 max-w-2xl mx-auto">
                    Independence without isolation. Rent a station or room and be part of a thriving
                    community while running your own show.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {/* Rental Options */}
                  <div className="space-y-6">
                    <h3
                      className="font-display text-xl font-medium"
                      style={{ color: '#3d3632' }}
                    >
                      Rental Options
                    </h3>

                    <div className="p-6 rounded-2xl bg-ivory/50 border border-sage/10">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-display text-lg font-medium text-charcoal">
                          Station Rental
                        </h4>
                        <span
                          className="text-lg font-medium"
                          style={{ color: '#ac4d3c' }}
                        >
                          Starting at $600/mo
                        </span>
                      </div>
                      <p className="text-sm text-charcoal/70 mb-3">
                        Semi-private workspace in our shared studio. Perfect for lash artists,
                        brow specialists, and estheticians.
                      </p>
                      <ul className="space-y-2">
                        {['Dedicated workspace', 'Shared amenities', 'Flexible hours'].map(item => (
                          <li key={item} className="flex items-center gap-2 text-sm text-charcoal/80">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 rounded-2xl bg-ivory/50 border border-sage/10">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-display text-lg font-medium text-charcoal">
                          Private Room
                        </h4>
                        <span
                          className="text-lg font-medium"
                          style={{ color: '#ac4d3c' }}
                        >
                          Starting at $1,200/mo
                        </span>
                      </div>
                      <p className="text-sm text-charcoal/70 mb-3">
                        Your own private space within LashPop. Ideal for permanent makeup artists,
                        injectables, or anyone wanting privacy.
                      </p>
                      <ul className="space-y-2">
                        {['Private, lockable room', 'Personal setup freedom', 'Premium amenities'].map(item => (
                          <li key={item} className="flex items-center gap-2 text-sm text-charcoal/80">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Amenities & Photos */}
                  <div className="space-y-6">
                    <h3
                      className="font-display text-xl font-medium"
                      style={{ color: '#3d3632' }}
                    >
                      Included Amenities
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {boothAmenities.map((amenity) => (
                        <div
                          key={amenity.text}
                          className="flex items-center gap-3 p-4 rounded-xl bg-ivory/50 border border-sage/10"
                        >
                          <amenity.icon
                            className="w-5 h-5 flex-shrink-0"
                            style={{ color: '#ac4d3c' }}
                          />
                          <span className="text-sm text-charcoal/80">{amenity.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Brand Standards Note */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-cream/50 to-peach/30">
                      <h4
                        className="font-display font-medium mb-2"
                        style={{ color: '#3d3632' }}
                      >
                        Brand Standards
                      </h4>
                      <p className="text-sm text-charcoal/70">
                        While you run your own business, being part of LashPop means maintaining
                        our commitment to quality, cleanliness, and exceptional client experience.
                        We&apos;ll share our standards during your consultation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Studio Photo Gallery */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="aspect-square rounded-2xl overflow-hidden">
                    <Image
                      src="/lashpop-images/culture/team-front-desk.jpeg"
                      alt="LashPop front desk"
                      width={300}
                      height={300}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden">
                    <Image
                      src="/lashpop-images/culture/team-lounge.jpg"
                      alt="LashPop team lounge"
                      width={300}
                      height={300}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden">
                    <Image
                      src="/lashpop-images/culture/team-working.jpg"
                      alt="LashPop team collaboration"
                      width={300}
                      height={300}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden">
                    <Image
                      src="/lashpop-images/culture/team-reception.jpg"
                      alt="LashPop reception area"
                      width={300}
                      height={300}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* LashPop Pro Training Section */}
      <AnimatePresence>
        {activeSection === 'training' && (
          <motion.section
            id="lashpop-pro"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: smoothEase }}
            className="overflow-hidden bg-white"
          >
            <div className="py-16 md:py-20 px-6 md:px-8">
              <div className="container max-w-4xl">
                {/* Coming Soon Badge */}
                <div className="flex justify-center mb-6">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rust/10 text-rust text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Coming Soon
                  </span>
                </div>

                <div className="text-center mb-12">
                  <h2
                    className="font-display text-2xl md:text-4xl font-medium mb-4"
                    style={{ color: '#3d3632' }}
                  >
                    LashPop Pro
                  </h2>
                  <p
                    className="text-lg italic mb-6"
                    style={{ color: '#cc947f' }}
                  >
                    Master the award-winning LashPop way
                  </p>
                  <p className="text-charcoal/80 max-w-2xl mx-auto">
                    We&apos;re developing a comprehensive training program to share the techniques,
                    artistry, and business knowledge that built LashPop Studios. Be the first to know
                    when enrollment opens.
                  </p>
                </div>

                {/* What to Expect */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="p-6 rounded-2xl bg-ivory/50 border border-sage/10">
                    <h3
                      className="font-display text-lg font-medium mb-4"
                      style={{ color: '#3d3632' }}
                    >
                      What You&apos;ll Learn
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'Signature LashPop lash techniques',
                        'Client consultation mastery',
                        'Business & marketing fundamentals',
                        'Building a loyal clientele',
                        'Advanced styling methods'
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3 text-charcoal/80">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 rounded-2xl bg-ivory/50 border border-sage/10">
                    <h3
                      className="font-display text-lg font-medium mb-4"
                      style={{ color: '#3d3632' }}
                    >
                      What&apos;s Included
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'Hands-on training with our expert artists',
                        'Professional starter kit',
                        'Certification upon completion',
                        'Ongoing mentorship access',
                        'Exclusive alumni community'
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3 text-charcoal/80">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Waitlist Signup */}
                <div className="bg-gradient-to-br from-cream to-peach/30 rounded-2xl p-8 md:p-10 text-center">
                  <h3
                    className="font-display text-xl font-medium mb-3"
                    style={{ color: '#3d3632' }}
                  >
                    Join the Waitlist
                  </h3>
                  <p className="text-charcoal/70 mb-6 max-w-md mx-auto">
                    Be first in line for our inaugural training cohort. Limited spots available.
                  </p>
                  <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="flex-1 px-4 py-3 rounded-full border border-sage/30 bg-white focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-full font-medium text-sm uppercase tracking-wider transition-all duration-300"
                      style={{
                        backgroundColor: '#ac4d3c',
                        color: 'rgb(240, 224, 219)'
                      }}
                    >
                      Notify Me
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Why Work With Us / Culture Section */}
      <section className="py-16 md:py-20 px-6 md:px-8 bg-gradient-to-b from-ivory to-cream/30">
        <motion.div
          className="container max-w-6xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="text-center mb-12">
            <h2
              className="font-display text-2xl md:text-3xl font-medium mb-4"
              style={{ color: '#ac4d3c' }}
            >
              Why LashPop?
            </h2>
            <p className="text-charcoal/80 max-w-2xl mx-auto">
              We&apos;re building something special here. A place where talent thrives,
              creativity flows, and everyone supports each other&apos;s success.
            </p>
          </div>

          {/* Feature Image Row */}
          <div className="mb-12">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                className="relative rounded-3xl overflow-hidden shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: smoothEase }}
              >
                <Image
                  src="/lashpop-images/culture/team-working.jpg"
                  alt="LashPop team collaborating together"
                  width={600}
                  height={400}
                  className="w-full h-64 md:h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-display text-lg">A team that grows together</p>
                </div>
              </motion.div>
              <motion.div
                className="relative rounded-3xl overflow-hidden shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: smoothEase, delay: 0.1 }}
              >
                <Image
                  src="/lashpop-images/culture/team-lounge.jpg"
                  alt="LashPop team in the lounge"
                  width={600}
                  height={400}
                  className="w-full h-64 md:h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-display text-lg">Community that feels like family</p>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6" style={{ color: '#ac4d3c' }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-charcoal mb-2">
                    Real Community
                  </h3>
                  <p className="text-charcoal/70">
                    Not just coworkers—a family. We celebrate wins, support through challenges,
                    and genuinely enjoy spending time together.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6" style={{ color: '#ac4d3c' }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-charcoal mb-2">
                    Cross-Promotion
                  </h3>
                  <p className="text-charcoal/70">
                    When one of us wins, we all win. Our team actively refers clients to each other
                    based on specialties and availability.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6" style={{ color: '#ac4d3c' }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-charcoal mb-2">
                    Fun Environment
                  </h3>
                  <p className="text-charcoal/70">
                    Good music, great energy, and a space that makes you actually want to come to work.
                    Life&apos;s too short for boring studios.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6" style={{ color: '#ac4d3c' }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-charcoal mb-2">
                    Brand Power
                  </h3>
                  <p className="text-charcoal/70">
                    Benefit from LashPop&apos;s established reputation, marketing, and client base.
                    Focus on your craft while we handle the rest.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6" style={{ color: '#ac4d3c' }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-charcoal mb-2">
                    Continuous Learning
                  </h3>
                  <p className="text-charcoal/70">
                    Regular training sessions, product education, and skill-sharing.
                    We&apos;re always growing, always improving.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6" style={{ color: '#ac4d3c' }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-charcoal mb-2">
                    Business Support
                  </h3>
                  <p className="text-charcoal/70">
                    Whether you&apos;re an employee or booth renter, get access to business guidance,
                    social media support, and growth strategies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Application Form Section */}
      <section id="apply" className="py-16 md:py-20 px-6 md:px-8 bg-white">
        <motion.div
          className="container max-w-2xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="text-center mb-10">
            <h2
              className="font-display text-2xl md:text-3xl font-medium mb-4"
              style={{ color: '#ac4d3c' }}
            >
              Ready to Join?
            </h2>
            <p className="text-charcoal/80">
              Tell us about yourself and which path interests you most. We&apos;ll be in touch soon.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-display text-xl font-medium text-charcoal mb-2">
                  Application Received!
                </h3>
                <p className="text-charcoal/70">
                  Thanks for your interest in LashPop. We&apos;ll review your application and reach out soon.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-sage/30 bg-ivory/50 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all"
                    placeholder="Your name"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-sage/30 bg-ivory/50 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-sage/30 bg-ivory/50 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {/* Preferred Path */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Which path interests you most? *
                  </label>
                  <select
                    name="preferredPath"
                    value={formData.preferredPath}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-sage/30 bg-ivory/50 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="">Select a path...</option>
                    <option value="employee">Employee</option>
                    <option value="booth-renter">Booth Renter</option>
                    <option value="training">LashPop Pro Training (Waitlist)</option>
                  </select>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Years of Experience
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-sage/30 bg-ivory/50 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="">Select experience level...</option>
                    <option value="new">New to the industry</option>
                    <option value="1-2">1-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5+">5+ years</option>
                  </select>
                </div>

                {/* Specialties */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Specialties (select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((specialty) => (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => handleSpecialtyToggle(specialty)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          formData.specialty.includes(specialty)
                            ? 'bg-rust text-cream'
                            : 'bg-ivory border border-sage/30 text-charcoal/80 hover:border-dusty-rose'
                        }`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Tell us about yourself
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-sage/30 bg-ivory/50 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all resize-none"
                    placeholder="Share your story, goals, or anything else you'd like us to know..."
                  />
                </div>

                {/* How did you hear about us */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    How did you hear about us?
                  </label>
                  <input
                    type="text"
                    name="hearAboutUs"
                    value={formData.hearAboutUs}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-sage/30 bg-ivory/50 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all"
                    placeholder="Instagram, referral, Google, etc."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full font-medium text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: '#ac4d3c',
                    color: 'rgb(240, 224, 219)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Application
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-8 bg-ivory border-t border-sage/10">
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3
                className="font-display text-lg font-medium mb-1"
                style={{ color: '#ac4d3c' }}
              >
                LashPop Studios
              </h3>
              <p className="text-sm text-charcoal/60">
                429 S Coast Hwy, Oceanside, CA 92054
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="tel:+17602120448"
                className="text-sm text-charcoal/80 hover:text-terracotta transition-colors"
              >
                (760) 212-0448
              </a>
              <a
                href="mailto:lashpopstudios@gmail.com"
                className="text-sm text-charcoal/80 hover:text-terracotta transition-colors"
              >
                lashpopstudios@gmail.com
              </a>
              <a
                href="https://instagram.com/lashpopstudios"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center hover:bg-terracotta hover:text-white transition-all"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-sage/10 text-center">
            <p className="text-xs text-charcoal/50">
              © 2025 LashPop Studios. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
