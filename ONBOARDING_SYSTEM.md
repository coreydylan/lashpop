# AI-Powered Onboarding System

A comprehensive onboarding flow that uses AI to extract brand information from user's social media and websites, generating custom color schemes and personalized themes.

## Overview

The onboarding system guides new users through connecting their brand sources (Instagram, websites, etc.), automatically imports and analyzes their content using AI, and generates a fully customized experience with:

- **Custom color schemes** based on brand colors
- **Logo detection and branding** in the UI
- **Automated image import** from connected sources
- **AI-generated examples** showcasing the brand
- **Personalized themes** applied throughout the app

## Architecture

### Database Schema

**New Tables:**
- `onboarding_progress` - Tracks user progress through onboarding steps
- `onboarding_connected_accounts` - Stores connected Instagram/websites
- `onboarding_brand_data` - AI-extracted brand information (colors, logo, aesthetic)
- `onboarding_imported_assets` - Images imported from external sources
- `onboarding_custom_themes` - User's generated custom themes

### Backend Services

**AI Services (`/src/lib/ai/`):**
- `brand-extractor.ts` - Claude AI-powered brand analysis
  - Analyzes images to extract colors, logos, aesthetic
  - Generates complementary color schemes
  - Provides brand personality insights

- `content-scraper.ts` - Web scraping utilities
  - Instagram public profile scraping
  - Website content extraction
  - Image discovery and metadata extraction

**API Endpoints (`/src/app/api/onboarding/`):**
- `POST /api/onboarding/connect-account` - Connect social media/website
- `GET /api/onboarding/connect-account` - List connected accounts
- `POST /api/onboarding/scrape` - Scrape and import content
- `POST /api/onboarding/extract-brand` - AI brand analysis
- `POST /api/onboarding/generate-theme` - Generate custom theme
- `GET /api/onboarding/generate-theme` - Get current theme
- `POST /api/onboarding/progress` - Update progress
- `GET /api/onboarding/progress` - Get progress

### Frontend Components

**Main Onboarding Flow (`/src/app/onboarding/`):**
- `page.tsx` - Onboarding page with progress tracking

**Wizard Components (`/src/components/onboarding/`):**
- `OnboardingWizard.tsx` - Main wizard orchestrator
- `steps/WelcomeStep.tsx` - Welcome and introduction
- `steps/ConnectAccountsStep.tsx` - Connect Instagram/websites
- `steps/ImportDataStep.tsx` - Scrape and import content
- `steps/BrandExtractionStep.tsx` - AI brand analysis
- `steps/ColorSchemeStep.tsx` - Color scheme preview/editing
- `steps/LogoSetupStep.tsx` - Logo upload/detection
- `steps/ExampleGenerationStep.tsx` - Show generated examples
- `steps/FinalReviewStep.tsx` - Summary and completion

**Theme System:**
- `BrandThemeContext.tsx` - Theme provider for custom branding

## User Flow

### Step 1: Welcome
- Introduction to onboarding
- Overview of features

### Step 2: Connect Accounts
- Add Instagram username(s)
- Add website URL(s)
- Multiple accounts supported

### Step 3: Import Data
- Automatic scraping of connected accounts
- Image import to S3
- Progress indicators for each account

### Step 4: Brand Extraction
- AI analyzes imported images
- Extracts:
  - Dominant color palette
  - Logo (if detected)
  - Brand personality
  - Visual keywords
  - Typography hints

### Step 5: Color Scheme
- Preview AI-generated color scheme
- Option to regenerate different harmonies
- Apply or customize colors

### Step 6: Logo Setup
- Upload custom logo
- Use AI-detected logo
- Preview logo placement

### Step 7: Example Generation
- Show branded interface preview
- Display custom color applications
- Showcase imported assets

### Step 8: Final Review
- Summary of setup
- Statistics (accounts, images, etc.)
- Launch into main application

## AI Integration

### Claude AI (Anthropic)

**Brand Extraction:**
```typescript
extractBrandFromImage(imageUrl: string): Promise<BrandExtractionResult>
```

Analyzes images for:
- Primary, secondary, accent colors (hex codes)
- 5-8 dominant colors
- Color harmony type
- Color temperature
- Logo detection and confidence
- Brand aesthetic keywords
- Typography characteristics

