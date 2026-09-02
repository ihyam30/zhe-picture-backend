package com.sdfkl.zhepicturebackend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sdfkl.zhepicturebackend.model.entity.AiTask;

import java.util.Date;
import java.util.List;

public interface AiTaskService extends IService<AiTask> {

    AiTask getByUserAndIdempotencyKey(Long userId, String idempotencyKey);

    AiTask getByProviderTaskId(String providerTaskId);

    AiTask getByProviderTaskIdAndUser(String providerTaskId, Long userId);

    /**
     * 将异常中断且没有第三方任务 ID 的任务置为 UNKNOWN。
     */
    boolean markUnknownIfCreating(Long taskId, String errorMessage);

    /**
     * 管理员确认第三方未创建任务后，允许使用原幂等号重试。
     */
    void markRetryable(Long taskId, String reason);

    /**
     * 原子认领一条可重试任务，防止并发请求重复调用第三方。
     */
    boolean claimRetryableTask(Long taskId, Long userId, String idempotencyKey);

    /**
     * 将第三方任务 ID 绑定到本地任务，供 taskId 丢失时人工恢复。
     */
    void bindProviderTask(Long taskId, String providerTaskId, String requestId);

    Page<AiTask> pageUnresolved(long current, long pageSize);

    /**
     * 查询待轮询任务。具体处理前仍需通过 claimPollTask 原子认领。
     */
    List<AiTask> listPollable(Date now, int limit);

    /**
     * 使用数据库条件更新给当前实例的轮询租约。
     */
    boolean claimPollTask(Long taskId, Date now, Date leaseUntil);
}
