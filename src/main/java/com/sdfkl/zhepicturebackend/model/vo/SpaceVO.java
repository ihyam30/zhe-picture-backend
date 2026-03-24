package com.sdfkl.zhepicturebackend.model.vo;

import cn.hutool.core.bean.BeanUtil;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 空间视图
 */
@Data
public class SpaceVO implements Serializable {
    private static final long serialVersionUID = 1L;
    /**
     * id
     */
    private Long id;

    /**
     * 空间名称
     */
    private String spaceName;

    /**
     * 0-普通版 1-专业版 2-旗舰版
     */
    private Integer spaceLevel;

    /**
     * 空间图片的最大总大小
     */
    private Long maxSize;

    /**
     * 空间图片的最大数量
     */
    private Long maxCount;

    /**
     * 空间图片的总大小
     */
    private Long totalSize;

    /**
     * 空间图片的总数量
     */
    private Long totalCount;

    /**
     * 创建用户 id
     */
    private Long userId;

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 编辑时间
     */
    private Date editTime;

    /**
     * 更新时间
     */
    private Date updateTime;

    /**
     * 创建用户信息
     */
    private UserVO userVO;

    /**
     * vo 转 object
     *
     * @param spaceVO vo对象
     * @return 对象
     */
    public static Space voToObject(SpaceVO spaceVO) {
        if (spaceVO == null) {
            return null;
        }
        return BeanUtil.copyProperties(spaceVO, Space.class);
    }

    /**
     * object 转 vo
     *
     * @param space 对象
     * @return vo对象
     */
    public static SpaceVO objectToVO(Space space) {
        if (space == null) {
            return null;
        }
        return BeanUtil.copyProperties(space, SpaceVO.class);
    }
}
