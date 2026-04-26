package com.example.editor.ai.dto;

import lombok.Data;

/**
 * Request for image matting (background removal)
 */
@Data
public class MattingRequest {
    /**
     * Base64 encoded image data (with or without data:image/xxx;base64, prefix)
     */
    private String imageData;

    /**
     * Original image width (optional, for response)
     */
    private Integer width;

    /**
     * Original image height (optional, for response)
     */
    private Integer height;

    /**
     * Matting type: "human" for human body, "general" for general objects
     * Default is "general"
     */
    private String type = "general";
}