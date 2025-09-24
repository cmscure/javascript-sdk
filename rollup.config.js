import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const isProduction = process.env.NODE_ENV === 'production';

const banner = `/**
 * CMSCure JavaScript SDK v${packageJson.version}
 * Official SDK for CMSCure content management
 * 
 * Copyright (c) ${new Date().getFullYear()} CMSCure
 * Licensed under MIT License
 * 
 * https://cmscure.com
 */`;

const baseConfig = {
  input: 'src/cmscure.js',
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    json()
  ]
};

const configs = [
  // ES Module build
  {
    ...baseConfig,
    output: {
      file: 'dist/cmscure.esm.js',
      format: 'esm',
      banner,
      sourcemap: true
    }
  },
  
  // CommonJS build
  {
    ...baseConfig,
    output: {
      file: 'dist/cmscure.js',
      format: 'cjs',
      banner,
      sourcemap: true,
      exports: 'default'
    }
  },
  
  // UMD build for browsers
  {
    ...baseConfig,
    output: {
      file: 'dist/cmscure.umd.js',
      format: 'umd',
      name: 'CMSCureSDK',
      banner,
      sourcemap: true
    }
  }
];

// Add minified versions for production
if (isProduction) {
  configs.push(
    // Minified ES Module
    {
      ...baseConfig,
      plugins: [...baseConfig.plugins, terser()],
      output: {
        file: 'dist/cmscure.esm.min.js',
        format: 'esm',
        banner,
        sourcemap: true
      }
    },
    
    // Minified UMD
    {
      ...baseConfig,
      plugins: [...baseConfig.plugins, terser()],
      output: {
        file: 'dist/cmscure.umd.min.js',
        format: 'umd',
        name: 'CMSCureSDK',
        banner,
        sourcemap: true
      }
    }
  );
}

export default configs;
