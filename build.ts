import { build } from 'tsup'

// Bundle the library as ESM.
build({
  bundle: true,
  clean: true,
  entry: ['src/**/*.ts'],
  format: 'esm',
  outDir: 'dist',
  splitting: false,
  sourcemap: false,
  target: 'es2021',
  cjsInterop: false,
})

// Build type declarations
Bun.spawn(['bunx', 'tsc', '--project', 'tsconfig.types.json'], {
  stdout: 'inherit',
  stderr: 'inherit'
});