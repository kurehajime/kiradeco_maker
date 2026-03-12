import type { ChangeEvent, CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import hologramUrl from './assets/kira.png'
import { AppHeader } from './components/AppHeader'
import { ControlBoard } from './components/ControlBoard'
import { ImageCanvas } from './components/ImageCanvas'
import { PreviewModal } from './components/PreviewModal'
import type { EditorMode, EffectType, PenType, StampType } from './editorTypes'
import { drawStar, popHistory, pushLimitedHistory } from './lib/canvas'
import { getDefaultToolSizes, getSizeBounds } from './lib/editorSizing'
import { loadImageSource } from './lib/image'
import { encodeUltraHDR } from './ultrahdr'

const DRAW_LAYER_PREVIEW_OPACITY = 0.7

function App() {
  const [imageName, setImageName] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isHdrSupported, setIsHdrSupported] = useState<boolean | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [undoCount, setUndoCount] = useState(0)
  const [editorMode, setEditorMode] = useState<EditorMode>('pen')
  const [penSize, setPenSize] = useState(20)
  const [stampSize, setStampSize] = useState(44)
  const [penType, setPenType] = useState<PenType>('plain')
  const [stampType, setStampType] = useState<StampType>('heart')
  const [effectType, setEffectType] = useState<EffectType>('hologram')
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const heartImageRef = useRef<HTMLImageElement | null>(null)
  const undoStackRef = useRef<ImageData[]>([])
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const hologramCacheRef = useRef<{
    width: number
    height: number
    data: Uint8ClampedArray
  } | null>(null)

  const hasImage = useMemo(() => {
    const canvas = baseCanvasRef.current
    return canvas !== null && canvas.width > 0 && canvas.height > 0
  }, [imageName])

  const revokePreviewUrl = useCallback((nextUrl: string | null) => {
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
      return nextUrl
    })
  }, [])

  const loadImage = useCallback(async (file: File) => {
    const imageUrl = URL.createObjectURL(file)
    const image = await loadImageSource(imageUrl, '画像の読み込みに失敗しました。')
    URL.revokeObjectURL(imageUrl)
    return image
  }, [])

  const loadImageFromUrl = useCallback(async (url: string) => {
    return loadImageSource(url, 'ホログラム画像の読み込みに失敗しました。')
  }, [])

  const loadHologramPattern = useCallback(
    async (width: number, height: number) => {
      const cached = hologramCacheRef.current
      if (cached && cached.width === width && cached.height === height) {
        return cached.data
      }
      const image = await loadImageFromUrl(hologramUrl)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('ホログラム描画用のキャンバスが作成できません。')
      }
      const tileSize = Math.min(width, height)
      for (let y = 0; y < height; y += tileSize) {
        for (let x = 0; x < width; x += tileSize) {
          context.drawImage(image, x, y, tileSize, tileSize)
        }
      }
      const patternData = context.getImageData(0, 0, width, height).data
      const cachedData = new Uint8ClampedArray(patternData)
      hologramCacheRef.current = { width, height, data: cachedData }
      return cachedData
    },
    [loadImageFromUrl],
  )

  const resetCanvases = useCallback((width: number, height: number) => {
    const baseCanvas = baseCanvasRef.current
    const drawCanvas = drawCanvasRef.current
    if (!baseCanvas || !drawCanvas) return
    baseCanvas.width = width
    baseCanvas.height = height
    drawCanvas.width = width
    drawCanvas.height = height
    const drawContext = drawCanvas.getContext('2d')
    if (drawContext) {
      drawContext.clearRect(0, 0, width, height)
    }
    setCanvasSize({ width, height })
  }, [])

  const clearUndoHistory = useCallback(() => {
    undoStackRef.current = []
    setUndoCount(0)
  }, [])

  const pushUndoSnapshot = useCallback(() => {
    const drawCanvas = drawCanvasRef.current
    if (!drawCanvas) return
    const context = drawCanvas.getContext('2d')
    if (!context) return
    const snapshot = context.getImageData(0, 0, drawCanvas.width, drawCanvas.height)
    const nextStack = pushLimitedHistory(undoStackRef.current, snapshot, 3)
    undoStackRef.current = nextStack
    setUndoCount(nextStack.length)
  }, [])

  const handleUndo = useCallback(() => {
    const drawCanvas = drawCanvasRef.current
    if (!drawCanvas) return
    const context = drawCanvas.getContext('2d')
    if (!context) return
    const { nextHistory, snapshot } = popHistory(undoStackRef.current)
    if (!snapshot) return
    context.putImageData(snapshot, 0, 0)
    undoStackRef.current = nextHistory
    setUndoCount(nextHistory.length)
    revokePreviewUrl(null)
  }, [revokePreviewUrl])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      event.target.value = ''
      setError(null)
      revokePreviewUrl(null)
      try {
        const image = await loadImage(file)
        resetCanvases(image.width, image.height)
        clearUndoHistory()
        const baseCanvas = baseCanvasRef.current
        const baseContext = baseCanvas?.getContext('2d')
        if (!baseContext) {
          throw new Error('ベース画像の描画に失敗しました。')
        }
        baseContext.clearRect(0, 0, image.width, image.height)
        baseContext.drawImage(image, 0, 0)
        setImageName(file.name)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '画像の読み込みに失敗しました。')
        setCanvasSize(null)
      }
    },
    [clearUndoHistory, loadImage, resetCanvases, revokePreviewUrl],
  )

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const canvasStackStyle = useMemo<CSSProperties | undefined>(() => {
    if (!canvasSize) return undefined
    return {
      aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
    }
  }, [canvasSize])

  const sizeBounds = useMemo(() => {
    return getSizeBounds(canvasSize)
  }, [canvasSize])

  useEffect(() => {
    if (!canvasSize) return
    const defaultToolSizes = getDefaultToolSizes(canvasSize.width, sizeBounds)
    setPenSize(defaultToolSizes.pen)
    setStampSize(defaultToolSizes.stamp)
  }, [canvasSize, sizeBounds])

  const getCanvasPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }, [])

  useEffect(() => {
    const image = new Image()
    image.src = `${import.meta.env.BASE_URL}heart.svg`
    heartImageRef.current = image
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setIsHdrSupported(false)
      return
    }

    let mediaQuery: MediaQueryList
    try {
      mediaQuery = window.matchMedia('(dynamic-range: high)')
    } catch {
      setIsHdrSupported(false)
      return
    }

    const updateHdrSupport = () => {
      setIsHdrSupported(mediaQuery.matches)
    }

    updateHdrSupport()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateHdrSupport)
      return () => {
        mediaQuery.removeEventListener('change', updateHdrSupport)
      }
    }

    mediaQuery.addListener(updateHdrSupport)
    return () => {
      mediaQuery.removeListener(updateHdrSupport)
    }
  }, [])

  const drawPenStroke = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const drawCanvas = drawCanvasRef.current
      const context = drawCanvas?.getContext('2d')
      if (!context) return
      context.strokeStyle = 'rgba(255, 255, 255, 0.96)'
      context.lineWidth = penSize
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.beginPath()
      context.moveTo(from.x, from.y)
      context.lineTo(to.x, to.y)
      context.stroke()
    },
    [penSize],
  )

  const drawHeartPenStroke = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const drawCanvas = drawCanvasRef.current
      const context = drawCanvas?.getContext('2d')
      const heartImage = heartImageRef.current
      if (!context || !heartImage?.complete || heartImage.naturalWidth === 0 || heartImage.naturalHeight === 0) {
        return
      }
      const spacing = Math.max(5, penSize * 0.42)
      const distance = Math.hypot(to.x - from.x, to.y - from.y)
      const steps = Math.max(1, Math.ceil(distance / spacing))
      const particleCount = Math.min(3, Math.max(2, Math.round(penSize / 24)))
      const spread = penSize * 0.65
      const aspect = heartImage.naturalHeight / heartImage.naturalWidth
      context.save()
      for (let step = 0; step <= steps; step += 1) {
        const ratio = step / steps
        const x = from.x + (to.x - from.x) * ratio
        const y = from.y + (to.y - from.y) * ratio
        for (let particle = 0; particle < particleCount; particle += 1) {
          const angle = Math.random() * Math.PI * 2
          const distanceScale = Math.sqrt(Math.random()) * spread
          const px = x + Math.cos(angle) * distanceScale
          const py = y + Math.sin(angle) * distanceScale
          const sizeScale = 0.18 + Math.random() * 0.82
          const drawWidth = penSize * sizeScale
          const drawHeight = drawWidth * aspect
          context.globalAlpha = 0.35 + Math.random() * 0.55
          context.drawImage(
            heartImage,
            px - drawWidth / 2,
            py - drawHeight / 2,
            drawWidth,
            drawHeight,
          )
        }
      }
      context.restore()
    },
    [penSize],
  )

  const drawStarPenStroke = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const drawCanvas = drawCanvasRef.current
      const context = drawCanvas?.getContext('2d')
      if (!context) return
      const spacing = Math.max(7, penSize * 0.48)
      const distance = Math.hypot(to.x - from.x, to.y - from.y)
      const steps = Math.max(1, Math.ceil(distance / spacing))
      const particleCount = Math.min(3, Math.max(1, Math.round(penSize / 28)))
      const spread = penSize * 0.48
      context.save()
      context.fillStyle = 'rgba(255, 255, 255, 0.94)'
      for (let step = 0; step <= steps; step += 1) {
        const ratio = step / steps
        const x = from.x + (to.x - from.x) * ratio
        const y = from.y + (to.y - from.y) * ratio
        for (let particle = 0; particle < particleCount; particle += 1) {
          const angle = Math.random() * Math.PI * 2
          const distanceScale = Math.sqrt(Math.random()) * spread
          const px = x + Math.cos(angle) * distanceScale
          const py = y + Math.sin(angle) * distanceScale
          const sizeScale = 0.22 + Math.random() * 0.68
          const outerRadius = (penSize * sizeScale) / 2
          context.globalAlpha = 0.35 + Math.random() * 0.55
          drawStar(
            context,
            px,
            py,
            outerRadius,
            outerRadius * 0.45,
            Math.random() * Math.PI,
          )
        }
      }
      context.restore()
    },
    [penSize],
  )

  const drawDecorativePenStroke = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      if (penType === 'heart') {
        drawHeartPenStroke(from, to)
        return
      }
      drawStarPenStroke(from, to)
    },
    [drawHeartPenStroke, drawStarPenStroke, penType],
  )

  const stampHeartAtPoint = useCallback(
    (point: { x: number; y: number }) => {
      const drawCanvas = drawCanvasRef.current
      const context = drawCanvas?.getContext('2d')
      const heartImage = heartImageRef.current
      if (!context || !heartImage?.complete || heartImage.naturalWidth === 0 || heartImage.naturalHeight === 0) {
        return
      }
      const aspect = heartImage.naturalHeight / heartImage.naturalWidth
      const drawWidth = stampSize
      const drawHeight = drawWidth * aspect
      context.save()
      context.globalAlpha = 0.96
      context.drawImage(
        heartImage,
        point.x - drawWidth / 2,
        point.y - drawHeight / 2,
        drawWidth,
        drawHeight,
      )
      context.restore()
    },
    [stampSize],
  )

  const stampStarAtPoint = useCallback(
    (point: { x: number; y: number }) => {
      const drawCanvas = drawCanvasRef.current
      const context = drawCanvas?.getContext('2d')
      if (!context) return
      context.save()
      context.fillStyle = 'rgba(255, 255, 255, 0.96)'
      drawStar(context, point.x, point.y, stampSize / 2, stampSize * 0.22, 0)
      context.restore()
    },
    [stampSize],
  )

  const stampAtPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (stampType === 'heart') {
        stampHeartAtPoint(point)
        return
      }
      stampStarAtPoint(point)
    },
    [stampHeartAtPoint, stampStarAtPoint, stampType],
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!hasImage) return
      const point = getCanvasPoint(event)
      if (!point) return
      if (editorMode === 'stamp') {
        pushUndoSnapshot()
        stampAtPoint(point)
        return
      }
      if (editorMode !== 'pen') return
      pushUndoSnapshot()
      isDrawingRef.current = true
      lastPointRef.current = point
      if (penType !== 'plain') {
        drawDecorativePenStroke(point, point)
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [drawDecorativePenStroke, editorMode, getCanvasPoint, hasImage, penType, pushUndoSnapshot, stampAtPoint],
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return
      const point = getCanvasPoint(event)
      const lastPoint = lastPointRef.current
      if (!point || !lastPoint) return
      if (editorMode === 'pen' && penType === 'plain') {
        drawPenStroke(lastPoint, point)
      } else if (editorMode === 'pen') {
        drawDecorativePenStroke(lastPoint, point)
      }
      lastPointRef.current = point
    },
    [drawDecorativePenStroke, drawPenStroke, editorMode, getCanvasPoint, penType],
  )

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    lastPointRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  const buildGainmap = useCallback(() => {
    const drawCanvas = drawCanvasRef.current
    if (!drawCanvas) return null
    const context = drawCanvas.getContext('2d')
    if (!context) return null
    const drawData = context.getImageData(0, 0, drawCanvas.width, drawCanvas.height)
    const output = new Uint8ClampedArray(drawData.data.length)
    const { width, height } = drawCanvas
    for (let index = 0; index < drawData.data.length; index += 4) {
      const alpha = drawData.data[index + 3]
      const value = Math.round(alpha)
      output[index] = value
      output[index + 1] = value
      output[index + 2] = value
      output[index + 3] = 255
    }
    return new ImageData(output, width, height)
  }, [])

  const applyHologramPattern = useCallback(async () => {
    const drawCanvas = drawCanvasRef.current
    if (!drawCanvas) return
    const context = drawCanvas.getContext('2d')
    if (!context) return
    const drawData = context.getImageData(0, 0, drawCanvas.width, drawCanvas.height)
    const patternData = await loadHologramPattern(drawCanvas.width, drawCanvas.height)
    for (let index = 0; index < drawData.data.length; index += 4) {
      const alpha = drawData.data[index + 3]
      const pattern =
        (patternData[index] + patternData[index + 1] + patternData[index + 2]) /
        (3 * 255)
      const contrasted = Math.min(1, Math.max(0, (pattern - 0.3) / 0.7))
      const shaped = Math.pow(contrasted, 2.6)
      const intensity = Math.min(255, Math.round(255 * Math.min(1, shaped * 2.5)))
      const baseAlpha = alpha / 255
      const hologramAlpha = 0.2 + Math.min(1, shaped * 2) * 0.8
      drawData.data[index] = intensity
      drawData.data[index + 1] = intensity
      drawData.data[index + 2] = intensity
      drawData.data[index + 3] = Math.round(255 * Math.max(baseAlpha, hologramAlpha))
    }
    context.putImageData(drawData, 0, 0)
    revokePreviewUrl(null)
  }, [loadHologramPattern, revokePreviewUrl])

  const handleModeSelect = useCallback((nextMode: EditorMode) => {
    setEditorMode(nextMode)
    setError(null)
  }, [])

  const handleEffectSelect = useCallback(
    async (nextEffect: EffectType) => {
      setEffectType(nextEffect)
      setError(null)
      if (!hasImage) return
      try {
        if (nextEffect === 'hologram') {
          pushUndoSnapshot()
          await applyHologramPattern()
        }
      } catch (effectError) {
        setError(
          effectError instanceof Error
            ? effectError.message
            : 'エフェクトの反映に失敗しました。',
        )
      }
    },
    [applyHologramPattern, hasImage, pushUndoSnapshot],
  )

  const handleGenerate = useCallback(async () => {
    const baseCanvas = baseCanvasRef.current
    if (!baseCanvas) return
    const baseContext = baseCanvas.getContext('2d')
    if (!baseContext) return
    const gainmap = buildGainmap()
    if (!gainmap) return
    setError(null)
    setIsGenerating(true)
    revokePreviewUrl(null)
    try {
      const baseImage = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height)
      const blob = await encodeUltraHDR(baseImage, gainmap)
      const nextUrl = URL.createObjectURL(blob)
      revokePreviewUrl(nextUrl)
    } catch (encodeError) {
      setError(
        encodeError instanceof Error
          ? encodeError.message
          : 'UltraHDRの生成に失敗しました。',
      )
    } finally {
      setIsGenerating(false)
    }
  }, [buildGainmap, revokePreviewUrl])

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      <AppHeader />
      <ImageCanvas
        baseCanvasRef={baseCanvasRef}
        canvasStackStyle={canvasStackStyle}
        drawCanvasRef={drawCanvasRef}
        hasImage={hasImage}
        isHdrSupported={isHdrSupported}
        onOpenFilePicker={openFilePicker}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        previewOpacity={DRAW_LAYER_PREVIEW_OPACITY}
      />
      <ControlBoard
        editorMode={editorMode}
        effectType={effectType}
        hasImage={hasImage}
        isGenerating={isGenerating}
        onEffectSelect={handleEffectSelect}
        onGenerate={handleGenerate}
        onModeSelect={handleModeSelect}
        onOpenFilePicker={openFilePicker}
        onUndo={handleUndo}
        penSize={penSize}
        penType={penType}
        setPenSize={setPenSize}
        setPenType={setPenType}
        setStampSize={setStampSize}
        setStampType={setStampType}
        sizeBounds={sizeBounds}
        stampSize={stampSize}
        stampType={stampType}
        undoCount={undoCount}
      />

      {error && <p className="error">{error}</p>}
      <PreviewModal previewUrl={previewUrl} onClose={() => revokePreviewUrl(null)} />
    </div>
  )
}

export default App
