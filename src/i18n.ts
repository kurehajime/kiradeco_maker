import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ja: {
    translation: {
      app: {
        title: 'キラデコメーカー',
        errors: {
          imageLoad: '画像の読み込みに失敗しました。',
          imageDecode: '画像のデコードに失敗しました。',
          hologramLoad: 'ホログラム画像の読み込みに失敗しました。',
          hologramCanvas: 'ホログラム描画用のキャンバスが作成できません。',
          baseDraw: 'ベース画像の描画に失敗しました。',
          pngCanvas: 'PNG変換用のキャンバスが作成できません。',
          pngGenerate: 'PNG変換に失敗しました。',
          effectApply: 'エフェクトの反映に失敗しました。',
          ultraHdrGenerate: 'UltraHDRの生成に失敗しました。',
        },
      },
      imageIntro: {
        lead: 'キラキラ写真を作ろう！',
        examplesAriaLabel: 'ビフォーアフターのイメージ',
        beforeAlt: '加工前のサンプル画像',
        beforeCaption: '元写真',
        afterHologramAlt: '加工後のサンプル画像 1',
        afterHologramCaption: 'ホログラム加工',
        afterDecorAlt: '加工後のサンプル画像 2',
        afterDecorCaption: '好きにデコれる！',
        hdrNotice:
          '※あなたの表示端末はキラキラ画像の表示(HDR)に対応していないようです。iPhone等で開いてみてください',
        chooseImage: '画像をえらぶ',
      },
      controls: {
        open: '読込',
        modesAriaLabel: '編集モード',
        pen: 'ペン',
        stamp: '判子',
        effect: '効果',
        undo: '戻す',
        generate: '完成',
        generating: '生成中',
        generateOptionsAriaLabel: '生成方法',
        generateImage: '画像を生成',
        generateXImage: 'X向け画像を生成',
        penSize: '線の太さ',
        penType: 'ペンの種類',
        plain: '線',
        heart: 'ハート',
        star: 'スター',
        stampSize: 'スタンプの大きさ',
        stampType: 'スタンプの種類',
        effects: 'エフェクト',
        hologram: 'ホログラム',
      },
      preview: {
        dialogAriaLabel: '生成プレビュー',
        close: 'とじる',
        heading: '完成♪',
        sharing: 'シェア中',
        share: 'シェアする',
        imageAlt: '生成された画像のプレビュー',
        shareText: 'キラデコメーカーで作成した画像です。',
        xHdrHintTitle: 'X向け画像投稿について',
        xHdrHintPost: '投稿はブラウザからでないとキラキラしません',
        xHdrHintView: '閲覧はアプリからでないとキラキラしません',
      },
      ultraHdr: {
        moduleLoad: 'UltraHDRモジュールの読み込みに失敗しました。`make ultrahdr`でビルドしてください。',
        missingInit: 'libultrahdr-wasmの初期化関数が見つかりません。',
        missingAppendGainMap: 'libultrahdr-wasmのappendGainMapが見つかりません。',
        jpegCanvas: 'JPEG変換用のキャンバスが作成できません。',
        jpegGenerate: 'JPEGの生成に失敗しました。',
      },
      xHdr: {
        errors: {
          drawCanvas: 'X向け画像生成用の描画キャンバスが取得できません。',
          generate: 'X向けHDR PNGの生成に失敗しました。',
          magickWasmLoad: 'ImageMagick WASMの読み込みに失敗しました。',
          maskCanvas: 'X向け画像生成用のマスクキャンバスが作成できません。',
          sourceMissing: 'X向け画像生成用の元画像データがありません。画像を読み込み直してください。',
          successSampleLoad: 'X向け画像生成用の参照ICC画像の読み込みに失敗しました。',
        },
      },
    },
  },
  en: {
    translation: {
      app: {
        title: 'Kiradeco Maker',
        errors: {
          imageLoad: 'Failed to load the image.',
          imageDecode: 'Failed to decode the image.',
          hologramLoad: 'Failed to load the hologram image.',
          hologramCanvas: 'Failed to create a canvas for the hologram effect.',
          baseDraw: 'Failed to draw the base image.',
          pngCanvas: 'Failed to create a canvas for PNG conversion.',
          pngGenerate: 'Failed to generate the PNG image.',
          effectApply: 'Failed to apply the effect.',
          ultraHdrGenerate: 'Failed to generate the UltraHDR image.',
        },
      },
      imageIntro: {
        lead: 'Make your photo sparkle!',
        examplesAriaLabel: 'Before and after examples',
        beforeAlt: 'Sample image before editing',
        beforeCaption: 'Before',
        afterHologramAlt: 'Sample image after editing 1',
        afterHologramCaption: 'Hologram effect',
        afterDecorAlt: 'Sample image after editing 2',
        afterDecorCaption: 'Decorate it your way!',
        hdrNotice:
          'Your display does not seem to support HDR sparkle previews. Try opening this on an iPhone or another HDR-capable device.',
        chooseImage: 'Choose an image',
      },
      controls: {
        open: 'Open',
        modesAriaLabel: 'Editing modes',
        pen: 'Pen',
        stamp: 'Stamp',
        effect: 'Effect',
        undo: 'Undo',
        generate: 'Create',
        generating: 'Creating',
        generateOptionsAriaLabel: 'Generation options',
        generateImage: 'Generate image',
        generateXImage: 'Generate image for X',
        penSize: 'Pen size',
        penType: 'Pen type',
        plain: 'Line',
        heart: 'Heart',
        star: 'Star',
        stampSize: 'Stamp size',
        stampType: 'Stamp type',
        effects: 'Effect',
        hologram: 'Hologram',
      },
      preview: {
        dialogAriaLabel: 'Generated preview',
        close: 'Close',
        heading: 'Done',
        sharing: 'Sharing',
        share: 'Share',
        imageAlt: 'Preview of the generated image',
        shareText: 'This image was created with Kiradeco Maker.',
        xHdrHintTitle: 'About posting images for X',
        xHdrHintPost: 'Sparkle appears only when posting from a browser',
        xHdrHintView: 'Sparkle appears only when viewing in the app',
      },
      ultraHdr: {
        moduleLoad: 'Failed to load the UltraHDR module. Run `make ultrahdr` to build it.',
        missingInit: 'The libultrahdr-wasm initializer was not found.',
        missingAppendGainMap: 'The libultrahdr-wasm appendGainMap function was not found.',
        jpegCanvas: 'Failed to create a canvas for JPEG conversion.',
        jpegGenerate: 'Failed to generate the JPEG image.',
      },
      xHdr: {
        errors: {
          drawCanvas: 'Failed to get the draw canvas for X image generation.',
          generate: 'Failed to generate the HDR PNG for X.',
          magickWasmLoad: 'Failed to load the ImageMagick WASM asset.',
          maskCanvas: 'Failed to create the mask canvas for X image generation.',
          sourceMissing: 'The source image data for X image generation is missing. Reload the image and try again.',
          successSampleLoad: 'Failed to load the ICC reference image for X image generation.',
        },
      },
    },
  },
} as const

const detectLanguage = () => {
  if (typeof window !== 'undefined') {
    const langParam = new URLSearchParams(window.location.search).get('lang')?.toLowerCase()
    if (langParam === 'ja' || langParam === 'en') {
      return langParam
    }
  }

  if (typeof navigator === 'undefined') {
    return 'ja'
  }
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['ja', 'en'],
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
