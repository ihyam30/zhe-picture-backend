package com.sdfkl.zhepicturebackend.worker;

import com.sdfkl.zhepicturebackend.model.entity.AiTask;
import com.sdfkl.zhepicturebackend.model.enums.AiTaskStatusEnum;
import com.sdfkl.zhepicturebackend.service.AiTaskService;
import com.sdfkl.zhepicturebackend.service.AiUsageRecordService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;
import java.util.Date;
import java.util.List;

/**
 * 将进程异常中断留下的 CREATING 任务转为可审计的 UNKNOWN 状态。
 */
@Slf4j
@Component
public class AiTaskRecoveryWorker {

    @Resource
    private AiTaskService aiTaskService;

    @Resource
    private AiUsageRecordService aiUsageRecordService;

    @Value("${ai-task.recovery.creating-timeout-ms:900000}")
    private long creatingTimeoutMs;

    @Scheduled(fixedDelayString = "${ai-task.recovery.fixed-delay-ms:60000}")
    public void recoverStaleCreatingTasks() {
        try {
            long timeout = Math.max(1L, creatingTimeoutMs);
            Date cutoff = new Date(System.currentTimeMillis() - timeout);
            List<AiTask> tasks = aiTaskService.lambdaQuery()
                    .eq(AiTask::getStatus, AiTaskStatusEnum.CREATING.name())
                    .and(wrapper -> wrapper.isNull(AiTask::getProviderTaskId)
                            .or()
                            .eq(AiTask::getProviderTaskId, ""))
                    .lt(AiTask::getCreateTime, cutoff)
                    .list();
            for (AiTask task : tasks) {
                boolean updated = aiTaskService.markUnknownIfCreating(task.getId(),
                        "AI 任务提交状态超时，请管理员核对第三方任务");
                if (updated) {
                    aiUsageRecordService.markFailed(task.getId(), "UNKNOWN",
                            "AI 任务提交状态超时，请管理员核对第三方任务");
                    log.warn("AI 任务已转为 UNKNOWN，taskId={}", task.getId());
                }
            }
        } catch (Exception e) {
            // 单次扫描失败不能阻止后续定时扫描。
            log.error("扫描异常 AI 任务失败", e);
        }
    }
}
