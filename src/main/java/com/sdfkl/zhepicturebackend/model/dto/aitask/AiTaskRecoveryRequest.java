package com.sdfkl.zhepicturebackend.model.dto.aitask;

import lombok.Data;

/**
 * AI 任务人工恢复请求。
 */
@Data
public class AiTaskRecoveryRequest {

    private Long taskId;

    private String providerTaskId;

    private String requestId;

    private String reason;
}
