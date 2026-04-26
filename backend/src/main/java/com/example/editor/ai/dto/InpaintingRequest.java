package com.example.editor.ai.dto;

import lombok.Data;

/**
 * Request for image inpainting (remove objects/fill areas)
 */
@Data
public class InpaintingRequest {
    /**
     * Base64 encoded image data (with or without data:image/xxx;base64, prefix)
     */
    private String imageData;

    /**
     * Base64 encoded mask data (white areas will be removed/inpainted)
     * Mask should be same size as the image
     */
    private String maskData;
}