package com.example.editor.common.util;

import java.io.ByteArrayInputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * 罕见/老式图片尺寸解析工具类
 * <p>
 * 支持一些不常见或老式的图片格式：
 * - CUR (Windows Cursor)
 * - PCX (PC Paintbrush)
 * - TGA (Targa)
 * - WBMP (Wireless BMP)
 * - XBM (X Bitmap)
 * - XPM (X PixMap)
 * <p>
 * 对于常见格式（JPEG, PNG, GIF, BMP, WebP, TIFF, ICO, PSD），
 * 请使用 {@link ImageUtils}
 */
public final class LegacyImageUtils {

    private LegacyImageUtils() {
    }

    /**
     * 解析图片尺寸
     *
     * @param data 图片文件字节数据
     * @return 包含宽高的 Dimension 对象
     * @throws IOException 如果数据格式无法识别或不支持
     */
    public static Dimension getDimension(byte[] data) throws IOException {
        return getDimension(new ByteArrayInputStream(data));
    }

    /**
     * 解析图片尺寸
     *
     * @param inputStream 图片文件输入流
     * @return 包含宽高的 Dimension 对象
     * @throws IOException 如果数据格式无法识别或不支持
     */
    public static Dimension getDimension(InputStream inputStream) throws IOException {
        DataInputStream dis = new DataInputStream(inputStream);
        dis.mark(32);

        int b1 = dis.read();
        int b2 = dis.read();
        int b3 = dis.read();
        int b4 = dis.read();

        if (b1 == -1 || b2 == -1) {
            throw new IOException("Empty or truncated file");
        }

        dis.reset();

        // CUR (Windows Cursor): 00 00 02 00
        // 注意：TGA 文件头也可能以 00 00 02 开头，但 TGA 第4字节是 color map spec 的开始
        // 需要先尝试 CUR，失败后再尝试 TGA
        if (b1 == 0x00 && b2 == 0x00 && b3 == 0x02 && b4 == 0x00) {
            try {
                dis.reset();
                return parseCUR(dis);
            } catch (IOException e) {
                // 不是有效的 CUR，继续尝试其他格式
                dis.reset();
            }
        }

        // PCX: 0A (identifier)，version 0-5
        if (b1 == 0x0A && b2 >= 0 && b2 <= 5) {
            return parsePCX(dis);
        }

        // WBMP: 00 00 (type + fixed header)
        // WBMP 文件头是 00 00，但需要确保不是 CUR/ICO 的变体
        // CUR 是 00 00 02 00，ICO 是 00 00 01 00
        if (b1 == 0x00 && b2 == 0x00 && (b3 != 0x01 && b3 != 0x02 || b4 != 0x00)) {
            try {
                dis.reset();
                return parseWBMP(dis);
            } catch (IOException e) {
                // 不是 WBMP，继续尝试 TGA
            }
        }

        // TGA: 尝试解析（放在最后，因为它的判断条件最宽松）
        try {
            dis.reset();
            return parseTGA(dis);
        } catch (IOException e) {
            // 不是 TGA
        }

        // XBM: C source file starting with #define
        if (b1 == '#' && b2 == 'd') {
            dis.reset();
            return parseXBM(dis);
        }

        throw new IOException("Unsupported legacy image format. Supported: CUR, PCX, TGA, WBMP, XBM. For common formats, use ImageUtils.");
    }

    /**
     * 解析 CUR (Windows Cursor) 图片
     * 格式与 ICO 类似
     */
    private static Dimension parseCUR(DataInputStream dis) throws IOException {
        dis.skipBytes(4); // reserved + type
        int count = readUInt16LE(dis);
        if (count == 0) {
            throw new IOException("CUR file has no images");
        }

        int width = dis.readByte() & 0xFF;
        int height = dis.readByte() & 0xFF;

        // CUR 中 width/height 为 0 表示 256
        if (width == 0) width = 256;
        if (height == 0) height = 256;

        return new Dimension(width, height);
    }

    /**
     * 解析 PCX (PC Paintbrush) 图片
     * PCX header (128 bytes):
     * - byte 0: identifier (0x0A)
     * - byte 1: version (0-5)
     * - byte 2: encoding (0=uncompressed, 1=RLE)
     * - byte 3: bits per pixel per plane
     * - bytes 4-7: xmin (little endian)
     * - bytes 8-11: ymin (little endian)
     * - bytes 12-15: xmax (little endian)
     * - bytes 16-19: ymax (little endian)
     */
    private static Dimension parsePCX(DataInputStream dis) throws IOException {
        dis.skipBytes(4); // identifier + version + encoding + bpp

        int xmin = readUInt16LE(dis);
        int ymin = readUInt16LE(dis);
        int xmax = readUInt16LE(dis);
        int ymax = readUInt16LE(dis);

        int width = xmax - xmin + 1;
        int height = ymax - ymin + 1;

        if (width <= 0 || height <= 0) {
            throw new IOException("Invalid PCX dimensions");
        }

        return new Dimension(width, height);
    }

