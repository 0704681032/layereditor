---
name: ImageUtils Review Findings
description: Key issues found in ImageUtils.java image dimension parser review
type: project
---

ImageUtils.java reviewed on 2026-05-10. Critical issues found:

1. **VP8X flag skip is 2 bytes short** -- reads `readShort()` (2 bytes) when it should skip 4 bytes before reading width/height. This means VP8X dimensions are parsed from the wrong byte offset.

2. **BMP int cast truncation** -- `readUInt32LE` returns long, cast to int can produce negative values for widths > 2^31-1.

3. **TIFF IFD offset not validated** -- offset < 8 causes skipBytes to be negative, parser reads from wrong position silently.

4. **TIFF value offset indirection ignored** -- always treats 4-byte value field as direct value, doesn't handle count > 1 or seek to offset.

5. **JPEG segment length not validated** -- length of 0 or 1 causes skipBytes(-2) or (-1), misaligns parser.

6. **No stream closing** -- DataInputStream never closed, resource leak for non-ByteArrayInputStream callers.

7. **mark/reset fragile** -- No check for markSupported(), will fail on FileInputStream etc.

8. **PNG/PSD signed int** -- readInt() can return negative values, should validate.

How to apply: If anyone modifies ImageUtils or adds format support, these issues should be fixed first. The VP8X bug is the most impactful for correctness since it affects all VP8X WebP files.
