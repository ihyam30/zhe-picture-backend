package com.sdfkl.zhepicturebackend.api.aliyunai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.GetOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.model.entity.User;

/**
 * AI 供应商适配器。
 */
public interface AiProviderClient {

    CreateOutPaintingTaskResponse createOutPaintingTask(
            CreateOutPaintingTaskRequest request, User loginUser) throws JsonProcessingException;

    GetOutPaintingTaskResponse getOutPaintingTask(String providerTaskId);
}