    /**
     * 解析 TGA (Targa) 图片
     * TGA header (18 bytes minimum):
     * - byte 0: ID length
     * - byte 1: color map type (0=no colormap, 1=has colormap)
     * - byte 2: image type (0=no image, 1-3=uncompressed, 9-11=RLE compressed)
     * - bytes 3-7: color map specification
     * - bytes 8-9: x origin (little endian)
     * - bytes 10-11: y origin (little endian)
     * - bytes 12-13: width (little endian)
     * - bytes 14-15: height (little endian)
     * - byte 16: pixel depth
     * - byte 17: image descriptor
     */
    private static Dimension parseTGA(DataInputStream dis) throws IOException {
        int idLength = dis.readByte() & 0xFF;
        int colorMapType = dis.readByte() & 0xFF;
        int imageType = dis.readByte() & 0xFF;

        // 验证是否为有效 TGA
        if (imageType == 0) {
            throw new IOException("TGA has no image data");
        }
        if (colorMapType > 1) {
            throw new IOException("Invalid TGA color map type");
        }

        // 跳过 color map specification (5 bytes)
        dis.skipBytes(5);

        // x origin, y origin (跳过)
        readUInt16LE(dis);
        readUInt16LE(dis);

        // width, height
        int width = readUInt16LE(dis);
        int height = readUInt16LE(dis);

        if (width == 0 || height == 0) {
            throw new IOException("Invalid TGA dimensions");
        }

        return new Dimension(width, height);
    }

    /**
     * 解析 WBMP (Wireless BMP) 图片
     * WBMP 使用多字节整数编码
     */
    private static Dimension parseWBMP(DataInputStream dis) throws IOException {
        // type (必须为 0)
        int type = dis.readByte() & 0xFF;
        if (type != 0) {
            throw new IOException("Invalid WBMP type");
        }

        // fixed header field (必须为 0)
        int fixedHeader = dis.readByte() & 0xFF;
        if (fixedHeader != 0) {
            throw new IOException("Invalid WBMP fixed header");
        }

        int width = readWBMPMultiByteInt(dis);
        int height = readWBMPMultiByteInt(dis);

        if (width == 0 || height == 0) {
            throw new IOException("Invalid WBMP dimensions");
        }

        return new Dimension(width, height);
    }

    /**
     * 读取 WBMP 多字节整数
     */
    private static int readWBMPMultiByteInt(DataInputStream dis) throws IOException {
        int value = 0;
        int b;
        int bytesRead = 0;
        do {
            b = dis.readByte() & 0xFF;
            value = (value << 7) | (b & 0x7F);
            bytesRead++;
            if (bytesRead > 5) {
                throw new IOException("WBMP integer too large");
            }
        } while ((b & 0x80) != 0);
        return value;
    }

    /**
     * 解析 XBM (X Bitmap) 图片
     * XBM 是 C 语言源文件格式:
     * #define name_width 100
     * #define name_height 50
     * static unsigned char name_bits[] = { ... };
     */
    private static Dimension parseXBM(DataInputStream dis) throws IOException {
        StringBuilder sb = new StringBuilder();
        byte[] buffer = new byte[1024];
        int bytesRead = dis.read(buffer);
        if (bytesRead > 0) {
            sb.append(new String(buffer, 0, bytesRead, "ASCII"));
        }

        String content = sb.toString();

        // 查找 _width 定义
        int width = findDefineValue(content, "_width");
        int height = findDefineValue(content, "_height");

        if (width == -1 || height == -1) {
            throw new IOException("XBM width/height not found");
        }

        return new Dimension(width, height);
    }

    /**
     * 在 XBM 内容中查找 #define 宏的值
     * 匹配格式: #define <identifier>_width <value>
     */
    private static int findDefineValue(String content, String suffix) {
        // 使用非贪婪匹配，确保 suffix 能正确匹配
        String pattern = "#define\\s+\\S+?" + suffix + "\\s+(\\d+)";
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
        java.util.regex.Matcher m = p.matcher(content);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException e) {
                return -1;
            }
        }
        return -1;
    }

    private static int readUInt16LE(DataInputStream dis) throws IOException {
        byte[] bytes = new byte[2];
        dis.readFully(bytes);
        return (bytes[0] & 0xFF) | ((bytes[1] & 0xFF) << 8);
    }

    /**
     * 图片尺寸信息
     */
    public static final class Dimension {
        private final int width;
        private final int height;

        public Dimension(int width, int height) {
            this.width = width;
            this.height = height;
        }

        public int getWidth() {
            return width;
        }

        public int getHeight() {
            return height;
        }

        @Override
        public String toString() {
            return width + " x " + height;
        }
    }
}