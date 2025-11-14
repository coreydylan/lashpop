/**
 * fal.ai Client Utility
 *
 * Handles AI-powered lash application using SDXL inpainting.
 */

// @ts-ignore - Optional dependency for lash try-on feature
import * as fal from '@fal-ai/serverless-client'

export type LashType = 'classic' | 'hybrid' | 'volume' | 'wet'

export interface LashInpaintingRequest {
  imageUrl: string
  maskUrl: string
  lashType: LashType
}

export interface LashInpaintingResult {
  imageUrl: string
  lashType: LashType
}

/**
 * Initialize fal.ai client with API key
 */
export function initializeFalClient(apiKey: string) {
  fal.config({
    credentials: apiKey
  })
}

/**
 * Get prompt for specific lash type
 */
function getLashPrompt(lashType: LashType): string {
  const basePrompt = 'Add natural eyelash extensions only, preserve facial features exactly, keep eyes unchanged, maintain skin texture, professional lash application'

  const lashPrompts: Record<LashType, string> = {
    classic: 'single strand classic lash extensions, natural separated lashes, subtle enhancement',
    hybrid: 'hybrid lash extensions, mix of classic and volume, medium fullness',
    volume: 'russian volume lash extensions, dense fluffy fans, dramatic full lashes',
    wet: 'wet set lash extensions, glossy mascara effect, bold dark lashes'
  }

  return `${basePrompt}, ${lashPrompts[lashType]}`
}

/**
 * Get negative prompt (same for all lash types)
 */
function getNegativePrompt(): string {
  return 'deformed eyes, deformed face, changed eyes, different eyes, face modification, eye reconstruction, blurry, distorted, bad anatomy, closed eyes, unnatural, fake skin'
}

/**
 * Apply lash extensions to image using SDXL inpainting
 */
export async function applyLashesWithInpainting(
  request: LashInpaintingRequest
): Promise<LashInpaintingResult> {
  const prompt = getLashPrompt(request.lashType)
  const negativePrompt = getNegativePrompt()

  try {
    console.log(`Calling fal.ai for ${request.lashType} lashes...`)
    console.log('Image URL:', request.imageUrl)
    console.log('Mask URL:', request.maskUrl)
    console.log('Prompt:', prompt)

    const result = await fal.subscribe('fal-ai/fast-turbo-diffusion/inpainting', {
      input: {
        image_url: request.imageUrl,
        mask_url: request.maskUrl,
        prompt,
        negative_prompt: negativePrompt,
        guidance_scale: 2.0, // Fast turbo model requires ≤ 2.0
        num_inference_steps: 8, // Fast turbo diffusion uses fewer steps
        strength: 0.35, // Lower strength preserves more of the original face
        seed: Math.floor(Math.random() * 1000000)
      },
      logs: true,
      onQueueUpdate: (update: any) => {
        console.log('Queue update:', update.status, update)
      }
    })

    console.log(`${request.lashType} lashes generated successfully!`)
    return {
      imageUrl: (result as any).images[0].url,
      lashType: request.lashType
    }
  } catch (error) {
    console.error('Error applying lashes:', error)
    if (error && typeof error === 'object') {
      if ('body' in error) {
        console.error('Error body:', JSON.stringify((error as any).body, null, 2))
      }
      if ('message' in error) {
        console.error('Error message:', (error as any).message)
      }
    }
    throw new Error(`Failed to apply ${request.lashType} lashes`)
  }
}

/**
 * Generate all lash types for a given image
 */
export async function generateAllLashTypes(
  imageUrl: string,
  maskUrl: string
): Promise<Record<LashType, string>> {
  const lashTypes: LashType[] = ['classic', 'hybrid', 'volume', 'wet']

  const results = await Promise.all(
    lashTypes.map(lashType =>
      applyLashesWithInpainting({ imageUrl, maskUrl, lashType })
    )
  )

  return {
    classic: results[0].imageUrl,
    hybrid: results[1].imageUrl,
    volume: results[2].imageUrl,
    wet: results[3].imageUrl
  }
}

/**
 * Alternative: Use regular SDXL inpainting (slower but higher quality)
 */
export async function applyLashesWithSDXL(
  request: LashInpaintingRequest
): Promise<LashInpaintingResult> {
  const prompt = getLashPrompt(request.lashType)
  const negativePrompt = getNegativePrompt()

  try {
    const result = await fal.subscribe('fal-ai/inpaint', {
      input: {
        image_url: request.imageUrl,
        mask_url: request.maskUrl,
        prompt,
        negative_prompt: negativePrompt,
        guidance_scale: 7.5,
        num_inference_steps: 25,
        strength: 0.75,
        seed: Math.floor(Math.random() * 1000000)
      },
      logs: false
    })

    return {
      imageUrl: (result as any).images[0].url,
      lashType: request.lashType
    }
  } catch (error) {
    console.error('Error applying lashes:', error)
    throw new Error(`Failed to apply ${request.lashType} lashes`)
  }
}
