import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, '..', 'public', 'icon.svg');
const publicDir = join(__dirname, '..', 'public');

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}

// Apple touch icon (180x180)
await sharp(svgPath)
  .resize(180, 180)
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'));
console.log('Generated apple-touch-icon.png');
