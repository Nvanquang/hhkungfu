package com.hhkungfu.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;

    public BusinessException(String message, String errorCode, String errorCode2) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.errorCode = errorCode2;
    }
}
