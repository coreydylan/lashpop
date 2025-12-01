'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { gsap, ScrollTrigger, initGSAP } from '@/lib/gsap'

interface ParallaxImageProps {
  src: string
  depthSrc: string
  alt?: string
  className?: string
  parallaxAmount?: number // Depth displacement intensity (default: 0.3)
  scrollIntensity?: number // How much scroll affects parallax (default: 0.4)
  initialPan?: { x: number; y: number } // Initial pan animation offset
  scrollTrigger?: {
    start?: string
    end?: string
  }
}

const vertexShader = `
  varying vec2 vUv;
  uniform sampler2D uDepth;
  uniform float uParallaxAmount;
  uniform float uScrollProgress;
  uniform vec2 uMouseOffset;

  void main() {
    vUv = uv;

    // Sample depth at this UV coordinate
    float d = texture2D(uDepth, uv).r;   // 0-1
    float depthCentered = d - 0.5;       // -0.5 to 0.5

    // Start with original position
    vec3 displaced = position;

    // Push vertices in Z based on depth (subtle 3D relief)
    displaced.z += depthCentered * uParallaxAmount * 0.3;

    // XY shift based on scroll for subtle parallax effect
    // Objects closer (higher depth value) move more than distant objects
    float scrollEffect = (uScrollProgress - 0.5);
    displaced.x += depthCentered * scrollEffect * 0.08;
    displaced.y += depthCentered * scrollEffect * 0.04;

    // Add mouse-based parallax for subtle interactive depth
    displaced.x += depthCentered * uMouseOffset.x * 0.03;
    displaced.y += depthCentered * uMouseOffset.y * 0.03;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uColor;

  void main() {
    vec4 color = texture2D(uColor, vUv);
    gl_FragColor = color;
  }
`

