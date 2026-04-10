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

    @Transactional
    public AssetResponse upload(MultipartFile file, Long documentId, String kind) {
        try {
            String originalFilename = file.getOriginalFilename();
            String ext = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                ext = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
            YearMonth ym = YearMonth.now();
            String relativePath = ym.getYear() + "/" + String.format("%02d", ym.getMonthValue()) + "/" + storedName;

            Path dirPath = Paths.get(storagePath, ym.getYear() + "", String.format("%02d", ym.getMonthValue()));
            Files.createDirectories(dirPath);
            Path filePath = dirPath.resolve(storedName);

            // Read bytes before transfer
            byte[] fileBytes = file.getBytes();
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
            return null;
        }
    }
}
