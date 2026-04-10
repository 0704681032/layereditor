package com.example.editor.document.dto;

import java.time.OffsetDateTime;

public record DocumentListItemResponse(
    Long id,
    String title,
    String status,
    Integer currentVersion,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
