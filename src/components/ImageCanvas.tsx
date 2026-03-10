import type { CSSProperties, PointerEventHandler, RefObject } from 'react'

type ImageCanvasProps = {
  baseCanvasRef: RefObject<HTMLCanvasElement | null>
  canvasStackStyle?: CSSProperties
  drawCanvasRef: RefObject<HTMLCanvasElement | null>
  hasImage: boolean
  onOpenFilePicker: () => void
  onPointerDown: PointerEventHandler<HTMLCanvasElement>
  onPointerMove: PointerEventHandler<HTMLCanvasElement>
  onPointerUp: PointerEventHandler<HTMLCanvasElement>
  previewOpacity: number
}

export function ImageCanvas({
  baseCanvasRef,
  canvasStackStyle,
  drawCanvasRef,
  hasImage,
  onOpenFilePicker,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  previewOpacity,
}: ImageCanvasProps) {
  return (
    <section className="image-area">
      <div className={`canvas-stack${hasImage ? ' canvas-stack--ready' : ''}`} style={canvasStackStyle}>
        <canvas ref={baseCanvasRef} className="canvas" />
        <canvas
          ref={drawCanvasRef}
          className="canvas canvas--draw"
          style={{ opacity: previewOpacity }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        {!hasImage && (
          <button type="button" className="canvas-upload" onClick={onOpenFilePicker}>
            <span className="canvas-upload__icon" aria-hidden="true">
              <span className="canvas-upload__plus">+</span>
            </span>
            <span className="canvas-upload__label">画像をえらぶ</span>
          </button>
        )}
      </div>
    </section>
  )
}
