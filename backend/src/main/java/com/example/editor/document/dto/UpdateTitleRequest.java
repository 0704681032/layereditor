package com.example.editor.document.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTitleRequest(
    @NotBlank String title
) {}