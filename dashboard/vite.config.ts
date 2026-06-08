import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` is configurable so the same app can be served at root (Docker/nginx,
// Vercel, Netlify) or under a sub-path on GitHub Pages
// (e.g. VITE_BASE=/yourfin_rider/). Defaults to '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
