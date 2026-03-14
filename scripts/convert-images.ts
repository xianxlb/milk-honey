import sharp from 'sharp'
import { readdir, unlink, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BUILDINGS_DIR = join(__dirname, '..', 'public', 'buildings')

async function main() {
  const files = await readdir(BUILDINGS_DIR)
  const pngs = files.filter(f => f.endsWith('.png'))

  console.log(`Found ${pngs.length} PNG files to convert`)

  for (const png of pngs) {
    const input = join(BUILDINGS_DIR, png)
    const output = join(BUILDINGS_DIR, png.replace('.png', '.webp'))

    await sharp(input).webp({ quality: 80 }).toFile(output)

    const fileStat = await stat(output)
    console.log(`  ${png} → ${png.replace('.png', '.webp')} (${(fileStat.size / 1024).toFixed(0)} KB)`)

    await unlink(input)
  }

  console.log('Done! Original PNGs deleted.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
