# Troubleshooting

## Wasm

Starting with **v2.x** version, .wasm files are not longer embedded in final bundle. To properly load
them update your build config with appropriate wasm plugin.

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

## Websocket TTL cache

In the 8.x release, we upgraded `@polkadot/api` to version **16.x**.

> 🐛 **Note:** A **TTL-based LRU cache** was introduced starting from
> `@polkadot/api` **v14.1.1**, which can break router behavior if not
> addressed (eviction issue).

- 📄 [Release notes – v14.1.1](https://github.com/polkadot-js/api/releases/tag/v14.1.1)
- 🐞 [GitHub Issue #6154](https://github.com/polkadot-js/api/issues/6154)
- 🐞 [GitHub Issue #6122](https://github.com/polkadot-js/api/issues/6122)

To ensure the router works as expected, **either**:

1. Use a custom `WsProvider` configuration with cache TTL at least 10 minutes
2. Use a custom `WsProvider` configuration with cache TTL disabled (null)

```typescript
const wsProvider = new WsProvider(
  ws,
  2_500, // autoConnect (2.5 seconds)
  {}, // headers
  60_000, // request timeout  (60 seconds)
  102400, // cache capacity
  10 * 60_000 // cache TTL (10 minutes)
);
```
