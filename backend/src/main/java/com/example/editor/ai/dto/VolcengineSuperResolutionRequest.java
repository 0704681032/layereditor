package com.example.editor.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request for Volcengine ImageSuperResolution API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolcengineSuperResolutionRequest {
    @JsonProperty("image_base64")
    private String imageBase64;

    @JsonProperty("scale")
    private String scale;
}