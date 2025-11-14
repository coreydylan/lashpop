/**
 * MediaPipe Face Detection Utilities
 *
 * Provides real-time face detection and validation for selfie capture.
 * Uses Google's MediaPipe Face Landmarker for browser-based detection.
 */

// @ts-ignore - Optional dependency for lash try-on feature
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

export interface FaceValidation {
  faceDetected: boolean
  eyesVisible: boolean
  faceCentered: boolean
  goodLighting: boolean
  faceAngle: 'good' | 'too_left' | 'too_right' | 'too_up' | 'too_down'
  isValid: boolean
  message: string
}

export interface FaceLandmarks {
  leftEye: { x: number; y: number }
  rightEye: { x: number; y: number }
  nose: { x: number; y: number }
  mouth: { x: number; y: number }
  leftEyelidContour: Array<{ x: number; y: number }>
  rightEyelidContour: Array<{ x: number; y: number }>
}

let faceLandmarker: FaceLandmarker | null = null

/**
 * Initialize the MediaPipe Face Landmarker
 */
export async function initializeFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarker) return faceLandmarker

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU'
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    runningMode: 'VIDEO',
    numFaces: 1
  })

  return faceLandmarker
}

/**
 * Detect face landmarks from video element
 */
export async function detectFaceLandmarks(
  video: HTMLVideoElement,
  timestamp: number
): Promise<FaceLandmarks | null> {
  if (!faceLandmarker) {
    await initializeFaceLandmarker()
  }

  const results = faceLandmarker!.detectForVideo(video, timestamp)

  if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
    return null
  }

  const landmarks = results.faceLandmarks[0]

  // Key landmark indices (MediaPipe Face Mesh)
  // 33: left eye center
  // 263: right eye center
  // 1: nose tip
  // 13: upper lip center

  // Upper eyelid contour indices (ONLY the upper arc, from inner to outer corner)
  // Based on MediaPipe full eye contours, taking only the top half
  // Right eye upper lid (top arc): from inner corner (133) to outer corner (33)
  // Left eye upper lid (top arc): from inner corner (362) to outer corner (263)
  const rightEyelidIndices = [133, 173, 157, 158, 159, 160, 161, 246, 33]
  const leftEyelidIndices = [362, 398, 384, 385, 386, 387, 388, 466, 263]

  return {
    leftEye: { x: landmarks[33].x, y: landmarks[33].y },
    rightEye: { x: landmarks[263].x, y: landmarks[263].y },
    nose: { x: landmarks[1].x, y: landmarks[1].y },
    mouth: { x: landmarks[13].x, y: landmarks[13].y },
    leftEyelidContour: leftEyelidIndices.map(i => ({ x: landmarks[i].x, y: landmarks[i].y })),
    rightEyelidContour: rightEyelidIndices.map(i => ({ x: landmarks[i].x, y: landmarks[i].y }))
  }
}

/**
 * Validate face positioning and quality for optimal lash try-on
 */
export async function validateFaceForSelfie(
  video: HTMLVideoElement,
  timestamp: number
): Promise<FaceValidation> {
  const landmarks = await detectFaceLandmarks(video, timestamp)

  if (!landmarks) {
    return {
      faceDetected: false,
      eyesVisible: false,
      faceCentered: false,
      goodLighting: false,
      faceAngle: 'good',
      isValid: false,
      message: 'No face detected. Please position your face in the frame.'
    }
  }

  // Check if eyes are visible (both eyes detected)
  const eyesVisible = true // If we got landmarks, eyes are visible

  // Check if face is centered (nose should be near center)
  const faceCentered =
    landmarks.nose.x > 0.35 && landmarks.nose.x < 0.65 &&
    landmarks.nose.y > 0.3 && landmarks.nose.y < 0.7

  // Check face angle based on eye positions
  const eyeDistance = Math.abs(landmarks.leftEye.x - landmarks.rightEye.x)
  const eyeYDiff = Math.abs(landmarks.leftEye.y - landmarks.rightEye.y)

  let faceAngle: FaceValidation['faceAngle'] = 'good'

  // If eyes are not level, face is tilted
  if (eyeYDiff > 0.05) {
    faceAngle = landmarks.leftEye.y < landmarks.rightEye.y ? 'too_left' : 'too_right'
  }

  // Check vertical angle
  const noseToEyeDistance = landmarks.nose.y - (landmarks.leftEye.y + landmarks.rightEye.y) / 2
  if (noseToEyeDistance < 0.05) {
    faceAngle = 'too_up'
  } else if (noseToEyeDistance > 0.15) {
    faceAngle = 'too_down'
  }

  // Check lighting (analyze canvas brightness)
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return {
      faceDetected: true,
      eyesVisible,
      faceCentered,
      goodLighting: false,
      faceAngle,
      isValid: false,
      message: 'Unable to analyze image quality'
    }
  }

  ctx.drawImage(video, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const brightness = calculateBrightness(imageData)

  const goodLighting = brightness > 80 && brightness < 220 // Not too dark, not too bright

  // Generate helpful message
  let message = ''
  const isValid = eyesVisible && faceCentered && goodLighting && faceAngle === 'good'

  if (isValid) {
    message = 'Perfect! Hold still...'
  } else if (!faceCentered) {
    message = 'Move your face to the center'
  } else if (faceAngle !== 'good') {
    switch (faceAngle) {
      case 'too_left':
        message = 'Turn your head slightly right'
        break
      case 'too_right':
        message = 'Turn your head slightly left'
        break
      case 'too_up':
        message = 'Look down a bit'
        break
      case 'too_down':
        message = 'Look up a bit'
        break
    }
  } else if (!goodLighting) {
    message = brightness < 80 ? 'Need more light' : 'Too bright, reduce lighting'
  }

  return {
    faceDetected: true,
    eyesVisible,
    faceCentered,
    goodLighting,
    faceAngle,
    isValid,
    message
  }
}

/**
 * Calculate average brightness of image data
 */
function calculateBrightness(imageData: ImageData): number {
  const data = imageData.data
  let sum = 0

  for (let i = 0; i < data.length; i += 4) {
    // Calculate perceived brightness using luminosity formula
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    sum += (0.299 * r + 0.587 * g + 0.114 * b)
  }

  return sum / (data.length / 4)
}

/**
 * Capture image from video element
 */
export function captureImageFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Unable to get canvas context')

  ctx.drawImage(video, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.95)
}

/**
 * Draw face landmarks on canvas for debugging
 */
export function drawFaceLandmarks(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: FaceLandmarks
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  ctx.drawImage(video, 0, 0)

  // Draw landmarks
  ctx.fillStyle = '#FF5252'
  const drawPoint = (x: number, y: number) => {
    ctx.beginPath()
    ctx.arc(x * canvas.width, y * canvas.height, 5, 0, 2 * Math.PI)
    ctx.fill()
  }

  drawPoint(landmarks.leftEye.x, landmarks.leftEye.y)
  drawPoint(landmarks.rightEye.x, landmarks.rightEye.y)
  drawPoint(landmarks.nose.x, landmarks.nose.y)
  drawPoint(landmarks.mouth.x, landmarks.mouth.y)
}
