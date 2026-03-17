package com.hhkungfu.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ResourceNotFoundException extends RuntimeException {
    private final HttpStatus status;
    private final String resource;
    private final String errorCode;

    public ResourceNotFoundException(String message, String resource, String errorCode) {
        super(message);
        this.status = HttpStatus.NOT_FOUND;
        this.resource = resource;
        this.errorCode = errorCode;
    }
}
