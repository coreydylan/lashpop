import OpenAI from "openai"
import type {
  AssetSpec,
  CreativeBrief,
  GenerationResult,
  GeneratedAsset
} from "@/types/campaign"

/**
 * Specialist Generation Agent
 *
 * Responsibilities:
 * 1. Interpret asset spec from creative brief
 * 2. Select optimal AI model for generation
 * 3. Craft perfect prompt
 * 4. Generate asset with retry logic
 * 5. Return asset with metadata
 */
export class SpecialistGenerationAgent {
  private openai: OpenAI
  private spec: AssetSpec
  private brief: CreativeBrief
  private maxAttempts: number = 3

  constructor(config: {
    spec: AssetSpec
    brief: CreativeBrief
    maxAttempts?: number
  }) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required")
    }
    this.openai = new OpenAI({ apiKey })
    this.spec = config.spec
    this.brief = config.brief
    if (config.maxAttempts) this.maxAttempts = config.maxAttempts
  }

  /**
   * Main generation method
   */
  async generate(): Promise<GeneratedAsset> {
    console.log(`[GenerationAgent] Generating asset: ${this.spec.purpose}`)

    const startTime = Date.now()

    // Step 1: Interpret the brief for this specific asset
    const interpretation = this.interpretBrief()

    // Step 2: Select optimal model
    const model = this.selectModel()

    // Step 3: Craft the perfect prompt
    const prompt = this.craftPrompt(interpretation)

    // Step 4: Generate with retry logic
    const result = await this.generateWithRetry({
      model,
      prompt,
      maxAttempts: this.maxAttempts
    })

    const generationTime = Date.now() - startTime

    // Step 5: Return with metadata
    return {
      assetId: this.spec.id,
      url: result.url,
      role: this.spec.role,
      platform: this.spec.platform,
      status: 'generated',
      metadata: {
        model,
        prompt,
        cost: result.cost,
        generationTime,
        attempt: result.attempt
      }
    }
  }

  /**
   * Interpret the brief for this specific asset
   */
  private interpretBrief(): {
    style: string
    mood: string
    composition: string
    colors: string
    lighting: string
  } {
    return {
      style: this.brief.visualDirection.composition.style,
      mood: this.brief.visualDirection.mood.primary,
      composition: this.brief.visualDirection.composition.layout,
      colors: this.brief.visualDirection.colorPalette.primary,
      lighting: this.brief.visualDirection.composition.lighting
    }
  }

  /**
   * Select the best AI model for this asset type
   */
  private selectModel(): string {
    // For now, default to DALL-E 3
    // In the future, this could intelligently choose between:
    // - DALL-E 3 for photorealistic images
    // - Midjourney for artistic images (via API when available)
    // - Stable Diffusion for customizable generation
    return "dall-e-3"
  }

  /**
   * Craft the perfect generation prompt
   */
  private craftPrompt(interpretation: ReturnType<typeof this.interpretBrief>): string {
    // Start with base prompt from spec or generate one
    let prompt = this.spec.prompt || this.spec.purpose

    // Enhance with brief details
    const enhancements = []

    // Add composition details
    if (interpretation.composition) {
      enhancements.push(`${interpretation.composition} composition`)
    }

    // Add mood
    if (interpretation.mood) {
      enhancements.push(`${interpretation.mood} mood`)
    }

    // Add lighting
    if (interpretation.lighting) {
      enhancements.push(`${interpretation.lighting} lighting`)
    }

    // Add style
    if (interpretation.style) {
      enhancements.push(`${interpretation.style} style`)
    }

    // Add color guidance
    if (interpretation.colors) {
      enhancements.push(`color palette featuring ${interpretation.colors}`)
    }

    // Add technical quality requirements
    enhancements.push("high quality professional photography")
    enhancements.push("commercial grade")

    // Combine
    const enhancedPrompt = `${prompt}, ${enhancements.join(', ')}`

    // Ensure prompt isn't too long (DALL-E has a 4000 char limit)
    return enhancedPrompt.substring(0, 3900)
  }

  /**
   * Generate with retry logic
   */
  private async generateWithRetry(config: {
    model: string
    prompt: string
    maxAttempts: number
  }): Promise<{
    url: string
    cost: number
    attempt: number
  }> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        console.log(`[GenerationAgent] Attempt ${attempt}/${config.maxAttempts}`)

        const response = await this.openai.images.generate({
          model: config.model,
          prompt: config.prompt,
          n: 1,
          size: this.getImageSize(),
          quality: "hd",
          style: "natural"
        })

        const imageUrl = response.data[0]?.url

        if (!imageUrl) {
          throw new Error("No image URL in response")
        }

        // Calculate cost (approximate)
        // DALL-E 3 HD: $0.080 per image for 1024x1024, $0.120 for 1024x1792/1792x1024
        const cost = this.getImageSize() === "1024x1024" ? 8 : 12 // in cents

        return {
          url: imageUrl,
          cost,
          attempt
        }
      } catch (error) {
        console.error(`[GenerationAgent] Attempt ${attempt} failed:`, error)
        lastError = error as Error

        // Wait before retry (exponential backoff)
        if (attempt < config.maxAttempts) {
          const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s...
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    throw new Error(`Generation failed after ${config.maxAttempts} attempts: ${lastError?.message}`)
  }

  /**
   * Determine image size based on aspect ratio
   */
  private getImageSize(): "1024x1024" | "1024x1792" | "1792x1024" {
    const ratio = this.spec.specs.ratio || "1:1"

    if (ratio === "9:16" || ratio.includes("story")) {
      return "1024x1792" // Portrait
    } else if (ratio === "16:9") {
      return "1792x1024" // Landscape
    } else {
      return "1024x1024" // Square (default)
    }
  }
}

