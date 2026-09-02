package com.sdfkl.zhepicturebackend.exception;

import com.sdfkl.zhepicturebackend.common.BaseResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void shouldReturnUnauthorizedForNotLoginBusinessException() {
        ResponseEntity<BaseResponse<?>> response = handler.businessExceptionHandler(
                new BusinessException(ErrorCode.NOT_LOGIN_ERROR));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void shouldReturnForbiddenForAuthorizationBusinessException() {
        ResponseEntity<BaseResponse<?>> response = handler.businessExceptionHandler(
                new BusinessException(ErrorCode.FORBIDDEN_ERROR));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void shouldMaskUnexpectedExceptionAndReturnServerError() {
        ResponseEntity<BaseResponse<?>> response = handler.exceptionHandler(
                new IllegalStateException("database password must not be returned"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(ErrorCode.SYSTEM_ERROR.getCode(), response.getBody().getCode());
        assertEquals("系统错误", response.getBody().getMessage());
    }
}
