package com.project.exe.common.exception;

import lombok.Getter;

@Getter
public class ForbiddenException extends RuntimeException {

    private final String errorCode;

    public ForbiddenException(String message) {
        super(message);
        this.errorCode = "FORBIDDEN";
    }

    public ForbiddenException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode != null ? errorCode : "FORBIDDEN";
    }
}
