package com.example.editor.ai.service;

import com.example.editor.ai.client.VolcengineVisualClient;
import com.example.editor.ai.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Base64;

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

    private static final String API_VERSION = "2022-08-31";

    /**
     * Get AI API status - check if credentials are configured
     */
    public AiStatusResponse getStatus() {
        boolean configured = accessKey != null && !accessKey.isEmpty();

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

            VolcengineMattingRequest request = VolcengineMattingRequest.builder()
                .imageBase64(base64Image)
                .build();

            VolcengineResponse response = volcengineClient.matting("SegmentImage", API_VERSION, request);

            if (response.hasError()) {
                log.error("Matting API error: {}", response.getErrorMessage());
                throw new RuntimeException("Matting API error: " + response.getErrorMessage());
            }

            String resultBase64 = response.getResultImageBase64();
            if (resultBase64 == null) {
                throw new RuntimeException("No image data in response");
            }

            return Base64.getDecoder().decode(resultBase64);
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
            VolcengineMattingRequest request = VolcengineMattingRequest.builder()
                .imageUrl(imageUrl)
                .build();

            VolcengineResponse response = volcengineClient.matting("SegmentImage", API_VERSION, request);

            if (response.hasError()) {
                throw new RuntimeException("Matting API error: " + response.getErrorMessage());
            }

            return Base64.getDecoder().decode(response.getResultImageBase64());
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

            VolcengineOutpaintingRequest request = VolcengineOutpaintingRequest.builder()
                .imageBase64(base64Image)
                .expandTop(direction.equals("top") || direction.equals("all") ? String.valueOf(pixels) : "0")
                .expandBottom(direction.equals("bottom") || direction.equals("all") ? String.valueOf(pixels) : "0")
                .expandLeft(direction.equals("left") || direction.equals("all") ? String.valueOf(pixels) : "0")
                .expandRight(direction.equals("right") || direction.equals("all") ? String.valueOf(pixels) : "0")
                .build();

            VolcengineResponse response = volcengineClient.outpainting("ImageOutpainting", API_VERSION, request);

            if (response.hasError()) {
                log.error("Outpainting API error: {}", response.getErrorMessage());
                throw new RuntimeException("Outpainting API error: " + response.getErrorMessage());
            }

            return Base64.getDecoder().decode(response.getResultImageBase64());
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

            VolcengineInpaintingRequest request = VolcengineInpaintingRequest.builder()
                .imageBase64(base64Image)
                .maskBase64(base64Mask)
                .build();

            VolcengineResponse response = volcengineClient.inpainting("ImageInpainting", API_VERSION, request);

            if (response.hasError()) {
                log.error("Inpainting API error: {}", response.getErrorMessage());
                throw new RuntimeException("Inpainting API error: " + response.getErrorMessage());
            }

            return Base64.getDecoder().decode(response.getResultImageBase64());
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

            VolcengineSuperResolutionRequest request = VolcengineSuperResolutionRequest.builder()
                .imageBase64(base64Image)
                .scale(String.valueOf(scale))
                .build();

            VolcengineResponse response = volcengineClient.superResolution("ImageSuperResolution", API_VERSION, request);

            if (response.hasError()) {
                log.error("Super Resolution API error: {}", response.getErrorMessage());
                throw new RuntimeException("Super Resolution API error: " + response.getErrorMessage());
            }

            return Base64.getDecoder().decode(response.getResultImageBase64());
        } catch (Exception e) {
            log.error("Super Resolution API call failed", e);
            throw new RuntimeException("Failed to process image super resolution: " + e.getMessage(), e);
        }
    }
}