# Troubleshooting

## Upgrade to v2.x

To upgrade to **v2.x** version, make sure your application build is packaging hydradx wasm files correctly
in dist folder. See examples down below:

### script

Using script in package.json

```json
{
  "scripts": {
    "copy:wasm": "./node_modules/@galacticcouncil/sdk/**/*.wasm ./dist"
  },
}
```

### esbuild

Using esbuild `esbuild-plugin-copy` plugin:

```javascript
import { copy } from 'esbuild-plugin-copy';

const plugins = [
  copy({
    resolveFrom: 'cwd',
    assets: {
      from: ['./node_modules/@galacticcouncil/sdk/build/*.wasm'],
      to: ['./dist'],
    },
  }),
];
```

### vite & rollup

Using vite `viteStaticCopy` plugin to copy wasm files to `build` folder & optimizeDeps exclude config in order
to load wasms correctly for local dev.

```javascript
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ mode }) => {
  return {
    build: {
      target: "esnext",
      outDir: "build",
    },
    optimizeDeps: {
      exclude: ["@galacticcouncil/sdk"],
    },
    plugins: [
      wasm(),
      mode === "production" &&
        viteStaticCopy({
          targets: [
            {
              src: "node_modules/@galacticcouncil/sdk/**/*.wasm",
              dest: "assets/",
            },
          ],
        }),
    ],
  };
});
```
