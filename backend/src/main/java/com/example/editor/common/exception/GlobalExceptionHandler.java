package com.example.editor.common.exception;

import com.example.editor.asset.exception.FileValidationException;
import com.example.editor.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.function.BiFunction;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private <T> ResponseEntity<ApiResponse<T>> errorResponse(HttpStatus status, int code, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(code, message));
    }

    private <T> ResponseEntity<ApiResponse<T>> errorResponse(HttpStatus status, int code, String message, T data) {
        return ResponseEntity.status(status).body(ApiResponse.error(code, message, data));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NotFoundException e) {
        log.warn("Resource not found: {}", e.getMessage());
        return errorResponse(HttpStatus.NOT_FOUND, e.getCode(), e.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException e) {
        log.warn("Conflict: {}", e.getMessage());
        return errorResponse(HttpStatus.CONFLICT, e.getCode(), e.getMessage());
    }

    @ExceptionHandler(FileValidationException.class)
    public ResponseEntity<ApiResponse<FileValidationDetail>> handleFileValidation(FileValidationException e) {
        log.warn("File validation failed: code={}, message={}, filename={}, detail={}",
                e.getCode(), e.getMessage(), e.getFilename(), e.getDetail());
        var detail = new FileValidationDetail(e.getCode(), e.getMessage(), e.getFilename(), e.getDetail());
        return errorResponse(HttpStatus.BAD_REQUEST, e.getCode(), e.getMessage(), detail);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e) {
        log.warn("Business error: {}", e.getMessage());
        return errorResponse(HttpStatus.BAD_REQUEST, e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed");
        log.warn("Validation error: {}", message);
        return errorResponse(HttpStatus.BAD_REQUEST, 40003, message);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("Invalid argument: {}", e.getMessage());
        return errorResponse(HttpStatus.BAD_REQUEST, 40001, e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException e) {
        log.warn("Invalid state: {}", e.getMessage());
        return errorResponse(HttpStatus.BAD_REQUEST, 40002, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception e) {
        log.error("Unhandled exception: {}", e.getMessage(), e);
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, 50000, "Internal server error");
    }

    public record FileValidationDetail(int code, String message, String filename, String detail) {}
}