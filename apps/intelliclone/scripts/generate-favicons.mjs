import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const faviconDir = join(__dirname, '../public/images/favicon');

// SVG content with embedded fonts for consistent rendering
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1a1a2e"/>
  <text x="100" y="380" font-family="Arial, Helvetica, sans-serif" font-size="320" font-weight="700" fill="#ffffff">I</text>
  <text x="230" y="380" font-family="Arial, Helvetica, sans-serif" font-size="320" font-weight="700" fill="#D4A84B">C</text>
</svg>`;

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'mstile-150x150.png', size: 150 },
];

async function generateFavicons() {
  console.log('Generating favicons...');
  
  const svgBuffer = Buffer.from(svgContent);
  
  for (const { name, size } of sizes) {
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(join(faviconDir, name));
      console.log(`✓ Generated ${name}`);
    } catch (err) {
      console.error(`✗ Failed to generate ${name}:`, err.message);
    }
  }
  
  // Generate ICO (just use 32x32 PNG renamed - browsers handle this)
  try {
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(join(faviconDir, 'favicon.ico'));
    console.log('✓ Generated favicon.ico');
  } catch (err) {
    console.error('✗ Failed to generate favicon.ico:', err.message);
  }
  
  console.log('Done!');
}

generateFavicons();
