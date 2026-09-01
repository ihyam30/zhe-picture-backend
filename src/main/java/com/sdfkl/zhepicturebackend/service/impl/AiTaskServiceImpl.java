package com.sdfkl.zhepicturebackend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sdfkl.zhepicturebackend.mapper.AiTaskMapper;
import com.sdfkl.zhepicturebackend.model.entity.AiTask;
import com.sdfkl.zhepicturebackend.model.enums.AiTaskStatusEnum;
import com.sdfkl.zhepicturebackend.service.AiTaskService;
import cn.hutool.core.util.StrUtil;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import org.springframework.stereotype.Service;

@Service
public class AiTaskServiceImpl extends ServiceImpl<AiTaskMapper, AiTask>
        implements AiTaskService {

    @Override
    public AiTask getByUserAndIdempotencyKey(Long userId, String idempotencyKey) {
        return lambdaQuery()
                .eq(AiTask::getUserId, userId)
                .eq(AiTask::getIdempotencyKey, idempotencyKey)
                .one();
    }

    @Override
    public AiTask getByProviderTaskId(String providerTaskId) {
        return lambdaQuery()
                .eq(AiTask::getProviderTaskId, providerTaskId)
                .one();
    }

    @Override
    public AiTask getByProviderTaskIdAndUser(String providerTaskId, Long userId) {
        return lambdaQuery()
                .eq(AiTask::getProviderTaskId, providerTaskId)
                .eq(AiTask::getUserId, userId)
                .one();
    }

    @Override
    public boolean markUnknownIfCreating(Long taskId, String errorMessage) {
        return lambdaUpdate()
                .eq(AiTask::getId, taskId)
                .eq(AiTask::getStatus, AiTaskStatusEnum.CREATING.name())
                .and(wrapper -> wrapper.isNull(AiTask::getProviderTaskId)
                        .or()
                        .eq(AiTask::getProviderTaskId, ""))
                .set(AiTask::getStatus, AiTaskStatusEnum.UNKNOWN.name())
                .set(AiTask::getErrorMessage, normalizeError(errorMessage,
                        "AI 任务提交状态超时，请管理员核对第三方任务"))
                .update();
    }

    @Override
    public void markRetryable(Long taskId, String reason) {
        AiTask task = getById(taskId);
        if (task == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "AI 任务不存在");
        }
        if (StrUtil.isNotBlank(task.getProviderTaskId())) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR,
                    "AI 任务已有第三方任务 ID，不能标记为可重试");
        }
        if (!AiTaskStatusEnum.UNKNOWN.name().equals(task.getStatus())) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR,
                    "只有 UNKNOWN 状态的 AI 任务可以标记为可重试");
        }
        boolean updated = lambdaUpdate()
                .eq(AiTask::getId, taskId)
                .eq(AiTask::getStatus, AiTaskStatusEnum.UNKNOWN.name())
                .and(wrapper -> wrapper.isNull(AiTask::getProviderTaskId)
                        .or()
                        .eq(AiTask::getProviderTaskId, ""))
                .set(AiTask::getStatus, AiTaskStatusEnum.RETRYABLE.name())
                .set(AiTask::getErrorMessage, normalizeError(reason,
                        "管理员确认第三方未创建任务，可使用原幂等号重试"))
                .update();
        if (!updated) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR,
                    "AI 任务状态已变化，请刷新后重试");
        }
    }

    @Override
    public boolean claimRetryableTask(Long taskId, Long userId, String idempotencyKey) {
        return lambdaUpdate()
                .eq(AiTask::getId, taskId)
                .eq(AiTask::getUserId, userId)
                .eq(AiTask::getIdempotencyKey, idempotencyKey)
                .eq(AiTask::getStatus, AiTaskStatusEnum.RETRYABLE.name())
                .and(wrapper -> wrapper.isNull(AiTask::getProviderTaskId)
                        .or()
                        .eq(AiTask::getProviderTaskId, ""))
                .set(AiTask::getStatus, AiTaskStatusEnum.CREATING.name())
                .set(AiTask::getErrorMessage, null)
                .update();
    }

    @Override
    public void bindProviderTask(Long taskId, String providerTaskId, String requestId) {
        if (StrUtil.isBlank(providerTaskId) || providerTaskId.trim().length() > 128) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "第三方任务 ID 不合法");
        }
        AiTask task = getById(taskId);
        if (task == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "AI 任务不存在");
        }
        if (StrUtil.isNotBlank(task.getProviderTaskId())) {
            if (StrUtil.equals(task.getProviderTaskId(), providerTaskId.trim())) {
                return;
            }
            throw new BusinessException(ErrorCode.OPERATION_ERROR,
                    "AI 任务已经绑定其他第三方任务 ID");
        }
        if (!AiTaskStatusEnum.UNKNOWN.name().equals(task.getStatus())
                && !AiTaskStatusEnum.CREATING.name().equals(task.getStatus())) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR,
                    "当前 AI 任务状态不允许绑定第三方任务 ID");
        }
        boolean updated = lambdaUpdate()
                .eq(AiTask::getId, taskId)
                .and(wrapper -> wrapper.isNull(AiTask::getProviderTaskId)
                        .or()
                        .eq(AiTask::getProviderTaskId, ""))
                .in(AiTask::getStatus, AiTaskStatusEnum.UNKNOWN.name(), AiTaskStatusEnum.CREATING.name())
                .set(AiTask::getProviderTaskId, providerTaskId.trim())
                .set(AiTask::getStatus, AiTaskStatusEnum.PENDING.name())
                .set(AiTask::getRequestId, StrUtil.blankToDefault(requestId, task.getRequestId()))
                .set(AiTask::getErrorMessage, null)
                .update();
        if (!updated) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR,
                    "AI 任务状态已变化，请刷新后重试");
        }
    }

    @Override
    public Page<AiTask> pageUnresolved(long current, long pageSize) {
        return page(new Page<>(current, pageSize), lambdaQuery()
                .in(AiTask::getStatus, AiTaskStatusEnum.CREATING.name(), AiTaskStatusEnum.UNKNOWN.name())
                .and(wrapper -> wrapper.isNull(AiTask::getProviderTaskId)
                        .or()
                        .eq(AiTask::getProviderTaskId, ""))
                .orderByAsc(AiTask::getCreateTime)
                .getWrapper());
    }

    private String normalizeError(String errorMessage, String defaultMessage) {
        if (StrUtil.isBlank(errorMessage)) {
            return defaultMessage;
        }
        return errorMessage.length() > 512 ? errorMessage.substring(0, 512) : errorMessage;
    }
}