/**
 * Parallel Generation Orchestrator
 *
 * Manages multiple specialist agents generating in parallel
 */
export class ParallelGenerationOrchestrator {
  private brief: CreativeBrief
  private maxConcurrent: number = 5 // Generate max 5 at a time to avoid rate limits

  constructor(brief: CreativeBrief, maxConcurrent?: number) {
    this.brief = brief
    if (maxConcurrent) this.maxConcurrent = maxConcurrent
  }

  /**
   * Generate all assets in parallel (with concurrency limit)
   */
  async generateAll(
    onProgress?: (progress: {
      total: number
      completed: number
      inProgress: number
      failed: number
    }) => void
  ): Promise<GeneratedAsset[]> {
    const assets = this.brief.assets
    const results: GeneratedAsset[] = []
    const errors: Array<{ assetId: string; error: Error }> = []

    console.log(`[ParallelGeneration] Generating ${assets.length} assets with max ${this.maxConcurrent} concurrent`)

    // Process in batches to respect concurrency limit
    for (let i = 0; i < assets.length; i += this.maxConcurrent) {
      const batch = assets.slice(i, i + this.maxConcurrent)

      const batchPromises = batch.map(async (spec) => {
        try {
          const agent = new SpecialistGenerationAgent({
            spec,
            brief: this.brief
          })
          const result = await agent.generate()
          results.push(result)

          // Report progress
          if (onProgress) {
            onProgress({
              total: assets.length,
              completed: results.length,
              inProgress: batch.length - results.length + i,
              failed: errors.length
            })
          }

          return result
        } catch (error) {
          console.error(`[ParallelGeneration] Failed to generate ${spec.id}:`, error)
          errors.push({ assetId: spec.id, error: error as Error })

          // Report progress
          if (onProgress) {
            onProgress({
              total: assets.length,
              completed: results.length,
              inProgress: batch.length - results.length + i,
              failed: errors.length
            })
          }

          return null
        }
      })

      // Wait for batch to complete
      await Promise.all(batchPromises)
    }

    console.log(`[ParallelGeneration] Complete. Success: ${results.length}, Failed: ${errors.length}`)

    return results
  }
}
