package com.example.editor.common.util;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.DataInput;
import java.io.DataInputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * 常用图片尺寸解析工具类
 * <p>
 * 通过解析文件头部字节获取图片宽高，无需第三方依赖。
 * <p>
 * 支持格式：
 * - JPEG (JFIF/Exif)
 * - PNG
 * - GIF (87a/89a)
 * - BMP
 * - WebP (VP8/VP8L/VP8X)
 * - TIFF (Intel/Motorola byte order)
 * - ICO (Windows Icon)
 * - PSD (Photoshop)
 */
public final class ImageUtils {

    private ImageUtils() {
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
        if (!inputStream.markSupported()) {
            inputStream = new BufferedInputStream(inputStream);
        }
        DataInputStream dis = new DataInputStream(inputStream);
        dis.mark(16);

        int b1 = dis.read();
        int b2 = dis.read();
        int b3 = dis.read();
        int b4 = dis.read();

        if (b1 == -1 || b2 == -1) {
            throw new IOException("Empty or truncated file");
        }

        dis.reset();

        // JPEG: FF D8
        if (b1 == 0xFF && b2 == 0xD8) {
            return parseJPEG(dis);
        }

        // PNG: 89 50 4E 47
        if (b1 == 0x89 && b2 == 0x50) {
            return parsePNG(dis);
        }

        // GIF: 47 49 46 ("GIF")
        if (b1 == 0x47 && b2 == 0x49) {
            return parseGIF(dis);
        }

        // BMP: 42 4D ("BM")
        if (b1 == 0x42 && b2 == 0x4D) {
            return parseBMP(dis);
        }

        // WebP: 52 49 46 46 ("RIFF")
        if (b1 == 0x52 && b2 == 0x49 && b3 == 0x46 && b4 == 0x46) {
            return parseWebP(dis);
        }

        // TIFF (Intel byte order): 49 49 2A 00
        if (b1 == 0x49 && b2 == 0x49 && b3 == 0x2A && b4 == 0x00) {
            return parseTIFF(dis, false);
        }

        // TIFF (Motorola byte order): 4D 4D 00 2A
        if (b1 == 0x4D && b2 == 0x4D && b3 == 0x00 && b4 == 0x2A) {
            return parseTIFF(dis, true);
        }

        // ICO: 00 00 01 00
        if (b1 == 0x00 && b2 == 0x00 && b3 == 0x01 && b4 == 0x00) {
            return parseICO(dis);
        }

        // PSD: 38 42 50 53 ("8BPS")
        if (b1 == 0x38 && b2 == 0x42 && b3 == 0x50 && b4 == 0x53) {
            return parsePSD(dis);
        }

        throw new IOException("Unsupported image format. Supported: JPEG, PNG, GIF, BMP, WebP, TIFF, ICO, PSD");
    }

    /**
     * 解析 JPEG 图片
     */
    private static Dimension parseJPEG(DataInputStream dis) throws IOException {
        int soi = dis.readUnsignedShort();
        if (soi != 0xFFD8) {
            throw new IOException("Invalid JPEG SOI marker");
        }

        while (true) {
            int type = readJpegMarkerType(dis);

            if (type >= 0xC0 && type <= 0xCF && type != 0xC4 && type != 0xC8 && type != 0xCC) {
                int length = dis.readUnsignedShort();
                if (length < 7) {
                    throw new IOException("Invalid JPEG SOF segment length: " + length);
                }
                dis.readUnsignedByte();  // precision
                int height = dis.readUnsignedShort();
                int width = dis.readUnsignedShort();
                return validateDimension(width, height);
            }

            if (type == 0xD9 || type == 0xDA) {
                throw new IOException("JPEG SOF marker not found");
            }

            if (type == 0x01 || type >= 0xD0 && type <= 0xD7) {
                continue;
            }

            int length = dis.readUnsignedShort();
            if (length < 2) {
                throw new IOException("Invalid JPEG segment length: " + length);
            }
            skipFully(dis, length - 2);
        }
    }

    private static int readJpegMarkerType(DataInputStream dis) throws IOException {
        int b;
        do {
            b = dis.readUnsignedByte();
        } while (b != 0xFF);

        do {
            b = dis.readUnsignedByte();
        } while (b == 0xFF);

        if (b == 0x00) {
            throw new IOException("Invalid JPEG marker");
        }
        return b;
    }

    /**
     * 解析 PNG 图片
     */
    private static Dimension parsePNG(DataInputStream dis) throws IOException {
        byte[] signature = new byte[8];
        dis.readFully(signature);
        byte[] expectedSignature = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        for (int i = 0; i < expectedSignature.length; i++) {
            if (signature[i] != expectedSignature[i]) {
                throw new IOException("Invalid PNG signature");
            }
        }
        int length = dis.readInt();
        String type = readFourCC(dis);
        if (length != 13 || !"IHDR".equals(type)) {
            throw new IOException("PNG IHDR chunk not found");
        }
        int width = dis.readInt();
        int height = dis.readInt();
        return validateDimension(width, height);
    }

