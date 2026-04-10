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
    OffsetDateTime createdAt
) {}
