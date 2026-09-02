package com.sdfkl.zhepicturebackend.model.enums;

/**
 * AI 任务本地状态。
 */
public enum AiTaskStatusEnum {
    CREATING,
    PENDING,
    RUNNING,
    RETRY_WAIT,
    SUCCEEDED,
    FAILED,
    TIMED_OUT,
    UNKNOWN,
    /**
     * 管理员确认第三方未创建任务后，允许客户端使用原幂等号重新提交。
     */
    RETRYABLE
}
