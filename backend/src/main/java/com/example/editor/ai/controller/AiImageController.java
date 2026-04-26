package com.example.editor.ai.controller;

import com.example.editor.ai.dto.MattingRequest;
import com.example.editor.ai.dto.OutpaintingRequest;
import com.example.editor.ai.dto.InpaintingRequest;
import com.example.editor.ai.dto.SuperResolutionRequest;
import com.example.editor.ai.dto.AiImageResponse;
import com.example.editor.ai.dto.AiStatusResponse;
import com.example.editor.ai.service.AiImageService;
import com.example.editor.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@RestController
@RequestMapping("/api/ai/image")
@RequiredArgsConstructor
@Slf4j
public class AiImageController {

    private final AiImageService aiImageService;

    /**
     * Maximum image data size: 10MB (Base64 encoded ~13.3MB chars)
     */
    private static final int MAX_IMAGE_SIZE = 10 * 1024 * 1024;

    /**
     * Check AI API status - whether Volcengine credentials are configured
     */
    @GetMapping("/status")
    public ApiResponse<AiStatusResponse> status() {
        AiStatusResponse response = aiImageService.getStatus();
        return ApiResponse.ok(response);
    }

    /**
     * Image matting (background removal)
     * Input: image URL or base64 data
     * Output: processed image with transparent background (base64)
     */
    @PostMapping("/matting")
    public ApiResponse<AiImageResponse> matting(@RequestBody MattingRequest request) {
        log.info("Matting request received, type: {}, dataSize: {} chars",
            request.getType(), request.getImageData() != null ? request.getImageData().length() : 0);

        validateAndDecodeImage(request.getImageData());

        byte[] imageBytes = extractAndDecodeBase64(request.getImageData());
        byte[] result = aiImageService.matting(imageBytes, request.getType());

        return buildSuccessResponse(result, request.getWidth(), request.getHeight());
    }

    /**
     * Image outpainting (expand image boundaries)
     * Input: image data, direction, and pixels to expand
     * Output: expanded image (base64)
     */
    @PostMapping("/outpainting")
    public ApiResponse<AiImageResponse> outpainting(@RequestBody OutpaintingRequest request) {
        log.info("Outpainting request received, direction: {}, pixels: {}, dataSize: {} chars",
            request.getDirection(), request.getPixels(),
            request.getImageData() != null ? request.getImageData().length() : 0);

        validateAndDecodeImage(request.getImageData());

        byte[] imageBytes = extractAndDecodeBase64(request.getImageData());
        byte[] result = aiImageService.outpainting(imageBytes, request.getDirection(), request.getPixels());

        return buildSuccessResponse(result, null, null);
    }

    /**
     * Image inpainting (remove objects/fill areas)
     * Input: image data and mask data (white areas to remove)
     * Output: inpainted image (base64)
     */
    @PostMapping("/inpainting")
    public ApiResponse<AiImageResponse> inpainting(@RequestBody InpaintingRequest request) {
        log.info("Inpainting request received, imageSize: {} chars, maskSize: {} chars",
            request.getImageData() != null ? request.getImageData().length() : 0,
            request.getMaskData() != null ? request.getMaskData().length() : 0);

        validateAndDecodeImage(request.getImageData());
        validateAndDecodeImage(request.getMaskData());

        byte[] imageBytes = extractAndDecodeBase64(request.getImageData());
        byte[] maskBytes = extractAndDecodeBase64(request.getMaskData());
        byte[] result = aiImageService.inpainting(imageBytes, maskBytes);

        return buildSuccessResponse(result, null, null);
    }

    /**
     * Image super resolution - enhance image quality/resolution
     * Input: image data and scale factor
     * Output: enhanced image (base64)
     */
    @PostMapping("/super-resolution")
    public ApiResponse<AiImageResponse> superResolution(@RequestBody SuperResolutionRequest request) {
        log.info("Super Resolution request received, scale: {}, dataSize: {} chars",
            request.getScale(), request.getImageData() != null ? request.getImageData().length() : 0);

        validateAndDecodeImage(request.getImageData());

        int scale = validateScale(request.getScale());

        byte[] imageBytes = extractAndDecodeBase64(request.getImageData());
        byte[] result = aiImageService.superResolution(imageBytes, scale);

        return buildSuccessResponse(result, null, null);
    }

    /**
     * Validate image data is present and within size limit
     */
    private void validateAndDecodeImage(String imageData) {
        if (imageData == null || imageData.isEmpty()) {
            throw new IllegalArgumentException("imageData is required");
        }
        if (imageData.length() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Image data too large (max 10MB)");
        }
    }

    /**
     * Extract base64 data from data:image prefix if present, then decode
     */
    private byte[] extractAndDecodeBase64(String imageData) {
        String base64Data = imageData;
        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }
        return Base64.getDecoder().decode(base64Data);
    }

    /**
     * Validate scale parameter
     */
    private int validateScale(Integer scale) {
        if (scale == null) return 2;
        if (scale != 2 && scale != 4) {
            log.warn("Invalid scale value {}, using default 2", scale);
            return 2;
        }
        return scale;
    }

    /**
     * Build success response with base64 result
     */
    private ApiResponse<AiImageResponse> buildSuccessResponse(byte[] result, Integer width, Integer height) {
        String base64Result = Base64.getEncoder().encodeToString(result);
        AiImageResponse response = new AiImageResponse();
        response.setImageData("data:image/png;base64," + base64Result);
        response.setWidth(width);
        response.setHeight(height);
        log.info("AI operation completed successfully, resultSize: {} bytes", result.length);
        return ApiResponse.ok(response);
    }
}