    /**
     * 解析 GIF 图片
     */
    private static Dimension parseGIF(DataInputStream dis) throws IOException {
        String signature = readFourCC(dis);
        int version1 = dis.readUnsignedByte();
        int version2 = dis.readUnsignedByte();
        if (!"GIF8".equals(signature) || !((version1 == '7' || version1 == '9') && version2 == 'a')) {
            throw new IOException("Invalid GIF signature");
        }
        int width = readUInt16LE(dis);
        int height = readUInt16LE(dis);
        return validateDimension(width, height);
    }

    /**
     * 解析 BMP 图片
     */
    private static Dimension parseBMP(DataInputStream dis) throws IOException {
        skipFully(dis, 14);
        long headerSize = readUInt32LE(dis);
        int width;
        int height;
        if (headerSize == 12) {
            width = readUInt16LE(dis);
            height = readUInt16LE(dis);
        } else if (headerSize >= 40) {
            width = readInt32LE(dis);
            height = readInt32LE(dis);
            if (height < 0) height = -height;
        } else {
            throw new IOException("Unsupported BMP DIB header size: " + headerSize);
        }
        return validateDimension(width, height);
    }

    /**
     * 解析 WebP 图片
     */
    private static Dimension parseWebP(DataInputStream dis) throws IOException {
        String riff = readFourCC(dis);
        if (!"RIFF".equals(riff)) {
            throw new IOException("Not a valid WebP file");
        }
        dis.readInt();
        String webp = readFourCC(dis);
        if (!"WEBP".equals(webp)) {
            throw new IOException("Not a valid WebP file");
        }

        String chunkType = readFourCC(dis);
        return switch (chunkType) {
            case "VP8 " -> parseVP8(dis);
            case "VP8L" -> parseVP8L(dis);
            case "VP8X" -> parseVP8X(dis);
            default -> throw new IOException("Unknown WebP chunk type: " + chunkType);
        };
    }

    private static Dimension parseVP8(DataInputStream dis) throws IOException {
        long chunkSize = readUInt32LE(dis);
        if (chunkSize < 10) {
            throw new IOException("Invalid VP8 chunk size: " + chunkSize);
        }
        skipFully(dis, 3); // frame tag
        byte[] startCode = new byte[3];
        dis.readFully(startCode);
        if (startCode[0] != (byte) 0x9d || startCode[1] != 0x01 || startCode[2] != 0x2a) {
            throw new IOException("Invalid VP8 start code");
        }
        int widthAndScale = readUInt16LE(dis);
        int heightAndScale = readUInt16LE(dis);
        return validateDimension(widthAndScale & 0x3FFF, heightAndScale & 0x3FFF);
    }

    private static Dimension parseVP8L(DataInputStream dis) throws IOException {
        long chunkSize = readUInt32LE(dis);
        if (chunkSize < 5) {
            throw new IOException("Invalid VP8L chunk size: " + chunkSize);
        }
        if (dis.readUnsignedByte() != 0x2f) {
            throw new IOException("Invalid VP8L signature");
        }
        byte[] bits = new byte[4];
        dis.readFully(bits);
        int widthHeightBits = (bits[0] & 0xFF) | ((bits[1] & 0xFF) << 8) | ((bits[2] & 0xFF) << 16) | ((bits[3] & 0xFF) << 24);
        return validateDimension((widthHeightBits & 0x3FFF) + 1, ((widthHeightBits >> 14) & 0x3FFF) + 1);
    }

    private static Dimension parseVP8X(DataInputStream dis) throws IOException {
        long chunkSize = readUInt32LE(dis);
        if (chunkSize < 10) {
            throw new IOException("Invalid VP8X chunk size: " + chunkSize);
        }
        readUInt32LE(dis); // flags (4 bytes, not 2)
        int widthMinus1 = readUInt24LE(dis);
        int heightMinus1 = readUInt24LE(dis);
        return validateDimension(widthMinus1 + 1, heightMinus1 + 1);
    }

