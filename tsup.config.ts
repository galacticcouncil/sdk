import { defineConfig } from 'tsup';

export default defineConfig(({ watch }) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'build',
  target: 'node18',
  bundle: true,
  minify: true,
  sourcemap: false,
  clean: true,
  dts: false,
  outExtension({ format }) {
    const ext = format === 'esm' ? 'mjs' : 'cjs';

    return {
      js: `.${ext}`,
    };
  },
}));
