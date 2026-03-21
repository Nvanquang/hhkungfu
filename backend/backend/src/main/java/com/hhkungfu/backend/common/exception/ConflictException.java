package com.hhkungfu.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ConflictException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;

    public ConflictException(String message, String errorCode) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.errorCode = errorCode;
    }
}
