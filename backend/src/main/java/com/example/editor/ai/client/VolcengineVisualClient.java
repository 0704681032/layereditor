package com.example.editor.ai.client;

import com.example.editor.ai.dto.VolcengineMattingRequest;
import com.example.editor.ai.dto.VolcengineOutpaintingRequest;
import com.example.editor.ai.dto.VolcengineInpaintingRequest;
import com.example.editor.ai.dto.VolcengineSuperResolutionRequest;
import com.example.editor.ai.dto.VolcengineResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Feign client for Volcengine Visual Intelligence API
 *
 * API Documentation: https://www.volcengine.com/docs/6791/1347773
 */
@FeignClient(
    name = "volcengine-visual",
    url = "${app.volcengine.endpoint:https://visual.volcengineapi.com}",
    configuration = VolcengineFeignConfig.class
)
public interface VolcengineVisualClient {

    /**
     * Image matting - remove background and extract subject
     * Action: SegmentImage
     */
    @PostMapping(value = "/", consumes = "application/json")
    VolcengineResponse matting(
        @RequestParam("Action") String action,
        @RequestParam("Version") String version,
        VolcengineMattingRequest request
    );

    /**
     * Image outpainting - expand image boundaries
     * Action: ImageOutpainting
     */
    @PostMapping(value = "/", consumes = "application/json")
    VolcengineResponse outpainting(
        @RequestParam("Action") String action,
        @RequestParam("Version") String version,
        VolcengineOutpaintingRequest request
    );

    /**
     * Image inpainting - remove objects and fill areas
     * Action: ImageInpainting
     */
    @PostMapping(value = "/", consumes = "application/json")
    VolcengineResponse inpainting(
        @RequestParam("Action") String action,
        @RequestParam("Version") String version,
        VolcengineInpaintingRequest request
    );

    /**
     * Image super resolution - enhance image quality
     * Action: ImageSuperResolution
     */
    @PostMapping(value = "/", consumes = "application/json")
    VolcengineResponse superResolution(
        @RequestParam("Action") String action,
        @RequestParam("Version") String version,
        VolcengineSuperResolutionRequest request
    );
}