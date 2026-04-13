package com.example.editor.asset.service;

import com.example.editor.asset.dto.AssetListResponse;
import com.example.editor.asset.dto.AssetResponse;
import com.example.editor.asset.entity.EditorAsset;
import com.example.editor.asset.mapper.AssetMapper;
import com.example.editor.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetMapper assetMapper;

    @Value("${app.storage.local-path}")
    private String storagePath;

    @Value("${app.storage.base-url}")
    private String baseUrl;

    private static final Long DEFAULT_USER_ID = 1L;

    // Allowed file extensions (lowercase, with dot)
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico"
    );

    // Mapping from extension to allowed MIME types
    private static final Map<String, Set<String>> EXTENSION_TO_MIME_TYPES = Map.ofEntries(
            Map.entry(".png", Set.of("image/png")),
            Map.entry(".jpg", Set.of("image/jpeg")),
            Map.entry(".jpeg", Set.of("image/jpeg")),
            Map.entry(".gif", Set.of("image/gif")),
            Map.entry(".webp", Set.of("image/webp")),
            Map.entry(".svg", Set.of("image/svg+xml")),
            Map.entry(".bmp", Set.of("image/bmp", "image/x-ms-bmp")),
            Map.entry(".ico", Set.of("image/x-icon", "image/vnd.microsoft.icon"))
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
            String ext = extractAndValidateExtension(originalFilename);
            String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
            YearMonth ym = YearMonth.now();
            String relativePath = ym.getYear() + "/" + String.format("%02d", ym.getMonthValue()) + "/" + storedName;

            Path dirPath = Paths.get(storagePath, ym.getYear() + "", String.format("%02d", ym.getMonthValue()));
            Files.createDirectories(dirPath);
            Path filePath = dirPath.resolve(storedName);

            // Read bytes before transfer
            byte[] fileBytes = file.getBytes();

            // Validate Content-Type matches extension
            validateContentType(file.getContentType(), ext);
            String sha256 = calculateSha256(fileBytes);

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
                    }
                } catch (Exception ignored) {}
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

            return toResponse(asset);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file", e);
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
        int offset = page * size;
        List<EditorAsset> assets = assetMapper.selectList(documentId, kind, offset, size);
        long total = assetMapper.countByCondition(documentId, kind);
        List<AssetResponse> items = assets.stream().map(this::toResponse).toList();
        return new AssetListResponse(items, total, page, size);
    }

    private AssetResponse toResponse(EditorAsset asset) {
        String url = baseUrl + "/" + asset.getStorageKey();
        return new AssetResponse(
                asset.getId(), asset.getDocumentId(), asset.getKind(),
                asset.getFilename(), asset.getMimeType(), asset.getFileSize(),
                asset.getWidth(), asset.getHeight(), url, asset.getCreatedAt());
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
            throw new IllegalArgumentException("File must not be empty");
        }
        if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            throw new IllegalArgumentException("File name must not be empty");
        }
        String filename = file.getOriginalFilename();
        // Block path traversal attempts
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new IllegalArgumentException("File name contains invalid characters");
        }
    }

    /**
     * Extract file extension and validate against allowlist + Content-Type consistency.
     */
    private String extractAndValidateExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("File must have an extension");
        }
        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();

        // Block dangerous extensions first
        if (BLOCKED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("File type '" + ext + "' is not allowed");
        }

        // Must be in allowlist
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("File type '" + ext + "' is not allowed. Allowed types: " + ALLOWED_EXTENSIONS);
        }

        return ext;
    }

    /**
     * Verify that the declared Content-Type matches the file extension.
     */
    private void validateContentType(String contentType, String ext) {
        if (contentType == null || contentType.isBlank()) {
            throw new IllegalArgumentException("Content-Type must not be empty");
        }
        String normalizedContentType = contentType.toLowerCase().split(";")[0].trim();
        Set<String> allowedMimes = EXTENSION_TO_MIME_TYPES.get(ext);
        if (allowedMimes != null && !allowedMimes.contains(normalizedContentType)) {
            throw new IllegalArgumentException(
                    "Content-Type '" + normalizedContentType + "' does not match file extension '" + ext + "'");
        }
    }
}
