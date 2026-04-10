package com.example.editor.revision.dto;

import java.time.OffsetDateTime;

public record RevisionResponse(
    Long id,
    Long documentId,
    Integer versionNo,
    String message,
    OffsetDateTime createdAt
) {}
