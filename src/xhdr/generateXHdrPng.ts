import {
  FilterType,
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from '@imagemagick/magick-wasm'
import magickWasmUrl from '@imagemagick/magick-wasm/magick.wasm?url'
import i18n from '../i18n'
// @ts-expect-error local .mjs module without TS declarations
import { decodePngToRgba16, encodeRgba16Png, extractIccFromPngBytes } from './core.mjs'

const PQ_MAX_NITS = 10000
const SDR_REFERENCE_NITS = 203
const STROKE_MAX_GAIN = 6.0
const MAX_OUTPUT_LONG_SIDE = 800

let magickInitPromise: Promise<void> | null = null

function readU16BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 8) | bytes[offset + 1]) >>> 0
}

function writeU16BE(bytes: Uint8Array, offset: number, value: number) {
  const v = Math.max(0, Math.min(65535, Math.round(value)))
  bytes[offset] = (v >>> 8) & 0xff
  bytes[offset + 1] = v & 0xff
}

function srgbToLinear(value: number): number {
  if (value <= 0.04045) return value / 12.92
  return Math.pow((value + 0.055) / 1.055, 2.4)
}

function pqEncodeFromNits(nits: number): number {
  const luminance = Math.max(0, Math.min(1, nits / PQ_MAX_NITS))
  const m1 = 0.1593017578125
  const m2 = 78.84375
  const c1 = 0.8359375
  const c2 = 18.8515625
  const c3 = 18.6875
  const powered = Math.pow(luminance, m1)
  const numerator = c1 + c2 * powered
  const denominator = 1 + c3 * powered
  return Math.pow(numerator / denominator, m2)
}

function pqDecodeToNits(pqCode01: number): number {
  const value = Math.max(0, Math.min(1, pqCode01))
  const m1 = 0.1593017578125
  const m2 = 78.84375
  const c1 = 0.8359375
  const c2 = 18.8515625
  const c3 = 18.6875
  const powered = Math.pow(value, 1 / m2)
  const numerator = Math.max(0, powered - c1)
  const denominator = c2 - c3 * powered
  if (denominator <= 0) return PQ_MAX_NITS
  const luminance = Math.pow(numerator / denominator, 1 / m1)
  return Math.max(0, Math.min(PQ_MAX_NITS, luminance * PQ_MAX_NITS))
}

function pqCode16ToNits(code16: number): number {
  return pqDecodeToNits(Math.max(0, Math.min(65535, code16)) / 65535)
}

function nitsToPqCode16(nits: number): number {
  return Math.max(0, Math.min(65535, Math.round(pqEncodeFromNits(nits) * 65535)))
}

function computeAspectFitSize(width: number, height: number, maxLongSide: number) {
  const longSide = Math.max(width, height)
  if (longSide <= maxLongSide) {
    return { width, height }
  }
  const scale = maxLongSide / longSide
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function ensureImageMagickReady(wasmBytes: Uint8Array) {
  if (!magickInitPromise) {
    magickInitPromise = initializeImageMagick(wasmBytes)
  }
  return magickInitPromise
}

function resizePngBytesWithMagick(
  pngBytes: Uint8Array,
  outWidth: number,
  outHeight: number,
) {
  return ImageMagick.read(pngBytes, (image) => {
    if (image.width !== outWidth || image.height !== outHeight) {
      image.resize(outWidth, outHeight, FilterType.Lanczos)
    }
    image.depth = 16
    return image.write(MagickFormat.Png64, (data) => Uint8Array.from(data))
  })
}

function convertRgba16SrgbToBt2020PqInPlace(rgba16be: Uint8Array) {
  for (let index = 0; index < rgba16be.length; index += 8) {
    const sr = readU16BE(rgba16be, index + 0) / 65535
    const sg = readU16BE(rgba16be, index + 2) / 65535
    const sb = readU16BE(rgba16be, index + 4) / 65535

    const lr = srgbToLinear(sr)
    const lg = srgbToLinear(sg)
    const lb = srgbToLinear(sb)

    const r2020 = 0.627404 * lr + 0.329282 * lg + 0.0433136 * lb
    const g2020 = 0.069097 * lr + 0.91954 * lg + 0.0113612 * lb
    const b2020 = 0.0163916 * lr + 0.0880132 * lg + 0.895595 * lb

    writeU16BE(rgba16be, index + 0, Math.round(pqEncodeFromNits(Math.max(0, r2020) * SDR_REFERENCE_NITS) * 65535))
    writeU16BE(rgba16be, index + 2, Math.round(pqEncodeFromNits(Math.max(0, g2020) * SDR_REFERENCE_NITS) * 65535))
    writeU16BE(rgba16be, index + 4, Math.round(pqEncodeFromNits(Math.max(0, b2020) * SDR_REFERENCE_NITS) * 65535))
  }
}

async function fetchBytes(url: string, errorMessage: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(errorMessage)
  }
  return new Uint8Array(await response.arrayBuffer())
}

