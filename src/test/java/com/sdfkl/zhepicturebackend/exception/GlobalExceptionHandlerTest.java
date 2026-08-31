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
}
