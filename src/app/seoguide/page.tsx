'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { usePhoneAuth, phoneNumberAuth } from '@/lib/auth-client'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/phone-utils'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Database,
  FileCode2,
  Settings,
  Users,
  Star,
  MessageSquare,
  HelpCircle,
  Search,
  Globe,
  Bot,
  Shield,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'

// Smooth easing
const smoothEase = [0.23, 1, 0.32, 1] as const

// Phone Login Component
function PhoneLogin({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!validatePhoneNumber(phone)) {
        throw new Error('Please enter a valid phone number')
      }
      await phoneNumberAuth.sendOtp({ phoneNumber: phone })
      setStep('verify')
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await phoneNumberAuth.verifyOtp({ phoneNumber: phone, otp: code })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-sage/30 bg-white focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ivory via-cream/50 to-ivory p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/lashpop-images/branding/logo-terracotta.png"
              alt="LashPop Studios"
              width={140}
              height={47}
              className="h-10 w-auto"
            />
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-medium text-charcoal mb-2">
            SEO & AI Visibility Guide
          </h1>
          <p className="text-charcoal/60 text-sm">
            Sign in to access your documentation
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-sage/10">
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  className={inputClass}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !phone}
                className="w-full py-3 rounded-full font-medium text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#ac4d3c', color: 'rgb(240, 224, 219)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Code'
                )}
              </button>

              <p className="text-xs text-charcoal/50 text-center">
                We&apos;ll send a verification code to your phone
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-sm text-charcoal/60 hover:text-charcoal flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Change number
              </button>

              <p className="text-sm text-charcoal/70 mb-4">
                Enter the 6-digit code sent to {phone}
              </p>

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className={`${inputClass} text-center text-2xl tracking-widest`}
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 rounded-full font-medium text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#ac4d3c', color: 'rgb(240, 224, 219)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-charcoal/40">
          This guide is for authorized LashPop team members only
        </p>
      </motion.div>
    </div>
  )
}

// Collapsible Section Component
function Section({
  id,
  icon: Icon,
  title,
  children,
  defaultOpen = false
}: {
  id: string
  icon: any
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div id={id} className="border border-sage/20 rounded-2xl overflow-hidden bg-white/50 scroll-mt-24">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-ivory/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rust/10 flex items-center justify-center">
            <Icon className="w-5 h-5" style={{ color: '#ac4d3c' }} />
          </div>
          <h2 className="font-display text-lg font-medium text-charcoal">{title}</h2>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-charcoal/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: smoothEase }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Code Block Component
function CodeBlock({ children, copyable = true }: { children: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-charcoal/5 rounded-xl p-4 text-xs overflow-x-auto font-mono text-charcoal/80">
        {children}
      </pre>
      {copyable && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-charcoal/50" />
          )}
        </button>
      )}
    </div>
  )
}

