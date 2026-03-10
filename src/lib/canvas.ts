export const drawStar = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number,
) => {
  context.beginPath()
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? outerRadius : innerRadius
    const angle = rotation + (Math.PI / 5) * point - Math.PI / 2
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (point === 0) {
      context.moveTo(px, py)
    } else {
      context.lineTo(px, py)
    }
  }
  context.closePath()
  context.fill()
}

export const pushLimitedHistory = (
  history: ImageData[],
  snapshot: ImageData,
  limit: number,
) => {
  const nextHistory = [...history, snapshot]
  if (nextHistory.length > limit) {
    nextHistory.shift()
  }
  return nextHistory
}

export const popHistory = (history: ImageData[]) => {
  const snapshot = history.at(-1) ?? null
  if (!snapshot) {
    return {
      nextHistory: history,
      snapshot: null,
    }
  }
  return {
    nextHistory: history.slice(0, -1),
    snapshot,
  }
}
