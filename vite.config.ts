import path from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ tsDecorators: true }),
    tsconfigPaths(),
    svgr({ exportAsDefault: true }),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      'theme/': path.resolve(__dirname, './src/theme') + '/',
    },
  }
})
