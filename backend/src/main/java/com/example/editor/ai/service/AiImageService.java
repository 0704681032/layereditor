package com.example.editor.ai.service;

import com.example.editor.ai.dto.AiStatusResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for calling Volcengine (ByteDance) Visual Intelligence APIs
 *
 * API Documentation: https://www.volcengine.com/docs/6791/1347773
 *
 * Supported operations:
 * - Matting (background removal): SegmentImage / SegmentHumanBody
 * - Outpainting (image expansion): ImageOutpainting
 * - Inpainting (object removal): ImageInpainting
 */
@Service
@Slf4j
public class AiImageService {

    @Value("${app.volcengine.access-key:}")
    private String accessKey;

    @Value("${app.volcengine.secret-key:}")
    private String secretKey;

    @Value("${app.volcengine.endpoint:https://visual.volcengineapi.com}")
    private String endpoint;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final String SERVICE = "cv";
    private static final String REGION = "cn-north-1";

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
     * @return processed image bytes with transparent background
     */
    public byte[] matting(byte[] imageBytes) {
        if (accessKey == null || accessKey.isEmpty()) {
            throw new IllegalStateException("Volcengine API credentials not configured. Please set VOLC_ACCESS_KEY and VOLC_SECRET_KEY environment variables.");
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("image_base64", base64Image);

            String action = "SegmentImage";
            String version = "2022-08-31";

            String response = callVolcengineApi(action, version, requestBody);

            // Parse response to extract result image
            return extractImageFromResponse(response);
        } catch (Exception e) {
            log.error("Matting API call failed", e);
            throw new RuntimeException("Failed to process image matting: " + e.getMessage(), e);
        }
    }

