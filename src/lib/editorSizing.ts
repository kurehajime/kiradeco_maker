export type SizeBounds = {
  min: number
  max: number
}

export const getSizeBounds = (
  canvasSize: { width: number; height: number } | null,
): SizeBounds => {
  if (!canvasSize) {
    return {
      min: 4,
      max: 150,
    }
  }
  const min = Math.max(1, Math.round(canvasSize.width / 200))
  const max = Math.max(min, Math.round(canvasSize.width / 2))
  return { min, max }
}

export const getDefaultToolSizes = (
  canvasWidth: number,
  sizeBounds: SizeBounds,
) => ({
  pen: Math.min(sizeBounds.max, Math.max(sizeBounds.min, Math.round(canvasWidth / 40))),
  stamp: Math.min(sizeBounds.max, Math.max(sizeBounds.min, Math.round(canvasWidth / 10))),
})
