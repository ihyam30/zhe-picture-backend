package com.sdfkl.zhepicturebackend.model.dto.picture;

import com.sdfkl.zhepicturebackend.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class PictureQueryRequest extends PageRequest implements Serializable {
    /**
     * id
     */
    private Long id;
    /**
     * 名称
     */
    private String name;
    /**
     * 介绍
     */
    private String introduction;
    /**
     * 分类
     */
    private String category;
    /**
     * 标签
     */
    private List<String> tags;

    /**
     * 图片大小
     */
    private Long picSize;

    /**
     * 图片宽度
     */
    private Integer picWidth;

    /**
     * 图片高度
     */
    private Integer picHeight;

    /**
     * 图片宽高比
     */
    private Double picScale;

    /**
     * 图片格式
     */
    private String picFormat;

    /**
     * 搜索文本
     */
    private String searchText;

    /**
     * 用户id
     */
    private Long userId;

    /**
     * 空间id
     */
    private Long spaceId;

    /**
     * 空间id为null
     */
    private Boolean nullSpaceId;

    /**
     * 审核状态：0-待审核; 1-通过; 2-拒绝
     */
    private Integer reviewStatus;

    /**
     * 审核信息
     */
    private String reviewMessage;

    /**
     * 审核人 ID
     */
    private Long reviewerId;

    /**
     * 审核时间
     */
    private Date reviewTime;

    private static final long serialVersionUID = 1L;
}
