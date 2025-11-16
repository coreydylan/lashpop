import Anthropic from "@anthropic-ai/sdk"
import type {
  CampaignBriefInput,
  CreativeBrief,
  BrandAnalysis,
  InspirationAnalysis,
  ConductorBriefOutput,
  AssetSpec
} from "@/types/campaign"

/**
 * Conductor Agent - Master orchestrator for campaign creation
 *
 * Responsibilities:
 * 1. Analyze brand assets (logos, colors, typography, guidelines)
 * 2. Analyze inspiration (photos, style refs, mood boards)
 * 3. Synthesize into detailed creative brief
 * 4. Generate specifications for each individual asset
 */
export class ConductorAgent {
  private client: Anthropic

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required")
    }
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Main entry point: Create detailed creative brief from campaign input
   */
  async createDetailedBrief(
    input: CampaignBriefInput,
    brandAssets: any[],
    inspirationAssets: any[]
  ): Promise<CreativeBrief> {
    console.log("[ConductorAgent] Starting brief creation for campaign:", input.campaignName)

    // Step 1: Analyze brand assets
    const brandAnalysis = await this.analyzeBrandAssets(brandAssets, input.brandAssets)

    // Step 2: Analyze inspiration
    const inspirationAnalysis = await this.analyzeInspiration(inspirationAssets, input.inspiration)

    // Step 3: Synthesize into creative brief
    const brief = await this.synthesizeBrief({
      input,
      brandAnalysis,
      inspirationAnalysis
    })

    console.log("[ConductorAgent] Brief creation complete")
    return brief
  }

  /**
   * Analyze brand assets to extract visual identity
   */
  private async analyzeBrandAssets(
    assets: any[],
    brandAssetRefs: CampaignBriefInput['brandAssets']
  ): Promise<BrandAnalysis> {
    console.log("[ConductorAgent] Analyzing brand assets...")

    const prompt = `You are a brand strategist analyzing brand assets for a campaign.

Brand Assets Provided:
${JSON.stringify(brandAssetRefs, null, 2)}

Asset Details:
${assets.map(a => `- ${a.fileName}: ${a.caption || 'No caption'}`).join('\n')}

Analyze these assets and extract:

1. **Color Palette**:
   - Primary colors (hex codes)
   - Secondary colors
   - Accent colors

2. **Typography**:
   - Heading fonts
   - Body fonts

3. **Logo Usage**:
   - Preferred logo variation
   - Placement guidelines

4. **Brand Voice**:
   - Tone keywords
   - Common messaging themes
   - Words/phrases to avoid

Return a JSON object with this structure:
{
  "colors": {
    "primary": ["#hex1", "#hex2"],
    "secondary": ["#hex3"],
    "accent": ["#hex4"]
  },
  "typography": {
    "headings": ["Font Name"],
    "body": ["Font Name"]
  },
  "logoUsage": {
    "preferred": "description",
    "variations": ["var1", "var2"],
    "placement": "guidelines"
  },
  "voice": {
    "tone": ["keyword1", "keyword2"],
    "keywords": ["brand", "keywords"],
    "avoid": ["words", "to", "avoid"]
  }
}`

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: "user",
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type === "text") {
        // Extract JSON from response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as BrandAnalysis
        }
      }

      // Fallback: basic analysis
      return this.getDefaultBrandAnalysis()
    } catch (error) {
      console.error("[ConductorAgent] Error analyzing brand assets:", error)
      return this.getDefaultBrandAnalysis()
    }
  }

  /**
   * Analyze inspiration to extract visual themes
   */
  private async analyzeInspiration(
    assets: any[],
    inspirationRefs: CampaignBriefInput['inspiration']
  ): Promise<InspirationAnalysis> {
    console.log("[ConductorAgent] Analyzing inspiration...")

    const prompt = `You are a creative director analyzing inspiration for a campaign.

Inspiration Assets:
${JSON.stringify(inspirationRefs, null, 2)}

Asset Details:
${assets.map(a => `- ${a.fileName}: ${a.caption || 'No caption'}`).join('\n')}

Analyze these inspirations and identify:

1. **Visual Style**:
   - Style keywords (e.g., "minimal", "vibrant", "organic")
   - Mood descriptors
   - Composition patterns

2. **Color Trends**:
   - Dominant colors across images
   - Accent colors
   - Overall palette vibe

3. **Patterns**:
   - Common layout approaches
   - Recurring visual elements

Return JSON:
{
  "visualStyle": {
    "keywords": ["keyword1", "keyword2"],
    "mood": ["mood1", "mood2"],
    "composition": ["pattern1", "pattern2"]
  },
  "colorTrends": {
    "dominant": ["#hex1", "#hex2"],
    "accents": ["#hex3"],
    "palette": "description"
  },
  "patterns": {
    "layout": ["pattern1", "pattern2"],
    "elements": ["element1", "element2"]
  }
}`

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: "user",
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as InspirationAnalysis
        }
      }

      return this.getDefaultInspirationAnalysis()
    } catch (error) {
      console.error("[ConductorAgent] Error analyzing inspiration:", error)
      return this.getDefaultInspirationAnalysis()
    }
  }

  /**
   * Synthesize brand analysis + inspiration into complete creative brief
   */
  private async synthesizeBrief(context: {
    input: CampaignBriefInput
    brandAnalysis: BrandAnalysis
    inspirationAnalysis: InspirationAnalysis
  }): Promise<CreativeBrief> {
    console.log("[ConductorAgent] Synthesizing creative brief...")

    const { input, brandAnalysis, inspirationAnalysis } = context

    const prompt = `You are an expert creative director creating a comprehensive creative brief for a campaign.

CAMPAIGN OBJECTIVE: ${input.objective}
TARGET PLATFORMS: ${input.platforms.join(', ')}
TARGET AUDIENCE: ${input.requirements.targetAudience || 'Not specified'}

BRAND IDENTITY:
${JSON.stringify(brandAnalysis, null, 2)}

INSPIRATION ANALYSIS:
${JSON.stringify(inspirationAnalysis, null, 2)}

DELIVERABLES REQUIRED:
${input.requirements.deliverables?.join('\n') || 'Not specified'}

CONSTRAINTS:
${input.requirements.constraints?.join('\n') || 'None specified'}

Create a detailed creative brief with:

1. **Visual Direction**: Color palette, composition style, mood, product placement
2. **Copy Direction**: Tone, voice, keywords to use/avoid
3. **Technical Specs**: Resolution, format, color space, safe zones
4. **Brand Compliance**: Required elements, prohibited elements, quality thresholds
5. **Asset Specifications**: Detailed specs for each deliverable

Return comprehensive JSON following this structure:
{
  "visualDirection": {
    "colorPalette": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "rationale": "why these colors"
    },
    "composition": {
      "style": "composition approach",
      "layout": "layout principles",
      "lighting": "lighting direction"
    },
    "mood": {
      "primary": "main mood",
      "secondary": "secondary mood",
      "avoid": ["mood1", "mood2"]
    },
    "productPlacement": {
      "prominence": "how prominent",
      "context": "setting/context",
      "angle": "camera angle"
    }
  },
  "copyDirection": {
    "tone": "overall tone",
    "voice": "brand voice",
    "keywords": ["keyword1", "keyword2"],
    "avoid": ["word1", "word2"]
  },
  "technicalSpecs": {
    "resolution": "minimum resolution",
    "format": "file formats",
    "colorSpace": "color space",
    "safeZones": "safe zone requirements"
  },
  "brandCompliance": {
    "requiredElements": ["element1", "element2"],
    "prohibitedElements": ["element1", "element2"],
    "qualityThresholds": {
      "brandAlignment": 0.85,
      "visualQuality": 0.90,
      "accessibility": "WCAG AA"
    }
  }
}`

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        temperature: 0.4,
        messages: [{
          role: "user",
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const briefData = JSON.parse(jsonMatch[0])

          // Generate asset specifications
          const assets = await this.generateAssetSpecs(input, briefData)

          return {
            ...briefData,
            assets
          }
        }
      }

      return this.getDefaultBrief(input)
    } catch (error) {
      console.error("[ConductorAgent] Error synthesizing brief:", error)
      return this.getDefaultBrief(input)
    }
  }

  /**
   * Generate detailed specifications for each asset
   */
  private async generateAssetSpecs(
    input: CampaignBriefInput,
    brief: Partial<CreativeBrief>
  ): Promise<AssetSpec[]> {
    const deliverables = input.requirements.deliverables || []
    const specs: AssetSpec[] = []

    for (let i = 0; i < deliverables.length; i++) {
      const deliverable = deliverables[i]

      specs.push({
        id: `asset-${i + 1}`,
        type: 'photo', // TODO: Infer from deliverable name
        purpose: deliverable,
        role: this.inferAssetRole(deliverable),
        specs: {
          ratio: this.inferAspectRatio(deliverable),
          composition: brief.visualDirection?.composition.style || "Professional",
          mood: brief.visualDirection?.mood.primary || "Engaging",
          colorEmphasis: brief.visualDirection?.colorPalette.primary || "#000000"
        },
        prompt: this.generateAssetPrompt(deliverable, brief)
      })
    }

    return specs
  }

  /**
   * Generate AI image generation prompt for a specific asset
   */
  private generateAssetPrompt(deliverable: string, brief: Partial<CreativeBrief>): string {
    const visualDir = brief.visualDirection
    const copyDir = brief.copyDirection

    return `Professional product photography for ${deliverable}, ${visualDir?.mood.primary || 'engaging'} mood, ${visualDir?.composition.style || 'clean modern'} composition, ${visualDir?.composition.lighting || 'natural bright'} lighting, color palette: ${visualDir?.colorPalette.primary || 'brand colors'}, ${copyDir?.tone || 'professional'} aesthetic, high quality, commercial photography`
  }

  // Helper methods
  private inferAssetRole(deliverable: string): string {
    const lower = deliverable.toLowerCase()
    if (lower.includes('hero')) return 'hero'
    if (lower.includes('product')) return 'product_shot'
    if (lower.includes('lifestyle')) return 'lifestyle'
    if (lower.includes('teaser')) return 'teaser'
    if (lower.includes('email')) return 'email_header'
    if (lower.includes('web') || lower.includes('banner')) return 'web_banner'
    if (lower.includes('story') || lower.includes('stories')) return 'story'
    return 'custom'
  }

  private inferAspectRatio(deliverable: string): string {
    const lower = deliverable.toLowerCase()
    if (lower.includes('story') || lower.includes('stories')) return '9:16'
    if (lower.includes('feed')) return '4:5'
    if (lower.includes('square')) return '1:1'
    if (lower.includes('banner')) return '16:9'
    return '4:5' // Default to Instagram feed
  }

  private getDefaultBrandAnalysis(): BrandAnalysis {
    return {
      colors: {
        primary: ["#FF6B9D"],
        secondary: ["#000000"],
        accent: ["#FFFFFF"]
      },
      typography: {
        headings: ["Sans-serif"],
        body: ["Sans-serif"]
      },
      logoUsage: {
        preferred: "Primary logo",
        variations: ["Icon", "Full"],
        placement: "Top or bottom corner"
      },
      voice: {
        tone: ["Professional", "Friendly"],
        keywords: ["Quality", "Style"],
        avoid: ["Cheap", "Sale"]
      }
    }
  }

  private getDefaultInspirationAnalysis(): InspirationAnalysis {
    return {
      visualStyle: {
        keywords: ["Modern", "Clean"],
        mood: ["Professional", "Aspirational"],
        composition: ["Balanced", "Minimal"]
      },
      colorTrends: {
        dominant: ["#000000"],
        accents: ["#FFFFFF"],
        palette: "Minimalist monochrome"
      },
      patterns: {
        layout: ["Grid", "Centered"],
        elements: ["Product focus", "Clean background"]
      }
    }
  }

  private getDefaultBrief(input: CampaignBriefInput): CreativeBrief {
    return {
      visualDirection: {
        colorPalette: {
          primary: "#FF6B9D",
          secondary: "#000000",
          accent: "#FFFFFF",
          rationale: "Classic brand colors"
        },
        composition: {
          style: "Clean and modern",
          layout: "Rule of thirds",
          lighting: "Natural and bright"
        },
        mood: {
          primary: "Professional",
          secondary: "Approachable",
          avoid: ["Too casual", "Too formal"]
        }
      },
      copyDirection: {
        tone: "Professional and friendly",
        voice: "First-person, conversational",
        keywords: ["Quality", "Style", "Confidence"],
        avoid: ["Cheap", "Discount"]
      },
      technicalSpecs: {
        resolution: "2400px minimum width",
        format: "PNG for graphics, JPG for photos",
        colorSpace: "sRGB",
        safeZones: "10% margin on all sides"
      },
      brandCompliance: {
        requiredElements: ["Logo", "Brand colors"],
        prohibitedElements: ["Competitor products"],
        qualityThresholds: {
          brandAlignment: 0.85,
          visualQuality: 0.90,
          accessibility: "WCAG AA"
        }
      },
      assets: []
    }
  }
}
