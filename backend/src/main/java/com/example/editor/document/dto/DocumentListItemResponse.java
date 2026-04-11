package com.example.editor.document.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DocumentListItemResponse(
    Long id,
    String title,
    String status,
    Integer currentVersion,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    ContentSummary content
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ContentSummary(
        Canvas canvas,
        Integer layerCount,
        String thumbnail
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Canvas(
        Integer width,
        Integer height,
        String background
    ) {}
}
