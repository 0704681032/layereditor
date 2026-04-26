package com.example.editor.ai.dto;

import lombok.Data;

/**
 * Response for AI API status check
 */
@Data
public class AiStatusResponse {
    /**
     * Whether Volcengine API credentials are configured
     */
    private boolean configured;

    /**
     * API provider name
     */
    private String provider;

    /**
     * Available features
     */
    private String[] features;

    /**
     * Status message
     */
    private String message;

    public AiStatusResponse(boolean configured, String provider, String[] features, String message) {
        this.configured = configured;
        this.provider = provider;
        this.features = features;
        this.message = message;
    }
}