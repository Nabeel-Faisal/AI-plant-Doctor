import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iconsDir = path.join(root, 'public', 'icons');

const base = path.join(root, 'public', 'icon-source.svg');
const maskable = path.join(root, 'public', 'icon-maskable-source.svg');

async function run() {
  await sharp(base).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  await sharp(base).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  await sharp(base).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  await sharp(maskable).resize(512, 512).png().toFile(path.join(iconsDir, 'maskable-512.png'));
  console.log('Icons generated in public/icons/');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
