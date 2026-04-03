package com.sdfkl.zhepicturebackend.model.dto.picture;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;

@Data
public class PictureOutPaintingParams implements Serializable {

    private Integer leftOffset;
    private Integer rightOffset;
    private Integer topOffset;
    private Integer bottomOffset;

    @JsonProperty("xScale")
    private Double xScale;
    @JsonProperty("yScale")
    private Double yScale;

    private Boolean addWatermark;

    /**
     * 逆时针旋转角度
     */
    private Integer angle;

    /**
     * 输出宽高比
     */
    private String outputRatio;

    /**
     * 限制图片大小
     */
    private Boolean limitImageSize;

    /**
     * 最佳质量
     */
    private Boolean bestQuality;

    private static final long serialVersionUID = 1L;
}