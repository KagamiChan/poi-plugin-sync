import typescript from 'rollup-plugin-typescript'
import resolve from 'rollup-plugin-node-resolve'
import builtins from 'builtin-modules'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default {
  input: './index.ts',
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
    terser({
      output: {
        comments: 'all',
      },
    }),
  ],
  output: {
    file: 'dist/main.js',
    format: 'cjs',
    sourcemap: true,
  },
  external: builtins,
}
