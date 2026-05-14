package com.example.editor.common.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 图片尺寸解析工具类测试
 */
class ImageUtilsTest {

    private static final String TEST_IMAGES_DIR = "test-images";
    private static Path testDir;

    @BeforeAll
    static void setup() throws IOException {
        testDir = Paths.get("target", TEST_IMAGES_DIR);
        Files.createDirectories(testDir);
        generateTestImages();
    }

    // ========== 常用格式测试 (ImageUtils) ==========

    @Test
    @DisplayName("PNG 格式解析")
    void testPNG() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.png"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("PNG: " + dim);
    }

    @Test
    @DisplayName("JPEG 格式解析")
    void testJPEG() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.jpg"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("JPEG: " + dim);
    }

    @Test
    @DisplayName("JPEG 大尺寸应按无符号宽高解析")
    void testJPEGUnsignedDimensions() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(new byte[]{(byte) 0xFF, (byte) 0xD8}); // SOI
        out.write(new byte[]{(byte) 0xFF, (byte) 0xC0}); // SOF0
        out.write(new byte[]{0x00, 0x11}); // segment length
        out.write(0x08); // precision
        out.write(new byte[]{(byte) 0x9C, 0x40}); // height 40000
        out.write(new byte[]{(byte) 0x9C, 0x40}); // width 40000

        ImageUtils.Dimension dim = ImageUtils.getDimension(out.toByteArray());
        assertEquals(40000, dim.getWidth());
        assertEquals(40000, dim.getHeight());
    }

    @Test
    @DisplayName("JPEG marker 前的填充字节应被跳过")
    void testJPEGFillBytesBeforeMarker() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(new byte[]{(byte) 0xFF, (byte) 0xD8}); // SOI
        out.write(new byte[]{(byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xE0}); // fill bytes + APP0
        out.write(new byte[]{0x00, 0x04, 0x00, 0x00}); // APP0 segment length + payload
        out.write(new byte[]{(byte) 0xFF, (byte) 0xC0}); // SOF0
        out.write(new byte[]{0x00, 0x11}); // segment length
        out.write(0x08); // precision
        out.write(new byte[]{0x00, 0x32}); // height 50
        out.write(new byte[]{0x00, 0x64}); // width 100

        ImageUtils.Dimension dim = ImageUtils.getDimension(out.toByteArray());
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
    }

    @Test
    @DisplayName("BMP 格式解析")
    void testBMP() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.bmp"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("BMP: " + dim);
    }

    @Test
    @DisplayName("GIF 格式解析")
    void testGIF() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.gif"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("GIF: " + dim);
    }

    @Test
    @DisplayName("WebP (VP8) 格式解析")
    void testWebP_VP8() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test_vp8.webp"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("WebP (VP8): " + dim);
    }

    @Test
    @DisplayName("WebP (VP8L) 格式解析")
    void testWebP_VP8L() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test_vp8l.webp"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("WebP (VP8L): " + dim);
    }

    @Test
    @DisplayName("WebP (VP8X) 格式解析")
    void testWebP_VP8X() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test_vp8x.webp"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("WebP (VP8X): " + dim);
    }

    @Test
    @DisplayName("TIFF (Little-endian) 格式解析")
    void testTIFF_LE() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test_tiff_le.tiff"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("TIFF (LE): " + dim);
    }

    @Test
    @DisplayName("TIFF (Big-endian) 格式解析")
    void testTIFF_BE() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test_tiff_be.tiff"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("TIFF (BE): " + dim);
    }

    @Test
    @DisplayName("ICO 格式解析")
    void testICO() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.ico"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(32, dim.getWidth());
        assertEquals(32, dim.getHeight());
        System.out.println("ICO: " + dim);
    }

    @Test
    @DisplayName("PSD 格式解析")
    void testPSD() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.psd"));
        ImageUtils.Dimension dim = ImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("PSD: " + dim);
    }

    @Test
    @DisplayName("项目中已有的 JPEG 图片")
    void testExistingJPEG() throws IOException {
        Path imageDir = Paths.get("frontend", "public", "ad-images");
        if (Files.exists(imageDir)) {
            try (var stream = Files.list(imageDir)) {
                var jpgFile = stream.filter(p -> p.toString().endsWith(".jpg"))
                        .findFirst().orElse(null);
                if (jpgFile != null) {
                    byte[] data = Files.readAllBytes(jpgFile);
                    ImageUtils.Dimension dim = ImageUtils.getDimension(data);
                    System.out.println(jpgFile.getFileName() + ": " + dim);
                    assertTrue(dim.getWidth() > 0);
                    assertTrue(dim.getHeight() > 0);
                }
            }
        }
    }

    // ========== 罕见格式测试 (LegacyImageUtils) ==========

    @Test
    @DisplayName("CUR 格式解析")
    void testCUR() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.cur"));
        LegacyImageUtils.Dimension dim = LegacyImageUtils.getDimension(data);
        assertEquals(32, dim.getWidth());
        assertEquals(32, dim.getHeight());
        System.out.println("CUR: " + dim);
    }

    @Test
    @DisplayName("PCX 格式解析")
    void testPCX() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.pcx"));
        LegacyImageUtils.Dimension dim = LegacyImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("PCX: " + dim);
    }

    @Test
    @DisplayName("TGA 格式解析")
    void testTGA() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.tga"));
        LegacyImageUtils.Dimension dim = LegacyImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("TGA: " + dim);
    }

    @Test
    @DisplayName("WBMP 格式解析")
    void testWBMP() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.wbmp"));
        LegacyImageUtils.Dimension dim = LegacyImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("WBMP: " + dim);
    }

    @Test
    @DisplayName("XBM 格式解析")
    void testXBM() throws IOException {
        byte[] data = Files.readAllBytes(testDir.resolve("test.xbm"));
        LegacyImageUtils.Dimension dim = LegacyImageUtils.getDimension(data);
        assertEquals(100, dim.getWidth());
        assertEquals(50, dim.getHeight());
        System.out.println("XBM: " + dim);
    }

    @Test
    @DisplayName("无效数据应抛出异常")
    void testInvalidData() {
        assertThrows(IOException.class, () -> ImageUtils.getDimension(new byte[]{0x00, 0x00, 0x00, 0x00}));
    }

    @Test
    @DisplayName("伪造 PNG 头应抛出异常")
    void testInvalidPngSignature() {
        byte[] data = new byte[]{(byte) 0x89, 0x50, 0x00, 0x00, 0x00, 0x00};
        assertThrows(IOException.class, () -> ImageUtils.getDimension(data));
    }

    // ========== 测试图片生成 ==========

    private static void generateTestImages() throws IOException {
        BufferedImage image = new BufferedImage(100, 50, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < 100; x++) {
            for (int y = 0; y < 50; y++) {
                image.setRGB(x, y, 0xFF0000);
            }
        }

        // Java ImageIO 支持的格式
        ByteArrayOutputStream pngOut = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", pngOut);
        Files.write(testDir.resolve("test.png"), pngOut.toByteArray());

        ByteArrayOutputStream jpgOut = new ByteArrayOutputStream();
        ImageIO.write(image, "JPEG", jpgOut);
        Files.write(testDir.resolve("test.jpg"), jpgOut.toByteArray());

        ByteArrayOutputStream bmpOut = new ByteArrayOutputStream();
        ImageIO.write(image, "BMP", bmpOut);
        Files.write(testDir.resolve("test.bmp"), bmpOut.toByteArray());

        ByteArrayOutputStream gifOut = new ByteArrayOutputStream();
        ImageIO.write(image, "GIF", gifOut);
        Files.write(testDir.resolve("test.gif"), gifOut.toByteArray());

        ByteArrayOutputStream tiffOut = new ByteArrayOutputStream();
        ImageIO.write(image, "TIFF", tiffOut);
        Files.write(testDir.resolve("test_tiff_le.tiff"), tiffOut.toByteArray());

        // 手动生成的格式
        generateWebPImages();
        generateBigEndianTIFF();
        generateICO();
        generateCUR();
        generatePSD();
        generatePCX();
        generateTGA();
        generateWBMP();
        generateXBM();
    }

    private static void generateWebPImages() throws IOException {
        // VP8
        ByteArrayOutputStream vp8 = new ByteArrayOutputStream();
        writeFourCC(vp8, "RIFF");
        vp8.write(new byte[]{0, 0, 0, 0});
        writeFourCC(vp8, "WEBP");
        writeFourCC(vp8, "VP8 ");
        writeUInt32LE(vp8, 10);
        vp8.write(new byte[]{0x00, 0x00, 0x00}); // frame tag
        vp8.write(new byte[]{(byte) 0x9d, 0x01, 0x2a});
        writeUInt16LE(vp8, 100);
        writeUInt16LE(vp8, 50);
        byte[] vp8Data = vp8.toByteArray();
        updateRiffSize(vp8Data);
        Files.write(testDir.resolve("test_vp8.webp"), vp8Data);

        // VP8L
        ByteArrayOutputStream vp8l = new ByteArrayOutputStream();
        writeFourCC(vp8l, "RIFF");
        vp8l.write(new byte[]{0, 0, 0, 0});
        writeFourCC(vp8l, "WEBP");
        writeFourCC(vp8l, "VP8L");
        writeUInt32LE(vp8l, 5);
        vp8l.write(0x2f);
        int bits = 99 | (49 << 14);
        vp8l.write(bits & 0xFF);
        vp8l.write((bits >> 8) & 0xFF);
        vp8l.write((bits >> 16) & 0xFF);
        vp8l.write((bits >> 24) & 0xFF);
        byte[] vp8lData = vp8l.toByteArray();
        updateRiffSize(vp8lData);
        Files.write(testDir.resolve("test_vp8l.webp"), vp8lData);

        // VP8X
        ByteArrayOutputStream vp8x = new ByteArrayOutputStream();
        writeFourCC(vp8x, "RIFF");
        vp8x.write(new byte[]{0, 0, 0, 0});
        writeFourCC(vp8x, "WEBP");
        writeFourCC(vp8x, "VP8X");
        writeUInt32LE(vp8x, 10);
        writeUInt32LE(vp8x, 0); // flags (4 bytes)
        writeUInt24LE(vp8x, 99);
        writeUInt24LE(vp8x, 49);
        byte[] vp8xData = vp8x.toByteArray();
        updateRiffSize(vp8xData);
        Files.write(testDir.resolve("test_vp8x.webp"), vp8xData);
    }

    private static void updateRiffSize(byte[] data) {
        int riffSize = data.length - 8;
        data[4] = (byte) riffSize;
        data[5] = (byte) (riffSize >> 8);
        data[6] = (byte) (riffSize >> 16);
        data[7] = (byte) (riffSize >> 24);
    }

    private static void generateBigEndianTIFF() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // Header
        out.write(new byte[]{0x4D, 0x4D}); // "MM"
        out.write(new byte[]{0x00, 0x2A}); // magic 42
        out.write(new byte[]{0x00, 0x00, 0x00, 0x08}); // IFD offset = 8

        // IFD
        out.write(new byte[]{0x00, 0x03}); // 3 entries

        // ImageWidth (256)
        out.write(new byte[]{0x01, 0x00}); // tag
        out.write(new byte[]{0x00, 0x03}); // type SHORT
        out.write(new byte[]{0x00, 0x00, 0x00, 0x01}); // count
        out.write(new byte[]{0x00, 0x64, 0x00, 0x00}); // value 100 (在 SHORT 类型中前2字节有效)

        // ImageLength (257)
        out.write(new byte[]{0x01, 0x01}); // tag
        out.write(new byte[]{0x00, 0x03}); // type SHORT
        out.write(new byte[]{0x00, 0x00, 0x00, 0x01}); // count
        out.write(new byte[]{0x00, 0x32, 0x00, 0x00}); // value 50

        // BitsPerSample (258)
        out.write(new byte[]{0x01, 0x02}); // tag
        out.write(new byte[]{0x00, 0x03}); // type SHORT
        out.write(new byte[]{0x00, 0x00, 0x00, 0x01}); // count
        out.write(new byte[]{0x00, 0x08, 0x00, 0x00}); // value 8

        // Next IFD offset
        out.write(new byte[]{0x00, 0x00, 0x00, 0x00});

        Files.write(testDir.resolve("test_tiff_be.tiff"), out.toByteArray());
    }

    private static void generateICO() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(new byte[]{0x00, 0x00}); // reserved
        out.write(new byte[]{0x01, 0x00}); // type = icon
        out.write(new byte[]{0x01, 0x00}); // count = 1
        out.write(32);  // width
        out.write(32);  // height
        out.write(0);   // colors
        out.write(0);   // reserved
        out.write(new byte[]{0x00, 0x00}); // planes
        out.write(new byte[]{0x00, 0x20}); // bpp
        writeUInt32LE(out, 64); // size
        writeUInt32LE(out, 22); // offset
        out.write(new byte[64]); // dummy data
        Files.write(testDir.resolve("test.ico"), out.toByteArray());
    }

    private static void generateCUR() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(new byte[]{0x00, 0x00}); // reserved
        out.write(new byte[]{0x02, 0x00}); // type = cursor
        out.write(new byte[]{0x01, 0x00}); // count = 1
        out.write(32);  // width
        out.write(32);  // height
        out.write(0);   // colors
        out.write(0);   // reserved
        out.write(new byte[]{0x00, 0x00}); // planes
        out.write(new byte[]{0x00, 0x20}); // bpp
        writeUInt32LE(out, 64);
        writeUInt32LE(out, 22);
        out.write(new byte[64]);
        Files.write(testDir.resolve("test.cur"), out.toByteArray());
    }

    private static void generatePSD() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        writeFourCC(out, "8BPS");
        out.write(new byte[]{0x00, 0x01}); // version
        out.write(new byte[]{0x00, 0x00, 0x00, 0x00, 0x00, 0x00}); // reserved
        out.write(new byte[]{0x00, 0x03}); // channels
        out.write(new byte[]{0x00, 0x00, 0x00, 0x32}); // height 50
        out.write(new byte[]{0x00, 0x00, 0x00, 0x64}); // width 100
        out.write(new byte[]{0x00, 0x08}); // depth
        out.write(new byte[]{0x00, 0x03}); // color mode
        Files.write(testDir.resolve("test.psd"), out.toByteArray());
    }

    private static void generatePCX() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(0x0A); // identifier
        out.write(0x05); // version
        out.write(0x01); // encoding RLE
        out.write(0x08); // bpp
        writeUInt16LE(out, 0);  // xmin
        writeUInt16LE(out, 0);  // ymin
        writeUInt16LE(out, 99); // xmax
        writeUInt16LE(out, 49); // ymax
        out.write(new byte[48]); // rest of header
        Files.write(testDir.resolve("test.pcx"), out.toByteArray());
    }

    private static void generateTGA() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(0);   // ID length
        out.write(0);   // color map type (no colormap)
        out.write(2);   // image type (uncompressed RGB)
        out.write(new byte[5]); // color map spec
        writeUInt16LE(out, 0);   // x origin
        writeUInt16LE(out, 0);   // y origin
        writeUInt16LE(out, 100); // width
        writeUInt16LE(out, 50);  // height
        out.write(24);  // pixel depth
        out.write(0);   // image descriptor
        Files.write(testDir.resolve("test.tga"), out.toByteArray());
    }

    private static void generateWBMP() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(0x00); // type
        out.write(0x00); // fixed header
        out.write(0x64); // width 100
        out.write(0x32); // height 50
        out.write(new byte[]{(byte) 0xFF, (byte) 0xFF, (byte) 0xFF}); // dummy data
        Files.write(testDir.resolve("test.wbmp"), out.toByteArray());
    }

    private static void generateXBM() throws IOException {
        String xbmContent = "#define test_width 100\n#define test_height 50\nstatic unsigned char test_bits[] = { 0x00 };";
        Files.write(testDir.resolve("test.xbm"), xbmContent.getBytes());
    }

    private static void writeFourCC(ByteArrayOutputStream out, String s) {
        for (int i = 0; i < 4; i++) out.write((byte) s.charAt(i));
    }

    private static void writeUInt16LE(ByteArrayOutputStream out, int value) {
        out.write(value & 0xFF);
        out.write((value >> 8) & 0xFF);
    }

    private static void writeUInt24LE(ByteArrayOutputStream out, int value) {
        out.write(value & 0xFF);
        out.write((value >> 8) & 0xFF);
        out.write((value >> 16) & 0xFF);
    }

    private static void writeUInt32LE(ByteArrayOutputStream out, int value) {
        out.write(value & 0xFF);
        out.write((value >> 8) & 0xFF);
        out.write((value >> 16) & 0xFF);
        out.write((value >> 24) & 0xFF);
    }
}
