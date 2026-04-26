package com.example.editor.ai.service;

import com.example.editor.ai.client.VolcengineVisualClient;
import com.example.editor.ai.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Set;

/**
 * Service for calling Volcengine (ByteDance) Visual Intelligence APIs using OpenFeign
 *
 * API Documentation: https://www.volcengine.com/docs/6791/1347773
 *
 * Supported operations:
 * - Matting (background removal): SegmentImage / SegmentHumanBody
 * - Outpainting (image expansion): ImageOutpainting
 * - Inpainting (object removal): ImageInpainting
 * - Super Resolution (image enhancement): ImageSuperResolution
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AiImageService {

    private final VolcengineVisualClient volcengineClient;

    @Value("${app.volcengine.access-key:}")
    private String accessKey;

    @Value("${app.volcengine.secret-key:}")
    private String secretKey;

    private static final String API_VERSION = "2022-08-31";

    /**
     * Blocked URL patterns for SSRF protection
     */
    private static final Set<String> BLOCKED_URL_PATTERNS = Set.of(
        "localhost", "127.0.0.1", "0.0.0.0",
        "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
        "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
        "::1", "0:0:0:0:0:0:0:1", "fc00:", "fd00:"
    );

    /**
     * Check if API credentials are configured
     */
    private void checkCredentials() {
        if (accessKey == null || accessKey.isEmpty() || secretKey == null || secretKey.isEmpty()) {
            throw new IllegalStateException(
                "Volcengine API credentials not configured. " +
                "Please set VOLC_ACCESS_KEY and VOLC_SECRET_KEY environment variables.");
        }
    }

    /**
     * Get AI API status - check if credentials are configured
     */
    public AiStatusResponse getStatus() {
        boolean configured = accessKey != null && !accessKey.isEmpty()
            && secretKey != null && !secretKey.isEmpty();

        String[] features = configured
            ? new String[]{"matting", "outpainting", "inpainting", "super-resolution"}
            : new String[]{};

        String message = configured
            ? "AI features are available"
            : "Please configure VOLC_ACCESS_KEY and VOLC_SECRET_KEY to enable AI features";

        return new AiStatusResponse(configured, "ByteDance Volcengine", features, message);
    }

    /**
     * Image matting - remove background and extract subject
     *
     * @param imageBytes original image bytes
     * @param type matting type: 'human' for portrait, 'general' for objects
     * @return processed image bytes with transparent background
     */
    public byte[] matting(byte[] imageBytes, String type) {
        checkCredentials();

        String action = "human".equals(type) ? "SegmentHumanBody" : "SegmentImage";
        log.debug("Matting with action: {} for type: {}", action, type);

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            VolcengineMattingRequest request = VolcengineMattingRequest.builder()
                .imageBase64(base64Image)
                .build();

            VolcengineResponse response = volcengineClient.matting(action, API_VERSION, request);

            validateResponse(response, "Matting");
            return decodeResultImage(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            // Re-throw business exceptions directly
            throw e;
        } catch (Exception e) {
            log.error("Matting API call failed: {}", e.getMessage());
            throw new AiProcessingException("Failed to process image matting", e);
        }
    }

    /**
     * Alternative matting method using image URL
     *
     * @param imageUrl URL of the image to process
     * @param type matting type: 'human' for portrait, 'general' for objects
     * @return processed image bytes
     */
    public byte[] mattingFromUrl(String imageUrl, String type) {
        checkCredentials();
        validateImageUrl(imageUrl);

        String action = "human".equals(type) ? "SegmentHumanBody" : "SegmentImage";
        log.debug("Matting from URL with action: {}", action);

        try {
            VolcengineMattingRequest request = VolcengineMattingRequest.builder()
                .imageUrl(imageUrl)
                .build();

            VolcengineResponse response = volcengineClient.matting(action, API_VERSION, request);

            validateResponse(response, "Matting");
            return decodeResultImage(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Matting from URL failed: {}", e.getMessage());
            throw new AiProcessingException("Failed to process image matting from URL", e);
        }
    }

    /**
     * Image outpainting - expand image boundaries
     *
     * @param imageBytes original image bytes
     * @param direction expansion direction: top, bottom, left, right, all
     * @param pixels number of pixels to expand
     * @return expanded image bytes
     */
    public byte[] outpainting(byte[] imageBytes, String direction, int pixels) {
        checkCredentials();

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            VolcengineOutpaintingRequest request = VolcengineOutpaintingRequest.builder()
                .imageBase64(base64Image)
                .expandTop(direction.equals("top") || direction.equals("all") ? String.valueOf(pixels) : "0")
                .expandBottom(direction.equals("bottom") || direction.equals("all") ? String.valueOf(pixels) : "0")
                .expandLeft(direction.equals("left") || direction.equals("all") ? String.valueOf(pixels) : "0")
                .expandRight(direction.equals("right") || direction.equals("all") ? String.valueOf(pixels) : "0")
                .build();

            VolcengineResponse response = volcengineClient.outpainting("ImageOutpainting", API_VERSION, request);

            validateResponse(response, "Outpainting");
            return decodeResultImage(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Outpainting API call failed: {}", e.getMessage());
            throw new AiProcessingException("Failed to process image outpainting", e);
        }
    }

    /**
     * Image inpainting - remove objects and fill areas
     *
     * @param imageBytes original image bytes
     * @param maskBytes mask image bytes (white areas to remove)
     * @return inpainted image bytes
     */
    public byte[] inpainting(byte[] imageBytes, byte[] maskBytes) {
        checkCredentials();

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            String base64Mask = Base64.getEncoder().encodeToString(maskBytes);

            VolcengineInpaintingRequest request = VolcengineInpaintingRequest.builder()
                .imageBase64(base64Image)
                .maskBase64(base64Mask)
                .build();

            VolcengineResponse response = volcengineClient.inpainting("ImageInpainting", API_VERSION, request);

            validateResponse(response, "Inpainting");
            return decodeResultImage(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Inpainting API call failed: {}", e.getMessage());
            throw new AiProcessingException("Failed to process image inpainting", e);
        }
    }

    /**
     * Image super resolution - enhance image quality/resolution
     *
     * @param imageBytes original image bytes
     * @param scale resolution scale factor (2x, 4x)
     * @return enhanced image bytes
     */
    public byte[] superResolution(byte[] imageBytes, int scale) {
        checkCredentials();

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            VolcengineSuperResolutionRequest request = VolcengineSuperResolutionRequest.builder()
                .imageBase64(base64Image)
                .scale(String.valueOf(scale))
                .build();

            VolcengineResponse response = volcengineClient.superResolution("ImageSuperResolution", API_VERSION, request);

            validateResponse(response, "Super Resolution");
            return decodeResultImage(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Super Resolution API call failed: {}", e.getMessage());
            throw new AiProcessingException("Failed to process image super resolution", e);
        }
    }

    /**
     * Validate image URL for SSRF protection
     */
    private void validateImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new IllegalArgumentException("imageUrl is required");
        }

        // Only allow HTTP/HTTPS
        if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
            throw new IllegalArgumentException("imageUrl must be HTTP or HTTPS protocol");
        }

        // Extract host from URL
        String host = extractHost(imageUrl);

        // Check against blocked patterns
        for (String blocked : BLOCKED_URL_PATTERNS) {
            if (host.equalsIgnoreCase(blocked) || host.startsWith(blocked)) {
                log.warn("Blocked SSRF attempt to private network: {}", host);
                throw new IllegalArgumentException("Access to private network URLs is not allowed");
            }
        }
    }

    /**
     * Extract host from URL
     */
    private String extractHost(String url) {
        try {
            // Remove protocol
            String afterProtocol = url.replace("https://", "").replace("http://", "");
            // Extract host (before first / or :)
            int slashIndex = afterProtocol.indexOf('/');
            int colonIndex = afterProtocol.indexOf(':');
            int endIndex = Math.min(
                slashIndex >= 0 ? slashIndex : afterProtocol.length(),
                colonIndex >= 0 ? colonIndex : afterProtocol.length()
            );
            return afterProtocol.substring(0, endIndex).toLowerCase();
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Validate API response
     */
    private void validateResponse(VolcengineResponse response, String operation) {
        if (response == null) {
            throw new IllegalStateException(operation + " API returned null response");
        }
        if (response.hasError()) {
            String errorMsg = response.getErrorMessage();
            log.error("{} API error: {}", operation, errorMsg);
            throw new IllegalArgumentException(operation + " failed: " + errorMsg);
        }
    }

    /**
     * Decode result image from response
     */
    private byte[] decodeResultImage(VolcengineResponse response) {
        String resultBase64 = response.getResultImageBase64();
        if (resultBase64 == null || resultBase64.isEmpty()) {
            throw new IllegalStateException("No image data in API response");
        }
        return Base64.getDecoder().decode(resultBase64);
    }

    /**
     * Custom exception for AI processing failures
     */
    public static class AiProcessingException extends RuntimeException {
        public AiProcessingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}