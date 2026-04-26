package com.example.editor.ai.dto;

import lombok.Data;

/**
 * Response for AI image processing
 */
@Data
public class AiImageResponse {
    /**
     * Base64 encoded processed image data (with data:image/png;base64, prefix)
     */
    private String imageData;

    /**
     * Result image width
     */
    private Integer width;

    /**
     * Result image height
     */
    private Integer height;
}