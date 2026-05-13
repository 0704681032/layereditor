package com.example.editor.common.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeAll;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.HttpURLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 使用网络图片测试 ImageUtils 解析正确性
 * 每种格式下载 2 张图片，与 Java ImageIO 对照验证
 */
class NetworkImageTest {

    private static final String TEST_DIR = "network-test-images";
    private static Path testPath;
    private static List<TestImage> downloadedImages = new ArrayList<>();

    @BeforeAll
    static void setup() throws IOException {
        testPath = Paths.get(TEST_DIR);
        Files.createDirectories(testPath);
        downloadTestImages();
    }

    static class TestImage {
        String name;
        String url;
        String format;
        byte[] data;
        int referenceWidth;
        int referenceHeight;
        boolean hasReference;

        TestImage(String name, String url, String format) {
            this.name = name;
            this.url = url;
            this.format = format;
        }
    }

    /**
     * 下载测试图片 - 每种格式 2 张
     */
    private static void downloadTestImages() throws IOException {
        System.out.println("\n=== 下载测试图片 ===");

        List<TestImage> sources = new ArrayList<>();

        // PNG - 2 张
        sources.add(new TestImage("png_baidu", "https://www.baidu.com/img/flexible/logo/pc/result.png", "PNG"));
        sources.add(new TestImage("png_generated", "local", "PNG"));

        // JPEG - 2 张
        sources.add(new TestImage("jpeg_local1", "file:///E:/layereditor/frontend/public/ad-images/abstract-art-1.jpg", "JPEG"));
        sources.add(new TestImage("jpeg_local2", "file:///E:/layereditor/frontend/public/ad-images/landscape-1.jpg", "JPEG"));

        // GIF - 多张（网络下载 + 本地生成）
        // Giphy 的 GIF 比较稳定
        sources.add(new TestImage("gif_giphy_1", "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif", "GIF"));
        sources.add(new TestImage("gif_giphy_2", "https://media.giphy.com/media/3o7btPC0Nmi1bQY5qY/giphy.gif", "GIF"));
        // 本地生成的 GIF 作为保底
        sources.add(new TestImage("gif_generated_1", "local", "GIF"));
        sources.add(new TestImage("gif_generated_2", "local", "GIF"));

        for (TestImage img : sources) {
            try {
                System.out.print("下载 " + img.name + " (" + img.format + "): ");

                byte[] data;
                if ("local".equals(img.url)) {
                    data = generateLocalImage(img.format);
                    System.out.println("成功 (生成 " + data.length + " bytes)");
                } else {
                    data = downloadImage(img.url);
                    if (data != null && data.length > 0) {
                        System.out.println("成功 (" + data.length + " bytes)");
                    } else {
                        System.out.println("数据为空");
                        continue;
                    }
                }

                if (data != null && data.length > 0) {
                    img.data = data;

                    // 保存到本地
                    String ext = img.format.toLowerCase().replace("jpeg", "jpg");
                    Path file = testPath.resolve(img.name + "." + ext);
                    Files.write(file, data);

                    // 用 ImageIO 获取参考尺寸
                    try {
                        BufferedImage bi = ImageIO.read(file.toFile());
                        if (bi != null) {
                            img.referenceWidth = bi.getWidth();
                            img.referenceHeight = bi.getHeight();
                            img.hasReference = true;
                            System.out.println("  参考尺寸: " + img.referenceWidth + " x " + img.referenceHeight);
                        }
                    } catch (Exception e) {
                        System.out.println("  ImageIO 无法读取: " + e.getMessage());
                    }

                    downloadedImages.add(img);
                }
            } catch (Exception e) {
                System.out.println("失败: " + e.getMessage());
            }
        }

        // 检查每种格式是否有足够的图片
        ensureMinImagesPerFormat();

        System.out.println("\n成功准备 " + downloadedImages.size() + " 张测试图片");
    }