// Table Component
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sage/20">
            {headers.map((header, i) => (
              <th key={i} className="text-left py-2 px-3 font-medium text-charcoal">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-sage/10 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-3 text-charcoal/70">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Checklist Item
function CheckItem({ children, checked = false }: { children: React.ReactNode; checked?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${
        checked ? 'bg-green-100 border-green-300' : 'border-sage/30'
      }`}>
        {checked && <Check className="w-3 h-3 text-green-600" />}
      </div>
      <span className={`text-sm ${checked ? 'text-charcoal/50 line-through' : 'text-charcoal/70'}`}>
        {children}
      </span>
    </div>
  )
}

// Main Guide Content
function GuideContent() {
  const navItems = [
    { id: 'what-we-built', icon: Database, label: 'What We Built' },
    { id: 'admin-panels', icon: Settings, label: 'Admin Panels' },
    { id: 'content-recs', icon: FileCode2, label: 'Content Recommendations' },
    { id: 'action-items', icon: CheckCircle2, label: 'Action Items' },
  ]

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-sage/10">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/lashpop-images/branding/logo-terracotta.png"
              alt="LashPop Studios"
              width={100}
              height={33}
              className="h-7 w-auto"
            />
            <span className="text-charcoal/30">|</span>
            <span className="text-sm font-medium text-charcoal/70">SEO Guide</span>
          </Link>
          <Link
            href="/admin/website/seo"
            className="text-xs font-medium px-4 py-2 rounded-full transition-colors"
            style={{ backgroundColor: '#ac4d3c', color: 'rgb(240, 224, 219)' }}
          >
            Open SEO Admin
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: '#ac4d3c' }}>
            Documentation
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-medium text-charcoal mb-4">
            SEO & AI Visibility Guide
          </h1>
          <p className="text-charcoal/60 max-w-2xl">
            Complete documentation of your SEO infrastructure, admin panel usage, and content recommendations
            to maximize visibility in Google, Maps, and AI search engines.
          </p>
        </motion.div>

        {/* Quick Nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sage/20 text-sm text-charcoal/70 hover:border-rust/30 hover:text-charcoal transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </div>

        {/* Content Sections */}
        <div className="space-y-4">
          {/* Section 1: What We Built */}
          <Section id="what-we-built" icon={Database} title="What We Built" defaultOpen={true}>
            <div className="space-y-6">
              {/* Structured Data */}
              <div>
                <h3 className="font-medium text-charcoal mb-3 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4" style={{ color: '#ac4d3c' }} />
                  Structured Data (JSON-LD Schema)
                </h3>
                <p className="text-sm text-charcoal/70 mb-4">
                  Schema.org structured data helps Google and AI systems understand your business.
                  This data appears invisibly in your page source and powers rich search results.
                </p>
                <Table
                  headers={['Schema Type', 'Purpose', 'Data Source']}
                  rows={[
                    ['LocalBusinessSchema', 'Business info, location, credentials, employees', 'Database + SEO Admin'],
                    ['ReviewSchema', 'Individual review structured data', 'Reviews database'],
                    ['ServicesSchema', 'Service offerings with pricing', 'Services database'],
                    ['FAQSchema', 'FAQ rich results', 'FAQ database'],
                    ['WebSiteSchema', 'Site search and organization info', 'SEO Admin settings'],
                  ]}
                />
              </div>

              {/* Key Features */}
              <div>
                <h3 className="font-medium text-charcoal mb-3">Key Features</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { icon: Shield, title: 'Business Credentials', desc: 'Licenses, certifications, and awards appear in structured data even if not displayed publicly' },
                    { icon: Users, title: 'Team Member Credentials', desc: 'Each artist\'s certifications appear in the employee schema for E-E-A-T signals' },
                    { icon: Star, title: 'Review Schema Control', desc: 'Reviews can be included in structured data for crawlers even if hidden from the website' },
                    { icon: Search, title: 'Aggregate Rating', desc: 'Automatically calculated from all reviews with ratings' },
                  ].map((feature) => (
                    <div key={feature.title} className="flex gap-3 p-3 rounded-xl bg-ivory/50">
                      <feature.icon className="w-5 h-5 flex-shrink-0" style={{ color: '#ac4d3c' }} />
                      <div>
                        <h4 className="font-medium text-sm text-charcoal">{feature.title}</h4>
                        <p className="text-xs text-charcoal/60">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Files */}
              <div>
                <h3 className="font-medium text-charcoal mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4" style={{ color: '#ac4d3c' }} />
                  AI Discoverability Files
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-ivory/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-charcoal">llms.txt</h4>
                      <a href="/llms.txt" target="_blank" className="text-xs text-rust hover:underline flex items-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-charcoal/60">
                      Machine-readable file for AI assistants (ChatGPT, Claude, Perplexity). Contains business overview,
                      services, location, team, FAQs, and booking info. Intro customizable from SEO admin.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-ivory/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-charcoal">robots.txt</h4>
                      <a href="/robots.txt" target="_blank" className="text-xs text-rust hover:underline flex items-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-charcoal/60">
                      Configured to allow all major crawlers: Googlebot, Bingbot, GPTBot, Claude-Web, PerplexityBot.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-ivory/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-charcoal">sitemap.xml</h4>
                      <a href="/sitemap.xml" target="_blank" className="text-xs text-rust hover:underline flex items-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-charcoal/60">
                      Dynamic XML sitemap including homepage, all service pages, and careers page with proper priorities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Database Schema */}
              <div>
                <h3 className="font-medium text-charcoal mb-3">Database Schema Additions</h3>
                <CodeBlock>{`team_members.credentials (JSONB)
├── type: certification | license | training | award | education
├── name: "NovaLash Certified Volume Specialist"
├── issuer: "NovaLash"
├── dateIssued: "2022-03-15"
├── expirationDate: (optional)
├── licenseNumber: (optional)
└── url: (optional verification link)

reviews.include_in_schema (boolean)
├── true = Include in JSON-LD for search engines
└── false = Exclude from structured data

reviews.show_on_website (boolean)
├── true = Display publicly on website
└── false = Hide from public view`}</CodeBlock>
              </div>
            </div>
          </Section>

          {/* Section 2: Admin Panels */}
          <Section id="admin-panels" icon={Settings} title="Admin Panel Guide">
            <div className="space-y-6">
              {/* SEO Admin */}
              <div>
                <h3 className="font-medium text-charcoal mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" style={{ color: '#ac4d3c' }} />
                  SEO Admin Panel
                </h3>
                <p className="text-xs text-charcoal/50 mb-3">Location: Admin → Website → SEO</p>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-sage/20">
                    <h4 className="font-medium text-sm text-charcoal mb-2">Business Information</h4>
                    <Table
                      headers={['Field', 'What It Does']}
                      rows={[
                        ['Business Name', 'Appears in all schemas'],
                        ['Business Description', 'Used in meta tags and schemas'],
                        ['Business Type', 'Schema.org type (BeautySalon)'],
                        ['Phone / Email', 'Contact info in schema'],
                      ]}
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-sage/20">
                    <h4 className="font-medium text-sm text-charcoal mb-2">Business Credentials Section (NEW)</h4>
                    <p className="text-xs text-charcoal/60 mb-3">
                      <strong>For E-E-A-T signals that appear in structured data but NOT on the public website.</strong>
                    </p>
                    <div className="space-y-2 text-xs text-charcoal/70">
                      <p>Add credentials like:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Licenses:</strong> &quot;Licensed Cosmetology Establishment&quot;</li>
                        <li><strong>Certifications:</strong> &quot;Borboleta Platinum Partner Studio&quot;</li>
                        <li><strong>Awards:</strong> &quot;SD Reader Best of 2024&quot;</li>
                        <li><strong>Memberships:</strong> &quot;Associated Skin Care Professionals Member&quot;</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-sage/20">
                    <h4 className="font-medium text-sm text-charcoal mb-2">llms.txt Introduction</h4>
                    <p className="text-xs text-charcoal/60">
                      Customize the opening paragraph of your llms.txt file. This is the first thing AI assistants read.
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Admin */}
              <div>
                <h3 className="font-medium text-charcoal mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: '#ac4d3c' }} />
                  Team Admin Panel
                </h3>
                <p className="text-xs text-charcoal/50 mb-3">Location: Admin → Website → Team</p>

                <div className="p-4 rounded-xl border border-sage/20">
                  <h4 className="font-medium text-sm text-charcoal mb-2">Team Member Credentials</h4>
                  <p className="text-xs text-charcoal/60 mb-3">
                    Click any team member to expand and add their professional qualifications.
                  </p>
                  <CodeBlock>{`Example Credentials to Add:

Type: License
Name: Licensed Esthetician
Issuer: California Board of Barbering and Cosmetology
License Number: [number]

Type: Certification
Name: NovaLash Certified Volume Specialist
Issuer: NovaLash
Date Issued: 2022-03-15

Type: Award
Name: Best Lash Artist - SD Reader Best of 2024
Issuer: San Diego Reader`}</CodeBlock>
                </div>
              </div>

              {/* Reviews Admin */}
              <div>
                <h3 className="font-medium text-charcoal mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" style={{ color: '#ac4d3c' }} />
                  Reviews Admin Panel
                </h3>
                <p className="text-xs text-charcoal/50 mb-3">Location: Admin → Website → Reviews</p>

                <div className="p-4 rounded-xl border border-sage/20">
                  <h4 className="font-medium text-sm text-charcoal mb-3">Review Visibility Controls</h4>
                  <Table
                    headers={['Setting', 'What It Controls']}
                    rows={[
                      ['Show on Website', 'Whether review appears publicly on your website'],
                      ['Include in Schema', 'Whether review appears in JSON-LD for search engines'],
                    ]}
                  />
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>Pro tip:</strong> You can include reviews in schema even if hidden from the website.
                      This is legitimate SEO - search engines see your full review count while visitors see your curated best reviews.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Admin */}
              <div>
                <h3 className="font-medium text-charcoal mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" style={{ color: '#ac4d3c' }} />
                  FAQ Admin Panel
                </h3>
                <p className="text-xs text-charcoal/50 mb-3">Location: Admin → Website → FAQs</p>

                <div className="p-4 rounded-xl border border-sage/20">
                  <p className="text-xs text-charcoal/60 mb-2">
                    FAQs power the public FAQ section, Google FAQ rich results, and llms.txt content.
                  </p>
                  <p className="text-xs text-charcoal/70">
                    <strong>Best practices:</strong> Use actual questions people ask, put direct answer first,
                    include keywords naturally. 8-15 FAQs is optimal.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Section 3: Content Recommendations */}
          <Section id="content-recs" icon={FileCode2} title="Content Recommendations">
            <div className="space-y-6">
              {/* E-E-A-T */}
              <div>
                <h3 className="font-medium text-charcoal mb-3">E-E-A-T Content to Gather</h3>
                <p className="text-xs text-charcoal/60 mb-4">
                  Google and AI systems prioritize businesses that demonstrate Experience, Expertise, Authoritativeness, and Trustworthiness.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-ivory/50">
                    <h4 className="font-medium text-sm text-charcoal mb-2">Team Credentials</h4>
                    <div className="space-y-1">
                      <CheckItem>State/board license numbers</CheckItem>
                      <CheckItem>Brand certifications (NovaLash, Borboleta, etc.)</CheckItem>
                      <CheckItem>Years of experience</CheckItem>
                      <CheckItem>Specialized training courses</CheckItem>
                      <CheckItem>Competition wins or awards</CheckItem>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-ivory/50">
                    <h4 className="font-medium text-sm text-charcoal mb-2">Business Credentials</h4>
                    <div className="space-y-1">
                      <CheckItem>Business/establishment license</CheckItem>
                      <CheckItem>Brand partnerships</CheckItem>
                      <CheckItem>Industry association memberships</CheckItem>
                      <CheckItem>BBB accreditation</CheckItem>
                      <CheckItem>Awards (SD Reader, local awards)</CheckItem>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="font-medium text-charcoal mb-3">Statistics & Data Points</h3>
                <p className="text-xs text-charcoal/60 mb-4">
                  AI systems cite specific numbers. Gather these metrics:
                </p>
                <Table
                  headers={['Metric', 'Example', 'Action']}
                  rows={[
                    ['Clients served', '"Over 5,000 happy clients"', 'Count total'],
                    ['Average rating', '"4.9/5 from 500+ reviews"', 'Calculate'],
                    ['Experience', '"50+ combined years"', 'Sum team'],
                    ['Services', '"40+ service variations"', 'Count'],
                    ['Retention', '"85% client return rate"', 'Calculate'],
                  ]}
                />
              </div>

              {/* Expert Quotes */}
              <div>
                <h3 className="font-medium text-charcoal mb-3">Expert Quotes</h3>
                <p className="text-xs text-charcoal/60 mb-4">
                  AI systems heavily cite attributed quotes. Add to service pages:
                </p>
                <CodeBlock>{`From Artists:
"The key to natural-looking volume lashes is understanding
each client's unique eye shape and lash pattern."
— [Artist Name], Senior Lash Artist

From Clients (with permission):
"I've tried five different lash studios in LA, and LashPop
is the only one where my lashes last the full 3 weeks."
— Sarah M., Client since 2022`}</CodeBlock>
              </div>

              {/* FAQ Suggestions */}
              <div>
                <h3 className="font-medium text-charcoal mb-3">Recommended FAQs to Add</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-ivory/50">
                    <h4 className="text-xs font-medium text-charcoal mb-2">General</h4>
                    <ul className="text-xs text-charcoal/60 space-y-1">
                      <li>• What makes LashPop different?</li>
                      <li>• How do I choose a lash style?</li>
                      <li>• What certifications do artists have?</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-xl bg-ivory/50">
                    <h4 className="text-xs font-medium text-charcoal mb-2">Service-Specific</h4>
                    <ul className="text-xs text-charcoal/60 space-y-1">
                      <li>• How long do results last?</li>
                      <li>• Classic vs volume differences?</li>
                      <li>• Is the service painful?</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-xl bg-ivory/50">
                    <h4 className="text-xs font-medium text-charcoal mb-2">Practical</h4>
                    <ul className="text-xs text-charcoal/60 space-y-1">
                      <li>• What&apos;s your cancellation policy?</li>
                      <li>• Do you offer payment plans?</li>
                      <li>• How far in advance to book?</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Visual Assets */}
              <div>
                <h3 className="font-medium text-charcoal mb-3">Visual Assets Needed</h3>
                <Table
                  headers={['Image', 'Dimensions', 'Purpose']}
                  rows={[
                    ['Main OG Image', '1200 x 630px', 'Default social share'],
                    ['Twitter Card', '1200 x 628px', 'Twitter shares'],
                    ['Logo', 'Square, PNG', 'Schema logo property'],
                  ]}
                />
                <p className="text-xs text-charcoal/50 mt-2">
                  Upload to DAM, then select in SEO admin panel.
                </p>
              </div>
            </div>
          </Section>

          {/* Section 4: Action Items */}
          <Section id="action-items" icon={CheckCircle2} title="Action Items Checklist">
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-rust/5 border border-rust/10">
                <h3 className="font-medium text-charcoal mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rust/10 flex items-center justify-center text-xs font-bold" style={{ color: '#ac4d3c' }}>1</span>
                  Immediate (Admin Panel Setup)
                </h3>
                <div className="space-y-1 ml-8">
                  <CheckItem>SEO Admin: Add business credentials (licenses, certifications, awards)</CheckItem>
                  <CheckItem>SEO Admin: Add all social profile URLs</CheckItem>
                  <CheckItem>SEO Admin: Customize llms.txt introduction</CheckItem>
                  <CheckItem>SEO Admin: Upload and select OG images</CheckItem>
                  <CheckItem>Team Admin: Add credentials for each team member</CheckItem>
                  <CheckItem>Reviews Admin: Set include_in_schema for reviews</CheckItem>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <h3 className="font-medium text-charcoal mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">2</span>
                  Content to Gather
                </h3>
                <div className="space-y-1 ml-8">
                  <CheckItem>All team member certifications and license numbers</CheckItem>
                  <CheckItem>Business license/establishment license number</CheckItem>
                  <CheckItem>Brand partnership details</CheckItem>
                  <CheckItem>Awards and recognition (with dates)</CheckItem>
                  <CheckItem>Total clients served since opening</CheckItem>
                  <CheckItem>Team combined years of experience</CheckItem>
                  <CheckItem>3-5 quotable insights from lead artists</CheckItem>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                <h3 className="font-medium text-charcoal mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">3</span>
                  Content to Write
                </h3>
                <div className="space-y-1 ml-8">
                  <CheckItem>Expanded service descriptions with &quot;What to Expect&quot; sections</CheckItem>
                  <CheckItem>10+ additional FAQs</CheckItem>
                  <CheckItem>Artist quotes for service pages</CheckItem>
                  <CheckItem>Updated About section with credentials</CheckItem>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <h3 className="font-medium text-charcoal mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-800">4</span>
                  Ongoing Maintenance
                </h3>
                <div className="space-y-1 ml-8">
                  <CheckItem>Respond to all reviews within 48 hours</CheckItem>
                  <CheckItem>Update team credentials as new certifications are earned</CheckItem>
                  <CheckItem>Add new reviews to &quot;include in schema&quot; as they come in</CheckItem>
                  <CheckItem>Keep Google Business Profile posts current (weekly)</CheckItem>
                </div>
              </div>
            </div>
          </Section>

          {/* Verification Section */}
          <div className="mt-8 p-6 rounded-2xl bg-charcoal text-white">
            <h3 className="font-display text-lg font-medium mb-3">Verify Structured Data</h3>
            <p className="text-sm text-white/70 mb-4">
              To verify structured data is working correctly:
            </p>
            <ol className="text-sm text-white/80 space-y-2 mb-4">
              <li>1. Visit your site and view page source (Cmd+U or Ctrl+U)</li>
              <li>2. Search for <code className="bg-white/10 px-1 rounded">application/ld+json</code></li>
              <li>3. Copy the JSON and paste into Google&apos;s Rich Results Test</li>
            </ol>
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-charcoal text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Open Rich Results Test
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-sage/10 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-5 md:px-8 text-center text-xs text-charcoal/50">
          Last updated: January 2026 • For authorized LashPop team members only
        </div>
      </footer>
    </div>
  )
}

// Main Page Component
export default function SEOGuidePage() {
  const { isAuthenticated, isLoading } = usePhoneAuth()
  const [manualAuth, setManualAuth] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ac4d3c' }} />
      </div>
    )
  }

  if (!isAuthenticated && !manualAuth) {
    return <PhoneLogin onSuccess={() => setManualAuth(true)} />
  }

  return <GuideContent />
}
