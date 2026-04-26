package com.example.editor.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request for Volcengine ImageOutpainting API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolcengineOutpaintingRequest {
    @JsonProperty("image_base64")
    private String imageBase64;

    @JsonProperty("expand_top")
    private String expandTop;

    @JsonProperty("expand_bottom")
    private String expandBottom;

    @JsonProperty("expand_left")
    private String expandLeft;

    @JsonProperty("expand_right")
    private String expandRight;
}