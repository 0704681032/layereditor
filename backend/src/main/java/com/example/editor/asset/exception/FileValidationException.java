package com.example.editor.asset.exception;

import com.example.editor.common.exception.BusinessException;

/**
 * Exception thrown when file validation fails during upload.
 * Provides structured error information for client handling.
 */
public class FileValidationException extends BusinessException {

    public static final int FILE_EMPTY = 1001;
    public static final int FILENAME_EMPTY = 1002;
    public static final int FILENAME_INVALID = 1003;
    public static final int FILE_TOO_LARGE = 1004;
    public static final int EXTENSION_NOT_ALLOWED = 1005;
    public static final int EXTENSION_BLOCKED = 1006;
    public static final int CONTENT_TYPE_MISMATCH = 1007;
    public static final int MAGIC_NUMBER_MISMATCH = 1008;
    public static final int FILE_CORRUPTED = 1009;

    private final String filename;
    private final String detail;

    public FileValidationException(int code, String message, String filename, String detail) {
        super(code, message);
        this.filename = filename;
        this.detail = detail;
    }

    public FileValidationException(int code, String message) {
        this(code, message, null, null);
    }

    public String getFilename() {
        return filename;
    }

    public String getDetail() {
        return detail;
    }

    // Factory methods for common validation errors
    public static FileValidationException fileEmpty() {
        return new FileValidationException(FILE_EMPTY, "文件不能为空");
    }

    public static FileValidationException filenameEmpty() {
        return new FileValidationException(FILENAME_EMPTY, "文件名不能为空");
    }

    public static FileValidationException filenameInvalid(String filename) {
        return new FileValidationException(FILENAME_INVALID, "文件名包含非法字符", filename,
                "禁止使用路径分隔符或 '..' 序列");
    }

    public static FileValidationException fileTooLarge(String filename, long size, long maxSize) {
        return new FileValidationException(FILE_TOO_LARGE, "文件大小超出限制", filename,
                String.format("文件大小: %.2fMB, 最大允许: %.2fMB", size / 1024.0 / 1024.0, maxSize / 1024.0 / 1024.0));
    }

    public static FileValidationException extensionNotAllowed(String ext) {
        return new FileValidationException(EXTENSION_NOT_ALLOWED, "不允许的文件类型", ext,
                "允许的类型: png, jpg, jpeg, gif, webp, bmp, ico");
    }

    public static FileValidationException extensionBlocked(String ext) {
        return new FileValidationException(EXTENSION_BLOCKED, "禁止的文件类型", ext,
                "该文件类型可能存在安全风险");
    }

    public static FileValidationException contentTypeMismatch(String ext, String contentType) {
        return new FileValidationException(CONTENT_TYPE_MISMATCH, "Content-Type与文件扩展名不匹配", ext,
                String.format("扩展名: %s, Content-Type: %s", ext, contentType));
    }

    public static FileValidationException magicNumberMismatch(String filename, String ext) {
        return new FileValidationException(MAGIC_NUMBER_MISMATCH, "文件内容与声明类型不符，疑似伪装攻击", filename,
                String.format("声明类型: %s", ext));
    }

    public static FileValidationException fileCorrupted(String filename) {
        return new FileValidationException(FILE_CORRUPTED, "文件内容无效或已损坏", filename, null);
    }
}