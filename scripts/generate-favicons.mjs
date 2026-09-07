import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(process.cwd());
const svgPath = resolve(root, "public/favicon.svg");

function icoFromPngs(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + 16 * images.length;
  const payloads = [];

  for (const image of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(image.size === 256 ? 0 : image.size, 0);
    entry.writeUInt8(image.size === 256 ? 0 : image.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    payloads.push(image.png);
    offset += image.png.length;
  }

  return Buffer.concat([header, ...entries, ...payloads]);
}

async function pngFromSvg(size) {
  return sharp(svgPath, { density: 384 }).resize(size, size).png().toBuffer();
}

const png16 = await pngFromSvg(16);
const png32 = await pngFromSvg(32);
const png180 = await pngFromSvg(180);
const png192 = await pngFromSvg(192);
const png512 = await pngFromSvg(512);
const maskableInner = await sharp(svgPath, { density: 384 })
  .resize(410, 410)
  .png()
  .toBuffer();
const pngMaskable = await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: "#1f7a3d",
  },
})
  .composite([{ input: maskableInner, gravity: "center" }])
  .png()
  .toBuffer();

writeFileSync(resolve(root, "public/favicon.ico"), icoFromPngs([
  { size: 16, png: png16 },
  { size: 32, png: png32 },
]));
writeFileSync(resolve(root, "public/apple-touch-icon.png"), png180);
writeFileSync(resolve(root, "public/icon-192.png"), png192);
writeFileSync(resolve(root, "public/icon-512.png"), png512);
writeFileSync(resolve(root, "public/icon-maskable-512.png"), pngMaskable);

console.log("Wrote favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png");
