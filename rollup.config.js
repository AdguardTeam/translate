import typescript from '@wessberg/rollup-plugin-ts';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

import pkg from './package.json';

const config = {
    input: 'index.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
        },
        {
            file: pkg.module,
            format: 'esm',
        }
    ],
    plugins: [
        typescript({
            transpiler: "babel"
        }),
        commonjs(),
        resolve(),
    ]
}

export default [config];
