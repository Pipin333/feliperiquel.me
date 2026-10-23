import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://feliperiquel.me',
  adapter: vercel(),
  build: {
    // En Astro 7 + Tailwind 4, todo el CSS se compila a archivo externo (.css)
    inlineStylesheets: 'never'
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // CSP estricta de scripts: cero scripts inline en el HTML (limite de inline en 0)
      assetsInlineLimit: 0
    }
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/mantencion') && !page.includes('/ni-idea')
    })
  ],
  redirects: {
    '/mantenimiento': '/mantencion'
  },
  security: {
    checkOrigin: true
  },
  server: {
    port: 4321,
    host: true
  }
});
