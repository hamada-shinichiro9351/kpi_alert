import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages (project pages) 用の base 設定
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'
const repositoryName = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || ''

// https://vitejs.dev/config/
export default defineConfig({
  base: isGitHubActions && repositoryName ? `/${repositoryName}/` : '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
