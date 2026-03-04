# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## UltraHDR セットアップ

このアプリは`libultrahdr-wasm`のビルド成果物を`public/ultrahdr`から読み込みます。

```
git clone https://github.com/MONOGRID/libultrahdr-wasm.git vendor/libultrahdr-wasm
make ultrahdr
npm install
```

`make ultrahdr`は`vendor/libultrahdr-wasm`で`libultrahdr-esm`のみビルドし、成果物を`public/ultrahdr`へコピーします。
アプリは`public/ultrahdr/libultrahdr-esm.js`を読み込むため、出力ファイル名が異なる場合は`src/ultrahdr.ts`と合わせて調整してください。
`emscripten`, `meson`, `ninja`が必要です。必要に応じて`Makefile`の`ULTRAHDR_BUILD_DIR`や`ULTRAHDR_BUILD_CMD`を変更できます。
Emscriptenのキャッシュは`vendor/libultrahdr-wasm/.emscripten_cache`へ作成します。

ネットワークに出られない環境では、以下を`vendor/libultrahdr-wasm/subprojects/packagecache`へ手動で配置してください。

- `libjpeg-turbo-3.0.0.tar.gz` (https://sourceforge.net/projects/libjpeg-turbo/files/3.0.0/libjpeg-turbo-3.0.0.tar.gz)
- `libjpeg-turbo_3.0.0-5_patch.zip` (https://wrapdb.mesonbuild.com/v2/libjpeg-turbo_3.0.0-5/get_patch)

### macOS (Homebrew)

```
brew install emscripten meson ninja
```
