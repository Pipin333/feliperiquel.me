import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://feliperiquel.me',
  adapter: vercel(),
  integrations: [tailwind()],
  redirects: {
    '/mantenimiento': '/mantencion'
  },
  security: {
    checkOrigin: false
  },
  server: {
    port: 4321,
    host: true
  }
});
