package com.example.editor.ai.service;

import com.example.editor.ai.client.VolcengineVisualClient;
import com.example.editor.ai.config.VolcengineProperties;
import com.example.editor.ai.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.util.Base64;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiImageService {

    private final VolcengineVisualClient volcengineClient;
    private final VolcengineProperties properties;

    private void checkCredentials() {
        if (!properties.isConfigured()) {
            throw new IllegalStateException(
                "Volcengine API credentials not configured. " +
                "Please set VOLC_ACCESS_KEY and VOLC_SECRET_KEY environment variables.");
        }
    }

    public AiStatusResponse getStatus() {
        boolean configured = properties.isConfigured();

        String[] features = configured
            ? new String[]{"matting", "outpainting", "inpainting", "super-resolution"}
            : new String[]{};

        String message = configured
            ? "AI features are available"
            : "Please configure VOLC_ACCESS_KEY and VOLC_SECRET_KEY to enable AI features";

        return new AiStatusResponse(configured, "ByteDance Volcengine", features, message);
    }

    public byte[] matting(byte[] imageBytes, String type) {
        checkCredentials();

        String action = "human".equals(type) ? "SegmentHumanBody" : "SegmentImage";
        log.debug("Matting with action: {} for type: {}", action, type);

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            VolcengineMattingRequest request = VolcengineMattingRequest.builder()
                .imageBase64(base64Image)
                .build();

            VolcengineResponse response = volcengineClient.matting(action, properties.getVersion(), request);

            validateResponse(response, "Matting");
            return decodeResultImage(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Matting API call failed: {}", e.getMessage());
            throw new AiProcessingException("Failed to process image matting", e);
        }
    }

    public byte[] mattingFromUrl(String imageUrl, String type) {
        checkCredentials();
        validateImageUrl(imageUrl);

        String action = "human".equals(type) ? "SegmentHumanBody" : "SegmentImage";
        log.debug("Matting from URL with action: {}", action);

        try {
            VolcengineMattingRequest request = VolcengineMattingRequest.builder()
                .imageUrl(imageUrl)
                .build();

            VolcengineResponse response = volcengineClient.matting(action, properties.getVersion(), request);

            validateResponse(response, "Matting");
            return decodeResultImage(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Matting from URL failed: {}", e.getMessage());
            throw new AiProcessingException("Failed to process image matting from URL", e);
        }
    }

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

            VolcengineResponse response = volcengineClient.outpainting("ImageOutpainting", properties.getVersion(), request);

            validateResponse(response, "Outpainting");
            return decodeResultImage(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Outpainting API call failed: {}", e.getMessage());
            throw new AiProcessingException("Failed to process image outpainting", e);
        }
    }

    public byte[] inpainting(byte[] imageBytes, byte[] maskBytes) {
        checkCredentials();

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            String base64Mask = Base64.getEncoder().encodeToString(maskBytes);

            VolcengineInpaintingRequest request = VolcengineInpaintingRequest.builder()
                .imageBase64(base64Image)
                .maskBase64(base64Mask)
                .build();

            VolcengineResponse response = volcengineClient.inpainting("ImageInpainting", properties.getVersion(), request);

            validateResponse(response, "Inpainting");
            return decodeResultImage(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Inpainting API call failed: {}", e.getMessage());
            throw new AiProcessingException("Failed to process image inpainting", e);
        }
    }

    public byte[] superResolution(byte[] imageBytes, int scale) {
        checkCredentials();

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            VolcengineSuperResolutionRequest request = VolcengineSuperResolutionRequest.builder()
                .imageBase64(base64Image)
                .scale(String.valueOf(scale))
                .build();

            VolcengineResponse response = volcengineClient.superResolution("ImageSuperResolution", properties.getVersion(), request);

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
     * SSRF protection using DNS resolution and IP address validation.
     */
    private void validateImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new IllegalArgumentException("imageUrl is required");
        }

        if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
            throw new IllegalArgumentException("imageUrl must be HTTP or HTTPS protocol");
        }

        try {
            URI uri = new URI(imageUrl);
            String host = uri.getHost();
            if (host == null || host.isEmpty()) {
                throw new IllegalArgumentException("Invalid URL: missing host");
            }

            InetAddress address = InetAddress.getByName(host);

            if (address.isLoopbackAddress() || address.isSiteLocalAddress() ||
                address.isLinkLocalAddress() || address.isAnyLocalAddress()) {
                log.warn("Blocked SSRF attempt to private network: {} -> {}", host, address);
                throw new IllegalArgumentException("Access to private network URLs is not allowed");
            }

            byte[] bytes = address.getAddress();
            if (bytes.length == 4) {
                int first = bytes[0] & 0xFF;
                int second = bytes[1] & 0xFF;
                // 100.64.0.0/10 (Carrier-grade NAT, RFC 6598)
                if (first == 100 && second >= 64 && second <= 127) {
                    log.warn("Blocked SSRF attempt to CGNAT range: {} -> {}", host, address);
                    throw new IllegalArgumentException("Access to private network URLs is not allowed");
                }
                // 169.254.0.0/16 (link-local)
                if (first == 169 && second == 254) {
                    log.warn("Blocked SSRF attempt to link-local: {} -> {}", host, address);
                    throw new IllegalArgumentException("Access to private network URLs is not allowed");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid URL: " + e.getMessage());
        }
    }

    private void validateResponse(VolcengineResponse response, String operation) {
        if (response == null) {
            throw new IllegalStateException(operation + " API returned null response");
        }
        if (response.hasError()) {
            String errorMsg = response.getErrorMessage();
            log.error("{} API error: {}", operation, errorMsg);
            throw new IllegalArgumentException(operation + " failed");
        }
    }

    private byte[] decodeResultImage(VolcengineResponse response) {
        String resultBase64 = response.getResultImageBase64();
        if (resultBase64 == null || resultBase64.isEmpty()) {
            throw new IllegalStateException("No image data in API response");
        }
        return Base64.getDecoder().decode(resultBase64);
    }

    public static class AiProcessingException extends RuntimeException {
        public AiProcessingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
