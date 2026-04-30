package com.example.editor.asset.service;

import com.example.editor.asset.dto.AssetListResponse;
import com.example.editor.asset.dto.AssetResponse;
import com.example.editor.asset.entity.EditorAsset;
import com.example.editor.asset.exception.FileValidationException;
import com.example.editor.asset.mapper.AssetMapper;
import com.example.editor.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetMapper assetMapper;

    @Value("${app.storage.local-path}")
    private String storagePath;

    @Value("${app.storage.base-url}")
    private String baseUrl;

    @Value("${app.storage.max-file-size-mb:10}")
    private int maxFileSizeMb;

    @Value("${app.storage.max-page-size:100}")
    private int maxPageSize;

    @Value("${app.storage.max-batch-size:20}")
    private int maxBatchSize;

    @Value("${app.storage.dedup-enabled:true}")
    private boolean dedupEnabled;

    @Value("${app.storage.thumbnail-enabled:true}")
    private boolean thumbnailEnabled;

    @Value("${app.storage.thumbnail-size:200}")
    private int thumbnailSize;

    private static final Long DEFAULT_USER_ID = 1L;

    private static final String THUMBNAIL_DIR = "thumbnails";

    // File magic numbers for actual content validation (file signature detection)
    private static final Map<String, byte[]> MAGIC_NUMBERS = Map.ofEntries(
            Map.entry(".png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}),
            Map.entry(".jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}),
            Map.entry(".jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}),
            Map.entry(".gif", new byte[]{0x47, 0x49, 0x46, 0x38}), // GIF87a or GIF89a
            Map.entry(".webp", new byte[]{0x52, 0x49, 0x46, 0x46}), // RIFF (WebP container)
            Map.entry(".bmp", new byte[]{0x42, 0x4D}), // BM
            Map.entry(".ico", new byte[]{0x00, 0x00, 0x01, 0x00})
    );

    // Allowed file extensions (lowercase, with dot)
    // SVG is allowed only when kind="svg" (sanitized by DocumentService via SvgSanitizer)
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".svg"
    );

    // Mapping from extension to allowed MIME types
    private static final Map<String, Set<String>> EXTENSION_TO_MIME_TYPES = Map.ofEntries(
            Map.entry(".png", Set.of("image/png")),
            Map.entry(".jpg", Set.of("image/jpeg")),
            Map.entry(".jpeg", Set.of("image/jpeg")),
            Map.entry(".gif", Set.of("image/gif")),
            Map.entry(".webp", Set.of("image/webp")),
            Map.entry(".bmp", Set.of("image/bmp", "image/x-ms-bmp")),
            Map.entry(".ico", Set.of("image/x-icon", "image/vnd.microsoft.icon")),
            Map.entry(".svg", Set.of("image/svg+xml"))
    );

    // Dangerous extensions that must never be allowed
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            ".html", ".htm", ".js", ".mjs", ".svgz",
            ".xml", ".xhtml", ".xht", ".css",
            ".exe", ".bat", ".cmd", ".ps1", ".sh",
            ".php", ".jsp", ".asp", ".aspx",
            ".jar", ".class", ".dll", ".so", ".dylib"
    );

    @Transactional
    public AssetResponse upload(MultipartFile file, Long documentId, String kind) {
        validateUploadedFile(file);

        try {
            String originalFilename = file.getOriginalFilename();
            String ext = extractAndValidateExtension(originalFilename, kind);

            // Read file bytes first for validation and deduplication
            byte[] fileBytes = file.getBytes();
            String sha256 = calculateSha256(fileBytes);

            // Check for duplicate file - return existing if found
            if (dedupEnabled) {
                EditorAsset existingAsset = assetMapper.selectBySha256(sha256);
                if (existingAsset != null) {
                    log.info("Duplicate file detected (SHA256: {}), returning existing asset id={}", sha256, existingAsset.getId());
                    // Update documentId if provided and different
                    if (documentId != null && !documentId.equals(existingAsset.getDocumentId())) {
                        assetMapper.updateDocumentId(existingAsset.getId(), documentId);
                        existingAsset.setDocumentId(documentId);
                    }
                    return toResponse(existingAsset, true);
                }
            }

            // Validate Content-Type matches extension
            validateContentType(file.getContentType(), ext);

            // Validate file magic number (actual content type)
            validateMagicNumber(fileBytes, ext, originalFilename);

            String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
            YearMonth ym = YearMonth.now();
            String relativePath = ym.getYear() + "/" + String.format("%02d", ym.getMonthValue()) + "/" + storedName;

            Path dirPath = Paths.get(storagePath, ym.getYear() + "", String.format("%02d", ym.getMonthValue()));
            Files.createDirectories(dirPath);
            Path filePath = dirPath.resolve(storedName);

            // Transfer file to storage
            Files.write(filePath, fileBytes);

            Integer width = null;
            Integer height = null;

            if ("image".equals(kind)) {
                try (InputStream is = Files.newInputStream(filePath)) {
                    BufferedImage img = ImageIO.read(is);
                    if (img != null) {
                        width = img.getWidth();
                        height = img.getHeight();
                        // Generate thumbnail for large images
                        if (thumbnailEnabled && (width > thumbnailSize || height > thumbnailSize)) {
                            generateThumbnail(filePath, relativePath, width, height);
                        }
                    } else {
                        log.warn("Failed to read image dimensions for file: {}", storedName);
                    }
                } catch (IOException e) {
                    log.warn("Error reading image dimensions for file {}: {}", storedName, e.getMessage());
                }
            }

            EditorAsset asset = new EditorAsset();
            asset.setOwnerId(DEFAULT_USER_ID);
            asset.setDocumentId(documentId);
            asset.setKind(kind);
            asset.setFilename(originalFilename);
            asset.setMimeType(file.getContentType());
            asset.setBucket("local");
            asset.setStorageKey(relativePath);
            asset.setFileSize(file.getSize());
            asset.setWidth(width);
            asset.setHeight(height);
            asset.setSha256(sha256);
            assetMapper.insert(asset);

            log.info("Asset uploaded: id={}, filename={}, size={}, sha256={}",
                    asset.getId(), originalFilename, file.getSize(), sha256);

            return toResponse(asset, false);
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file", e);
        } catch (FileValidationException e) {
            throw e; // Re-throw validation exceptions
        }
    }

    public AssetResponse getAsset(Long id) {
        EditorAsset asset = assetMapper.selectById(id);
        if (asset == null) {
            throw new NotFoundException("asset not found");
        }
        return toResponse(asset);
    }

    public AssetListResponse listAssets(Long documentId, String kind, int page, int size) {
        // Validate pagination parameters
        if (page < 0) {
            page = 0;
        }
        if (size < 1 || size > maxPageSize) {
            size = Math.min(Math.max(size, 1), maxPageSize);
        }
        int offset = page * size;
        List<EditorAsset> assets = assetMapper.selectList(documentId, kind, offset, size);
        long total = assetMapper.countByCondition(documentId, kind);
        List<AssetResponse> items = assets.stream().map(this::toResponse).toList();
        return new AssetListResponse(items, total, page, size);
    }

    @Transactional
    public List<AssetResponse> uploadBatch(List<MultipartFile> files, Long documentId, String kind) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("No files provided for batch upload");
        }
        if (files.size() > maxBatchSize) {
            throw new IllegalArgumentException("Batch upload limited to " + maxBatchSize + " files at once");
        }
        return files.stream()
                .map(file -> upload(file, documentId, kind))
                .toList();
    }

    @Transactional
    public void deleteAsset(Long id) {
        EditorAsset asset = assetMapper.selectById(id);
        if (asset == null) {
            throw new NotFoundException("asset not found");
        }
        // Delete file from storage
        Path filePath = Paths.get(storagePath, asset.getStorageKey());
        try {
            Files.deleteIfExists(filePath);
            log.info("Deleted asset file: {}", asset.getStorageKey());
        } catch (IOException e) {
            log.warn("Failed to delete asset file {}: {}", asset.getStorageKey(), e.getMessage());
        }
        // Delete thumbnails to avoid orphaned files
        deleteThumbnails(asset.getStorageKey());
        // Delete database record
        assetMapper.deleteById(id);
    }

    /**
     * Check if a file with the same SHA256 already exists.
     * Returns existing asset if found, null otherwise.
     */
    public AssetResponse findDuplicateBySha256(String sha256) {
        EditorAsset existing = assetMapper.selectBySha256(sha256);
        if (existing != null) {
            return toResponse(existing);
        }
        return null;
    }

    /**
     * Search assets by filename (partial match).
     */
    public AssetListResponse searchAssets(String query, Long documentId, String kind, int page, int size) {
        if (page < 0) page = 0;
        if (size < 1 || size > maxPageSize) size = Math.min(Math.max(size, 1), maxPageSize);
        int offset = page * size;
        List<EditorAsset> assets = assetMapper.searchByFilename(query, documentId, kind, offset, size);
        long total = assetMapper.countSearchByFilename(query, documentId, kind);
        List<AssetResponse> items = assets.stream().map(this::toResponse).toList();
        return new AssetListResponse(items, total, page, size);
    }

    /**
     * Get storage statistics: total files, total size, size by kind.
     */
    public StorageStats getStorageStats() {
        long totalFiles = assetMapper.countByCondition(null, null);
        long totalSize = assetMapper.selectTotalFileSize();
        long imageCount = assetMapper.selectCountByKind("image");
        long imageSize = assetMapper.selectTotalSizeByKind("image");
        return new StorageStats(totalFiles, totalSize, imageCount, imageSize);
    }

    /**
     * Batch delete assets.
     */
    @Transactional
    public BatchDeleteResult batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("No asset IDs provided");
        }
        if (ids.size() > maxBatchSize) {
            throw new IllegalArgumentException("Batch delete limited to " + maxBatchSize + " assets at once");
        }
        int deletedCount = 0;
        long deletedSize = 0;
        List<Long> failedIds = new java.util.ArrayList<>();
        for (Long id : ids) {
            try {
                EditorAsset asset = assetMapper.selectById(id);
                if (asset != null) {
                    Path filePath = Paths.get(storagePath, asset.getStorageKey());
                    Files.deleteIfExists(filePath);
                    // Also delete thumbnails
                    deleteThumbnails(asset.getStorageKey());
                    assetMapper.deleteById(id);
                    deletedCount++;
                    deletedSize += asset.getFileSize();
                }
            } catch (Exception e) {
                log.warn("Failed to delete asset {}: {}", id, e.getMessage());
                failedIds.add(id);
            }
        }
        log.info("Batch delete completed: {} assets deleted, {} bytes freed", deletedCount, deletedSize);
        return new BatchDeleteResult(deletedCount, deletedSize, failedIds);
    }

    public record BatchDeleteResult(int deletedCount, long deletedSizeBytes, List<Long> failedIds) {
        public double getDeletedSizeMB() {
            return deletedSizeBytes / (1024.0 * 1024.0);
        }
    }

    public record StorageStats(long totalFiles, long totalSizeBytes, long imageCount, long imageSizeBytes) {
        public double getTotalSizeMB() {
            return totalSizeBytes / (1024.0 * 1024.0);
        }
        public double getImageSizeMB() {
            return imageSizeBytes / (1024.0 * 1024.0);
        }
    }

    /**
     * Get file content for download/preview.
     */
    public FileContent getFileContent(Long id) {
        EditorAsset asset = assetMapper.selectById(id);
        if (asset == null) {
            throw new NotFoundException("asset not found");
        }
        Path filePath = Paths.get(storagePath, asset.getStorageKey());
        if (!Files.exists(filePath)) {
            throw new NotFoundException("file not found on storage");
        }
        return new FileContent(
                filePath,
                asset.getFilename(),
                asset.getMimeType(),
                asset.getFileSize()
        );
    }

    /**
     * Get thumbnail content if exists.
     */
    /**
     * 获取缩略图内容，支持按需生成。
     * size参数限制在50-1000范围内，防止恶意请求生成超大缩略图消耗服务器资源。
     */
    public FileContent getThumbnail(Long id, int size) {
        if (size < 50 || size > 1000) {
            throw new IllegalArgumentException("Thumbnail size must be between 50 and 1000");
        }
        EditorAsset asset = assetMapper.selectById(id);
        if (asset == null) {
            throw new NotFoundException("asset not found");
        }
        if (!"image".equals(asset.getKind())) {
            throw new IllegalArgumentException("Only image assets have thumbnails");
        }
        Path thumbnailPath = Paths.get(storagePath, THUMBNAIL_DIR, size + "px", asset.getStorageKey());
        if (!Files.exists(thumbnailPath)) {
            // Generate thumbnail on demand if original exists
            Path originalPath = Paths.get(storagePath, asset.getStorageKey());
            if (Files.exists(originalPath)) {
                generateThumbnail(originalPath, asset.getStorageKey(), asset.getWidth(), asset.getHeight(), size);
            } else {
                throw new NotFoundException("thumbnail not found");
            }
        }
        try {
            return new FileContent(
                    thumbnailPath,
                    asset.getFilename(),
                    asset.getMimeType(),
                    Files.size(thumbnailPath)
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to read thumbnail file size", e);
        }
    }

    /**
     * Clean orphaned files - files in storage that have no database record.
     */
    public CleanupResult cleanupOrphanedFiles() {
        List<EditorAsset> allAssets = assetMapper.selectList(null, null, 0, Integer.MAX_VALUE);
        Set<String> validPaths = allAssets.stream()
                .map(EditorAsset::getStorageKey)
                .collect(Collectors.toSet());

        java.util.concurrent.atomic.AtomicInteger deletedFiles = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicLong deletedSize = new java.util.concurrent.atomic.AtomicLong(0);

        try {
            Files.walk(Paths.get(storagePath))
                    .filter(Files::isRegularFile)
                    .filter(p -> !p.toString().contains(THUMBNAIL_DIR)) // Skip thumbnails
                    .forEach(p -> {
                        String relative = Paths.get(storagePath).relativize(p).toString().replace("\\", "/");
                        if (!validPaths.contains(relative)) {
                            try {
                                long size = Files.size(p);
                                Files.delete(p);
                                deletedFiles.incrementAndGet();
                                deletedSize.addAndGet(size);
                                log.info("Deleted orphaned file: {} ({} bytes)", relative, size);
                            } catch (IOException e) {
                                log.warn("Failed to delete orphaned file {}: {}", relative, e.getMessage());
                            }
                        }
                    });
        } catch (IOException e) {
            log.error("Failed to walk storage directory: {}", e.getMessage());
        }

        return new CleanupResult(deletedFiles.get(), deletedSize.get());
    }

    public record FileContent(Path path, String filename, String mimeType, long size) {}

    public record CleanupResult(int deletedFiles, long deletedSize) {}

    private AssetResponse toResponse(EditorAsset asset, boolean isDuplicate) {
        String url = baseUrl + "/" + asset.getStorageKey();
        return new AssetResponse(
                asset.getId(), asset.getDocumentId(), asset.getKind(),
                asset.getFilename(), asset.getMimeType(), asset.getFileSize(),
                asset.getWidth(), asset.getHeight(), url, asset.getCreatedAt(), isDuplicate);
    }

    private AssetResponse toResponse(EditorAsset asset) {
        return toResponse(asset, false);
    }

    private String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Validate the uploaded file: non-empty, size limit, and filename safety.
     */
    private void validateUploadedFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw FileValidationException.fileEmpty();
        }
        if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            throw FileValidationException.filenameEmpty();
        }
        String filename = file.getOriginalFilename();
        // Block path traversal attempts
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw FileValidationException.filenameInvalid(filename);
        }
        // Check file size limit
        long maxBytes = maxFileSizeMb * 1024L * 1024L;
        if (file.getSize() > maxBytes) {
            throw FileValidationException.fileTooLarge(filename, file.getSize(), maxBytes);
        }
    }

    /**
     * Extract file extension and validate against allowlist + Content-Type consistency.
     * @param originalFilename the original filename
     * @param kind the asset kind (e.g., "image", "svg")
     */
    private String extractAndValidateExtension(String originalFilename, String kind) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw FileValidationException.extensionNotAllowed("");
        }
        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();

        // Block dangerous extensions first
        if (BLOCKED_EXTENSIONS.contains(ext)) {
            throw FileValidationException.extensionBlocked(ext);
        }

        // SVG is only allowed when kind="svg" (DocumentService sanitizes via SvgSanitizer)
        if (".svg".equals(ext) && !"svg".equals(kind)) {
            throw FileValidationException.extensionNotAllowed(ext);
        }

        // Must be in allowlist
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw FileValidationException.extensionNotAllowed(ext);
        }

        return ext;
    }

    /**
     * Verify that the declared Content-Type matches the file extension.
     */
    private void validateContentType(String contentType, String ext) {
        if (contentType == null || contentType.isBlank()) {
            throw FileValidationException.contentTypeMismatch(ext, "null");
        }
        String normalizedContentType = contentType.toLowerCase().split(";")[0].trim();
        Set<String> allowedMimes = EXTENSION_TO_MIME_TYPES.get(ext);
        if (allowedMimes != null && !allowedMimes.contains(normalizedContentType)) {
            throw FileValidationException.contentTypeMismatch(ext, normalizedContentType);
        }
    }

    /**
     * Validate file magic number to ensure actual content matches declared extension.
     * Prevents attackers from uploading malicious files disguised as images.
     */
    private void validateMagicNumber(byte[] fileBytes, String ext, String filename) {
        byte[] expectedMagic = MAGIC_NUMBERS.get(ext);
        if (expectedMagic == null) {
            return; // No magic number check for this extension
        }
        if (fileBytes.length < expectedMagic.length) {
            throw FileValidationException.fileCorrupted(filename);
        }
        for (int i = 0; i < expectedMagic.length; i++) {
            if (fileBytes[i] != expectedMagic[i]) {
                throw FileValidationException.magicNumberMismatch(filename, ext);
            }
        }
    }

    /**
     * Generate thumbnail for an image file.
     */
    private void generateThumbnail(Path originalPath, String relativePath, int width, int height, int targetSize) {
        try {
            BufferedImage original = ImageIO.read(originalPath.toFile());
            if (original == null) {
                log.warn("Cannot read image for thumbnail generation: {}", originalPath);
                return;
            }

            // Calculate thumbnail dimensions maintaining aspect ratio
            int thumbWidth, thumbHeight;
            if (width > height) {
                thumbWidth = targetSize;
                thumbHeight = (int) ((double) height / width * targetSize);
            } else {
                thumbHeight = targetSize;
                thumbWidth = (int) ((double) width / height * targetSize);
            }

            // 创建缩略图，使用try-finally确保Graphics2D资源被释放，防止native内存泄漏
            BufferedImage thumbnail = new BufferedImage(thumbWidth, thumbHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = thumbnail.createGraphics();
            try {
                g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g2d.drawImage(original, 0, 0, thumbWidth, thumbHeight, null);
            } finally {
                g2d.dispose();
            }

            // Determine output format based on original
            String ext = relativePath.substring(relativePath.lastIndexOf(".")).toLowerCase();
            String formatName = ext.equals(".png") ? "png" : "jpg";

            // Save thumbnail
            Path thumbnailDir = Paths.get(storagePath, THUMBNAIL_DIR, targetSize + "px",
                    relativePath.substring(0, relativePath.lastIndexOf("/")));
            Files.createDirectories(thumbnailDir);
            Path thumbnailPath = thumbnailDir.resolve(relativePath.substring(relativePath.lastIndexOf("/") + 1));

            try (OutputStream os = Files.newOutputStream(thumbnailPath)) {
                ImageIO.write(thumbnail, formatName, os);
            }

            log.info("Generated thumbnail: {} -> {}px ({}x{})", relativePath, targetSize, thumbWidth, thumbHeight);
        } catch (IOException e) {
            log.warn("Failed to generate thumbnail for {}: {}", relativePath, e.getMessage());
        }
    }

    private void generateThumbnail(Path originalPath, String relativePath, int width, int height) {
        generateThumbnail(originalPath, relativePath, width, height, thumbnailSize);
    }

    /**
     * Delete all thumbnails for a given asset storage key.
     */
    private void deleteThumbnails(String storageKey) {
        Path thumbnailBase = Paths.get(storagePath, THUMBNAIL_DIR);
        if (!Files.exists(thumbnailBase)) {
            return;
        }
        try {
            Files.walk(thumbnailBase)
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().contains(storageKey.replace("/", "\\")))
                    .forEach(p -> {
                        try {
                            Files.delete(p);
                            log.info("Deleted thumbnail: {}", p);
                        } catch (IOException e) {
                            log.warn("Failed to delete thumbnail {}: {}", p, e.getMessage());
                        }
                    });
        } catch (IOException e) {
            log.warn("Failed to walk thumbnail directory: {}", e.getMessage());
        }
    }

    /**
     * Apply watermark to an image asset.
     */
    @Transactional
    public AssetResponse applyWatermark(Long id, String watermarkText, WatermarkPosition position, int opacity) {
        EditorAsset asset = assetMapper.selectById(id);
        if (asset == null) {
            throw new NotFoundException("asset not found");
        }
        if (!"image".equals(asset.getKind())) {
            throw new IllegalArgumentException("Only image assets can be watermarked");
        }

        Path originalPath = Paths.get(storagePath, asset.getStorageKey());
        if (!Files.exists(originalPath)) {
            throw new NotFoundException("file not found on storage");
        }

        try {
            BufferedImage original = ImageIO.read(originalPath.toFile());
            if (original == null) {
                throw new IllegalArgumentException("Cannot read image file");
            }

            // 创建水印图像，使用try-finally确保Graphics2D资源释放
            BufferedImage watermarked = new BufferedImage(original.getWidth(), original.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = watermarked.createGraphics();
            try {
                g2d.drawImage(original, 0, 0, null);

                // Configure watermark text
                g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, opacity / 100.0f));
                int fontSize = Math.max(original.getWidth() / 20, 12);
                g2d.setFont(new Font("Arial", Font.BOLD, fontSize));
                g2d.setColor(Color.WHITE);

                // Calculate position
                FontMetrics fm = g2d.getFontMetrics();
                int textWidth = fm.stringWidth(watermarkText);
                int textHeight = fm.getHeight();
                int x, y;

                switch (position) {
                    case TOP_LEFT -> { x = 10; y = textHeight + 10; }
                    case TOP_RIGHT -> { x = original.getWidth() - textWidth - 10; y = textHeight + 10; }
                    case BOTTOM_LEFT -> { x = 10; y = original.getHeight() - 10; }
                    case BOTTOM_RIGHT -> { x = original.getWidth() - textWidth - 10; y = original.getHeight() - 10; }
                    case CENTER -> { x = (original.getWidth() - textWidth) / 2; y = original.getHeight() / 2; }
                    default -> { x = 10; y = original.getHeight() - 10; }
                }

                // Draw watermark with shadow for better visibility
                g2d.setColor(Color.BLACK);
                g2d.drawString(watermarkText, x + 1, y + 1);
                g2d.setColor(Color.WHITE);
                g2d.drawString(watermarkText, x, y);
            } finally {
                g2d.dispose();
            }

            // Save watermarked image (create new asset)
            String ext = asset.getStorageKey().substring(asset.getStorageKey().lastIndexOf(".")).toLowerCase();
            String formatName = ext.equals(".png") ? "png" : "jpg";
            YearMonth ym = YearMonth.now();
            String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
            String relativePath = ym.getYear() + "/" + String.format("%02d", ym.getMonthValue()) + "/" + storedName;

            Path dirPath = Paths.get(storagePath, ym.getYear() + "", String.format("%02d", ym.getMonthValue()));
            Files.createDirectories(dirPath);
            Path filePath = dirPath.resolve(storedName);

            try (OutputStream os = Files.newOutputStream(filePath)) {
                ImageIO.write(watermarked, formatName, os);
            }

            // Create new asset record
            EditorAsset newAsset = new EditorAsset();
            newAsset.setOwnerId(DEFAULT_USER_ID);
            newAsset.setDocumentId(asset.getDocumentId());
            newAsset.setKind("image");
            newAsset.setFilename(asset.getFilename().replaceAll("(\\.[^.]+)$", "_watermarked$1"));
            newAsset.setMimeType(asset.getMimeType());
            newAsset.setBucket("local");
            newAsset.setStorageKey(relativePath);
            newAsset.setFileSize(Files.size(filePath));
            newAsset.setWidth(original.getWidth());
            newAsset.setHeight(original.getHeight());
            newAsset.setSha256(calculateSha256(Files.readAllBytes(filePath)));
            assetMapper.insert(newAsset);

            log.info("Applied watermark to asset {}: text='{}', position={}, opacity={}",
                    id, watermarkText, position, opacity);

            return toResponse(newAsset);
        } catch (IOException e) {
            throw new RuntimeException("Failed to apply watermark", e);
        }
    }

    /**
     * Crop an image asset.
     */
    @Transactional
    public AssetResponse cropImage(Long id, int x, int y, int width, int height) {
        EditorAsset asset = assetMapper.selectById(id);
        if (asset == null) {
            throw new NotFoundException("asset not found");
        }
        if (!"image".equals(asset.getKind())) {
            throw new IllegalArgumentException("Only image assets can be cropped");
        }
        if (x < 0 || y < 0 || width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Invalid crop parameters");
        }

        Path originalPath = Paths.get(storagePath, asset.getStorageKey());
        if (!Files.exists(originalPath)) {
            throw new NotFoundException("file not found on storage");
        }

        try {
            BufferedImage original = ImageIO.read(originalPath.toFile());
            if (original == null) {
                throw new IllegalArgumentException("Cannot read image file");
            }

            // Validate crop bounds
            if (x + width > original.getWidth() || y + height > original.getHeight()) {
                throw new IllegalArgumentException("Crop area exceeds image bounds");
            }

            // Crop image
            BufferedImage cropped = original.getSubimage(x, y, width, height);

            // Save cropped image
            String ext = asset.getStorageKey().substring(asset.getStorageKey().lastIndexOf(".")).toLowerCase();
            String formatName = ext.equals(".png") ? "png" : "jpg";
            YearMonth ym = YearMonth.now();
            String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
            String relativePath = ym.getYear() + "/" + String.format("%02d", ym.getMonthValue()) + "/" + storedName;

            Path dirPath = Paths.get(storagePath, ym.getYear() + "", String.format("%02d", ym.getMonthValue()));
            Files.createDirectories(dirPath);
            Path filePath = dirPath.resolve(storedName);

            try (OutputStream os = Files.newOutputStream(filePath)) {
                ImageIO.write(cropped, formatName, os);
            }

            // Create new asset record
            EditorAsset newAsset = new EditorAsset();
            newAsset.setOwnerId(DEFAULT_USER_ID);
            newAsset.setDocumentId(asset.getDocumentId());
            newAsset.setKind("image");
            newAsset.setFilename(asset.getFilename().replaceAll("(\\.[^.]+)$", "_cropped$1"));
            newAsset.setMimeType(asset.getMimeType());
            newAsset.setBucket("local");
            newAsset.setStorageKey(relativePath);
            newAsset.setFileSize(Files.size(filePath));
            newAsset.setWidth(width);
            newAsset.setHeight(height);
            newAsset.setSha256(calculateSha256(Files.readAllBytes(filePath)));
            assetMapper.insert(newAsset);

            log.info("Cropped asset {}: x={}, y={}, width={}, height={}", id, x, y, width, height);

            return toResponse(newAsset);
        } catch (IOException e) {
            throw new RuntimeException("Failed to crop image", e);
        }
    }

    public enum WatermarkPosition {
        TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, CENTER
    }
}
