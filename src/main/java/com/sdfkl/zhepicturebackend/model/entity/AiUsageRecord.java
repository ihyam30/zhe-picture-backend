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
 * AI 调用次数和费用流水。
 *
 * <p>每个本地任务只保留一条可更新的流水，重试不会重复计费。</p>
 */
@Data
@TableName("ai_usage_record")
public class AiUsageRecord implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.ASSIGN_ID)
    private Long id;

    @TableField("task_id")
    private Long taskId;

    @TableField("user_id")
    private Long userId;

    @TableField("space_id")
    private Long spaceId;

    @TableField("provider")
    private String provider;

    @TableField("provider_task_id")
    private String providerTaskId;

    @TableField("status")
    private String status;

    @TableField("request_units")
    private Integer requestUnits;

    @TableField("cost_amount")
    private BigDecimal costAmount;

    @TableField("currency")
    private String currency;

    @TableField("error_message")
    private String errorMessage;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;
}
