# ResOptimizer

A small web app that optimizes **Minecraft Java resource packs** (`.zip` files) in your browser. This page explains **how PNG textures are handled**.

---

## How PNG images are optimized

**In plain terms:** we open each PNG, read the picture as pixels, then save it again as a new PNG. The picture you see stays the same (unless you turn on an optional color-reduction mode). What usually changes is **file size**, because we drop extra baggage and pack the pixel data more tightly.

### What happens step by step

1. **Unpack**  
   The app walks every folder in your resource pack and finds PNG files.

2. **Decode**  
   Each PNG is turned into a grid of pixels (red, green, blue, and transparency). That is the real image data.

3. **Encode again**  
   Those pixels are written into a **fresh PNG file**. The new file is built in a clean, minimal way: we keep what Minecraft needs to draw the texture, not every optional extra the original exporter may have added.

4. **Strip metadata**  
   PNG files can carry hidden data: camera info, color profiles, text blocks, and similar. That data is often useless inside a game texture pack. Re-encoding drops most of that, which saves space.

5. **Recompress**  
   The pixel data inside a PNG is compressed with **DEFLATE** (the same family of compression **zlib** uses, which is what Minecraft relies on for PNG). We compress that stream again from the decoded pixels, which often yields a smaller file than the original, even when the pixels are identical.

### Lossless by default

With the default settings, the goal is **no visual change**: same pixels in, same pixels out. You may still get a smaller file because of cleaner structure and better compression.

Fully **opaque** images (no transparency) can sometimes be stored in a simpler color mode, which also helps size without changing how they look.

### If normal decoding fails

In rare cases the built-in PNG reader may fail. The app can then **draw the image with the browser** and save a new PNG from that. The result is still a normal PNG Minecraft can load; the idea is the same: a fresh file, often smaller, without relying on the original’s quirks.

### Optional: reduce colors (not lossless)

You can enable **color quantization**. Then each texture is limited to **at most 256 colors**. Files can get much smaller, but **colors may shift slightly** compared to the original. Use this only if you accept that trade-off.

---

*Everything runs locally in the browser; your pack is not uploaded to a server.*
