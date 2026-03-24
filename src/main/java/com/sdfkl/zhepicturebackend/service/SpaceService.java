package com.sdfkl.zhepicturebackend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sdfkl.zhepicturebackend.model.dto.space.SpaceAddRequest;
import com.sdfkl.zhepicturebackend.model.dto.space.SpaceQueryRequest;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.vo.SpaceVO;


import javax.servlet.http.HttpServletRequest;

/**
 * @author user
 * @description 针对表【space(空间)】的数据库操作Service
 * @createDate 2026-03-23 12:41:50
 */
public interface SpaceService extends IService<Space> {
    /**
     * 获取查询条件
     *
     * @param spaceQueryRequest 空间查询条件
     * @return 查询条件
     */
    QueryWrapper<Space> getQueryWrapper(SpaceQueryRequest spaceQueryRequest);

    /**
     * 获取空间信息
     *
     * @param space   空间
     * @param request 请求
     * @return 空间信息
     */
    SpaceVO getSpaceVO(Space space, HttpServletRequest request);

    /**
     * 获取空间分页信息
     *
     * @param spacePage 空间分页
     * @param request   请求
     * @return 空间分页信息
     */
    Page<SpaceVO> getSpaceVOPage(Page<Space> spacePage, HttpServletRequest request);

    /**
     * 校验空间信息
     *
     * @param space 空间信息
     */
    void validSpace(Space space, boolean add);

    /**
     * 根据空间等级填充空间信息
     *
     * @param space 空间信息
     */
    void fillSpaceBySpaceLevel(Space space);

    /**
     * 添加空间
     * @param spaceAddRequest 空间添加请求
     * @param loginUser 登录用户
     * @return 添加的空间id
     */
    long addSpace(SpaceAddRequest spaceAddRequest, User loginUser);

}
