package com.sdfkl.zhepicturebackend.model.dto.picture;

import lombok.Data;

import java.io.Serializable;

@Data
public class PictureOutPaintingParams implements Serializable {

    private Integer leftOffset;
    private Integer rightOffset;
    private Integer topOffset;
    private Integer bottomOffset;

    private Float xScale;
    private Float yScale;

    private Boolean addWatermark;

    private static final long serialVersionUID = 1L;
}