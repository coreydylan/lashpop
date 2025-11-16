/**
 * Content Scraping Service
 *
 * Scrapes content from various sources:
 * - Instagram profiles (public data)
 * - Websites
 * - Social media profiles
 *
 * Extracts images, metadata, and content for brand analysis
 */

import * as cheerio from 'cheerio'

export interface ScrapedImage {
  url: string
  alt?: string
  width?: number
  height?: number
  source: string
}

export interface ScrapedContent {
  images: ScrapedImage[]
  logoUrl?: string
  faviconUrl?: string
  title?: string
  description?: string
  colors?: string[]
  metadata: Record<string, any>
}

/**
 * Scrapes a website for images and brand assets
 */
export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const images: ScrapedImage[] = []
    const metadata: Record<string, any> = {}

    // Extract all images
    $('img').each((_, el) => {
      const src = $(el).attr('src')
      if (!src) return

      // Resolve relative URLs
      let imageUrl = src
      if (src.startsWith('/')) {
        const urlObj = new URL(url)
        imageUrl = `${urlObj.origin}${src}`
      } else if (!src.startsWith('http')) {
        const urlObj = new URL(url)
        imageUrl = `${urlObj.origin}/${src}`
      }

      images.push({
        url: imageUrl,
        alt: $(el).attr('alt'),
        width: parseInt($(el).attr('width') || '0'),
        height: parseInt($(el).attr('height') || '0'),
        source: 'website'
      })
    })

    // Extract logo
    let logoUrl: string | undefined

    // Try og:image
    const ogImage = $('meta[property="og:image"]').attr('content')
    if (ogImage) logoUrl = ogImage

    // Try common logo selectors
    const logoSelectors = [
      'img[class*="logo" i]',
      'img[id*="logo" i]',
      'img[alt*="logo" i]',
      '.logo img',
      '#logo img',
      'header img:first'
    ]

    for (const selector of logoSelectors) {
      const logo = $(selector).first().attr('src')
      if (logo) {
        logoUrl = logo
        break
      }
    }

    // Extract favicon
    let faviconUrl: string | undefined
    const favicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href')

    if (favicon) {
      if (favicon.startsWith('/')) {
        const urlObj = new URL(url)
        faviconUrl = `${urlObj.origin}${favicon}`
      } else if (!favicon.startsWith('http')) {
        const urlObj = new URL(url)
        faviconUrl = `${urlObj.origin}/${favicon}`
      } else {
        faviconUrl = favicon
      }
    }

    // Extract title and description
    const title =
      $('meta[property="og:title"]').attr('content') || $('title').text() || undefined
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      undefined

    // Extract colors from CSS
    const colors: string[] = []
    $('style').each((_, el) => {
      const css = $(el).html() || ''
      const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g
      const matches = css.match(colorRegex)
      if (matches) {
        matches.forEach((color) => {
          if (!colors.includes(color.toUpperCase())) {
            colors.push(color.toUpperCase())
          }
        })
      }
    })

    // Extract metadata
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property')
      const content = $(el).attr('content')
      if (name && content) {
        metadata[name] = content
      }
    })

    return {
      images: images.slice(0, 50), // Limit to 50 images
      logoUrl,
      faviconUrl,
      title,
      description,
      colors: Array.from(new Set(colors)).slice(0, 20),
      metadata
    }
  } catch (error) {
    console.error('Website scraping error:', error)
    throw error
  }
}

/**
 * Scrapes Instagram profile for public data
 * Note: This uses Instagram's public API/endpoints
 */
export async function scrapeInstagram(username: string): Promise<ScrapedContent> {
  try {
    // Instagram's public JSON endpoint
    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    })

    if (!response.ok) {
      // Fallback to HTML scraping
      return await scrapeInstagramFallback(username)
    }

    const data = await response.json()
    const userData = data?.graphql?.user || data?.user

    if (!userData) {
      throw new Error('Could not find user data')
    }

    const images: ScrapedImage[] = []
    const posts =
      userData.edge_owner_to_timeline_media?.edges ||
      userData.edge_felix_video_timeline?.edges ||
      []

    posts.slice(0, 20).forEach((edge: any) => {
      const node = edge.node
      if (node.display_url) {
        images.push({
          url: node.display_url,
          alt: node.accessibility_caption || node.edge_media_to_caption?.edges[0]?.node?.text,
          width: node.dimensions?.width,
          height: node.dimensions?.height,
          source: 'instagram'
        })
      }
    })

    return {
      images,
      logoUrl: userData.profile_pic_url_hd || userData.profile_pic_url,
      title: userData.full_name || username,
      description: userData.biography,
      metadata: {
        username: userData.username,
        followers: userData.edge_followed_by?.count,
        following: userData.edge_follow?.count,
        posts: userData.edge_owner_to_timeline_media?.count,
        isVerified: userData.is_verified,
        isPrivate: userData.is_private,
        externalUrl: userData.external_url,
        category: userData.category_name
      }
    }
  } catch (error) {
    console.error('Instagram scraping error:', error)
    throw error
  }
}

/**
 * Fallback Instagram scraper using HTML parsing
 */
async function scrapeInstagramFallback(username: string): Promise<ScrapedContent> {
  try {
    const url = `https://www.instagram.com/${username}/`
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    const html = await response.text()

    // Extract JSON data from script tags
    const scriptRegex = /<script type="application\/ld\+json">(.*?)<\/script>/gs
    const matches = html.match(scriptRegex)

    const images: ScrapedImage[] = []
    let metadata: Record<string, any> = {}

    if (matches) {
      matches.forEach((match) => {
        try {
          const jsonStr = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '')
          const data = JSON.parse(jsonStr)

          if (data.image) {
            if (Array.isArray(data.image)) {
              data.image.forEach((img: string) => {
                images.push({ url: img, source: 'instagram' })
              })
            } else {
              images.push({ url: data.image, source: 'instagram' })
            }
          }

          if (data.author) {
            metadata = {
              ...metadata,
              author: data.author
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      })
    }

    return {
      images,
      title: username,
      metadata
    }
  } catch (error) {
    console.error('Instagram fallback scraping error:', error)
    throw error
  }
}

/**
 * Downloads and converts an image to base64
 */
export async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString('base64')
  } catch (error) {
    console.error('Image to base64 error:', error)
    throw error
  }
}

/**
 * Validates image URL and checks if accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    return response.ok && contentType?.startsWith('image/') === true
  } catch (error) {
    return false
  }
}

/**
 * Filters images by size (removes very small images like icons)
 */
export function filterImagesBySize(
  images: ScrapedImage[],
  minWidth = 200,
  minHeight = 200
): ScrapedImage[] {
  return images.filter((img) => {
    if (!img.width || !img.height) return true // Include if dimensions unknown
    return img.width >= minWidth && img.height >= minHeight
  })
}
