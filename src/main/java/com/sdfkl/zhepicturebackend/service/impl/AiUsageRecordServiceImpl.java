package com.sdfkl.zhepicturebackend.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sdfkl.zhepicturebackend.mapper.AiUsageRecordMapper;
import com.sdfkl.zhepicturebackend.model.entity.AiUsageRecord;
import com.sdfkl.zhepicturebackend.model.enums.AiUsageStatusEnum;
import com.sdfkl.zhepicturebackend.service.AiUsageRecordService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

/**
 * AI 调用流水服务实现。
 */
@Service
public class AiUsageRecordServiceImpl extends ServiceImpl<AiUsageRecordMapper, AiUsageRecord>
        implements AiUsageRecordService {

    @Override
    public AiUsageRecord getByTaskId(Long taskId) {
        return lambdaQuery().eq(AiUsageRecord::getTaskId, taskId).one();
    }

    @Override
    public void saveReservation(AiUsageRecord record) {
        if (record == null || record.getTaskId() == null) {
            return;
        }
        AiUsageRecord existing = getByTaskId(record.getTaskId());
        if (existing == null) {
            record.setStatus(AiUsageStatusEnum.RESERVED.name());
            try {
                if (!save(record)) {
                    throw new IllegalStateException("保存 AI 费用流水失败");
                }
            } catch (DuplicateKeyException e) {
                // 并发轮询或重复提交可能同时观察到空记录，唯一键冲突时改为幂等更新。
                updateReservation(record);
            }
            return;
        }
        updateReservation(record);
    }

    private void updateReservation(AiUsageRecord record) {
        lambdaUpdate()
                .eq(AiUsageRecord::getTaskId, record.getTaskId())
                .set(AiUsageRecord::getProviderTaskId, record.getProviderTaskId())
                .set(AiUsageRecord::getStatus, AiUsageStatusEnum.RESERVED.name())
                .set(AiUsageRecord::getCostAmount, record.getCostAmount())
                .set(AiUsageRecord::getCurrency, record.getCurrency())
                .set(AiUsageRecord::getErrorMessage, null)
                .update();
    }

    @Override
    public void markSucceeded(Long taskId, String providerTaskId) {
        lambdaUpdate()
                .eq(AiUsageRecord::getTaskId, taskId)
                .set(AiUsageRecord::getProviderTaskId, providerTaskId)
                .set(AiUsageRecord::getStatus, AiUsageStatusEnum.SUCCEEDED.name())
                .set(AiUsageRecord::getErrorMessage, null)
                .update();
    }

    @Override
    public void markFailed(Long taskId, String status, String errorMessage) {
        String normalizedStatus = StrUtil.isBlank(status)
                ? AiUsageStatusEnum.FAILED.name() : status;
        String normalizedError = StrUtil.isBlank(errorMessage)
                ? null : (errorMessage.length() > 512 ? errorMessage.substring(0, 512) : errorMessage);
        lambdaUpdate()
                .eq(AiUsageRecord::getTaskId, taskId)
                .set(AiUsageRecord::getStatus, normalizedStatus)
                .set(AiUsageRecord::getErrorMessage, normalizedError)
                .update();
    }
}
