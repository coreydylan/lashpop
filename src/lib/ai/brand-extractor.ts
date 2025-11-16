/**
 * AI Brand Extraction Service
 *
 * Uses Claude AI to analyze images and extract brand information:
 * - Colors and color palette
 * - Logo detection and extraction
 * - Brand aesthetic and personality
 * - Typography hints
 * - Overall brand style
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

export interface BrandExtractionResult {
  colors: {
    primary: string
    secondary?: string
    accent?: string
    palette: string[]
    dominantColors: string[]
    complementaryColors?: string[]
    colorHarmony: 'complementary' | 'analogous' | 'triadic' | 'monochromatic'
    colorTemperature: 'warm' | 'cool' | 'neutral'
  }
  logo?: {
    detected: boolean
    confidence: 'high' | 'medium' | 'low'
    description: string
    suggestedCrop?: string // Bounding box or description
  }
  aesthetic: {
    keywords: string[]
    personality: string
    style: string[]
    industry?: string
  }
  typography?: {
    primaryFont?: string
    secondaryFont?: string
    fontStyle: 'serif' | 'sans-serif' | 'script' | 'display' | 'mixed'
  }
  confidence: number // 0-100
  rawAnalysis: string
}

/**
 * Analyzes a single image to extract brand information
 */
export async function extractBrandFromImage(
  imageUrl: string,
  imageBase64?: string
): Promise<BrandExtractionResult> {
  try {
    const imageSource = imageBase64
      ? {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: imageBase64
        }
      : {
          type: 'url' as const,
          url: imageUrl
        }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: imageSource
            },
            {
              type: 'text',
              text: `Analyze this image to extract comprehensive brand information. Provide:

1. **Color Palette**:
   - Identify the primary, secondary, and accent colors (hex codes)
   - List 5-8 dominant colors that define the brand
   - Determine if colors are complementary, analogous, triadic, or monochromatic
   - Classify color temperature (warm, cool, neutral)

2. **Logo Detection**:
   - Is there a logo visible? (confidence: high/medium/low)
   - Describe the logo's characteristics
   - Suggest where to crop if extracting the logo

3. **Brand Aesthetic**:
   - 5-7 keywords that describe the visual style
   - Brand personality (e.g., luxurious, playful, minimalist, bold)
   - Style categories (modern, vintage, organic, geometric, etc.)
   - Likely industry based on visual cues

4. **Typography** (if visible):
   - Primary font style (serif, sans-serif, script, display)
   - Font characteristics and mood

Return your analysis in this exact JSON structure:
{
  "colors": {
    "primary": "#HEXCODE",
    "secondary": "#HEXCODE",
    "accent": "#HEXCODE",
    "palette": ["#HEX1", "#HEX2", ...],
    "dominantColors": ["#HEX1", "#HEX2", ...],
    "complementaryColors": ["#HEX1", "#HEX2"],
    "colorHarmony": "complementary|analogous|triadic|monochromatic",
    "colorTemperature": "warm|cool|neutral"
  },
  "logo": {
    "detected": true|false,
    "confidence": "high|medium|low",
    "description": "string",
    "suggestedCrop": "optional string"
  },
  "aesthetic": {
    "keywords": ["keyword1", "keyword2", ...],
    "personality": "string",
    "style": ["modern", "minimalist", ...],
    "industry": "string"
  },
  "typography": {
    "primaryFont": "optional string",
    "secondaryFont": "optional string",
    "fontStyle": "serif|sans-serif|script|display|mixed"
  },
  "confidence": 85
}

Respond ONLY with valid JSON, no additional text.`
            }
          ]
        }
      ]
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI')
    }

    // Parse AI response
    const analysisText = textContent.text
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response')
    }

    const result = JSON.parse(jsonMatch[0]) as BrandExtractionResult
    result.rawAnalysis = analysisText

    return result
  } catch (error) {
    console.error('Brand extraction error:', error)
    throw error
  }
}

/**
 * Analyzes multiple images and aggregates brand information
 */
