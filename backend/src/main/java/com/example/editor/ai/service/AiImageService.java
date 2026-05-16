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
import java.util.Optional;
import java.util.function.Function;

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

        return executeOperation(
            () -> VolcengineMattingRequest.builder()
                .imageBase64(Base64.getEncoder().encodeToString(imageBytes))
                .build(),
            req -> volcengineClient.matting(action, properties.getVersion(), req),
            "Matting"
        );
    }

    public byte[] mattingFromUrl(String imageUrl, String type) {
        checkCredentials();
        validateImageUrl(imageUrl);
        String action = "human".equals(type) ? "SegmentHumanBody" : "SegmentImage";
        log.debug("Matting from URL with action: {}", action);

        return executeOperation(
            () -> VolcengineMattingRequest.builder()
                .imageUrl(imageUrl)
                .build(),
            req -> volcengineClient.matting(action, properties.getVersion(), req),
            "Matting"
        );
    }

    public byte[] outpainting(byte[] imageBytes, String direction, int pixels) {
        checkCredentials();

        return executeOperation(
            () -> VolcengineOutpaintingRequest.builder()
                .imageBase64(Base64.getEncoder().encodeToString(imageBytes))
                .expandTop(pixelsForDirection(direction, "top", pixels))
                .expandBottom(pixelsForDirection(direction, "bottom", pixels))
                .expandLeft(pixelsForDirection(direction, "left", pixels))
                .expandRight(pixelsForDirection(direction, "right", pixels))
                .build(),
            req -> volcengineClient.outpainting("ImageOutpainting", properties.getVersion(), req),
            "Outpainting"
        );
    }

    private String pixelsForDirection(String direction, String target, int pixels) {
        return direction.equals(target) || direction.equals("all") ? String.valueOf(pixels) : "0";
    }

    public byte[] inpainting(byte[] imageBytes, byte[] maskBytes) {
        checkCredentials();

        return executeOperation(
            () -> VolcengineInpaintingRequest.builder()
                .imageBase64(Base64.getEncoder().encodeToString(imageBytes))
                .maskBase64(Base64.getEncoder().encodeToString(maskBytes))
                .build(),
            req -> volcengineClient.inpainting("ImageInpainting", properties.getVersion(), req),
            "Inpainting"
        );
    }

    public byte[] superResolution(byte[] imageBytes, int scale) {
        checkCredentials();

        return executeOperation(
            () -> VolcengineSuperResolutionRequest.builder()
                .imageBase64(Base64.getEncoder().encodeToString(imageBytes))
                .scale(String.valueOf(scale))
                .build(),
            req -> volcengineClient.superResolution("ImageSuperResolution", properties.getVersion(), req),
            "Super Resolution"
        );
    }

    private <T> byte[] executeOperation(
            java.util.function.Supplier<T> requestSupplier,
            Function<T, VolcengineResponse> clientCall,
            String operationName) {
        try {
            T request = requestSupplier.get();
            VolcengineResponse response = clientCall.apply(request);
            validateResponse(response, operationName);
            return decodeResultImage(response);
        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("{} API call failed: {}", operationName, e.getMessage());
            throw new AiProcessingException("Failed to process " + operationName.toLowerCase(), e);
        }
    }

    /**
     * SSRF protection using DNS resolution and IP address validation.
     */
    private void validateImageUrl(String imageUrl) {
        Optional.ofNullable(imageUrl)
            .filter(url -> !url.isEmpty())
            .orElseThrow(() -> new IllegalArgumentException("imageUrl is required"));

        if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
            throw new IllegalArgumentException("imageUrl must be HTTP or HTTPS protocol");
        }

        try {
            URI uri = new URI(imageUrl);
            String host = Optional.ofNullable(uri.getHost())
                .filter(h -> !h.isEmpty())
                .orElseThrow(() -> new IllegalArgumentException("Invalid URL: missing host"));

            InetAddress address = InetAddress.getByName(host);

            validateNotPrivateNetwork(host, address);
            validateNotSpecialRange(host, address);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid URL: " + e.getMessage());
        }
    }

    private void validateNotPrivateNetwork(String host, InetAddress address) {
        if (address.isLoopbackAddress() || address.isSiteLocalAddress() ||
            address.isLinkLocalAddress() || address.isAnyLocalAddress()) {
            log.warn("Blocked SSRF attempt to private network: {} -> {}", host, address);
            throw new IllegalArgumentException("Access to private network URLs is not allowed");
        }
    }

    private void validateNotSpecialRange(String host, InetAddress address) {
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
    }

    private void validateResponse(VolcengineResponse response, String operation) {
        Optional.ofNullable(response)
            .orElseThrow(() -> new IllegalStateException(operation + " API returned null response"));

        if (response.hasError()) {
            String errorMsg = response.getErrorMessage();
            log.error("{} API error: {}", operation, errorMsg);
            throw new IllegalArgumentException(operation + " failed");
        }
    }

    private byte[] decodeResultImage(VolcengineResponse response) {
        return Optional.ofNullable(response.getResultImageBase64())
            .filter(base64 -> !base64.isEmpty())
            .map(Base64.getDecoder()::decode)
            .orElseThrow(() -> new IllegalStateException("No image data in API response"));
    }

    public static class AiProcessingException extends RuntimeException {
        public AiProcessingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}