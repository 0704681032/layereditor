package com.example.editor.revision.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;

public record RevisionDetailResponse(
    Long id,
    Long documentId,
    Integer versionNo,
    JsonNode snapshot,
    String message,
    OffsetDateTime createdAt
) {}
