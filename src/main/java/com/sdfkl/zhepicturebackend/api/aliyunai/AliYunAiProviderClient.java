package com.sdfkl.zhepicturebackend.api.aliyunai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.GetOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.model.entity.User;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;

/**
 * 阿里云 AI 供应商适配器。
 */
@Component
public class AliYunAiProviderClient implements AiProviderClient {

    @Resource
    private AliYunAIApi aliYunAIApi;

    @Override
    public CreateOutPaintingTaskResponse createOutPaintingTask(
            CreateOutPaintingTaskRequest request, User loginUser) throws JsonProcessingException {
        return aliYunAIApi.createOutPaintingTask(request, loginUser);
    }

    @Override
    public GetOutPaintingTaskResponse getOutPaintingTask(String providerTaskId) {
        return aliYunAIApi.getOutPaintingTask(providerTaskId);
    }
}
