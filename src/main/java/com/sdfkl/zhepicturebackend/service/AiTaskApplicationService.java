package com.sdfkl.zhepicturebackend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.GetOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.model.dto.picture.CreatePictureOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.model.entity.User;

/**
 * AI 任务应用服务。Controller 只负责鉴权、参数接收和响应转换。
 */
public interface AiTaskApplicationService {

    CreateOutPaintingTaskResponse createOutPaintingTask(
            CreatePictureOutPaintingTaskRequest request, User loginUser, String idempotencyKey)
            throws JsonProcessingException;

    GetOutPaintingTaskResponse getOutPaintingTask(Long taskId, User loginUser);

    /**
     * 兼容旧客户端按供应商任务 ID 查询，但实际只读本地任务状态。
     */
    GetOutPaintingTaskResponse getOutPaintingTaskByProviderTaskId(String providerTaskId, User loginUser);

    void pollDueTasks();
}