    /**
     * 确保每种格式至少有 2 张图片
     */
    private static void ensureMinImagesPerFormat() throws IOException {
        String[] formats = {"PNG", "JPEG", "GIF"};

        for (String format : formats) {
            int count = (int) downloadedImages.stream().filter(i -> i.format.equals(format)).count();
            System.out.println("  " + format + " 图片数量: " + count);

            while (count < 2) {
                System.out.println("  补充生成 " + format + " 测试图片...");
                int w = 100 + count * 50;
                int h = 50 + count * 25;

                TestImage img = new TestImage(format.toLowerCase() + "_gen_" + count, "local", format);
                img.data = generateLocalImage(format, w, h);
                img.referenceWidth = w;
                img.referenceHeight = h;
                img.hasReference = true;

                String ext = format.toLowerCase().replace("jpeg", "jpg");
                Files.write(testPath.resolve(img.name + "." + ext), img.data);

                downloadedImages.add(img);
                System.out.println("  -> " + img.name + ": " + w + " x " + h);
                count++;
            }
        }
    }

    /**
     * 生成本地测试图片
     */
    private static byte[] generateLocalImage(String format) throws IOException {
        return generateLocalImage(format, 100, 50);
    }

    /**
     * 生成本地测试图片（指定尺寸）
     */
    private static byte[] generateLocalImage(String format, int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height,
            format.equals("PNG") ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);

