import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Selbstwirksamkeit',
    short_name: 'Erfolge',
    description: 'Dein persönliches Erfolgs-Journal',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f7',
    theme_color: '#1a1a1a',
    icons: [
      { src: '/icons/icon-192.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icons/icon-512.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