    /**
     * 解析 TIFF 图片
     */
    private static Dimension parseTIFF(DataInputStream dis, boolean bigEndian) throws IOException {
        skipFully(dis, 4);
        long ifdOffset = bigEndian ? dis.readInt() & 0xFFFFFFFFL : readUInt32LE(dis);

        if (ifdOffset < 8) {
            throw new IOException("Invalid TIFF IFD offset: " + ifdOffset);
        }
        skipFully(dis, ifdOffset - 8);

        int entryCount = bigEndian ? dis.readShort() & 0xFFFF : readUInt16LE(dis);

        int width = 0;
        int height = 0;

        for (int i = 0; i < entryCount; i++) {
            int tag = bigEndian ? dis.readShort() & 0xFFFF : readUInt16LE(dis);
            int type = bigEndian ? dis.readShort() & 0xFFFF : readUInt16LE(dis);
            long count = bigEndian ? dis.readInt() & 0xFFFFFFFFL : readUInt32LE(dis);

            // 读取值/偏移 (4 bytes)
            byte[] valueBytes = new byte[4];
            dis.readFully(valueBytes);

            // 根据类型解析值
            int value;
            if (type == 3) { // SHORT (2 bytes)
                if (bigEndian) {
                    value = ((valueBytes[0] & 0xFF) << 8) | (valueBytes[1] & 0xFF);
                } else {
                    value = (valueBytes[0] & 0xFF) | ((valueBytes[1] & 0xFF) << 8);
                }
            } else if (type == 4) { // LONG (4 bytes)
                if (bigEndian) {
                    value = ((valueBytes[0] & 0xFF) << 24) | ((valueBytes[1] & 0xFF) << 16) | ((valueBytes[2] & 0xFF) << 8) | (valueBytes[3] & 0xFF);
                } else {
                    value = (valueBytes[0] & 0xFF) | ((valueBytes[1] & 0xFF) << 8) | ((valueBytes[2] & 0xFF) << 16) | ((valueBytes[3] & 0xFF) << 24);
                }
            } else {
                value = 0;
            }

            if (count == 1 && tag == 256) width = value;
            if (count == 1 && tag == 257) height = value;

            if (width > 0 && height > 0) {
                return validateDimension(width, height);
            }
        }

        if (width == 0 || height == 0) {
            throw new IOException("TIFF width/height tags not found");
        }
        return validateDimension(width, height);
    }

    /**
     * 解析 ICO 图片
     */
    private static Dimension parseICO(DataInputStream dis) throws IOException {
        skipFully(dis, 4);
        int count = readUInt16LE(dis);
        if (count == 0) {
            throw new IOException("ICO file has no images");
        }

        int width = dis.readByte() & 0xFF;
        int height = dis.readByte() & 0xFF;
        if (width == 0) width = 256;
        if (height == 0) height = 256;

        return validateDimension(width, height);
    }

    /**
     * 解析 PSD 图片
     */
    private static Dimension parsePSD(DataInputStream dis) throws IOException {
        skipFully(dis, 12);
        dis.readUnsignedShort(); // channels
        int height = dis.readInt();
        int width = dis.readInt();
        return validateDimension(width, height);
    }

    private static String readFourCC(DataInput in) throws IOException {
        byte[] bytes = new byte[4];
        in.readFully(bytes);
        return new String(bytes, StandardCharsets.US_ASCII);
    }

    private static int readUInt16LE(DataInput in) throws IOException {
        byte[] bytes = new byte[2];
        in.readFully(bytes);
        return (bytes[0] & 0xFF) | ((bytes[1] & 0xFF) << 8);
    }

    private static int readUInt24LE(DataInput in) throws IOException {
        byte[] bytes = new byte[3];
        in.readFully(bytes);
        return (bytes[0] & 0xFF) | ((bytes[1] & 0xFF) << 8) | ((bytes[2] & 0xFF) << 16);
    }

    private static int readInt32LE(DataInput in) throws IOException {
        byte[] bytes = new byte[4];
        in.readFully(bytes);
        return (bytes[0] & 0xFF) | ((bytes[1] & 0xFF) << 8) | ((bytes[2] & 0xFF) << 16) | (bytes[3] << 24);
    }

    private static long readUInt32LE(DataInput in) throws IOException {
        byte[] bytes = new byte[4];
        in.readFully(bytes);
        return (bytes[0] & 0xFFL) | ((bytes[1] & 0xFFL) << 8) | ((bytes[2] & 0xFFL) << 16) | ((bytes[3] & 0xFFL) << 24);
    }

    private static void skipFully(DataInputStream in, long bytes) throws IOException {
        long remaining = bytes;
        while (remaining > 0) {
            long skipped = in.skip(remaining);
            if (skipped <= 0) {
                if (in.read() == -1) {
                    throw new EOFException("Unexpected end of file");
                }
                skipped = 1;
            }
            remaining -= skipped;
        }
    }

    private static Dimension validateDimension(int width, int height) throws IOException {
        if (width <= 0 || height <= 0) {
            throw new IOException("Invalid image dimensions: " + width + " x " + height);
        }
        return new Dimension(width, height);
    }

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
