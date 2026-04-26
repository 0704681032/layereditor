package com.example.editor.document.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DocumentDetailResponse(
    Long id,
    String title,
    Integer schemaVersion,
    Integer currentVersion,
    JsonNode content,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}