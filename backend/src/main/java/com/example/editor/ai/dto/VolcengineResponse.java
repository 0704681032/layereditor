package com.example.editor.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class VolcengineResponse {

    private ResponseMetadata ResponseMetadata;
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

    public boolean hasError() {
        return ResponseMetadata != null && ResponseMetadata.Error != null;
    }

    public String getErrorMessage() {
        if (hasError()) {
            return String.valueOf(ResponseMetadata.Error.Code) + ": " +
                   String.valueOf(ResponseMetadata.Error.Message);
        }
        return null;
    }

    public String getResultImageBase64() {
        if (Result == null) {
            return null;
        }
        return Result.imageBase64 != null ? Result.imageBase64 : Result.resultImage;
    }
}
