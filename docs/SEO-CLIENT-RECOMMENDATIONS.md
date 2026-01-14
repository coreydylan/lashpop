# LashPop Studios: SEO & AI Visibility Guide
## Complete Technical Implementation & Content Strategy

**Prepared for:** LashPop Studios
**Last Updated:** January 2026
**Purpose:** Document all SEO infrastructure, admin panel usage, and content recommendations

---

## Table of Contents

1. [What We Built](#part-1-what-we-built)
2. [Admin Panel Guide](#part-2-admin-panel-guide)
3. [Content Recommendations](#part-3-content-recommendations)
4. [Action Items Checklist](#part-4-action-items-checklist)

---

## Part 1: What We Built

### 1.1 Structured Data (JSON-LD Schema)

We've implemented comprehensive Schema.org structured data that helps Google and AI systems understand your business. This data appears invisibly in your page source and powers rich search results.

**Components Implemented:**

| Schema Type | Purpose | Data Source |
|-------------|---------|-------------|
| **LocalBusinessSchema** | Business info, location, aggregate rating, credentials, employees | Database + SEO Admin |
| **ReviewSchema** | Individual review structured data | Reviews database |
| **ServicesSchema** | Service offerings with pricing | Services database |
| **FAQSchema** | FAQ rich results | FAQ database |
| **WebSiteSchema** | Site search and organization info | SEO Admin settings |

**Key Features:**

- **Business Credentials**: Licenses, certifications, and awards appear in structured data even if not displayed publicly on the website
- **Team Member Credentials**: Each artist's certifications appear in the `employee` schema for E-E-A-T signals
- **Review Schema Control**: Reviews can be included in structured data for crawlers even if hidden from the public website display
- **Aggregate Rating**: Automatically calculated from all reviews with ratings

### 1.2 AI Discoverability Files

**llms.txt** (`/llms.txt`)
A machine-readable file specifically for AI assistants (ChatGPT, Claude, Perplexity). Contains:
- Business overview and mission
- Service catalog with pricing
- Location and contact information
- Team member list
- FAQ content
- Booking information

The intro section is customizable from the SEO admin panel.

**robots.txt** (`/robots.txt`)
Properly configured to allow all major search engine and AI crawlers:
- Googlebot, Bingbot
- GPTBot (OpenAI)
- Claude-Web (Anthropic)
- PerplexityBot
- Sitemap location

**sitemap.xml** (`/sitemap.xml`)
Dynamic XML sitemap including:
- Homepage
- All service pages with slugs
- Work With Us page
- Proper lastmod dates and priorities

### 1.3 Database Schema for SEO

**New Fields Added:**

```
team_members.credentials (JSONB)
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
└── false = Hide from public view
```

### 1.4 SEO Metadata System

Each page has configurable:
- Title and meta description
- Open Graph (Facebook/LinkedIn) title, description, image
- Twitter Card title, description, image
- Canonical URL
- noindex/nofollow options

---

## Part 2: Admin Panel Guide

### 2.1 SEO Admin Panel (`/admin/website/seo`)

**Location:** Admin > Website > SEO

#### Business Information Section
Configure core business details for structured data:

| Field | What It Does | Example |
|-------|--------------|---------|
| Business Name | Appears in all schemas | "LashPop Studios" |
| Business Description | Used in meta tags and schemas | "LA's premier luxury lash studio..." |
| Business Type | Schema.org type for rich results | BeautySalon |
| Phone | Appears in LocalBusiness schema | "(555) 123-4567" |
| Email | Contact info in schema | "hello@lashpopstudios.com" |

#### Social Profiles Section
Add all social media URLs. These appear in the `sameAs` property for brand verification:
- Instagram
- Facebook
- TikTok
- Twitter/X
- Yelp
- Pinterest

#### Business Credentials Section (NEW)
**This is for E-E-A-T signals that appear in structured data but NOT on the public website.**

Add credentials like:
- **Licenses**: "Licensed Cosmetology Establishment - California Board of Barbering and Cosmetology"
- **Certifications**: "Borboleta Platinum Partner Studio"
- **Awards**: "SD Reader Best of 2024 - Best Lash Studio"
- **Memberships**: "Associated Skin Care Professionals Member"
- **Accreditations**: "BBB Accredited Business - A+ Rating"

Each credential includes:
- Type (license, certification, award, membership, accreditation)
- Name (the credential title)
- Issuer (who granted it)
- Date Issued
- License Number (if applicable)
- Verification URL (if available)

**Why This Matters:** Google and AI systems look for credentials to assess E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). These appear in your page's JSON-LD but don't clutter the visual design.

#### llms.txt Introduction Section
Customize the opening paragraph of your llms.txt file. This is the first thing AI assistants read when they discover your site.

Default:
```
LashPop Studios is Los Angeles' premier destination for luxury
lash services. We offer a full range of lash extensions, lifts,
and beauty services performed by certified artists.
```

Make it compelling and include your unique value proposition.

#### Page-Specific SEO
Configure SEO for each key page:
- **Homepage**: Primary landing page SEO
- **Services**: Service listing page
- **Work With Us**: Careers/employment page

Each page can have:
- Custom title tag
- Meta description (155 chars recommended)
- OG image (from DAM)
- Twitter image (from DAM)
- noindex/nofollow toggles

---

### 2.2 Team Admin Panel (`/admin/website/team`)

**Location:** Admin > Website > Team

#### Team Member Credentials (NEW)
Click on any team member to expand their details. The **Credentials** section allows you to add professional qualifications.

**How to Add Credentials:**

1. Click "Add Credential" button
2. Select type:
   - **Certification**: Brand certifications, technique certifications
   - **License**: State/board licenses (Esthetician, Cosmetologist)
   - **Training**: Courses, workshops, masterclasses
   - **Award**: Individual recognition, competition wins
   - **Education**: Degrees, diplomas, formal education
3. Fill in details:
   - Name (required): "NovaLash Certified Volume Specialist"
   - Issuer: "NovaLash"
   - Date Issued: When they earned it
   - License Number: For verifiable licenses
   - URL: Link to verification or issuer

**Example Credentials to Add:**

```
Type: License
Name: Licensed Esthetician
Issuer: California Board of Barbering and Cosmetology
License Number: [number]
URL: https://search.dca.ca.gov/

Type: Certification
Name: NovaLash Certified Volume Specialist
Issuer: NovaLash
Date Issued: 2022-03-15

Type: Training
Name: Mega Volume Masterclass
Issuer: [Trainer/Academy Name]
Date Issued: 2023-06-01

Type: Award
Name: Best Lash Artist - SD Reader Best of 2024
Issuer: San Diego Reader
Date Issued: 2024-01-01
```

---

### 2.3 Reviews Admin Panel (`/admin/website/reviews`)

**Location:** Admin > Website > Reviews

Reviews are synced from Vagaro automatically. Each review has two visibility controls:

| Setting | What It Controls |
|---------|------------------|
| **Show on Website** | Whether the review appears publicly on your website |
| **Include in Schema** | Whether the review appears in JSON-LD structured data for search engines |

**Use Cases:**

1. **Public Review**: Both toggles ON - Review visible everywhere
2. **Crawler-Only Review**: Show on Website OFF, Include in Schema ON - Not on public site, but in structured data
3. **Hidden Review**: Both toggles OFF - Completely hidden

**Why Include Reviews in Schema Only?**
- You may have many reviews but only want to show a curated selection publicly
- All legitimate reviews can still contribute to your aggregate rating in structured data
- Search engines see your full review count, visitors see your best reviews
- This is legitimate SEO (not cloaking) - you're providing accurate data to search engines

---

### 2.4 FAQ Admin Panel (`/admin/website/faq`)

**Location:** Admin > Website > FAQs

FAQs power both:
- The public FAQ section on your website
- FAQPage schema markup for Google FAQ rich results
- Content in llms.txt for AI assistants

**Best Practices:**
- Use actual questions people ask (check Google Search Console)
- Put the direct answer first, then details
- Include keywords naturally
- 8-15 FAQs is optimal for schema

---

## Part 3: Content Recommendations

### 3.1 E-E-A-T Content (Experience, Expertise, Authoritativeness, Trustworthiness)

Google and AI systems prioritize businesses that demonstrate credibility.

#### Team Credentials to Add

For each team member, gather:

- [ ] State/board license numbers (Esthetician, Cosmetologist)
- [ ] Brand certifications (NovaLash, Borboleta, Paris Lash Academy, etc.)
- [ ] Years of experience
- [ ] Specialized training courses
- [ ] Competition wins or awards
- [ ] Notable achievements

#### Business Credentials to Add

- [ ] Business license/cosmetology establishment license
- [ ] Brand partnerships (Platinum Partner status, etc.)
- [ ] Industry association memberships
- [ ] BBB accreditation
- [ ] Awards (SD Reader Best of, local awards, etc.)
- [ ] Insurance/bonding (if appropriate to mention)

### 3.2 Statistics & Data Points

AI systems cite specific numbers. Add these throughout your site:

| Metric | Example | Action |
|--------|---------|--------|
| Clients served | "Over 5,000 happy clients" | Count total |
| Average rating | "4.9/5 from 500+ reviews" | Calculate |
| Experience | "50+ combined years of experience" | Sum team |
| Services | "Offering 40+ service variations" | Count |
| Retention | "85% client return rate" | Calculate if available |

### 3.3 Expert Quotes

AI systems heavily cite attributed quotes. Add to service pages and about section:

**From Artists:**
```
"The key to natural-looking volume lashes is understanding each
client's unique eye shape and lash pattern."
— [Artist Name], Senior Lash Artist
```

**From Clients (with permission):**
```
"I've tried five different lash studios in LA, and LashPop is the
only one where my lashes last the full 3 weeks."
— Sarah M., Client since 2022
```

### 3.4 FAQ Expansion

Recommended additional FAQs:

**General:**
- [ ] "What makes LashPop different from other lash studios?"
- [ ] "How do I know which lash style is right for me?"
- [ ] "What certifications do your artists have?"

**Service-Specific:**
- [ ] "How long do [specific service] results last?"
- [ ] "What's the difference between classic and volume lashes?"
- [ ] "Is [service] painful?"
- [ ] "Can I wear makeup with lash extensions?"

**Practical:**
- [ ] "What's your cancellation policy?"
- [ ] "Do you offer payment plans?"
- [ ] "How far in advance should I book?"

### 3.5 Service Description Enhancement

For each service, provide:
- [ ] "What to expect" section
- [ ] Preparation instructions
- [ ] Aftercare summary
- [ ] Ideal candidates ("Perfect for...")
- [ ] Duration and longevity
- [ ] Comparison to alternatives

### 3.6 Local SEO Content

- [ ] Mention neighborhoods served (Beverly Hills, West Hollywood, etc.)
- [ ] Add parking/transit information
- [ ] Include nearby landmarks
- [ ] Ensure Google Business Profile is complete

### 3.7 Visual Assets Needed

**For SEO Admin (OG Images):**

| Image | Dimensions | Purpose |
|-------|------------|---------|
| Main OG Image | 1200 x 630px | Default social share |
| Twitter Card | 1200 x 628px | Twitter shares |
| Logo | Square, transparent PNG | Schema logo property |

**Upload to DAM, then select in SEO admin panel.**

---

## Part 4: Action Items Checklist

### Immediate (Admin Panel Setup)

- [ ] **SEO Admin**: Add business credentials (licenses, certifications, awards)
- [ ] **SEO Admin**: Add all social profile URLs
- [ ] **SEO Admin**: Customize llms.txt introduction
- [ ] **SEO Admin**: Upload and select OG images
- [ ] **Team Admin**: Add credentials for each team member
- [ ] **Reviews Admin**: Set include_in_schema for reviews to include in structured data

### Content to Gather

- [ ] All team member certifications and license numbers
- [ ] Business license/establishment license number
- [ ] Brand partnership details (Borboleta, NovaLash, etc.)
- [ ] Awards and recognition (with dates)
- [ ] Total clients served since opening
- [ ] Team combined years of experience
- [ ] 3-5 quotable insights from lead artists

### Content to Write

- [ ] Expanded service descriptions with "What to Expect" sections
- [ ] 10+ additional FAQs
- [ ] Artist quotes for service pages
- [ ] Updated About section with credentials and history

### Ongoing Maintenance

- [ ] Respond to all reviews within 48 hours
- [ ] Update team credentials as new certifications are earned
- [ ] Add new reviews to "include in schema" as they come in
- [ ] Keep Google Business Profile posts current (weekly recommended)

---

## Technical Reference

### Schema Files Location

```
/src/components/seo/
├── index.tsx              # Exports all schema components
├── LocalBusinessSchema.tsx # Business, credentials, employees, reviews aggregate
├── ReviewSchema.tsx       # Individual review schemas
├── ServicesSchema.tsx     # Service offerings
├── FAQSchema.tsx          # FAQ page schema
└── WebSiteSchema.tsx      # Organization and site search
```

### Database Tables Affected

```
website_settings   # SEO config stored as JSONB
team_members       # credentials column (JSONB array)
reviews            # show_on_website, include_in_schema columns
```

### Generated Files

```
/llms.txt          # AI assistant discovery file
/robots.txt        # Crawler directives
/sitemap.xml       # XML sitemap for search engines
```

### Verification

To verify structured data is working:
1. Visit your site
2. View page source (Cmd+U or Ctrl+U)
3. Search for `application/ld+json`
4. Copy the JSON and paste into [Google's Rich Results Test](https://search.google.com/test/rich-results)

---

## Questions?

For technical issues with the admin panels or schema output, contact your developer.

For content strategy questions, consider:
1. What credentials are you most proud of?
2. What questions do clients ask most often?
3. What makes your studio unique vs. competitors?
4. What statistics would impress potential clients?
