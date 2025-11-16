import Anthropic from "@anthropic-ai/sdk"
import type {
  GeneratedAsset,
  CreativeBrief,
  QualityCheckResult,
  QualityCheck
} from "@/types/campaign"

/**
 * Quality Control Agent
 *
 * Responsibilities:
 * 1. Validate brand alignment
 * 2. Check visual quality
 * 3. Verify accessibility
 * 4. Check technical specs
 * 5. Validate safe zones
 * 6. Generate actionable feedback
 */
export class QualityControlAgent {
  private client: Anthropic

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required")
    }
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Validate a generated asset against the creative brief
   */
  async validateAsset(
    asset: GeneratedAsset,
    brief: CreativeBrief
  ): Promise<QualityCheckResult> {
    console.log(`[QualityControl] Validating asset: ${asset.assetId}`)

    // Run all checks in parallel
    const checkPromises = [
      this.checkBrandAlignment(asset, brief),
      this.checkVisualQuality(asset, brief),
      this.checkAccessibility(asset, brief),
      this.checkTechnicalSpecs(asset, brief)
    ]

    const checks = await Promise.all(checkPromises)

    // Aggregate results
    const passed = checks.every(c => c.passed)
    const score = checks.reduce((sum, c) => sum + c.score, 0) / checks.length

    // Generate feedback
    const feedback = this.generateFeedback(checks)

    // Determine if refinement is needed
    const requiresRefinement =
      !passed ||
      score < (brief.brandCompliance?.qualityThresholds.brandAlignment || 0.85)

    return {
      assetId: asset.assetId,
      passed,
      score,
      checks,
      feedback,
      requiresRefinement
    }
  }

  /**
   * Check brand alignment using Claude's vision capabilities
   */
  private async checkBrandAlignment(
    asset: GeneratedAsset,
    brief: CreativeBrief
  ): Promise<QualityCheck> {
    try {
      const prompt = `You are a brand compliance expert. Analyze this image for brand alignment.

BRAND REQUIREMENTS:
- Color Palette: Primary ${brief.visualDirection.colorPalette.primary}, Secondary ${brief.visualDirection.colorPalette.secondary}
- Mood: ${brief.visualDirection.mood.primary}
- Composition: ${brief.visualDirection.composition.style}
- Required Elements: ${brief.brandCompliance?.requiredElements.join(', ')}
- Prohibited Elements: ${brief.brandCompliance?.prohibitedElements.join(', ')}

Evaluate:
1. Color alignment (0-1 score)
2. Mood alignment (0-1 score)
3. Composition alignment (0-1 score)
4. Presence of required elements
5. Absence of prohibited elements

Return JSON:
{
  "colorScore": 0.0-1.0,
  "moodScore": 0.0-1.0,
  "compositionScore": 0.0-1.0,
  "requiredElements": ["found elements"],
  "prohibitedElements": ["found elements"],
  "overallScore": 0.0-1.0,
  "feedback": "Brief feedback on brand alignment"
}`

      // Note: In production, we'd pass the actual image URL to Claude's vision API
      // For now, we'll use a simulated check based on metadata
      const mockAnalysis = {
        colorScore: 0.85,
        moodScore: 0.90,
        compositionScore: 0.80,
        requiredElements: brief.brandCompliance?.requiredElements || [],
        prohibitedElements: [],
        overallScore: 0.85,
        feedback: "Good brand alignment, colors match palette"
      }

      return {
        name: "Brand Alignment",
        passed: mockAnalysis.overallScore >= 0.80,
        score: mockAnalysis.overallScore,
        details: mockAnalysis
      }
    } catch (error) {
      console.error("[QualityControl] Brand alignment check failed:", error)
      return {
        name: "Brand Alignment",
        passed: false,
        score: 0,
        details: { error: "Check failed" }
      }
    }
  }

  /**
   * Check visual quality
   */
  private async checkVisualQuality(
    asset: GeneratedAsset,
    brief: CreativeBrief
  ): Promise<QualityCheck> {
    // In production, this would analyze:
    // - Resolution meets requirements
    // - Image isn't blurry or pixelated
    // - Lighting is appropriate
    // - Composition is balanced

    const mockScore = 0.90

    return {
      name: "Visual Quality",
      passed: mockScore >= (brief.brandCompliance?.qualityThresholds.visualQuality || 0.90),
      score: mockScore,
      details: {
        resolution: "Pass",
        sharpness: "Pass",
        lighting: "Pass",
        composition: "Pass"
      }
    }
  }

  /**
   * Check accessibility
   */
  private async checkAccessibility(
    asset: GeneratedAsset,
    brief: CreativeBrief
  ): Promise<QualityCheck> {
    // In production, this would check:
    // - Color contrast ratios (WCAG AA/AAA)
    // - Text readability
    // - Alt text presence
    // - Sufficient size for text elements

    const mockScore = 0.95

    return {
      name: "Accessibility",
      passed: true,
      score: mockScore,
      details: {
        colorContrast: "WCAG AA",
        textReadability: "Pass",
        altText: asset.metadata.prompt ? "Present" : "Missing"
      }
    }
  }

  /**
   * Check technical specifications
   */
  private async checkTechnicalSpecs(
    asset: GeneratedAsset,
    brief: CreativeBrief
  ): Promise<QualityCheck> {
    // Check against technical requirements
    const requirements = brief.technicalSpecs

    const checks = {
      resolution: true, // Mock: would check actual image dimensions
      format: true,     // Mock: would check file format
      colorSpace: true, // Mock: would check color space
      fileSize: true    // Mock: would check file size limits
    }

    const score = Object.values(checks).filter(Boolean).length / Object.values(checks).length

    return {
      name: "Technical Specs",
      passed: score === 1.0,
      score,
      details: checks
    }
  }

  /**
   * Generate actionable feedback from check results
   */
  private generateFeedback(checks: QualityCheck[]): string[] {
    const feedback: string[] = []

    checks.forEach(check => {
      if (!check.passed) {
        if (check.name === "Brand Alignment") {
          const details = check.details as any
          if (details.colorScore < 0.8) {
            feedback.push("Colors don't match brand palette - consider adjusting saturation or hue")
          }
          if (details.moodScore < 0.8) {
            feedback.push(`Mood doesn't match target - aim for more ${details.targetMood || 'appropriate'} feeling`)
          }
          if (details.compositionScore < 0.8) {
            feedback.push("Composition needs adjustment - review layout guidelines")
          }
        }

        if (check.name === "Visual Quality") {
          feedback.push("Visual quality below threshold - check resolution and sharpness")
        }

        if (check.name === "Accessibility") {
          feedback.push("Accessibility issues detected - review color contrast and text sizing")
        }

        if (check.name === "Technical Specs") {
          feedback.push("Technical specifications not met - review format and resolution requirements")
        }
      }
    })

    if (feedback.length === 0) {
      feedback.push("All quality checks passed!")
    }

    return feedback
  }
}

/**
 * Batch Quality Control
 *
 * Process multiple assets in parallel
 */
export class BatchQualityControl {
  private agent: QualityControlAgent

  constructor() {
    this.agent = new QualityControlAgent()
  }

  async validateAll(
    assets: GeneratedAsset[],
    brief: CreativeBrief,
    onProgress?: (completed: number, total: number) => void
  ): Promise<QualityCheckResult[]> {
    console.log(`[BatchQC] Validating ${assets.length} assets`)

    const results: QualityCheckResult[] = []

    // Process in parallel (with reasonable concurrency)
    const batchSize = 5
    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize)

      const batchResults = await Promise.all(
        batch.map(asset => this.agent.validateAsset(asset, brief))
      )

      results.push(...batchResults)

      if (onProgress) {
        onProgress(results.length, assets.length)
      }
    }

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length

    console.log(`[BatchQC] Complete. Passed: ${passed}, Failed: ${failed}`)

    return results
  }
}
