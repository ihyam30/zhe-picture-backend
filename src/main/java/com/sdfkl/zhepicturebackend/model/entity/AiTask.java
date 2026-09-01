package com.sdfkl.zhepicturebackend.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * AI 图片处理任务本地记录。
 *
 * <p>providerTaskId 只用于调用第三方接口，本地查询必须同时校验 userId。</p>
 */
@Data
@TableName("ai_task")
public class AiTask implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("provider")
    private String provider;

    @TableField("provider_task_id")
    private String providerTaskId;

    @TableField("user_id")
    private Long userId;

    @TableField("picture_id")
    private Long pictureId;

    @TableField("space_id")
    private Long spaceId;

    @TableField("status")
    private String status;

    @TableField("output_url")
    private String outputUrl;

    @TableField("idempotency_key")
    private String idempotencyKey;

    /**
     * 幂等请求指纹，用于防止同一幂等号被复用于不同的图片或参数。
     */
    @TableField("request_hash")
    private String requestHash;

    @TableField("error_message")
    private String errorMessage;

    @TableField("request_id")
    private String requestId;

    @TableField("model")
    private String model;

    @TableField("cost_amount")
    private BigDecimal costAmount;

    @TableField("currency")
    private String currency;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;
}
