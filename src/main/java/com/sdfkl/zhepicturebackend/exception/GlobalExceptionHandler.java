package com.sdfkl.zhepicturebackend.exception;

import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotPermissionException;
import com.sdfkl.zhepicturebackend.common.BaseResponse;
import com.sdfkl.zhepicturebackend.common.ResultUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NotLoginException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public BaseResponse<?> notLoginException(NotLoginException e) {
        log.warn("Authentication failed: {}", e.getMessage());
        return ResultUtils.error(ErrorCode.NOT_LOGIN_ERROR);
    }

    @ExceptionHandler(NotPermissionException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public BaseResponse<?> notPermissionExceptionHandler(NotPermissionException e) {
        log.warn("Authorization failed: {}", e.getMessage());
        return ResultUtils.error(ErrorCode.FORBIDDEN_ERROR);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<BaseResponse<?>> businessExceptionHandler(BusinessException e) {
        log.error("BusinessException: ", e);
        HttpStatus status = HttpStatus.OK;
        if (e.getCode() == ErrorCode.NOT_LOGIN_ERROR.getCode()) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (e.getCode() == ErrorCode.NO_AUTH_ERROR.getCode()
                || e.getCode() == ErrorCode.FORBIDDEN_ERROR.getCode()) {
            status = HttpStatus.FORBIDDEN;
        }
        return ResponseEntity.status(status).body(ResultUtils.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public BaseResponse<?> runtimeExceptionHandler(RuntimeException e) {
        log.error("RuntimeException: ", e);
        return ResultUtils.error(ErrorCode.SYSTEM_ERROR, "系统错误");
    }
}
