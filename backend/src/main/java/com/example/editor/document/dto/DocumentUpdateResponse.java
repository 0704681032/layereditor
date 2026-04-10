package com.example.editor.document.dto;

import java.time.OffsetDateTime;

public record DocumentUpdateResponse(
    Long id,
    Integer currentVersion,
    OffsetDateTime updatedAt
) {}
