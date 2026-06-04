import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Selbstwirksamkeit',
    short_name: 'Erfolge',
    description: 'Dein persönliches Erfolgs-Journal',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf6ef',
    theme_color: '#152a47',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
