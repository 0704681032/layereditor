package com.example.editor.common.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Validates and sanitizes document content JSON,
 * including sanitizing SVG data in svg layers.
 */
public final class ContentValidator {

    private ContentValidator() {}

    // Maximum content JSON string size: 10MB
    private static final int MAX_CONTENT_SIZE = 10 * 1024 * 1024;

    // Maximum SVG string size per layer: 2MB
    private static final int MAX_SVG_SIZE = 2 * 1024 * 1024;

    // Maximum number of layers
    private static final int MAX_LAYERS = 500;

    // Maximum text content length per text layer
    private static final int MAX_TEXT_LENGTH = 50000;

    /**
     * Validate and sanitize document content.
     *
     * @param content The JSON content node
     * @return Sanitized content node
     * @throws IllegalArgumentException if content is invalid
     */
    public static JsonNode validateAndSanitize(JsonNode content) {
        if (content == null) {
            throw new IllegalArgumentException("Content cannot be null");
        }

        // Validate structure
        if (!content.has("canvas") || !content.has("layers")) {
            throw new IllegalArgumentException("Content must have 'canvas' and 'layers' fields");
        }

        JsonNode canvas = content.get("canvas");
        if (!canvas.has("width") || !canvas.has("height")) {
            throw new IllegalArgumentException("Canvas must have 'width' and 'height'");
        }

        int canvasWidth = canvas.get("width").asInt();
        int canvasHeight = canvas.get("height").asInt();
        if (canvasWidth < 10 || canvasWidth > 10000 || canvasHeight < 10 || canvasHeight > 10000) {
            throw new IllegalArgumentException("Canvas dimensions must be between 10 and 10000");
        }

        JsonNode layers = content.get("layers");
        if (!layers.isArray()) {
            throw new IllegalArgumentException("'layers' must be an array");
        }

        if (layers.size() > MAX_LAYERS) {
            throw new IllegalArgumentException("Too many layers (max " + MAX_LAYERS + ")");
        }

        // Sanitize SVG data in layers
        sanitizeLayers((ArrayNode) layers);

        return content;
    }

    /**
     * Validate content size as a string.
     */
    public static void validateContentSize(String contentStr) {
        if (contentStr == null) {
            throw new IllegalArgumentException("Content cannot be null");
        }
        if (contentStr.length() > MAX_CONTENT_SIZE) {
            throw new IllegalArgumentException("Content too large (max " + (MAX_CONTENT_SIZE / 1024 / 1024) + "MB)");
        }
    }

    private static void sanitizeLayers(ArrayNode layers) {
        for (int i = 0; i < layers.size(); i++) {
            JsonNode layer = layers.get(i);
            if (layer.isObject()) {
                sanitizeLayer((ObjectNode) layer);
            }
        }
    }

    private static void sanitizeLayer(ObjectNode layer) {
        String type = layer.has("type") ? layer.get("type").asText() : "";

        // Sanitize SVG layers
        if ("svg".equals(type) && layer.has("svgData")) {
            String svgData = layer.get("svgData").asText();
            if (svgData != null) {
                if (svgData.length() > MAX_SVG_SIZE) {
                    throw new IllegalArgumentException("SVG data too large in layer (max " + (MAX_SVG_SIZE / 1024 / 1024) + "MB)");
                }
                String sanitized = SvgSanitizer.sanitize(svgData);
                layer.put("svgData", sanitized);
            }
        }

        // Validate text layers
        if ("text".equals(type) && layer.has("text")) {
            String text = layer.get("text").asText();
            if (text != null && text.length() > MAX_TEXT_LENGTH) {
                throw new IllegalArgumentException("Text content too long in layer (max " + MAX_TEXT_LENGTH + " characters)");
            }
        }

        // Recursively sanitize children in group layers
        if ("group".equals(type) && layer.has("children") && layer.get("children").isArray()) {
            sanitizeLayers((ArrayNode) layer.get("children"));
        }
    }
}