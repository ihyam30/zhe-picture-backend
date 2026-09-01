package com.sdfkl.zhepicturebackend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sdfkl.zhepicturebackend.model.entity.OutboxEvent;

public interface OutboxEventService extends IService<OutboxEvent> {
    void publish(String eventType, Long aggregateId, String dedupeKey, String payload);

    void markSucceeded(String dedupeKey);
}
