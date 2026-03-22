import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShareIcon } from '../icons'

export type PreviewAsset = {
  fileName: string
  kind: 'ultrahdr' | 'xhdr'
  url: string
}

type PreviewModalProps = {
  preview: PreviewAsset | null
  onClose: () => void
}

export function PreviewModal({ preview, onClose }: PreviewModalProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { t } = useTranslation()
  const isXHdrPreview = preview?.kind === 'xhdr'

  const canShare = useMemo(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    [],
  )

  if (!preview) return null

  const handleShare = async () => {
    if (!canShare || isSharing) return
    setIsSharing(true)
    try {
      const response = await fetch(preview.url)
      const blob = await response.blob()
      const file = new File([blob], preview.fileName, {
        type:
          blob.type ||
          (preview.fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'),
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
            <ShareIcon className="subtle-button__icon" aria-hidden="true" />
            <span>{isSharing ? t('preview.sharing') : t('preview.share')}</span>
          </button>
        </div>
        {isXHdrPreview && (
          <div className="preview-modal__hint" role="note">
            <p className="preview-modal__hint-title">{t('preview.xHdrHintTitle')}</p>
            <ul className="preview-modal__hint-list">
              <li>{t('preview.xHdrHintPost')}</li>
              <li>{t('preview.xHdrHintView')}</li>
            </ul>
          </div>
        )}
        <img className="preview-modal__image" src={preview.url} alt={t('preview.imageAlt')} />
      </div>
    </div>
  )
}
