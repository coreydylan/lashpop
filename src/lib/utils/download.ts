/**
 * Download Utilities for DAM
 *
 * Provides functions for downloading assets, creating ZIPs, and exporting metadata
 * Uses only native browser APIs (no external dependencies)
 */

interface Asset {
  id: string
  fileName: string
  filePath: string
  fileType: "image" | "video"
  uploadedAt: Date
  teamMemberId?: string
  tags?: Array<{
    id: string
    name: string
    displayName: string
    category: {
      id: string
      name: string
      displayName: string
      color?: string
    }
  }>
}

/**
 * Download a single file from a URL
 */
export async function downloadSingleFile(
  url: string,
  filename: string
): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the blob URL after a short delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  } catch (error) {
    console.error('Failed to download file:', error)
    throw new Error(`Failed to download ${filename}`)
  }
}

/**
 * Create and download a ZIP file from multiple assets
 * Uses a simple ZIP implementation with native browser APIs
 */
export async function downloadAsZip(
  assets: Asset[],
  zipFilename: string = 'assets.zip'
): Promise<void> {
  if (assets.length === 0) {
    throw new Error('No assets to download')
  }

  // For a single file, just download it directly
  if (assets.length === 1) {
    const asset = assets[0]
    await downloadSingleFile(asset.filePath, asset.fileName)
    return
  }

  try {
    // Fetch all files
    const filePromises = assets.map(async (asset) => {
      try {
        const response = await fetch(asset.filePath)
        if (!response.ok) {
          console.warn(`Failed to fetch ${asset.fileName}`)
          return null
        }
        const blob = await response.blob()
        return {
          name: asset.fileName,
          blob: blob,
          date: asset.uploadedAt
        }
      } catch (error) {
        console.warn(`Error fetching ${asset.fileName}:`, error)
        return null
      }
    })

    const files = (await Promise.all(filePromises)).filter((f): f is NonNullable<typeof f> => f !== null)

    if (files.length === 0) {
      throw new Error('Failed to fetch any files')
    }

    // Create ZIP file using native implementation
    const zipBlob = await createZipBlob(files)

    // Download the ZIP
    const blobUrl = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = zipFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  } catch (error) {
    console.error('Failed to create ZIP:', error)
    throw new Error('Failed to create ZIP file')
  }
}

/**
 * Create a ZIP blob from files using native browser APIs
 * Implements basic ZIP file format (STORE method - no compression)
 */
async function createZipBlob(
  files: Array<{ name: string; blob: Blob; date: Date }>
): Promise<Blob> {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const centralDirectory: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const fileData = new Uint8Array(await file.blob.arrayBuffer())
    const fileName = encoder.encode(file.name)
    const crc32 = calculateCRC32(fileData)
    const dosTime = dateToDosTime(file.date)
    const dosDate = dateToDosDate(file.date)

    // Local file header
    const localHeader = new Uint8Array(30 + fileName.length)
    const view = new DataView(localHeader.buffer)

    view.setUint32(0, 0x04034b50, true) // Local file header signature
    view.setUint16(4, 0x000a, true) // Version needed to extract
    view.setUint16(6, 0x0000, true) // General purpose bit flag
    view.setUint16(8, 0x0000, true) // Compression method (0 = STORE)
    view.setUint16(10, dosTime, true) // File last modification time
    view.setUint16(12, dosDate, true) // File last modification date
    view.setUint32(14, crc32, true) // CRC-32
    view.setUint32(18, fileData.length, true) // Compressed size
    view.setUint32(22, fileData.length, true) // Uncompressed size
    view.setUint16(26, fileName.length, true) // File name length
    view.setUint16(28, 0, true) // Extra field length

    localHeader.set(fileName, 30)

    chunks.push(localHeader)
    chunks.push(fileData)

    // Central directory header
    const centralHeader = new Uint8Array(46 + fileName.length)
    const centralView = new DataView(centralHeader.buffer)

    centralView.setUint32(0, 0x02014b50, true) // Central directory signature
    centralView.setUint16(4, 0x0014, true) // Version made by
    centralView.setUint16(6, 0x000a, true) // Version needed to extract
    centralView.setUint16(8, 0x0000, true) // General purpose bit flag
    centralView.setUint16(10, 0x0000, true) // Compression method
    centralView.setUint16(12, dosTime, true) // File last modification time
    centralView.setUint16(14, dosDate, true) // File last modification date
    centralView.setUint32(16, crc32, true) // CRC-32
    centralView.setUint32(20, fileData.length, true) // Compressed size
    centralView.setUint32(24, fileData.length, true) // Uncompressed size
    centralView.setUint16(28, fileName.length, true) // File name length
    centralView.setUint16(30, 0, true) // Extra field length
    centralView.setUint16(32, 0, true) // File comment length
    centralView.setUint16(34, 0, true) // Disk number start
    centralView.setUint16(36, 0, true) // Internal file attributes
    centralView.setUint32(38, 0, true) // External file attributes
    centralView.setUint32(42, offset, true) // Relative offset of local header

    centralHeader.set(fileName, 46)

    centralDirectory.push(centralHeader)

    offset += localHeader.length + fileData.length
  }

  // End of central directory record
  const centralDirSize = centralDirectory.reduce((sum, arr) => sum + arr.length, 0)
  const endOfCentralDir = new Uint8Array(22)
  const endView = new DataView(endOfCentralDir.buffer)

  endView.setUint32(0, 0x06054b50, true) // End of central directory signature
  endView.setUint16(4, 0, true) // Number of this disk
  endView.setUint16(6, 0, true) // Disk where central directory starts
  endView.setUint16(8, files.length, true) // Number of central directory records on this disk
  endView.setUint16(10, files.length, true) // Total number of central directory records
  endView.setUint32(12, centralDirSize, true) // Size of central directory
  endView.setUint32(16, offset, true) // Offset of start of central directory
  endView.setUint16(20, 0, true) // Comment length

  // Combine all parts
  return new Blob([...chunks, ...centralDirectory, endOfCentralDir], { type: 'application/zip' })
}

