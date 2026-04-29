package com.example.editor.asset.dto;

import java.time.OffsetDateTime;

public record AssetResponse(
    Long id,
    Long documentId,
    String kind,
    String filename,
    String mimeType,
    Long fileSize,
    Integer width,
    Integer height,
    String url,
    OffsetDateTime createdAt,
    boolean isDuplicate
) {
    // Convenience constructor for non-duplicate assets
    public AssetResponse(Long id, Long documentId, String kind, String filename,
                         String mimeType, Long fileSize, Integer width, Integer height,
                         String url, OffsetDateTime createdAt) {
        this(id, documentId, kind, filename, mimeType, fileSize, width, height, url, createdAt, false);
    }
}
