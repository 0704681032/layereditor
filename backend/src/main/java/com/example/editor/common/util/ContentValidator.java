package com.example.editor.common.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.nio.charset.StandardCharsets;

public final class ContentValidator {

    private ContentValidator() {}

    private static final int MAX_CONTENT_SIZE = 10 * 1024 * 1024;

    private static final int MAX_SVG_SIZE = 2 * 1024 * 1024;

    private static final int MAX_LAYERS = 500;

    private static final int MAX_TEXT_LENGTH = 50000;

    private static final java.util.Set<String> VALID_LAYER_TYPES = java.util.Set.of(
            "image", "svg", "text", "group", "shape", "rect", "ellipse", "line"
    );

    public static JsonNode validateAndSanitize(JsonNode content) {
        if (content == null) {
            throw new IllegalArgumentException("Content cannot be null");
        }

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

        // Validate content size in bytes
        validateContentSize(content.toString());

        sanitizeLayers((ArrayNode) layers);

        return content;
    }

    public static void validateContentSize(String contentStr) {
        if (contentStr == null) {
            throw new IllegalArgumentException("Content cannot be null");
        }
        int byteSize = contentStr.getBytes(StandardCharsets.UTF_8).length;
        if (byteSize > MAX_CONTENT_SIZE) {
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

        if (!VALID_LAYER_TYPES.contains(type)) {
            throw new IllegalArgumentException("Invalid layer type: " + type);
        }

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

        if ("text".equals(type) && layer.has("text")) {
            String text = layer.get("text").asText();
            if (text != null && text.length() > MAX_TEXT_LENGTH) {
                throw new IllegalArgumentException("Text content too long in layer (max " + MAX_TEXT_LENGTH + " characters)");
            }
        }

        if ("group".equals(type) && layer.has("children") && layer.get("children").isArray()) {
            sanitizeLayers((ArrayNode) layer.get("children"));
        }
    }
}
