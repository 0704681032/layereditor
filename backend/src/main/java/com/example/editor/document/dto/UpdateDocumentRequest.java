package com.example.editor.document.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateDocumentRequest(
    @NotBlank String title,
    @NotNull Integer schemaVersion,
    @NotNull Integer currentVersion,
    @NotNull JsonNode content
) {}