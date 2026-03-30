package com.sdfkl.zhepicturebackend.model.dto.space;

import com.sdfkl.zhepicturebackend.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

/**
 * 查询空间请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class SpaceQueryRequest extends PageRequest implements Serializable {
    /**
     * 空间名称
     */
    private String spaceName;
    /**
     * 空间等级: 0-普通版 1-专业版 2-旗舰版
     */
    private Integer spaceLevel;

    /**
     * 空间类型：0-个人空间 1-团队空间
     */
    private Integer spaceType;

    /**
     * 空间id
     */
    private Long id;

    /**
     * 用户id
     */
    private Long userId;

    private static final long serialVersionUID = 1L;
}