export default function ParallaxImage({
  src,
  depthSrc,
  alt = '',
  className = '',
  parallaxAmount = 0.3,
  scrollIntensity = 0.4,
  initialPan,
  scrollTrigger: scrollTriggerConfig,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const needsRenderRef = useRef(true)
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mark that we need a render
  const requestRender = useCallback(() => {
    needsRenderRef.current = true
  }, [])

  const resize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current || !meshRef.current) return

    const { clientWidth: width, clientHeight: height } = containerRef.current

    rendererRef.current.setSize(width, height)
    cameraRef.current.aspect = width / height
    cameraRef.current.updateProjectionMatrix()

    // Calculate the visible height at z=0 for our camera
    const fov = cameraRef.current.fov * (Math.PI / 180)
    const cameraZ = cameraRef.current.position.z
    const visibleHeight = 2 * Math.tan(fov / 2) * cameraZ
    const visibleWidth = visibleHeight * cameraRef.current.aspect

    // Scale mesh to fill the visible area (like object-fit: cover)
    const imageAspect = 1086 / 724 // Desk image aspect ratio
    const viewAspect = visibleWidth / visibleHeight

    let scaleX, scaleY

    if (viewAspect > imageAspect) {
      // View is wider than image - fit to width
      scaleX = visibleWidth * 1.1
      scaleY = (visibleWidth / imageAspect) * 1.1
    } else {
      // View is taller than image - fit to height
      scaleX = (visibleHeight * imageAspect) * 1.1
      scaleY = visibleHeight * 1.1
    }

    meshRef.current.scale.set(scaleX, scaleY, 1)
    requestRender()
  }, [requestRender])

  // Debounced resize handler
  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
    resizeTimeoutRef.current = setTimeout(resize, 100)
  }, [resize])

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    console.log('[ParallaxImage] Initializing Three.js parallax effect')

    const container = containerRef.current
    const canvas = canvasRef.current

    // Initialize Three.js
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    } catch (e) {
      console.error('[ParallaxImage] WebGL initialization failed:', e)
      return
    }
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.z = 2
    cameraRef.current = camera

    // Load textures
    const textureLoader = new THREE.TextureLoader()

    const colorTexture = textureLoader.load(src, () => {
      console.log('[ParallaxImage] Color texture loaded:', src)
      colorTexture.minFilter = THREE.LinearFilter
      colorTexture.magFilter = THREE.LinearFilter
      colorTexture.flipY = true // Flip Y for correct orientation
      colorTexture.needsUpdate = true
      requestRender()
    })

    const depthTexture = textureLoader.load(depthSrc, () => {
      console.log('[ParallaxImage] Depth texture loaded:', depthSrc)
      depthTexture.minFilter = THREE.LinearFilter
      depthTexture.magFilter = THREE.LinearFilter
      depthTexture.flipY = true // Flip Y for correct orientation
      depthTexture.needsUpdate = true
      requestRender()
    })

    // Create shader material
    const uniforms = {
      uColor: { value: colorTexture },
      uDepth: { value: depthTexture },
      uParallaxAmount: { value: parallaxAmount },
      uScrollProgress: { value: 0.0 },
      uMouseOffset: { value: new THREE.Vector2(0, 0) },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    })
    materialRef.current = material

    // Create subdivided unit plane for smooth displacement (will be scaled in resize)
    const geometry = new THREE.PlaneGeometry(1, 1, 128, 128)
    const mesh = new THREE.Mesh(geometry, material)
    meshRef.current = mesh
    scene.add(mesh)

    // Initial resize
    resize()

    // On-demand render loop - only renders when needsRenderRef.current is true
    const render = () => {
      if (needsRenderRef.current) {
        renderer.render(scene, camera)
        needsRenderRef.current = false
      }
      animationIdRef.current = requestAnimationFrame(render)
    }
    render()

    // Handle resize with debouncing
    const resizeObserver = new ResizeObserver(debouncedResize)
    resizeObserver.observe(container)

    // Mouse move for subtle parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2

      if (materialRef.current) {
        gsap.to(materialRef.current.uniforms.uMouseOffset.value, {
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: requestRender,
        })
      }
    }
    container.addEventListener('mousemove', handleMouseMove)

    // Initialize GSAP deferred, then set up ScrollTrigger
    initGSAP().then(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 768px)', () => {
        // Initial pan animation (mimicking original behavior)
        if (initialPan && meshRef.current) {
          gsap.fromTo(
            meshRef.current.position,
            { x: 0, y: 0 },
            {
              x: initialPan.x * 0.1,
              y: initialPan.y * 0.1,
              duration: 4,
              ease: 'power2.out',
              onUpdate: requestRender,
            }
          )
        }

        // Scroll-triggered parallax
        ScrollTrigger.create({
          trigger: container,
          start: scrollTriggerConfig?.start || 'top bottom',
          end: scrollTriggerConfig?.end || 'bottom top',
          scrub: 1,
          onUpdate: (self) => {
            if (materialRef.current) {
              materialRef.current.uniforms.uScrollProgress.value = self.progress
            }
            // Subtle camera movement for extra depth
            if (cameraRef.current) {
              const p = self.progress
              cameraRef.current.position.x = (p - 0.5) * scrollIntensity * 0.05
              cameraRef.current.position.y = (p - 0.5) * scrollIntensity * 0.025
              cameraRef.current.lookAt(0, 0, 0)
            }
            requestRender()
          },
        })
      })

      // Store mm for cleanup
      ;(container as HTMLDivElement & { _gsapMatchMedia?: gsap.MatchMedia })._gsapMatchMedia = mm
    })

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      resizeObserver.disconnect()
      container.removeEventListener('mousemove', handleMouseMove)

      // Clean up GSAP matchMedia if it was set up
      const mm = (container as HTMLDivElement & { _gsapMatchMedia?: gsap.MatchMedia })._gsapMatchMedia
      if (mm) {
        mm.revert()
      }

      geometry.dispose()
      material.dispose()
      colorTexture.dispose()
      depthTexture.dispose()
      renderer.dispose()
    }
  }, [src, depthSrc, parallaxAmount, scrollIntensity, initialPan, scrollTriggerConfig, resize, debouncedResize, requestRender])

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-label={alt}
      />
    </div>
  )
}