export async function extractBrandFromMultipleImages(
  images: Array<{ url: string; base64?: string }>
): Promise<BrandExtractionResult> {
  const results = await Promise.all(
    images.map((img) => extractBrandFromImage(img.url, img.base64))
  )

  // Aggregate results
  const aggregated: BrandExtractionResult = {
    colors: {
      primary: results[0].colors.primary,
      secondary: results[0].colors.secondary,
      accent: results[0].colors.accent,
      palette: [],
      dominantColors: [],
      colorHarmony: results[0].colors.colorHarmony,
      colorTemperature: results[0].colors.colorTemperature
    },
    aesthetic: {
      keywords: [],
      personality: results[0].aesthetic.personality,
      style: [],
      industry: results[0].aesthetic.industry
    },
    typography: results[0].typography,
    confidence: 0,
    rawAnalysis: ''
  }

  // Merge color palettes
  const allColors = new Set<string>()
  results.forEach((r) => {
    r.colors.palette.forEach((c) => allColors.add(c))
    r.colors.dominantColors.forEach((c) => allColors.add(c))
  })
  aggregated.colors.palette = Array.from(allColors)
  aggregated.colors.dominantColors = aggregated.colors.palette.slice(0, 8)

  // Merge keywords and styles
  const allKeywords = new Set<string>()
  const allStyles = new Set<string>()
  results.forEach((r) => {
    r.aesthetic.keywords.forEach((k) => allKeywords.add(k))
    r.aesthetic.style.forEach((s) => allStyles.add(s))
  })
  aggregated.aesthetic.keywords = Array.from(allKeywords)
  aggregated.aesthetic.style = Array.from(allStyles)

  // Find best logo detection
  const logoResults = results.filter((r) => r.logo?.detected)
  if (logoResults.length > 0) {
    const bestLogo = logoResults.reduce((best, current) => {
      const confidenceScore = { high: 3, medium: 2, low: 1 }
      const bestScore = confidenceScore[best.logo!.confidence]
      const currentScore = confidenceScore[current.logo!.confidence]
      return currentScore > bestScore ? current : best
    })
    aggregated.logo = bestLogo.logo
  }

  // Average confidence
  aggregated.confidence = Math.round(
    results.reduce((sum, r) => sum + r.confidence, 0) / results.length
  )

  aggregated.rawAnalysis = results.map((r) => r.rawAnalysis).join('\n\n---\n\n')

  return aggregated
}

/**
 * Scrapes a website and extracts brand information
 */
export async function extractBrandFromWebsite(url: string): Promise<BrandExtractionResult> {
  try {
    // Fetch website content
    const response = await fetch(url)
    const html = await response.text()

    // Extract key information using AI
    const aiResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analyze this website HTML to extract brand information:

${html.slice(0, 50000)}

Extract:
1. Logo URL (look for <img> tags, favicon, og:image)
2. Brand colors (CSS variables, inline styles, common color values)
3. Typography (font-family declarations)
4. Brand personality from content and design
5. Industry/business type

Return JSON in the same format as the image analysis.`
        }
      ]
    })

    const textContent = aiResponse.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI')
    }

    const analysisText = textContent.text
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response')
    }

    const result = JSON.parse(jsonMatch[0]) as BrandExtractionResult
    result.rawAnalysis = analysisText

    return result
  } catch (error) {
    console.error('Website brand extraction error:', error)
    throw error
  }
}

/**
 * Generates a complementary color scheme from a base color
 */
export async function generateColorScheme(baseColor: string): Promise<{
  palette: string[]
  harmony: string
  description: string
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Given the base color ${baseColor}, generate a harmonious color scheme with:
          - 5-7 complementary colors
          - Color harmony type (complementary, analogous, triadic, monochromatic)
          - Brief description of the palette's mood

          Return JSON:
          {
            "palette": ["#HEX1", "#HEX2", ...],
            "harmony": "string",
            "description": "string"
          }`
        }
      ]
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI')
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Color scheme generation error:', error)
    throw error
  }
}
