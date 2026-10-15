import type { Plugin } from 'vite';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { copyFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const normalizeBase = (value: string | undefined): string => {
  const segments = (value ?? '').split('/').filter(Boolean);
  return segments.length > 0 ? `/${segments.join('/')}/` : '/';
};

const spaFallback = (): Plugin => ({
  name: 'instameter:spa-fallback',
  apply: 'build',
  closeBundle: async () => {
    const outDir = resolve(import.meta.dirname, 'dist');
    await copyFile(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
  },
});

const loadHttpsOptions = async (enabled: boolean) => {
  if (!enabled) {
    return;
  }
  const certDir = resolve(import.meta.dirname, 'certs');
  const [key, cert] = await Promise.all([
    readFile(resolve(certDir, 'dev-key.pem')),
    readFile(resolve(certDir, 'dev-cert.pem')),
  ]);
  return { key, cert };
};

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '');
  const base = normalizeBase(env.VITE_BASE);
  const https = await loadHttpsOptions(env.HTTPS === 'true');

  return {
    base,
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, 'src'),
      },
    },
    server: { host: true, https },
    preview: { host: true, https },
    plugins: [
      react(),
      tailwindcss(),
      spaFallback(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        pwaAssets: {
          config: true,
          overrideManifestIcons: true,
        },
        manifest: {
          name: 'Instameter',
          short_name: 'Instameter',
          description: 'Советчик настроек для камер моментальной печати',
          lang: 'ru',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#1f6feb',
          background_color: '#ffffff',
          scope: base,
          start_url: base,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
          globIgnores: ['404.html'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
        },
      }),
    ],
  };
});
