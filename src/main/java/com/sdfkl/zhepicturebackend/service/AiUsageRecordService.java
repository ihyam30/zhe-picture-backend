package com.sdfkl.zhepicturebackend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sdfkl.zhepicturebackend.model.entity.AiUsageRecord;

/**
 * AI 调用流水服务。
 */
public interface AiUsageRecordService extends IService<AiUsageRecord> {

    AiUsageRecord getByTaskId(Long taskId);

    void saveReservation(AiUsageRecord record);

    void markSucceeded(Long taskId, String providerTaskId);

    void markFailed(Long taskId, String status, String errorMessage);
}
