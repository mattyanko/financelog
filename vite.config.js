import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change 'finance-log' to match your exact GitHub repo name
  base: '/financelog/',
})