**Multi-Image Analysis:**
```typescript
extractBrandFromMultipleImages(images: Array): Promise<BrandExtractionResult>
```

Aggregates brand information across multiple images for more accurate results.

**Color Scheme Generation:**
```typescript
generateColorScheme(baseColor: string): Promise<ColorScheme>
```

Generates harmonious color palettes using color theory.

### Content Scraping

**Instagram Scraping:**
- Uses public JSON endpoints
- Extracts latest posts (up to 20)
- Retrieves profile picture
- Gathers bio and metadata

**Website Scraping:**
- Cheerio HTML parsing
- Logo detection (multiple selectors)
- Favicon extraction
- Color extraction from CSS
- Meta tag analysis (og:image, etc.)

## Theme Application

The `BrandThemeContext` provides:

```typescript
interface BrandTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  textSecondaryColor: string
  colorPalette: Record<string, string>
  logoUrl?: string
  isActive: boolean
}
```

**CSS Variables Applied:**
- `--brand-primary`
- `--brand-secondary`
- `--brand-accent`
- `--brand-bg`
- `--brand-surface`
- `--brand-text`
- Plus all palette colors

## Environment Variables Required

```bash
# AI Service
ANTHROPIC_API_KEY=sk-ant-...

# AWS S3 (for image storage)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
AWS_S3_BUCKET=...

# Database
DATABASE_URL=postgresql://...
```

## Installation

### 1. Install Dependencies

```bash
npm install @anthropic-ai/sdk cheerio
```

### 2. Run Database Migration

```bash
npm run db:generate
npm run db:migrate
```

### 3. Set Environment Variables

Add the required environment variables to `.env.local`

### 4. Integration with Auth

The login flow automatically redirects to onboarding for new users:

```typescript
// In PhoneLoginForm.tsx
if (profileData.profile?.onboardingCompleted) {
  window.location.href = '/dam'
} else {
  window.location.href = '/onboarding'
}
```

## Usage Examples

### Connect an Account

```typescript
const response = await fetch('/api/onboarding/connect-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountType: 'instagram',
    accountIdentifier: 'myusername',
    displayName: 'My Instagram',
    profileUrl: 'https://instagram.com/myusername'
  })
})
```

### Scrape Content

```typescript
const response = await fetch('/api/onboarding/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountId: 'uuid-of-connected-account'
  })
})
```

### Extract Brand Data

```typescript
const response = await fetch('/api/onboarding/extract-brand', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
```

## Features

✅ **AI-Powered Brand Analysis**
- Automatic color extraction
- Logo detection
- Brand personality analysis
- Typography hints

✅ **Multi-Source Import**
- Instagram profiles
- Website scraping
- Manual upload support

✅ **Custom Theme Generation**
- Harmonious color palettes
- Complementary color suggestions
- Real-time preview

✅ **Seamless Integration**
- Automatic redirect flow
- Progress persistence
- Resume capability
- Skip options for flexibility

✅ **Professional UX**
- Step-by-step wizard
- Progress indicators
- Beautiful animations (Framer Motion)
- Mobile-responsive

## Future Enhancements

- [ ] Additional social media platforms (TikTok, Pinterest, LinkedIn)
- [ ] More sophisticated logo extraction with computer vision
- [ ] Font pairing recommendations
- [ ] Brand voice analysis from text content
- [ ] Competitor analysis
- [ ] A/B testing different color schemes
- [ ] Export brand guidelines PDF
- [ ] Team collaboration on onboarding

## Technical Details

**Framework:** Next.js 15 (App Router)
**State Management:** TanStack Query
**Animations:** Framer Motion
**Database:** PostgreSQL + Drizzle ORM
**AI:** Anthropic Claude 3.5 Sonnet
**Storage:** AWS S3
**Styling:** Tailwind CSS

## Troubleshooting

### Instagram Scraping Fails
- Instagram may rate-limit or block automated requests
- Consider using Instagram Graph API for production
- Fallback to manual image upload

### AI Extraction Errors
- Check ANTHROPIC_API_KEY is valid
- Ensure images are accessible URLs
- Verify sufficient API credits

### Theme Not Applying
- Check BrandThemeProvider wraps the app
- Verify CSS variables in browser dev tools
- Clear cache and reload

## Support

For issues or questions:
1. Check console logs for detailed errors
2. Verify all environment variables
3. Test with sample accounts first
4. Review API response error messages
