package com.sdfkl.zhepicturebackend.exception;

import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotPermissionException;
import com.sdfkl.zhepicturebackend.common.BaseResponse;
import com.sdfkl.zhepicturebackend.common.ResultUtils;
import com.sdfkl.zhepicturebackend.config.RequestTraceFilter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.slf4j.MDC;

/**
 * 全局异常处理器
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NotLoginException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public BaseResponse<?> notLoginException(NotLoginException e) {
        log.warn("authentication_failed code={} requestId={}", ErrorCode.NOT_LOGIN_ERROR.getCode(), requestId());
        return ResultUtils.error(ErrorCode.NOT_LOGIN_ERROR);
    }

    @ExceptionHandler(NotPermissionException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public BaseResponse<?> notPermissionExceptionHandler(NotPermissionException e) {
        log.warn("authorization_failed code={} requestId={}", ErrorCode.FORBIDDEN_ERROR.getCode(), requestId());
        return ResultUtils.error(ErrorCode.FORBIDDEN_ERROR);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<BaseResponse<?>> businessExceptionHandler(BusinessException e) {
        log.warn("business_exception code={} requestId={}", e.getCode(), requestId());
        HttpStatus status = HttpStatus.OK;
        if (e.getCode() == ErrorCode.NOT_LOGIN_ERROR.getCode()) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (e.getCode() == ErrorCode.NO_AUTH_ERROR.getCode()
                || e.getCode() == ErrorCode.FORBIDDEN_ERROR.getCode()) {
            status = HttpStatus.FORBIDDEN;
        }
        return ResponseEntity.status(status).body(ResultUtils.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<BaseResponse<?>> exceptionHandler(Exception e) {
        // 不把异常 message、请求参数或堆栈直接写入日志/响应，避免第三方错误内容和敏感信息泄露。
        log.error("unhandled_exception type={} requestId={}", e.getClass().getName(), requestId());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResultUtils.error(ErrorCode.SYSTEM_ERROR, "系统错误"));
    }

    private String requestId() {
        String requestId = MDC.get(RequestTraceFilter.REQUEST_ID_MDC_KEY);
        return requestId == null ? "-" : requestId;
    }
}
