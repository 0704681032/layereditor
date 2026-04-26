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
        log.info("Matting request received, type: {}", request.getType());

        // Extract base64 data from request
        String imageData = request.getImageData();
        if (imageData == null || imageData.isEmpty()) {
            throw new IllegalArgumentException("imageData is required");
        }

        // Remove data:image prefix if present
        String base64Data = imageData;
        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        byte[] imageBytes = Base64.getDecoder().decode(base64Data);
        byte[] result = aiImageService.matting(imageBytes);

        String base64Result = Base64.getEncoder().encodeToString(result);
        AiImageResponse response = new AiImageResponse();
        response.setImageData("data:image/png;base64," + base64Result);
        response.setWidth(request.getWidth());
        response.setHeight(request.getHeight());

        log.info("Matting completed successfully");
        return ApiResponse.ok(response);
    }

    /**
     * Image outpainting (expand image boundaries)
     * Input: image data, direction, and pixels to expand
     * Output: expanded image (base64)
     */
    @PostMapping("/outpainting")
    public ApiResponse<AiImageResponse> outpainting(@RequestBody OutpaintingRequest request) {
        log.info("Outpainting request received, direction: {}, pixels: {}", request.getDirection(), request.getPixels());

        String imageData = request.getImageData();
        if (imageData == null || imageData.isEmpty()) {
            throw new IllegalArgumentException("imageData is required");
        }

        // Remove data:image prefix if present
        String base64Data = imageData;
        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        byte[] imageBytes = Base64.getDecoder().decode(base64Data);
        byte[] result = aiImageService.outpainting(imageBytes, request.getDirection(), request.getPixels());

        String base64Result = Base64.getEncoder().encodeToString(result);
        AiImageResponse response = new AiImageResponse();
        response.setImageData("data:image/png;base64," + base64Result);

        log.info("Outpainting completed successfully");
        return ApiResponse.ok(response);
    }

    /**
     * Image inpainting (remove objects/fill areas)
     * Input: image data and mask data (white areas to remove)
     * Output: inpainted image (base64)
     */
    @PostMapping("/inpainting")
    public ApiResponse<AiImageResponse> inpainting(@RequestBody InpaintingRequest request) {
        log.info("Inpainting request received");

        String imageData = request.getImageData();
        String maskData = request.getMaskData();
        if (imageData == null || imageData.isEmpty()) {
            throw new IllegalArgumentException("imageData is required");
        }
        if (maskData == null || maskData.isEmpty()) {
            throw new IllegalArgumentException("maskData is required");
        }

        // Remove data:image prefix if present
        String base64Image = imageData;
        if (base64Image.contains(",")) {
            base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
        }
        String base64Mask = maskData;
        if (base64Mask.contains(",")) {
            base64Mask = base64Mask.substring(base64Mask.indexOf(",") + 1);
        }

        byte[] imageBytes = Base64.getDecoder().decode(base64Image);
        byte[] maskBytes = Base64.getDecoder().decode(base64Mask);
        byte[] result = aiImageService.inpainting(imageBytes, maskBytes);

        String base64Result = Base64.getEncoder().encodeToString(result);
        AiImageResponse response = new AiImageResponse();
        response.setImageData("data:image/png;base64," + base64Result);

        log.info("Inpainting completed successfully");
        return ApiResponse.ok(response);
    }

    /**
     * Image super resolution - enhance image quality/resolution
     * Input: image data and scale factor
     * Output: enhanced image (base64)
     */
    @PostMapping("/super-resolution")
    public ApiResponse<AiImageResponse> superResolution(@RequestBody SuperResolutionRequest request) {
        log.info("Super Resolution request received, scale: {}", request.getScale());

        String imageData = request.getImageData();
        if (imageData == null || imageData.isEmpty()) {
            throw new IllegalArgumentException("imageData is required");
        }

        // Remove data:image prefix if present
        String base64Image = imageData;
        if (base64Image.contains(",")) {
            base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
        }

        int scale = request.getScale() != null ? request.getScale() : 2;
        if (scale != 2 && scale != 4) {
            scale = 2; // Default to 2x if invalid scale
        }

        byte[] imageBytes = Base64.getDecoder().decode(base64Image);
        byte[] result = aiImageService.superResolution(imageBytes, scale);

        String base64Result = Base64.getEncoder().encodeToString(result);
        AiImageResponse response = new AiImageResponse();
        response.setImageData("data:image/png;base64," + base64Result);

        log.info("Super Resolution completed successfully");
        return ApiResponse.ok(response);
    }
}