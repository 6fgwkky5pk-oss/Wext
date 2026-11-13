import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ base: process.env.BASE || './', plugins: [react()], build: { target: ['es2018', 'safari12', 'chrome64'] } })
