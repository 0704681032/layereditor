package com.example.editor.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request for Volcengine ImageInpainting API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolcengineInpaintingRequest {
    @JsonProperty("image_base64")
    private String imageBase64;

    @JsonProperty("mask_base64")
    private String maskBase64;
}