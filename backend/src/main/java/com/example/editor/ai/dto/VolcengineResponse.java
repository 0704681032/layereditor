package com.example.editor.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Base response from Volcengine API
 */
@Data
public class VolcengineResponse {
    /**
     * Response metadata (contains requestId, error info etc.)
     */
    private ResponseMetadata ResponseMetadata;

    /**
     * Result data
     */
    private ResultData Result;

    @Data
    public static class ResponseMetadata {
        private String RequestId;
        private ErrorInfo Error;
    }

    @Data
    public static class ErrorInfo {
        private String Code;
        private String Message;
    }

    @Data
    public static class ResultData {
        @JsonProperty("image_base64")
        private String imageBase64;

        @JsonProperty("result_image")
        private String resultImage;

        private Integer width;
        private Integer height;
    }

    /**
     * Check if response has error
     */
    public boolean hasError() {
        return ResponseMetadata != null && ResponseMetadata.Error != null;
    }

    /**
     * Get error message
     */
    public String getErrorMessage() {
        if (hasError()) {
            return ResponseMetadata.Error.Code + ": " + ResponseMetadata.Error.Message;
        }
        return null;
    }

    /**
     * Get result image base64
     */
    public String getResultImageBase64() {
        if (Result == null) {
            return null;
        }
        return Result.imageBase64 != null ? Result.imageBase64 : Result.resultImage;
    }
}