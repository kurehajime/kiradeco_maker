type UltraHDREncoder = (payload: {
  base: ImageData
  gainmap: ImageData
  width: number
  height: number
}) => Promise<Uint8Array | ArrayBuffer | { data: Uint8Array } | Uint8Array>

const resolveEncoder = (module: Record<string, unknown>) => {
  const candidates = [
    module.encodeUltraHDR,
    module.encodeUHDR,
    module.encode,
    module.default && (module.default as Record<string, unknown>).encodeUltraHDR,
    module.default && (module.default as Record<string, unknown>).encode,
  ]
  return candidates.find((candidate) => typeof candidate === 'function') as
    | UltraHDREncoder
    | undefined
}

const loadModule = async () => {
  const moduleUrl = '/ultrahdr/libultrahdr-esm.js'
  try {
    const loaded = (await import(/* @vite-ignore */ moduleUrl)) as Record<string, unknown>
    return loaded
  } catch (error) {
    throw new Error(
      'UltraHDRモジュールの読み込みに失敗しました。`make ultrahdr`でビルドしてください。',
      { cause: error },
    )
  }
}

export const encodeUltraHDR = async (base: ImageData, gainmap: ImageData) => {
  const module = await loadModule()
  const init = module.default
  if (typeof init === 'function') {
    await (init as () => Promise<void>)()
  }
  const encoder = resolveEncoder(module)
  if (!encoder) {
    throw new Error('libultrahdr-wasmのエンコーダーが見つかりません。')
  }
  const result = await encoder({
    base,
    gainmap,
    width: base.width,
    height: base.height,
  })
  const data =
    result instanceof Uint8Array
      ? result
      : result instanceof ArrayBuffer
        ? new Uint8Array(result)
        : result.data
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  return new Blob([arrayBuffer], { type: 'image/jpeg' })
}
