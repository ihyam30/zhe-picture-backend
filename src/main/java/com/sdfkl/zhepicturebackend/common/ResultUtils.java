package com.sdfkl.zhepicturebackend.common;

import com.sdfkl.zhepicturebackend.exception.ErrorCode;

/**
 * 响应工具类
 */
public class ResultUtils {
    /**
     * 成功
     *
     * @param data 数据
     * @param <T>  数据类型
     * @return BaseResponse 全局响应封装类
     */
    public static <T> BaseResponse<T> success(T data) {
        return new BaseResponse<>(0, "ok", data);
    }

    /**
     * 失败
     *
     * @param errorCode 错误码
     * @param <T>       数据类型
     * @return BaseResponse 全局响应封装类
     */
    public static <T> BaseResponse<T> error(ErrorCode errorCode) {
        return new BaseResponse<>(errorCode);
    }

    /**
     * 失败
     *
     * @param errorCode 错误码
     * @param message   错误信息
     * @param <T>       数据类型
     * @return BaseResponse 全局响应封装类
     */
    public static <T> BaseResponse<T> error(ErrorCode errorCode, String message) {
        return new BaseResponse<>(errorCode.getCode(), message, null);
    }

    /**
     * 错误
     *
     * @param code    错误码
     * @param message 错误信息
     * @param <T>     数据类型
     * @return BaseResponse 全局响应封装类
     */
    public static <T> BaseResponse<T> error(int code, String message) {
        return new BaseResponse<>(code, message, null);
    }
}
