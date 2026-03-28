package com.sdfkl.zhepicturebackend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sdfkl.zhepicturebackend.model.dto.space.SpaceAddRequest;
import com.sdfkl.zhepicturebackend.model.dto.space.SpaceQueryRequest;
import com.sdfkl.zhepicturebackend.model.dto.space.analyze.*;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.vo.SpaceVO;
import com.sdfkl.zhepicturebackend.model.vo.space.analyze.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * @author user
 * @description 针对表【space(空间)】的数据库操作Service
 * @createDate 2026-03-23 12:41:50
 */
public interface SpaceAnalyzeService extends IService<Space> {
    /**
     * 获取空间使用分析
     *
     * @param spaceUsageAnalyzeRequest 空间使用分析请求
     * @param loginUser                登录用户
     * @return 空间使用分析响应
     */
    SpaceUsageAnalyzeResponse getSpaceUsageAnalyze(SpaceUsageAnalyzeRequest spaceUsageAnalyzeRequest, User loginUser);

    /**
     * 获取空间分类分析
     * @param spaceCategoryAnalyzeRequest 空间分类分析请求
     * @param loginUser 登录用户
     * @return 空间分类分析响应
     */
    List<SpaceCategoryAnalyzeResponse> getSpaceCategoryAnalyze(SpaceCategoryAnalyzeRequest spaceCategoryAnalyzeRequest, User loginUser);

    /**
     * 获取空间标签分析
     * @param spaceTagAnalyzeRequest 空间标签分析请求
     * @param loginUser 登录用户
     * @return 空间标签分析响应
     */
    List<SpaceTagAnalyzeResponse> getSpaceTagAnalyze(SpaceTagAnalyzeRequest spaceTagAnalyzeRequest, User loginUser);

    /**
     * 获取空间大小分析
     * @param spaceSizeAnalyzeRequest 空间大小分析请求
     * @param loginUser 登录用户
     * @return 空间大小分析响应
     */
    List<SpaceSizeAnalyzeResponse> getSpaceSizeAnalyze(SpaceSizeAnalyzeRequest spaceSizeAnalyzeRequest, User loginUser);

    /**
     * 获取空间用户行为分析
     * @param spaceUserAnalyzeRequest 空间用户行为分析请求
     * @param loginUser 登录用户
     * @return 空间用户行为分析响应
     */
    List<SpaceUserAnalyzeResponse> getSpaceUserAnalyze(SpaceUserAnalyzeRequest spaceUserAnalyzeRequest, User loginUser);

    /**
     * 获取空间排行分析
     * @param spaceRankAnalyzeRequest 空间排行分析请求
     * @param loginUser 登录用户
     * @return 空间列表
     */
    List<Space> getSpaceRankAnalyze(SpaceRankAnalyzeRequest spaceRankAnalyzeRequest, User loginUser);
}