function getPublicAssetUrl(fileName: string) {
  return new URL(fileName, new URL(import.meta.env.BASE_URL, window.location.origin)).href
}

export async function generateXHdrPng({
  backgroundCap8 = 255,
  drawCanvas,
  sourcePngBytes,
}: {
  backgroundCap8?: number
  drawCanvas: HTMLCanvasElement
  sourcePngBytes: Uint8Array
}) {
  const drawContext = drawCanvas.getContext('2d')
  if (!drawContext) {
    throw new Error(i18n.t('xHdr.errors.drawCanvas'))
  }

  const [wasmBytes, successRefPngBytes] = await Promise.all([
    fetchBytes(magickWasmUrl, i18n.t('xHdr.errors.magickWasmLoad')),
    fetchBytes(getPublicAssetUrl('success_sample.png'), i18n.t('xHdr.errors.successSampleLoad')),
  ])

  await ensureImageMagickReady(wasmBytes)

  const fitted = computeAspectFitSize(drawCanvas.width, drawCanvas.height, MAX_OUTPUT_LONG_SIDE)
  const outWidth = fitted.width
  const outHeight = fitted.height
  const drawImageData = (() => {
    if (drawCanvas.width === outWidth && drawCanvas.height === outHeight) {
      return drawContext.getImageData(0, 0, outWidth, outHeight)
    }
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = outWidth
    maskCanvas.height = outHeight
    const maskContext = maskCanvas.getContext('2d')
    if (!maskContext) {
      throw new Error(i18n.t('xHdr.errors.maskCanvas'))
    }
    maskContext.drawImage(drawCanvas, 0, 0, outWidth, outHeight)
    return maskContext.getImageData(0, 0, outWidth, outHeight)
  })()

  const resizedSourcePngBytes = resizePngBytesWithMagick(sourcePngBytes, outWidth, outHeight)
  const decoded = decodePngToRgba16(resizedSourcePngBytes, 'resizedSourcePngBytes')
  const rgba16be = decoded.rgba16be
  convertRgba16SrgbToBt2020PqInPlace(rgba16be)
  const backgroundCap16 = Math.max(0, Math.min(255, backgroundCap8)) * 257

  for (let index = 0; index < outWidth * outHeight; index += 1) {
    const pixelOffset = index * 4
    const maskAlpha = drawImageData.data[pixelOffset + 3] / 255
    const sourceOffset = index * 8
    let currentR = readU16BE(rgba16be, sourceOffset + 0)
    let currentG = readU16BE(rgba16be, sourceOffset + 2)
    let currentB = readU16BE(rgba16be, sourceOffset + 4)

    const backgroundWeight = 1 - maskAlpha
    if (backgroundWeight > 0) {
      const maxChannel = Math.max(currentR, currentG, currentB)
      if (maxChannel > backgroundCap16 && maxChannel > 0) {
        const scale = backgroundCap16 / maxChannel
        const factor = 1 - backgroundWeight * (1 - scale)
        currentR = Math.round(currentR * factor)
        currentG = Math.round(currentG * factor)
        currentB = Math.round(currentB * factor)
      }
    }

    if (maskAlpha > 0) {
      const maskLuma =
        (drawImageData.data[pixelOffset + 0] +
          drawImageData.data[pixelOffset + 1] +
          drawImageData.data[pixelOffset + 2]) /
        (3 * 255)
      const strokeWeight = Math.max(0, Math.min(1, maskAlpha * maskLuma))
      const desiredGain = 1 + strokeWeight * (STROKE_MAX_GAIN - 1)
      const rNits = pqCode16ToNits(currentR)
      const gNits = pqCode16ToNits(currentG)
      const bNits = pqCode16ToNits(currentB)
      const maxNits = Math.max(1e-6, rNits, gNits, bNits)
      const headroomGain = PQ_MAX_NITS / maxNits
      const gain = Math.max(1, Math.min(desiredGain, headroomGain))
      currentR = nitsToPqCode16(rNits * gain)
      currentG = nitsToPqCode16(gNits * gain)
      currentB = nitsToPqCode16(bNits * gain)
    }

    writeU16BE(rgba16be, sourceOffset + 0, currentR)
    writeU16BE(rgba16be, sourceOffset + 2, currentG)
    writeU16BE(rgba16be, sourceOffset + 4, currentB)
    writeU16BE(rgba16be, sourceOffset + 6, 65535)
  }

  const iccProfile = extractIccFromPngBytes(successRefPngBytes, 'successRefPngBytes')
  const successBytes = encodeRgba16Png({
    width: outWidth,
    height: outHeight,
    rgba16be,
    iccProfileBytes: iccProfile,
  })

  return new Blob([successBytes as BlobPart], { type: 'image/png' })
}
