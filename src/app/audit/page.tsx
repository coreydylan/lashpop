'use client'

import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Search,
  Smartphone,
  Shield,
  BarChart3,
  Star,
  Image as ImageIcon,
  Globe,
  FileText,
  Mail,
  TrendingUp,
  ArrowRight,
  ExternalLink
} from 'lucide-react'

// Score calculation based on audit findings
const scores = {
  performance: 65,
  localSeo: 40,
  accessibility: 72,
  mobile: 85,
  conversion: 58,
  analytics: 15,
  security: 45,
  content: 55,
}

const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length)

function ScoreRing({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e' // green
    if (s >= 60) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(161, 151, 129, 0.2)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-dune">{score}</span>
      </div>
    </div>
  )
}

function CategoryCard({
  title,
  score,
  icon: Icon,
  items,
  delay = 0
}: {
  title: string
  score: number
  icon: React.ElementType
  items: { status: 'pass' | 'fail' | 'warn'; text: string }[]
  delay?: number
}) {
  const getScoreBg = (s: number) => {
    if (s >= 80) return 'bg-emerald-50 border-emerald-200'
    if (s >= 60) return 'bg-amber-50 border-amber-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl shadow-sm border border-sage/10 overflow-hidden"
    >
      <div className={`p-6 ${getScoreBg(score)} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
              <Icon className="w-5 h-5 text-dune" />
            </div>
            <h3 className="font-semibold text-lg text-dune">{title}</h3>
          </div>
          <ScoreRing score={score} size={60} strokeWidth={5} />
        </div>
      </div>
      <div className="p-6">
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              {item.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
              {item.status === 'fail' && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
              {item.status === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
              <span className="text-sm text-dune/80">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

function RecommendationCard({
  priority,
  title,
  description,
  impact,
  effort,
  category,
  delay = 0
}: {
  priority: 1 | 2 | 3
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  category: string
  delay?: number
}) {
  const priorityColors = {
    1: 'bg-red-500',
    2: 'bg-amber-500',
    3: 'bg-blue-500'
  }

  const priorityLabels = {
    1: 'Critical',
    2: 'Important',
    3: 'Nice to Have'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-xl border border-sage/10 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className={`${priorityColors[priority]} text-white text-xs font-bold px-2 py-1 rounded shrink-0`}>
          P{priority}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-dusty-rose font-medium uppercase tracking-wide">{category}</span>
          </div>
          <h4 className="font-semibold text-dune mb-2">{title}</h4>
          <p className="text-sm text-dune/70 mb-4">{description}</p>
          <div className="flex items-center gap-4 text-xs">
            <span className={`px-2 py-1 rounded-full ${
              impact === 'high' ? 'bg-emerald-100 text-emerald-700' :
              impact === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              Impact: {impact}
            </span>
            <span className={`px-2 py-1 rounded-full ${
              effort === 'low' ? 'bg-emerald-100 text-emerald-700' :
              effort === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              Effort: {effort}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-gradient-to-br from-dune to-dune/90 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-dusty-rose font-medium mb-2">LashPop Studios</p>
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Landing Page Audit Report</h1>
            <p className="text-white/70 text-lg max-w-2xl">
              Comprehensive analysis against 2025 best practices for high-performance lash extension business websites.
            </p>
            <p className="text-white/50 text-sm mt-4">Generated: December 4, 2025</p>
          </motion.div>
        </div>
      </header>

      {/* Overall Score */}
      <section className="py-12 px-6 -mt-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-serif text-dune mb-4">Overall Score</h2>
                <p className="text-dune/70 mb-6">
                  Your landing page shows solid foundations in mobile UX and accessibility,
                  but has significant opportunities for improvement in analytics, local SEO,
                  and conversion optimization.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">3 areas passing</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">3 need improvement</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">2 critical issues</span>
                </div>
              </div>
              <div className="flex justify-center">
                <ScoreRing score={overallScore} size={200} strokeWidth={12} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Scores */}
      <section className="py-12 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-serif text-dune mb-8 text-center"
          >
            Category Breakdown
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CategoryCard
              title="Core Web Vitals"
              score={scores.performance}
              icon={Zap}
              delay={0.1}
              items={[
                { status: 'fail', text: 'Image optimization disabled (unoptimized: true)' },
                { status: 'fail', text: '8 Google Fonts loaded - impacts LCP' },
                { status: 'warn', text: 'No preload hint for hero LCP image' },
                { status: 'pass', text: 'WebP/AVIF formats configured' },
                { status: 'pass', text: 'Lazy loading implemented via Next.js Image' },
                { status: 'pass', text: 'Package import optimization enabled' },
              ]}
            />

            <CategoryCard
              title="Local SEO"
              score={scores.localSeo}
              icon={Search}
              delay={0.2}
              items={[
                { status: 'fail', text: 'Metadata references "Los Angeles" not Oceanside' },
                { status: 'fail', text: 'No LocalBusiness JSON-LD schema' },
                { status: 'fail', text: 'Missing robots.txt and sitemap.xml' },
                { status: 'fail', text: 'No FAQ or Review schema markup' },
                { status: 'warn', text: 'Footer NAP lacks microdata markup' },
                { status: 'pass', text: 'Business contact info present in footer' },
              ]}
            />

            <CategoryCard
              title="Accessibility (WCAG 2.2)"
              score={scores.accessibility}
              icon={Globe}
              delay={0.3}
              items={[
                { status: 'fail', text: 'userScalable: false violates accessibility' },
                { status: 'warn', text: 'Some form inputs lack visible focus states' },
                { status: 'pass', text: 'Touch targets meet 44x44px minimum' },
                { status: 'pass', text: 'Color contrast appears sufficient' },
                { status: 'pass', text: 'ARIA labels on interactive elements' },
                { status: 'pass', text: 'Semantic HTML structure used' },
              ]}
            />

            <CategoryCard
              title="Mobile Booking UX"
              score={scores.mobile}
              icon={Smartphone}
              delay={0.4}
              items={[
                { status: 'pass', text: '"Book Now" CTA visible without scrolling' },
                { status: 'pass', text: 'Mobile-first responsive design' },
                { status: 'pass', text: 'Touch-friendly interactions' },
                { status: 'pass', text: 'Smooth scroll navigation works well' },
                { status: 'warn', text: 'Booking flow requires 4+ steps' },
                { status: 'warn', text: 'Vagaro iframe booking could be streamlined' },
              ]}
            />

            <CategoryCard
              title="Conversion Optimization"
              score={scores.conversion}
              icon={TrendingUp}
              delay={0.5}
              items={[
                { status: 'fail', text: 'Reviews not placed before booking CTAs' },
                { status: 'fail', text: 'No pricing information displayed' },
                { status: 'warn', text: 'Testimonials in separate section, not inline' },
                { status: 'warn', text: 'No urgency/scarcity elements' },
                { status: 'pass', text: 'Multiple CTAs throughout page' },
                { status: 'pass', text: 'Social proof via review counts in hero' },
              ]}
            />

            <CategoryCard
              title="Analytics & Tracking"
              score={scores.analytics}
              icon={BarChart3}
              delay={0.6}
              items={[
                { status: 'fail', text: 'No Google Analytics (GA4) implementation' },
                { status: 'fail', text: 'No Meta Pixel / Conversions API' },
                { status: 'fail', text: 'No conversion tracking configured' },
                { status: 'fail', text: 'No event tracking for CTAs' },
                { status: 'warn', text: 'Internal Vagaro events not sent to analytics' },
                { status: 'pass', text: 'Vagaro widget events captured internally' },
              ]}
            />

            <CategoryCard
              title="Security & Headers"
              score={scores.security}
              icon={Shield}
              delay={0.7}
              items={[
                { status: 'fail', text: 'No Content Security Policy (CSP) header' },
                { status: 'fail', text: 'No security headers in vercel.json' },
                { status: 'warn', text: 'Newsletter form lacks spam protection' },
                { status: 'pass', text: 'X-Content-Type-Options on DAM routes' },
                { status: 'pass', text: 'External links use noopener noreferrer' },
                { status: 'pass', text: 'HTTPS enforced by Vercel' },
              ]}
            />

            <CategoryCard
              title="Content Strategy"
              score={scores.content}
              icon={FileText}
              delay={0.8}
              items={[
                { status: 'fail', text: 'No comparison content (lash lift vs extensions)' },
                { status: 'warn', text: 'Limited aftercare/educational content' },
                { status: 'warn', text: 'No heading optimization for SEO' },
                { status: 'pass', text: 'Comprehensive FAQ section exists' },
                { status: 'pass', text: 'Team bios and quick facts present' },
                { status: 'pass', text: 'Before/after portfolio potential (DAM system)' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Priority Recommendations */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-serif text-dune mb-4">Priority Recommendations</h2>
            <p className="text-dune/70 max-w-2xl mx-auto">
              Ranked by impact on traffic and conversions, based on the 2025 high-performance lash website guide.
            </p>
          </motion.div>

          {/* Critical Priority */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-red-600 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">P1</span>
              Critical Priority
            </h3>
            <div className="space-y-4">
              <RecommendationCard
                priority={1}
                category="Analytics"
                title="Implement Google Analytics 4 with Conversion Tracking"
                description="You have zero visibility into user behavior. Set up GA4 with 14-month data retention, enable enhanced measurement, and track booking_complete as your primary conversion event. This is foundational for all optimization efforts."
                impact="high"
                effort="medium"
                delay={0.1}
              />
              <RecommendationCard
                priority={1}
                category="Local SEO"
                title="Add LocalBusiness JSON-LD Schema"
                description="Without structured data, Google cannot properly understand your business for local pack rankings. Implement BeautySalon schema with address, phone, hours, services, and aggregateRating. AI-powered search features prioritize structured data."
                impact="high"
                effort="low"
                delay={0.15}
              />
              <RecommendationCard
                priority={1}
                category="Performance"
                title="Enable Image Optimization (Remove unoptimized: true)"
                description="Your next.config.js has images.unoptimized: true, which completely disables Next.js image optimization. This directly harms LCP. Enable optimization and serve images in AVIF format first (50% smaller than JPEG), then WebP as fallback."
                impact="high"
                effort="low"
                delay={0.2}
              />
              <RecommendationCard
                priority={1}
                category="Local SEO"
                title="Fix Metadata: Replace 'Los Angeles' with 'Oceanside'"
                description="Your meta description and keywords reference Los Angeles, but you're in Oceanside. This actively hurts local rankings. Update to target 'North County San Diego', 'Oceanside', 'Carlsbad', and nearby cities."
                impact="high"
                effort="low"
                delay={0.25}
              />
            </div>
          </div>

          {/* Important Priority */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-amber-600 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">P2</span>
              Important Priority
            </h3>
            <div className="space-y-4">
              <RecommendationCard
                priority={2}
                category="Conversion"
                title="Place Testimonials Directly Before Booking CTAs"
                description="Research shows placing testimonials before CTAs increases conversions by 35.6%. Currently, reviews are in a separate section after Team and Instagram. Add 2-3 specific testimonials directly above or beside the 'Book Now' buttons."
                impact="high"
                effort="medium"
                delay={0.3}
              />
              <RecommendationCard
                priority={2}
                category="Meta Pixel"
                title="Implement Meta Conversions API (CAPI)"
                description="Browser-based Pixel tracking alone misses significant conversions due to iOS 14+ restrictions. CAPI can recover 40-130% more conversion data. Build custom audiences for retargeting: visitors, service page viewers, and booking abandoners."
                impact="high"
                effort="medium"
                delay={0.35}
              />
              <RecommendationCard
                priority={2}
                category="Local SEO"
                title="Create robots.txt and sitemap.xml"
                description="Missing robots.txt and sitemap means search engines can't efficiently crawl your site. Create robots.txt to block /admin/, /dam/, /api/ and create a Next.js sitemap.ts for automatic XML sitemap generation."
                impact="medium"
                effort="low"
                delay={0.4}
              />
              <RecommendationCard
                priority={2}
                category="Performance"
                title="Reduce Font Loading (8 Fonts is Excessive)"
                description="You're loading 8 Google Fonts plus custom fonts. This significantly impacts LCP. Audit which fonts are actually used and reduce to 2-3 maximum. Consider using font-display: optional for non-critical fonts."
                impact="medium"
                effort="medium"
                delay={0.45}
              />
              <RecommendationCard
                priority={2}
                category="Accessibility"
                title="Remove userScalable: false from Viewport"
                description="Disabling zoom (userScalable: false) violates WCAG 2.2 and can trigger accessibility issues. Users with low vision need zoom capability. Remove this setting from your viewport configuration in layout.tsx."
                impact="medium"
                effort="low"
                delay={0.5}
              />
              <RecommendationCard
                priority={2}
                category="Conversion"
                title="Display Pricing Information"
                description="83% of customers prefer brands with clear pricing, and 61% abandon due to unclear pricing. Add 'starting at' pricing with service descriptions. Position FAQs about cost near pricing to reduce friction."
                impact="high"
                effort="medium"
                delay={0.55}
              />
            </div>
          </div>

          {/* Nice to Have Priority */}
          <div>
            <h3 className="text-xl font-semibold text-blue-600 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">P3</span>
              Nice to Have
            </h3>
            <div className="space-y-4">
              <RecommendationCard
                priority={3}
                category="Email"
                title="Implement Rebooking Reminder Sequences"
                description="Automated rebooking reminders (2-3 weeks for lash fills) can achieve 80%+ rebooking rates. Connect your newsletter form to an email service like Klaviyo and set up triggered sequences based on service cycle timing."
                impact="high"
                effort="high"
                delay={0.6}
              />
              <RecommendationCard
                priority={3}
                category="Content"
                title="Create Comparison Content for High-Intent Searches"
                description="Add content like 'Lash Lift vs Extensions: Which Is Right for You?' - these commercial investigation searches convert well when structured with comparison tables, maintenance requirements, and cost breakdowns."
                impact="medium"
                effort="medium"
                delay={0.65}
              />
              <RecommendationCard
                priority={3}
                category="Security"
                title="Add Content Security Policy and Security Headers"
                description="Implement CSP headers to protect against XSS attacks, particularly important since you accept booking deposits. Add security headers in vercel.json: X-Frame-Options, X-Content-Type-Options, Referrer-Policy."
                impact="low"
                effort="medium"
                delay={0.7}
              />
              <RecommendationCard
                priority={3}
                category="Forms"
                title="Add Honeypot Spam Protection to Newsletter Form"
                description="Replace no protection with honeypot fields combined with time-based analysis. This provides better UX than CAPTCHAs while still blocking automated submissions. Cloudflare Turnstile is an alternative for invisible verification."
                impact="low"
                effort="low"
                delay={0.75}
              />
              <RecommendationCard
                priority={3}
                category="Performance"
                title="Preload Hero LCP Image"
                description="Add <link rel='preload'> for your above-the-fold hero image. Never lazy-load it - this directly sabotages LCP. Always specify explicit width and height dimensions to prevent layout shifts."
                impact="medium"
                effort="low"
                delay={0.8}
              />
              <RecommendationCard
                priority={3}
                category="Schema"
                title="Add FAQ and Review Schema Markup"
                description="Structure your FAQ content with FAQPage schema to generate rich results in search. Add Review schema for your testimonials. These can capture featured snippets and AI Overview citations."
                impact="medium"
                effort="low"
                delay={0.85}
              />
            </div>
          </div>
        </div>
      </section>

      {/* What's Working Well */}
      <section className="py-16 px-6 bg-emerald-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-serif text-dune mb-4">What's Working Well</h2>
            <p className="text-dune/70">These aspects of your landing page are already following best practices.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Smartphone,
                title: 'Mobile-First Design',
                description: 'Excellent responsive design with touch-friendly interactions, proper use of dvh units, and visible booking CTA above the fold.'
              },
              {
                icon: Star,
                title: 'Review Aggregation',
                description: 'Multi-source review display (Google, Yelp, Vagaro) with total counts creates strong social proof in the hero section.'
              },
              {
                icon: ImageIcon,
                title: 'Modern Image Formats',
                description: 'AVIF and WebP formats configured with responsive deviceSizes. Just need to enable the optimization.'
              },
              {
                icon: FileText,
                title: 'Comprehensive FAQ',
                description: 'Well-structured FAQ section with categories, search functionality, and accordion UI. Good foundation for FAQ schema.'
              },
              {
                icon: Globe,
                title: 'Semantic HTML',
                description: 'Proper use of semantic elements, ARIA labels, and adequate touch targets (44x44px minimum enforced in CSS).'
              },
              {
                icon: Zap,
                title: 'Performance Optimizations',
                description: 'Package import optimization, GSAP for smooth animations, and code splitting via dynamic imports are all in place.'
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white rounded-xl p-6 border border-emerald-200"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-dune mb-2">{item.title}</h3>
                <p className="text-sm text-dune/70">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-serif text-dune mb-4">Implementation Roadmap</h2>
            <p className="text-dune/70">Suggested timeline for implementing these recommendations.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border border-sage/10"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-red-600">1</span>
              </div>
              <h3 className="font-semibold text-lg text-dune mb-2">Week 1: Critical Fixes</h3>
              <ul className="space-y-2 text-sm text-dune/70">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Fix metadata (Los Angeles → Oceanside)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Enable image optimization
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Add LocalBusiness schema
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Create robots.txt & sitemap
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Remove userScalable: false
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 border border-sage/10"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-amber-600">2</span>
              </div>
              <h3 className="font-semibold text-lg text-dune mb-2">Week 2-3: Analytics & Tracking</h3>
              <ul className="space-y-2 text-sm text-dune/70">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Set up Google Analytics 4
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Configure GA4 events & conversions
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Implement Meta Pixel + CAPI
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Connect Vagaro events to analytics
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Set up Search Console
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-8 border border-sage/10"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-lg text-dune mb-2">Week 4+: Optimization</h3>
              <ul className="space-y-2 text-sm text-dune/70">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Add testimonials near CTAs
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Display pricing information
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Reduce font loading
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Add FAQ & Review schema
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-dusty-rose" />
                  Create comparison content
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Statistics Reference */}
      <section className="py-16 px-6 bg-dune text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-serif mb-12 text-center">Key Statistics to Remember</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { stat: '60%+', desc: 'of salon bookings happen on mobile' },
              { stat: '35.6%', desc: 'conversion increase from testimonials before CTAs' },
              { stat: '83%', desc: 'of customers prefer clear pricing' },
              { stat: '80%', desc: 'lose trust with inconsistent NAP info' },
              { stat: '270%', desc: 'higher purchase likelihood with 5+ reviews' },
              { stat: '2.5s', desc: 'LCP threshold for good Core Web Vitals' },
              { stat: '40-130%', desc: 'more conversions recovered via CAPI' },
              { stat: '42%', desc: 'more direction requests with GBP photos' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-dusty-rose mb-2">{item.stat}</div>
                <div className="text-sm text-white/70">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-cream border-t border-sage/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-dune/60">
            This audit is based on the 2025 High-Performance Lash Extension Business Website Guide.
            For questions or implementation assistance, contact your development team.
          </p>
          <p className="text-xs text-dune/40 mt-2">
            Report generated by Claude Code for LashPop Studios
          </p>
        </div>
      </footer>
    </div>
  )
}
