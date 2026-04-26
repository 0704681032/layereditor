package com.example.editor.ai.dto;

import lombok.Data;

/**
 * Request for image super resolution (enhance image quality)
 */
@Data
public class SuperResolutionRequest {
    /**
     * Base64 encoded image data (with or without data:image/xxx;base64, prefix)
     */
    private String imageData;

    /**
     * Resolution scale factor
     * Default is 2x (can be 2 or 4)
     */
    private Integer scale = 2;
}