    /**
     * Alternative matting method using image URL
     */
    public byte[] mattingFromUrl(String imageUrl) {
        try {
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("image_url", imageUrl);

            String action = "SegmentImage";
            String version = "2022-08-31";

            String response = callVolcengineApi(action, version, requestBody);
            return extractImageFromResponse(response);
        } catch (Exception e) {
            log.error("Matting from URL failed", e);
            throw new RuntimeException("Failed to process image matting: " + e.getMessage(), e);
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
        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("image_base64", base64Image);
            requestBody.put("expand_top", direction.equals("top") || direction.equals("all") ? String.valueOf(pixels) : "0");
            requestBody.put("expand_bottom", direction.equals("bottom") || direction.equals("all") ? String.valueOf(pixels) : "0");
            requestBody.put("expand_left", direction.equals("left") || direction.equals("all") ? String.valueOf(pixels) : "0");
            requestBody.put("expand_right", direction.equals("right") || direction.equals("all") ? String.valueOf(pixels) : "0");

            String action = "ImageOutpainting";
            String version = "2022-08-31";

            String response = callVolcengineApi(action, version, requestBody);
            return extractImageFromResponse(response);
        } catch (Exception e) {
            log.error("Outpainting API call failed", e);
            throw new RuntimeException("Failed to process image outpainting: " + e.getMessage(), e);
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
        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            String base64Mask = Base64.getEncoder().encodeToString(maskBytes);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("image_base64", base64Image);
            requestBody.put("mask_base64", base64Mask);

            String action = "ImageInpainting";
            String version = "2022-08-31";

            String response = callVolcengineApi(action, version, requestBody);
            return extractImageFromResponse(response);
        } catch (Exception e) {
            log.error("Inpainting API call failed", e);
            throw new RuntimeException("Failed to process image inpainting: " + e.getMessage(), e);
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
        if (accessKey == null || accessKey.isEmpty()) {
            throw new IllegalStateException("Volcengine API credentials not configured. Please set VOLC_ACCESS_KEY and VOLC_SECRET_KEY environment variables.");
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("image_base64", base64Image);
            requestBody.put("scale", String.valueOf(scale));

            String action = "ImageSuperResolution";
            String version = "2022-08-31";

            String response = callVolcengineApi(action, version, requestBody);
            return extractImageFromResponse(response);
        } catch (Exception e) {
            log.error("Super Resolution API call failed", e);
            throw new RuntimeException("Failed to process image super resolution: " + e.getMessage(), e);
        }
    }

    /**
     * Call Volcengine API with signature authentication
     *
     * Volcengine uses OpenAPI style authentication similar to AWS
     */
    private String callVolcengineApi(String action, String version, Map<String, String> body) throws IOException, InterruptedException {
        String now = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
                .withZone(java.time.ZoneOffset.UTC)
                .format(Instant.now());

        // Build canonical request
        String method = "POST";
        String path = "/";
        String queryString = buildQueryString(action, version);

        String jsonBody = toJsonString(body);
        String bodyHash = sha256Hex(jsonBody);

        String canonicalHeaders = "content-type:application/json\nhost:" + endpoint.replace("https://", "") + "\nx-date:" + now + "\n";
        String signedHeaders = "content-type;host;x-date";

        String canonicalRequest = method + "\n" + path + "\n" + queryString + "\n" +
                canonicalHeaders + "\n" + signedHeaders + "\n" + bodyHash;

        // Build string to sign
        String algorithm = "HMAC-SHA256";
        String credentialScope = now.substring(0, 8) + "/" + REGION + "/" + SERVICE + "/request";
        String stringToSign = algorithm + "\n" + now + "\n" + credentialScope + "\n" + sha256Hex(canonicalRequest);

        // Calculate signature
        byte[] kDate = hmacSha256(secretKey.getBytes(StandardCharsets.UTF_8), now.substring(0, 8));
        byte[] kRegion = hmacSha256(kDate, REGION);
        byte[] kService = hmacSha256(kRegion, SERVICE);
        byte[] kSigning = hmacSha256(kService, "request");
        String signature = hex(hmacSha256(kSigning, stringToSign));

        // Build authorization header
        String authorization = algorithm + " Credential=" + accessKey + "/" + credentialScope +
                ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

        // Send request
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint + "?" + queryString))
                .header("Content-Type", "application/json")
                .header("Host", endpoint.replace("https://", ""))
                .header("X-Date", now)
                .header("Authorization", authorization)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (response.statusCode() != 200) {
            log.error("API call failed with status {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("API call failed: " + response.body());
        }

        return response.body();
    }

    private String buildQueryString(String action, String version) {
        return "Action=" + action + "&Version=" + version;
    }

    private String toJsonString(Map<String, String> map) {
        return map.entrySet().stream()
                .map(e -> "\"" + e.getKey() + "\":\"" + escapeJson(e.getValue()) + "\"")
                .collect(Collectors.joining(",", "{", "}"));
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    private byte[] extractImageFromResponse(String response) {
        // Parse JSON response to get result image
        // Response format: {"ResponseMetadata": {...}, "Result": {"image_base64": "..."}}
        try {
            int start = response.indexOf("\"image_base64\"");
            if (start == -1) {
                // Try alternative response format
                start = response.indexOf("\"result_image\"");
                if (start == -1) {
                    throw new RuntimeException("No image data found in response: " + response.substring(0, Math.min(500, response.length())));
                }
            }

            int valueStart = response.indexOf(":", start) + 2; // skip ": "
            int valueEnd = response.indexOf("\"", valueStart + 1);
            String base64Image = response.substring(valueStart, valueEnd);

            return Base64.getDecoder().decode(base64Image);
        } catch (Exception e) {
            log.error("Failed to parse response: {}", response.substring(0, Math.min(1000, response.length())));
            throw new RuntimeException("Failed to extract image from API response", e);
        }
    }

    private static String sha256Hex(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return hex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 failed", e);
        }
    }

    private static byte[] hmacSha256(byte[] key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256 failed", e);
        }
    }

    private static String hex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}