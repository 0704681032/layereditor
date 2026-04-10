package com.example.editor.common.exception;

public class NotFoundException extends BusinessException {
    public NotFoundException(String message) {
        super(40400, message);
    }
}