/**
 * Calculate CRC-32 checksum
 */
function calculateCRC32(data: Uint8Array): number {
  const table = makeCRCTable()
  let crc = 0 ^ (-1)

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff]
  }

  return (crc ^ (-1)) >>> 0
}

/**
 * Generate CRC-32 lookup table
 */
function makeCRCTable(): Uint32Array {
  const table = new Uint32Array(256)

  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c
  }

  return table
}

/**
 * Convert Date to DOS time format
 */
function dateToDosTime(date: Date): number {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = Math.floor(date.getSeconds() / 2)
  return (hours << 11) | (minutes << 5) | seconds
}

/**
 * Convert Date to DOS date format
 */
function dateToDosDate(date: Date): number {
  const year = date.getFullYear() - 1980
  const month = date.getMonth() + 1
  const day = date.getDate()
  return (year << 9) | (month << 5) | day
}

/**
 * Export asset metadata as CSV
 */
export function exportMetadataAsCSV(
  assets: Asset[],
  filename: string = 'assets-metadata.csv'
): void {
  if (assets.length === 0) {
    throw new Error('No assets to export')
  }

  // Build CSV header
  const headers = [
    'ID',
    'Filename',
    'File Type',
    'Upload Date',
    'Team Member ID',
    'Tags',
    'File Path'
  ]

  // Build CSV rows
  const rows = assets.map(asset => {
    const tags = asset.tags
      ? asset.tags.map(tag => `${tag.category.displayName}: ${tag.displayName}`).join('; ')
      : ''

    return [
      escapeCsvValue(asset.id),
      escapeCsvValue(asset.fileName),
      escapeCsvValue(asset.fileType),
      escapeCsvValue(asset.uploadedAt.toISOString()),
      escapeCsvValue(asset.teamMemberId || ''),
      escapeCsvValue(tags),
      escapeCsvValue(asset.filePath)
    ]
  })

  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Create and download the CSV file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const blobUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
}

/**
 * Escape CSV values (handle quotes, commas, newlines)
 */
function escapeCsvValue(value: string): string {
  if (!value) return '""'

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

/**
 * Download multiple files individually (fallback when ZIP fails)
 */
export async function downloadFilesIndividually(assets: Asset[]): Promise<void> {
  if (assets.length === 0) {
    throw new Error('No assets to download')
  }

  const errors: string[] = []

  for (const asset of assets) {
    try {
      await downloadSingleFile(asset.filePath, asset.fileName)
      // Add a small delay between downloads to avoid browser throttling
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error(`Failed to download ${asset.fileName}:`, error)
      errors.push(asset.fileName)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Failed to download ${errors.length} files: ${errors.join(', ')}`)
  }
}
