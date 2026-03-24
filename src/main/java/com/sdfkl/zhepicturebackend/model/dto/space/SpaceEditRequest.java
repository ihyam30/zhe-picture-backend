package com.sdfkl.zhepicturebackend.model.dto.space;

import lombok.Data;

import java.io.Serializable;

/**
 * 编辑空间请求
 */
@Data
public class SpaceEditRequest implements Serializable {
    /**
     * 空间名称
     */
    private String spaceName;

    /**
     * 空间id
     */
    private Long id;

    private static final long serialVersionUID = 1L;
}
