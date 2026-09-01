package com.sdfkl.zhepicturebackend.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 事务 Outbox 事件。
 */
@Data
@TableName("outbox_event")
public class OutboxEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private String eventType;

    private Long aggregateId;

    private String dedupeKey;

    private String payload;

    private String status;

    private Integer retryCount;

    private Date nextRetryTime;

    private Date lockedUntil;

    private String lastError;

    private Date createTime;

    private Date updateTime;
}
