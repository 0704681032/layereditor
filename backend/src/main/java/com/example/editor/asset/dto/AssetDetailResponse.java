package com.example.editor.asset.dto;

import java.time.OffsetDateTime;

public record AssetDetailResponse(
    Long id,
    Long documentId,
    String kind,
    String filename,
    String mimeType,
    Long fileSize,
    Integer width,
    Integer height,
    String url,
    String thumbnailUrl,
    String sha256,
    OffsetDateTime createdAt,
    boolean isDuplicate,
    // EXIF metadata (for images)
    ExifMetadata exif
) {
    public record ExifMetadata(
        String cameraMake,
        String cameraModel,
        OffsetDateTime takenAt,
        Double latitude,
        Double longitude,
        Integer orientation,
        Integer iso,
        String exposureTime,
        Double focalLength,
        Double aperture
    ) {}
}