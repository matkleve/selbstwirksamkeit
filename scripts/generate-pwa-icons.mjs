#!/usr/bin/env node
/** Rasterize public/icons/*.svg → icon-192.png, icon-512.png for iOS PWA. */
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = resolve(__dirname, '../public/icons')

async function rasterize(svgName, pngName, size) {
  const svg = readFileSync(resolve(iconsDir, svgName))
  await sharp(svg, { density: 144 })
    .resize(size, size)
    .png()
    .toFile(resolve(iconsDir, pngName))
  console.log(`  wrote ${pngName} (${size}×${size})`)
}

await rasterize('icon-192.svg', 'icon-192.png', 192)
await rasterize('icon-512.svg', 'icon-512.png', 512)
console.log('Done.')
