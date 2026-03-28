package com.sdfkl.zhepicturebackend.controller;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.http.server.HttpServerRequest;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sdfkl.zhepicturebackend.annotation.AuthCheck;
import com.sdfkl.zhepicturebackend.common.BaseResponse;
import com.sdfkl.zhepicturebackend.common.DeleteRequest;
import com.sdfkl.zhepicturebackend.common.ResultUtils;
import com.sdfkl.zhepicturebackend.constant.UserConstant;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import com.sdfkl.zhepicturebackend.model.dto.space.*;
import com.sdfkl.zhepicturebackend.model.dto.space.analyze.*;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.enums.SpaceLevelEnum;
import com.sdfkl.zhepicturebackend.model.vo.SpaceVO;
import com.sdfkl.zhepicturebackend.model.vo.space.analyze.*;
import com.sdfkl.zhepicturebackend.service.SpaceAnalyzeService;
import com.sdfkl.zhepicturebackend.service.SpaceService;
import com.sdfkl.zhepicturebackend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/space/analyze")
@Slf4j
public class SpaceAnalyzeController {
    @Resource
    private UserService userService;

    @Resource
    private SpaceAnalyzeService spaceAnalyzeService;

    /**
     * 获取空间使用情况
     * @param spaceUsageAnalyzeRequest 空间使用情况请求
     * @param request 请求
     * @return 空间使用情况
     */
    @PostMapping("/usage")
    public BaseResponse<SpaceUsageAnalyzeResponse> getSpaceUsageAnalyze(@RequestBody SpaceUsageAnalyzeRequest spaceUsageAnalyzeRequest, HttpServletRequest request) {
        if (spaceUsageAnalyzeRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        SpaceUsageAnalyzeResponse response = spaceAnalyzeService.getSpaceUsageAnalyze(spaceUsageAnalyzeRequest, loginUser);
        return ResultUtils.success(response);
    }

    /**
     * 获取空间分类分析
     * @param spaceCategoryAnalyzeRequest 空间分类分析请求
     * @param request 请求
     * @return 空间分类分析响应
     */
    @PostMapping("/category")
    public BaseResponse<List<SpaceCategoryAnalyzeResponse>> getSpaceCategoryAnalyze(@RequestBody SpaceCategoryAnalyzeRequest spaceCategoryAnalyzeRequest, HttpServletRequest request){
        if (spaceCategoryAnalyzeRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        List<SpaceCategoryAnalyzeResponse> responses = spaceAnalyzeService.getSpaceCategoryAnalyze(spaceCategoryAnalyzeRequest, loginUser);
        return ResultUtils.success(responses);
    }

    /**
     * 获取空间标签分析
     *
     * @param spaceTagAnalyzeRequest 空间标签分析请求
     * @param request 请求
     * @return 空间标签分析响应
     */
    @PostMapping("/tag")
    public BaseResponse<List<SpaceTagAnalyzeResponse>> getSpaceTagAnalyze(@RequestBody SpaceTagAnalyzeRequest spaceTagAnalyzeRequest, HttpServletRequest request) {
        if (spaceTagAnalyzeRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        List<SpaceTagAnalyzeResponse> responses = spaceAnalyzeService.getSpaceTagAnalyze(spaceTagAnalyzeRequest, loginUser);
        return ResultUtils.success(responses);
    }

    /**
     * 获取空间大小分析
     * @param spaceSizeAnalyzeRequest 空间大小分析请求
     * @param request 请求
     * @return 空间大小分析响应
     */
    @PostMapping("/size")
    public BaseResponse<List<SpaceSizeAnalyzeResponse>> getSpaceSizeAnalyze(@RequestBody SpaceSizeAnalyzeRequest spaceSizeAnalyzeRequest, HttpServletRequest request) {
        if (spaceSizeAnalyzeRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        List<SpaceSizeAnalyzeResponse> responses = spaceAnalyzeService.getSpaceSizeAnalyze(spaceSizeAnalyzeRequest, loginUser);
        return ResultUtils.success(responses);
    }

    /**
     * 获取空间用户行为分析
     * @param spaceUserAnalyzeRequest 空间用户行为分析请求
     * @param request 请求
     * @return 空间用户行为分析响应
     */
    @PostMapping("/user")
    public BaseResponse<List<SpaceUserAnalyzeResponse>> getSpaceUserAnalyze(@RequestBody SpaceUserAnalyzeRequest spaceUserAnalyzeRequest, HttpServletRequest request) {
        if (spaceUserAnalyzeRequest == null){
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        List<SpaceUserAnalyzeResponse> responses = spaceAnalyzeService.getSpaceUserAnalyze(spaceUserAnalyzeRequest, loginUser);
        return ResultUtils.success(responses);
    }

    /**
     * 获取空间排行
     * @param spaceRankAnalyzeRequest 空间排行请求
     * @param request 请求
     * @return 空间列表
     */
    @PostMapping("/rank")
    public BaseResponse<List<Space>> getSpaceRankAnalyze(@RequestBody SpaceRankAnalyzeRequest spaceRankAnalyzeRequest, HttpServletRequest request) {
        if (spaceRankAnalyzeRequest == null){
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = userService.getLoginUser(request);
        List<Space> responses = spaceAnalyzeService.getSpaceRankAnalyze(spaceRankAnalyzeRequest, loginUser);
        return ResultUtils.success(responses);
    }
}
