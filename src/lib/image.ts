export const loadImageSource = (src: string, errorMessage: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(errorMessage))
    image.src = src
  })

type NormalizeImageErrors = {
  canvas: string
  decode: string
  pngGenerate: string
}

export const normalizeImageFileToPngBytes = async (
  file: File,
  errors: NormalizeImageErrors,
) => {
  if (file.type === 'image/png') {
    return new Uint8Array(await file.arrayBuffer())
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImageSource(objectUrl, errors.decode)
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error(errors.canvas)
    }
    context.drawImage(image, 0, 0)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value)
        } else {
          reject(new Error(errors.pngGenerate))
        }
      }, 'image/png')
    })
    return new Uint8Array(await blob.arrayBuffer())
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
