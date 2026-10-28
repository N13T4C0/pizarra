import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En GitHub Pages la app vive en https://n13t4c0.github.io/pizarra/
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/pizarra/' : '/',
  plugins: [react()],
}))
