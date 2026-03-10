type PreviewModalProps = {
  previewUrl: string | null
  onClose: () => void
}

export function PreviewModal({ previewUrl, onClose }: PreviewModalProps) {
  if (!previewUrl) return null

  return (
    <div
      className="preview-modal"
      role="dialog"
      aria-modal="true"
      aria-label="生成プレビュー"
      onClick={onClose}
    >
      <div className="preview-modal__panel" onClick={(event) => event.stopPropagation()}>
        <div className="preview-modal__header">
          <h2>できあがりプレビュー</h2>
          <button type="button" className="subtle-button" onClick={onClose}>
            とじる
          </button>
        </div>
        <img className="preview-modal__image" src={previewUrl} alt="生成された画像のプレビュー" />
      </div>
    </div>
  )
}
