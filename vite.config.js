import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const BUILD = String(Date.now())
// version.json lets an already-open app (iPhone keeps it in memory) notice a new release and reload itself
const versionFile = { name: 'version-file', generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ v: BUILD }) }) } }
export default defineConfig({ base: process.env.BASE || './', define: { __BUILD__: JSON.stringify(BUILD) }, plugins: [react(), versionFile], build: { target: ['es2018', 'safari12', 'chrome64'] } })
