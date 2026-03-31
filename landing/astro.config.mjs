import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // Mantenemos react para que los iconos carguen sin problemas
  integrations: [react()],
  vite: {
    plugins: [tailwind()],
    // Forzamos a Vite a optimizar react-icons para evitar errores de transformación
    ssr: {
      noExternal: ['react-icons']
    }
  },
});
