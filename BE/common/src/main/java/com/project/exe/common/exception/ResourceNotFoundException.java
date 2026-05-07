package com.project.exe.common.exception;

import lombok.Getter;

@Getter
public class ResourceNotFoundException extends RuntimeException {

    private final String errorCode;
    private final String resource;
    private final Object identifier;

    public ResourceNotFoundException(String resource, Object identifier) {
        super(String.format("%s not found: %s", resource, identifier));
        this.errorCode = "NOT_FOUND";
        this.resource = resource;
        this.identifier = identifier;
    }

    public ResourceNotFoundException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode != null ? errorCode : "NOT_FOUND";
        this.resource = null;
        this.identifier = null;
    }
}
