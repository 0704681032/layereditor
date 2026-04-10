package com.example.editor.common.exception;

public class ConflictException extends BusinessException {
    public ConflictException(String message) {
        super(40901, message);
    }
}
