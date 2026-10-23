import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://feliperiquel.me',
  adapter: vercel(),
  build: {
    // CSP estricta de estilos: todo el CSS va a archivos externos, nunca inline
    inlineStylesheets: 'always'
  },
  vite: {
    build: {
      // CSP estricta de scripts: cero scripts inline en el HTML (limite de inline en 0)
      assetsInlineLimit: 0
    }
  },
  integrations: [
    tailwind(),
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
