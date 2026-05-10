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
import java.util.Set;

@RestController
@RequestMapping("/api/ai/image")
@RequiredArgsConstructor
@Slf4j
public class AiImageController {

    private final AiImageService aiImageService;

    private static final int MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    private static final Set<String> VALID_DIRECTIONS = Set.of("top", "bottom", "left", "right", "all");
    private static final int MAX_PIXELS = 1024;

    @GetMapping("/status")
    public ApiResponse<AiStatusResponse> status() {
        AiStatusResponse response = aiImageService.getStatus();
        return ApiResponse.ok(response);
    }

    @PostMapping("/matting")
    public ApiResponse<AiImageResponse> matting(@RequestBody MattingRequest request) {
        log.info("Matting request received, type: {}, dataSize: {} chars",
            request.getType(), request.getImageData() != null ? request.getImageData().length() : 0);

        byte[] imageBytes = validateAndDecodeImage(request.getImageData());
        byte[] result = aiImageService.matting(imageBytes, request.getType());

        return buildSuccessResponse(result, request.getWidth(), request.getHeight());
    }

    @PostMapping("/outpainting")
    public ApiResponse<AiImageResponse> outpainting(@RequestBody OutpaintingRequest request) {
        log.info("Outpainting request received, direction: {}, pixels: {}, dataSize: {} chars",
            request.getDirection(), request.getPixels(),
            request.getImageData() != null ? request.getImageData().length() : 0);

        byte[] imageBytes = validateAndDecodeImage(request.getImageData());
        String direction = request.getDirection() != null ? request.getDirection() : "all";
        int pixels = request.getPixels() != null ? request.getPixels() : 100;

        if (!VALID_DIRECTIONS.contains(direction)) {
            throw new IllegalArgumentException("Invalid direction: must be one of " + VALID_DIRECTIONS);
        }
        if (pixels <= 0 || pixels > MAX_PIXELS) {
            throw new IllegalArgumentException("Pixels must be between 1 and " + MAX_PIXELS);
        }

        byte[] result = aiImageService.outpainting(imageBytes, direction, pixels);
        return buildSuccessResponse(result, null, null);
    }

    @PostMapping("/inpainting")
    public ApiResponse<AiImageResponse> inpainting(@RequestBody InpaintingRequest request) {
        log.info("Inpainting request received, imageSize: {} chars, maskSize: {} chars",
            request.getImageData() != null ? request.getImageData().length() : 0,
            request.getMaskData() != null ? request.getMaskData().length() : 0);

        byte[] imageBytes = validateAndDecodeImage(request.getImageData());
        byte[] maskBytes = validateAndDecodeImage(request.getMaskData());
        byte[] result = aiImageService.inpainting(imageBytes, maskBytes);

        return buildSuccessResponse(result, null, null);
    }

    @PostMapping("/super-resolution")
    public ApiResponse<AiImageResponse> superResolution(@RequestBody SuperResolutionRequest request) {
        log.info("Super Resolution request received, scale: {}, dataSize: {} chars",
            request.getScale(), request.getImageData() != null ? request.getImageData().length() : 0);

        byte[] imageBytes = validateAndDecodeImage(request.getImageData());
        int scale = validateScale(request.getScale());
        byte[] result = aiImageService.superResolution(imageBytes, scale);

        return buildSuccessResponse(result, null, null);
    }

    private byte[] validateAndDecodeImage(String imageData) {
        if (imageData == null || imageData.isEmpty()) {
            throw new IllegalArgumentException("imageData is required");
        }
        if (imageData.length() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Image data too large (max 10MB)");
        }
        String base64Data = imageData;
        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }
        try {
            return Base64.getDecoder().decode(base64Data);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid base64 image data");
        }
    }

    private int validateScale(Integer scale) {
        if (scale == null) return 2;
        if (scale != 2 && scale != 4) {
            log.warn("Invalid scale value {}, using default 2", scale);
            return 2;
        }
        return scale;
    }

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
