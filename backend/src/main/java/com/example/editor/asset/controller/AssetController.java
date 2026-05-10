package com.example.editor.asset.controller;

import com.example.editor.asset.dto.AssetListResponse;
import com.example.editor.asset.dto.AssetResponse;
import com.example.editor.asset.service.AssetService;
import com.example.editor.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @PostMapping
    public ApiResponse<AssetResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "documentId", required = false) Long documentId,
            @RequestParam(value = "kind", defaultValue = "image") String kind) {
        return ApiResponse.ok(assetService.upload(file, documentId, kind));
    }

    @PostMapping("/batch")
    public ApiResponse<List<AssetResponse>> uploadBatch(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "documentId", required = false) Long documentId,
            @RequestParam(value = "kind", defaultValue = "image") String kind) {
        return ApiResponse.ok(assetService.uploadBatch(files, documentId, kind));
    }

    @GetMapping("/{id}")
    public ApiResponse<AssetResponse> getAsset(@PathVariable Long id) {
        return ApiResponse.ok(assetService.getAsset(id));
    }

    @GetMapping
    public ApiResponse<AssetListResponse> listAssets(
            @RequestParam(value = "documentId", required = false) Long documentId,
            @RequestParam(value = "kind", required = false) String kind,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ApiResponse.ok(assetService.listAssets(documentId, kind, page, size));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteAsset(@PathVariable Long id) {
        assetService.deleteAsset(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/check-duplicate")
    public ApiResponse<AssetResponse> checkDuplicate(@RequestParam("sha256") String sha256) {
        AssetResponse existing = assetService.findDuplicateBySha256(sha256);
        return ApiResponse.ok(existing);
    }

    @GetMapping("/stats")
    public ApiResponse<AssetService.StorageStats> getStorageStats() {
        return ApiResponse.ok(assetService.getStorageStats());
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<FileSystemResource> downloadAsset(@PathVariable Long id) {
        AssetService.FileContent content = assetService.getFileContent(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(content.mimeType()));
        headers.setContentLength(content.size());
        String encodedFilename = URLEncoder.encode(content.filename(), StandardCharsets.UTF_8).replace("+", "%20");
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename);
        return ResponseEntity.ok()
                .headers(headers)
                .body(new FileSystemResource(content.path()));
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<FileSystemResource> previewAsset(@PathVariable Long id) {
        AssetService.FileContent content = assetService.getFileContent(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(content.mimeType()));
        headers.setContentLength(content.size());
        String encodedFilename = URLEncoder.encode(content.filename(), StandardCharsets.UTF_8).replace("+", "%20");
        // SVG files served as attachment to prevent stored XSS
        if ("image/svg+xml".equals(content.mimeType())) {
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename);
            headers.add("Content-Security-Policy", "sandbox");
        } else {
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedFilename);
        }
        return ResponseEntity.ok()
                .headers(headers)
                .body(new FileSystemResource(content.path()));
    }

    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<FileSystemResource> getThumbnail(
            @PathVariable Long id,
            @RequestParam(value = "size", defaultValue = "200") int size) {
        AssetService.FileContent content = assetService.getThumbnail(id, size);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(content.mimeType()));
        headers.setContentLength(content.size());
        String encodedThumbFilename = URLEncoder.encode(content.filename(), StandardCharsets.UTF_8).replace("+", "%20");
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedThumbFilename);
        return ResponseEntity.ok()
                .headers(headers)
                .body(new FileSystemResource(content.path()));
    }

    @PostMapping("/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AssetService.CleanupResult> cleanupOrphanedFiles() {
        return ApiResponse.ok(assetService.cleanupOrphanedFiles());
    }

    @GetMapping("/search")
    public ApiResponse<AssetListResponse> searchAssets(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "documentId", required = false) Long documentId,
            @RequestParam(value = "kind", required = false) String kind,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ApiResponse.ok(assetService.searchAssets(query, documentId, kind, page, size));
    }

    @DeleteMapping("/batch")
    public ApiResponse<AssetService.BatchDeleteResult> batchDelete(@RequestBody List<Long> ids) {
        return ApiResponse.ok(assetService.batchDelete(ids));
    }

    @PostMapping("/{id}/watermark")
    public ApiResponse<AssetResponse> applyWatermark(
            @PathVariable Long id,
            @RequestParam("text") String text,
            @RequestParam(value = "position", defaultValue = "BOTTOM_RIGHT") AssetService.WatermarkPosition position,
            @RequestParam(value = "opacity", defaultValue = "50") int opacity) {
        if (text == null || text.isBlank() || text.length() > 200) {
            throw new IllegalArgumentException("Watermark text must be 1-200 characters");
        }
        if (opacity < 0 || opacity > 100) {
            throw new IllegalArgumentException("Opacity must be between 0 and 100");
        }
        return ApiResponse.ok(assetService.applyWatermark(id, text, position, opacity));
    }

    @PostMapping("/{id}/crop")
    public ApiResponse<AssetResponse> cropImage(
            @PathVariable Long id,
            @RequestParam("x") int x,
            @RequestParam("y") int y,
            @RequestParam("width") int width,
            @RequestParam("height") int height) {
        if (x < 0 || y < 0 || width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Invalid crop parameters");
        }
        return ApiResponse.ok(assetService.cropImage(id, x, y, width, height));
    }
}
