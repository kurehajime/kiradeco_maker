import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type PreviewModalProps = {
  previewUrl: string | null
  onClose: () => void
}

export function PreviewModal({ previewUrl, onClose }: PreviewModalProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { t } = useTranslation()

  const canShare = useMemo(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    [],
  )

  if (!previewUrl) return null

  const handleShare = async () => {
    if (!canShare || isSharing) return
    setIsSharing(true)
    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const file = new File([blob], 'kiradeco-maker.jpg', {
        type: blob.type || 'image/jpeg',
      })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t('app.title'),
        })
      } else {
        await navigator.share({
          title: t('app.title'),
          text: t('preview.shareText'),
        })
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error(error)
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div
      className="preview-modal"
      role="dialog"
      aria-modal="true"
      aria-label={t('preview.dialogAriaLabel')}
      onClick={onClose}
    >
      <div className="preview-modal__panel" onClick={(event) => event.stopPropagation()}>
        <div className="preview-modal__header">
          <button type="button" className="subtle-button" onClick={onClose}>
            {t('preview.close')}
          </button>
          <h2>{t('preview.heading')}</h2>
          <button
            type="button"
            className="subtle-button subtle-button--share"
            onClick={() => {
              void handleShare()
            }}
            disabled={!canShare || isSharing}
          >
            <img
              className="subtle-button__icon"
              src={`${import.meta.env.BASE_URL}share.svg`}
              alt=""
              aria-hidden="true"
            />
            <span>{isSharing ? t('preview.sharing') : t('preview.share')}</span>
          </button>
        </div>
        <img className="preview-modal__image" src={previewUrl} alt={t('preview.imageAlt')} />
      </div>
    </div>
  )
}
