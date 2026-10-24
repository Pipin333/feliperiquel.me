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
    server: {
      proxy: {
        '/lab/finflow': {
          target: 'https://finflow-beta-two.vercel.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/lab\/finflow/, '')
        }
      }
    },
    build: {
      // CSP estricta de scripts: cero scripts inline en el HTML (limite de inline en 0)
      assetsInlineLimit: 0
    }
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/mantencion') && !page.includes('/ni-idea'),
      customPages: ['https://feliperiquel.me/lab/finflow/']
    })
  ],
  redirects: {
    '/mantenimiento': '/mantencion',
    '/construccion': '/mantencion'
  },
  security: {
    checkOrigin: true
  },
  server: {
    port: 4321,
    host: true
  }
});
