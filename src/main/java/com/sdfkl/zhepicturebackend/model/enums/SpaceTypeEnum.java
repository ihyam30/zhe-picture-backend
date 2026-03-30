package com.sdfkl.zhepicturebackend.model.enums;

import cn.hutool.core.util.ObjectUtil;
import lombok.Getter;

/**
 * 用户角色枚举
 */
@Getter
public enum SpaceTypeEnum {
    PRIVATE("普通版", 0),
    TEAM("专业版", 1);

    private final String text;

    private final Integer value;

    SpaceTypeEnum(String text, Integer value) {
        this.text = text;
        this.value = value;
    }

    /**
     * 根据 value 获取枚举
     *
     * @param value
     * @return
     */
    public static SpaceTypeEnum getEnumByValue(Integer value) {
        if (ObjectUtil.isEmpty(value)) {
            return null;
        }
        for (SpaceTypeEnum anEnum : SpaceTypeEnum.values()) {
            if (anEnum.value.equals(value)) {
                return anEnum;
            }
        }
        return null;
    }
}
