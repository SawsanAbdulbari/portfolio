import sharp from 'sharp';
import { readdirSync, unlinkSync, existsSync, statSync } from 'fs';
import { join, parse, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const imgDir = resolve(__dirname, '../images/');
const files = readdirSync(imgDir).filter(f => f.endsWith('.png'));

for (const file of files) {
  const inputPath = join(imgDir, file);
  const { name } = parse(file);
  const outputPath = join(imgDir, `${name}.webp`);
  console.log(`Converting: ${file}`);
  await sharp(inputPath)
    .webp({ quality: 75 })
    .toFile(outputPath);
  const { size: oldSize } = statSync(inputPath);
  const { size: newSize } = statSync(outputPath);
  console.log(`  ${(oldSize / 1024).toFixed(1)} KB → ${(newSize / 1024).toFixed(1)} KB (${((newSize / oldSize) * 100).toFixed(0)}%)`);
}

// Remove legacy tech_background.png
const legacy = join(imgDir, 'tech_background.png');
if (existsSync(legacy)) {
  unlinkSync(legacy);
  console.log('Removed legacy tech_background.png');
}

console.log('Done.');