        // 填充颜色
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                image.setRGB(x, y, format.equals("PNG") ? 0x80FF0000 : 0xFF0000);
            }
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, format, out);
        return out.toByteArray();
    }

    /**
     * 从 URL 下载图片
     */
    private static byte[] downloadImage(String urlStr) throws IOException {
        URL url = new URL(urlStr);

        if (urlStr.startsWith("file:")) {
            try (InputStream is = url.openStream();
                 ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                    bos.write(buffer, 0, bytesRead);
                }
                return bos.toByteArray();
            }
        }

        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(20000);
        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        conn.setRequestProperty("Accept", "image/gif,image/png,image/jpeg,image/*");
        conn.setRequestProperty("Referer", "https://www.baidu.com/");

        int code = conn.getResponseCode();
        if (code != 200) {
            conn.disconnect();
            throw new IOException("HTTP " + code);
        }

        // 检查 Content-Type
        String contentType = conn.getContentType();
        System.out.print("(type=" + contentType + ") ");

        try (InputStream is = conn.getInputStream();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                bos.write(buffer, 0, bytesRead);
            }
            return bos.toByteArray();
        } finally {
            conn.disconnect();
        }
    }

    @Test
    @DisplayName("验证所有图片尺寸解析（与 ImageIO 对照）")
    void testAllImagesWithReference() throws IOException {
        System.out.println("\n=== 验证图片尺寸解析 ===");

        int passed = 0;
        int failed = 0;

        for (TestImage img : downloadedImages) {
            System.out.println("\n[" + img.format + "] " + img.name);

            try {
                ImageUtils.Dimension dim = ImageUtils.getDimension(img.data);
                System.out.println("  ImageUtils: " + dim.getWidth() + " x " + dim.getHeight());

                if (img.hasReference) {
                    System.out.println("  ImageIO:    " + img.referenceWidth + " x " + img.referenceHeight);

                    if (dim.getWidth() == img.referenceWidth && dim.getHeight() == img.referenceHeight) {
                        System.out.println("  ✓ 完全匹配!");
                        passed++;
                    } else {
                        System.out.println("  ✗ 不匹配!");
                        System.out.println("  文件头: " + hexDump(img.data, 0, 20));
                        failed++;
                    }
                } else {
                    System.out.println("  ✓ 解析成功 (无对照组)");
                    assertTrue(dim.getWidth() > 0);
                    assertTrue(dim.getHeight() > 0);
                    passed++;
                }

            } catch (IOException e) {
                System.out.println("  ✗ 解析失败: " + e.getMessage());
                System.out.println("  文件头: " + hexDump(img.data, 0, 20));
                failed++;
            }
        }

        System.out.println("\n=== 测试结果 ===");
        System.out.println("匹配成功: " + passed);
        System.out.println("失败: " + failed);
        System.out.println("总计: " + downloadedImages.size());

        assertTrue(passed >= downloadedImages.size() - 1, "至少大部分测试通过");
        assertEquals(0, failed, "不应有失败的测试");
    }

    @Test
    @DisplayName("PNG 图片解析验证（至少 2 张）")
    void testPNGImages() throws IOException {
        System.out.println("\n=== PNG 图片验证 ===");

        int count = 0;
        for (TestImage img : downloadedImages) {
            if ("PNG".equals(img.format)) {
                count++;
                System.out.println(img.name + ":");
                ImageUtils.Dimension dim = ImageUtils.getDimension(img.data);
                System.out.println("  解析结果: " + dim);

                assertTrue(dim.getWidth() > 0);
                assertTrue(dim.getHeight() > 0);

                if (img.hasReference) {
                    assertEquals(img.referenceWidth, dim.getWidth(), "PNG width mismatch");
                    assertEquals(img.referenceHeight, dim.getHeight(), "PNG height mismatch");
                    System.out.println("  ✓ 与 ImageIO 匹配");
                }
            }
        }

        System.out.println("测试 PNG 图片数量: " + count);
        assertTrue(count >= 2, "应至少测试 2 张 PNG 图片");
    }

    @Test
    @DisplayName("JPEG 图片解析验证（至少 2 张）")
    void testJPEGImages() throws IOException {
        System.out.println("\n=== JPEG 图片验证 ===");

        int count = 0;
        for (TestImage img : downloadedImages) {
            if ("JPEG".equals(img.format)) {
                count++;
                System.out.println(img.name + ":");
                ImageUtils.Dimension dim = ImageUtils.getDimension(img.data);
                System.out.println("  解析结果: " + dim);

                assertTrue(dim.getWidth() > 0);
                assertTrue(dim.getHeight() > 0);

                if (img.hasReference) {
                    assertEquals(img.referenceWidth, dim.getWidth(), "JPEG width mismatch");
                    assertEquals(img.referenceHeight, dim.getHeight(), "JPEG height mismatch");
                    System.out.println("  ✓ 与 ImageIO 匹配");
                }
            }
        }

        System.out.println("测试 JPEG 图片数量: " + count);
        assertTrue(count >= 2, "应至少测试 2 张 JPEG 图片");
    }

    @Test
    @DisplayName("GIF 图片解析验证（至少 2 张）")
    void testGIFImages() throws IOException {
        System.out.println("\n=== GIF 图片验证 ===");

        int count = 0;
        for (TestImage img : downloadedImages) {
            if ("GIF".equals(img.format)) {
                count++;
                System.out.println(img.name + ":");
                ImageUtils.Dimension dim = ImageUtils.getDimension(img.data);
                System.out.println("  解析结果: " + dim);
                System.out.println("  文件头: " + hexDump(img.data, 0, 10));

                assertTrue(dim.getWidth() > 0);
                assertTrue(dim.getHeight() > 0);

                if (img.hasReference) {
                    assertEquals(img.referenceWidth, dim.getWidth(), "GIF width mismatch");
                    assertEquals(img.referenceHeight, dim.getHeight(), "GIF height mismatch");
                    System.out.println("  ✓ 与 ImageIO 匹配");
                }
            }
        }

        System.out.println("测试 GIF 图片数量: " + count);
        assertTrue(count >= 2, "应至少测试 2 张 GIF 图片");
    }

    private static String hexDump(byte[] data, int offset, int len) {
        StringBuilder sb = new StringBuilder();
        int end = Math.min(offset + len, data.length);
        for (int i = offset; i < end; i++) {
            sb.append(String.format("%02X ", data[i]));
        }
        return sb.toString();
    }
}