"use server"

import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq } from "drizzle-orm"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { uploadToS3 } from "@/lib/dam/s3-client"

import { promises as fs } from 'fs'
import path from 'path'

// Duplicate config from PhotoCropEditor.tsx to avoid importing client component
const CROP_CONFIGS = {
  fullVertical: { aspect: 3 / 4 },
  fullHorizontal: { aspect: 16 / 9 },
  square: { aspect: 1 / 1 },
  mediumCircle: { aspect: 1 / 1 },
  closeUpCircle: { aspect: 1 / 1 }
}

type CropType = keyof typeof CROP_CONFIGS

interface CropData {
  x: number
  y: number
  scale: number
}

interface SaveCropsParams {
  photoId: string
  crops: Partial<Record<CropType, CropData>>
}

export async function saveTeamPhotoCrops({ photoId, crops }: SaveCropsParams) {
  const db = getDb()

  // 1. Fetch photo record
  const [photo] = await db
    .select()
    .from(teamMemberPhotos)
    .where(eq(teamMemberPhotos.id, photoId))
    .limit(1)

  if (!photo) {
    throw new Error("Photo not found")
  }

  // 2. Fetch original image
  let originalBuffer: Buffer
  
  if (photo.filePath.startsWith('/')) {
    // Local file
    const fullPath = path.join(process.cwd(), 'public', photo.filePath)
    originalBuffer = await fs.readFile(fullPath)
  } else {
    // Remote URL
    const response = await fetch(photo.filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch original image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    originalBuffer = Buffer.from(arrayBuffer)
  }
  
  const updates: Partial<typeof teamMemberPhotos.$inferInsert> = {
    // Update the JSON crop data as well
    ...(crops.fullVertical && { cropFullVertical: crops.fullVertical }),
    ...(crops.fullHorizontal && { cropFullHorizontal: crops.fullHorizontal }),
    ...(crops.mediumCircle && { cropMediumCircle: crops.mediumCircle }),
    ...(crops.closeUpCircle && { cropCloseUpCircle: crops.closeUpCircle }),
    ...(crops.square && { cropSquare: crops.square }),
  }

  // 3. Process each crop
  const uploadPromises = Object.entries(crops).map(async ([type, data]) => {
    if (!data) return null
    
    const cropType = type as CropType
    const config = CROP_CONFIGS[cropType]
    
    // Target dimensions
    // We want a high quality output. Let's say base dimension 1200px.
    // For square: 1200x1200
    // For 3/4: 900x1200
    // For 16/9: 1600x900
    
    let targetWidth = 1200
    let targetHeight = 1200
    
    if (config.aspect === 3/4) {
      targetWidth = 900
      targetHeight = 1200
    } else if (config.aspect === 16/9) {
      targetWidth = 1600
      targetHeight = 900
    }
    
    try {
      const processedBuffer = await generateCrop(
        originalBuffer,
        data,
        targetWidth,
        targetHeight
      )
      
      const fileName = photo.fileName.replace(/\.[^/.]+$/, "")
      const key = `team-crops/${photo.teamMemberId}/${fileName}-${cropType}-${Date.now()}.jpg`
      
      // Use existing uploadToS3 helper but we need a File object... 
      // The helper expects a File. We can mock it or use the S3 client directly.
      // Let's use S3 client directly to avoid File object creation in Node environment
      
      const s3Client = new S3Client({
        region: process.env.AWS_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })
      
      const BUCKET_NAME = process.env.AWS_BUCKET_NAME!
      const BUCKET_URL = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
      // Or construct URL based on environment
      
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: processedBuffer,
        ContentType: "image/jpeg",
        CacheControl: "max-age=31536000"
      }))
      
      // Construct URL
      // We need to match the URL format used in the app.
      // Looking at s3-client.ts, it returns `${BUCKET_URL}/${key}`
      // I need to ensure I use the correct base URL.
      // I will read process.env.AWS_BUCKET_URL if available, or construct it.
      
      const url = process.env.AWS_BUCKET_URL 
        ? `${process.env.AWS_BUCKET_URL}/${key}`
        : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
      
      return { type: cropType, url }
      
    } catch (err) {
      console.error(`Failed to generate crop ${cropType}`, err)
      return null
    }
  })
  
  const results = await Promise.all(uploadPromises)
  
  results.forEach(result => {
    if (!result) return
    
    switch (result.type) {
      case "fullVertical": updates.cropFullVerticalUrl = result.url; break;
      case "fullHorizontal": updates.cropFullHorizontalUrl = result.url; break;
      case "mediumCircle": updates.cropMediumCircleUrl = result.url; break;
      case "closeUpCircle": updates.cropCloseUpCircleUrl = result.url; break;
      case "square": updates.cropSquareUrl = result.url; break;
    }
  })

  // 4. Update DB
  await db
    .update(teamMemberPhotos)
    .set({
        ...updates,
        updatedAt: new Date()
    })
    .where(eq(teamMemberPhotos.id, photoId))
    
  return { success: true, updates }
}

async function generateCrop(
  originalBuffer: Buffer,
  data: CropData,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  const { x, y, scale } = data
  
  const image = sharp(originalBuffer)
  const metadata = await image.metadata()
  const originalWidth = metadata.width || 1000
  const originalHeight = metadata.height || 1000
  
  // Calculate dimensions to cover the target box
  const ratioImg = originalWidth / originalHeight
  const ratioTarget = targetWidth / targetHeight
  
  let coverWidth, coverHeight
  
  if (ratioImg > ratioTarget) {
    // Image is wider than target
    coverHeight = targetHeight
    coverWidth = targetHeight * ratioImg
  } else {
    // Image is taller than target
    coverWidth = targetWidth
    coverHeight = targetWidth / ratioImg
  }
  
  // Apply user scale
  const scaledWidth = coverWidth * scale
  const scaledHeight = coverHeight * scale
  
  // Calculate offsets to center the focal point (x%, y%)
  // Formula: CenterOfContainer - PointInImage
  // PointInImage = scaledDimension * (percent / 100)
  // CenterOfContainer = targetDimension / 2
  
  const left = Math.round((targetWidth / 2) - (scaledWidth * (x / 100)))
  const top = Math.round((targetHeight / 2) - (scaledHeight * (y / 100)))
  
  // Pipeline:
  // 1. Resize original to scaled dimensions
  // 2. Extend/Composite onto a transparent canvas of target size
  
  // Note: Sharp resize might be slow for very large images if we scale UP a lot.
  // But usually we are scaling down from a high res photo.
  
  return image
    .resize({
        width: Math.round(scaledWidth),
        height: Math.round(scaledHeight),
        fit: 'fill'
    })
    .toBuffer()
    .then(buffer => {
         return sharp({
            create: {
                width: targetWidth,
                height: targetHeight,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for JPG
            }
         })
         .composite([{
             input: buffer,
             left: left,
             top: top
         }])
         .jpeg({ quality: 90 })
         .toBuffer()
    })
}

