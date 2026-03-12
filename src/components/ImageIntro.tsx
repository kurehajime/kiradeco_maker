import { useTranslation } from 'react-i18next'

type ImageIntroProps = {
  isHdrSupported: boolean | null
  onOpenFilePicker: () => void
}

export function ImageIntro({ isHdrSupported, onOpenFilePicker }: ImageIntroProps) {
  const assetBase = import.meta.env.BASE_URL
  const { t } = useTranslation()

  return (
    <div className="image-intro">
      <p className="image-intro__lead">{t('imageIntro.lead')}</p>

      <div className="image-intro__examples" aria-label={t('imageIntro.examplesAriaLabel')}>
        <figure className="image-intro__card">
          <img className="image-intro__image" src={`${assetBase}before.jpg`} alt={t('imageIntro.beforeAlt')} />
          <figcaption className="image-intro__caption">{t('imageIntro.beforeCaption')}</figcaption>
        </figure>

        <span className="image-intro__arrow" aria-hidden="true" />

        <div className="image-intro__after-group">
          <figure className="image-intro__card image-intro__card--after">
            <img className="image-intro__image" src={`${assetBase}after1.jpg`} alt={t('imageIntro.afterHologramAlt')} />
            <figcaption className="image-intro__caption">{t('imageIntro.afterHologramCaption')}</figcaption>
          </figure>
          <figure className="image-intro__card image-intro__card--after">
            <img className="image-intro__image" src={`${assetBase}after2.jpg`} alt={t('imageIntro.afterDecorAlt')} />
            <figcaption className="image-intro__caption">{t('imageIntro.afterDecorCaption')}</figcaption>
          </figure>
        </div>
      </div>

      {isHdrSupported === false && (
        <p className="image-intro__notice">{t('imageIntro.hdrNotice')}</p>
      )}

      <button type="button" className="image-intro__button" onClick={onOpenFilePicker}>
        <span className="image-intro__button-icon" aria-hidden="true">
          <img src={`${assetBase}image.svg`} alt="" />
        </span>
        <span className="image-intro__button-label">{t('imageIntro.chooseImage')}</span>
      </button>
    </div>
  )
}
