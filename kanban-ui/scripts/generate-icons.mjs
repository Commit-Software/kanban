// Simple script to generate PWA icons
// Run with: node scripts/generate-icons.js

import { writeFileSync } from 'fs';
import { createCanvas } from 'canvas';

const sizes = [192, 512];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#030712';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.167);
  ctx.fill();
  
  const scale = size / 192;
  
  // Pink bar
  ctx.fillStyle = '#db2777';
  ctx.beginPath();
  ctx.roundRect(24 * scale, 48 * scale, 40 * scale, 96 * scale, 8 * scale);
  ctx.fill();
  
  // Purple bar
  ctx.fillStyle = '#8b5cf6';
  ctx.beginPath();
  ctx.roundRect(76 * scale, 32 * scale, 40 * scale, 128 * scale, 8 * scale);
  ctx.fill();
  
  // Cyan bar
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.roundRect(128 * scale, 64 * scale, 40 * scale, 80 * scale, 8 * scale);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`public/icon-${size}.png`, buffer);
  console.log(`Generated icon-${size}.png`);
}
