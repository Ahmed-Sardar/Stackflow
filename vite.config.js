import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const envDir = fileURLToPath(new URL('./client', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, 'VITE_');
  if (env.VITE_API_URL && env.VITE_API_URL !== '/api') {
    throw new Error('VITE_API_URL must be /api for cookie authentication. Configure the Render URL in vercel.json using npm run configure:render -- https://YOUR-SERVICE.onrender.com.');
  }
  if (process.env.VERCEL === '1') {
    const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
    const destination = config.rewrites?.find(rule => rule.source === '/api/:path*')?.destination;
    if (!destination || destination.includes('YOUR-RENDER-SERVICE')) {
      throw new Error('Set the new Render service URL before deploying Vercel: npm run configure:render -- https://YOUR-SERVICE.onrender.com');
    }
  }
  return {
    envDir,
    plugins: [react()],
    server: { proxy: { '/api': 'http://localhost:4000' } },
  };
});
