# Troubleshooting

## Wasm

Starting with **v2.x** version, .wasm files are not longer embedded in final bundle. To properly load
them update your build config with corresponding wasm plugin.

### esbuild

```javascript
import { wasmLoader } from 'esbuild-plugin-wasm';

const plugins = [wasmLoader({ mode: 'deferred' })];
```

### vite & rollup

```javascript
import wasm from 'vite-plugin-wasm';

export default defineConfig(({ mode }) => {
  return {
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    plugins: [wasm()],
  };
});
```
