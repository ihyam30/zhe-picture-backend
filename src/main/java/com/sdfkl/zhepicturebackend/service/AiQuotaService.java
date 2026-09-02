package com.sdfkl.zhepicturebackend.service;

/**
 * AI 调用额度服务。
 */
public interface AiQuotaService {

    /**
     * 原子预留一次用户和空间额度。
     *
     * @return 是否成功预留
     */
    boolean tryReserve(Long userId, Long spaceId);
}
