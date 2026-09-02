package com.sdfkl.zhepicturebackend.config;

import com.qcloud.cos.COSClient;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;

/**
 * 通过 COS bucket HEAD 检查对象存储连通性，不在健康详情中暴露 bucket 或凭证信息。
 */
@Component("cosHealthIndicator")
@ConditionalOnProperty(name = "management.health.cos.enabled", havingValue = "true", matchIfMissing = true)
public class CosHealthIndicator extends AbstractHealthIndicator {

    @Resource
    private COSClient cosClient;

    @Resource
    private CosClientConfig cosClientConfig;

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        String bucket = cosClientConfig.getBucket();
        if (!StringUtils.hasText(bucket)) {
            builder.down().withDetail("reason", "configuration_missing");
            return;
        }
        try {
            if (cosClient.doesBucketExist(bucket)) {
                builder.up().withDetail("provider", "tencent-cos");
            } else {
                builder.down().withDetail("reason", "bucket_unavailable");
            }
        } catch (Exception ignored) {
            builder.down().withDetail("reason", "request_failed");
        }
    }
}
