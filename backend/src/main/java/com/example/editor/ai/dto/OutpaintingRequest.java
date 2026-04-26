package com.example.editor.ai.dto;

import lombok.Data;

/**
 * Request for image outpainting (expand image boundaries)
 */
@Data
public class OutpaintingRequest {
    /**
     * Base64 encoded image data (with or without data:image/xxx;base64, prefix)
     */
    private String imageData;

    /**
     * Expansion direction: top, bottom, left, right, all
     * Default is "all"
     */
    private String direction = "all";

    /**
     * Number of pixels to expand
     * Default is 100 pixels
     */
    private Integer pixels = 100;
}