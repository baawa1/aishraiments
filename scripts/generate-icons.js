const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-96x96.png', size: 96 },
];

async function generateIcons() {
  const inputPath = path.join(__dirname, '..', 'public', 'logo.png');
  const outputDir = path.join(__dirname, '..', 'public');

  console.log('Reading logo from:', inputPath);

  // Read the original image
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  console.log(`Original image: ${metadata.width}x${metadata.height}`);

  for (const { name, size } of sizes) {
    const outputPath = path.join(outputDir, name);

    try {
      // Create a square canvas with padding
      // Calculate the scaling to fit the image within the target size with padding
      const padding = Math.floor(size * 0.1); // 10% padding
      const targetSize = size - (padding * 2);

      await sharp(inputPath)
        .resize(targetSize, targetSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // white background
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
