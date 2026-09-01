package com.sdfkl.zhepicturebackend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sdfkl.zhepicturebackend.mapper.OutboxEventMapper;
import com.sdfkl.zhepicturebackend.model.entity.OutboxEvent;
import com.sdfkl.zhepicturebackend.model.enums.OutboxEventStatusEnum;
import com.sdfkl.zhepicturebackend.service.OutboxEventService;
import org.springframework.stereotype.Service;
import org.springframework.dao.DuplicateKeyException;

import java.util.Date;

@Service
public class OutboxEventServiceImpl extends ServiceImpl<OutboxEventMapper, OutboxEvent>
        implements OutboxEventService {

    @Override
    public void publish(String eventType, Long aggregateId, String dedupeKey, String payload) {
        if (lambdaQuery().eq(OutboxEvent::getDedupeKey, dedupeKey).exists()) {
            return;
        }
        OutboxEvent event = new OutboxEvent();
        event.setEventType(eventType);
        event.setAggregateId(aggregateId);
        event.setDedupeKey(dedupeKey);
        event.setPayload(payload);
        event.setStatus(OutboxEventStatusEnum.PENDING.name());
        event.setRetryCount(0);
        event.setNextRetryTime(new Date());
        try {
            save(event);
        } catch (DuplicateKeyException ignored) {
            // 多实例同时发布同一事件时由唯一索引收敛，调用方无需重复处理。
        }
    }

    @Override
    public void markSucceeded(String dedupeKey) {
        lambdaUpdate()
                .eq(OutboxEvent::getDedupeKey, dedupeKey)
                .set(OutboxEvent::getStatus, OutboxEventStatusEnum.SUCCEEDED.name())
                .set(OutboxEvent::getLockedUntil, null)
                .update();
    }
}
