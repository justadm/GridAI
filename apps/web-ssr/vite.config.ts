import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^vue$/, replacement: 'vue/dist/vue.esm-bundler.js' }
    ]
  },
  server: {
    allowedHosts: ['gridai.loc', 'auth.gridai.loc', 'career.gridai.loc', 'hiring.gridai.loc', 'admin.gridai.loc', 'api.gridai.loc', 'localhost', '127.0.0.1']
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist/client'),
    emptyOutDir: true
  },
  ssr: {
    noExternal: ['vue', 'vue-router']
  }
});
