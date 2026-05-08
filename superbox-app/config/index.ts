import type { UserConfigExport } from '@tarojs/cli'

export default {
  projectName: 'macro-asset-interactive',
  date: '2026-05-08',
  designWidth: 375,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-framework-react'],
  defineConstants: {},
  copy: { patterns: [{ from: 'src/index.html', to: 'dist/index.html' }], options: {} },
  framework: 'react',
  compiler: 'webpack5',
  mini: {
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    esnextModules: ['@tarojs/components'],
    prebundle: { enable: false },
    postcss: {
      autoprefixer: { enable: true, config: {} },
    },
  },
} satisfies UserConfigExport
