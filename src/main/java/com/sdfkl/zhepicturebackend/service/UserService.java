package com.sdfkl.zhepicturebackend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.sdfkl.zhepicturebackend.model.dto.user.UserLoginRequest;
import com.sdfkl.zhepicturebackend.model.dto.user.UserQueryRequest;
import com.sdfkl.zhepicturebackend.model.dto.user.UserRegisterRequest;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sdfkl.zhepicturebackend.model.vo.UserLoginVO;
import com.sdfkl.zhepicturebackend.model.vo.UserVO;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * @author user
 * @description 针对表【user(用户)】的数据库操作Service
 * @createDate 2026-03-18 15:18:00
 */
public interface UserService extends IService<User> {
    /**
     * 用户注册
     *
     * @param userRegisterRequest 用户注册请求
     * @return 用户id
     */
    Long userRegister(UserRegisterRequest userRegisterRequest);

    /**
     * 用户登录
     *
     * @param loginRequest 登录请求
     * @return 登录信息
     */
    UserLoginVO userLogin(UserLoginRequest loginRequest, HttpServletRequest request);

    /**
     * 获取当前登录用户
     *
     * @param request 请求
     * @return 用户
     */
    User getLoginUser(HttpServletRequest request);

    /**
     * 用户登出
     *
     * @param request 请求
     * @return 是否登出成功
     */
    Boolean userLogout(HttpServletRequest request);

    /**
     * 获取脱敏后的用户信息
     *
     * @param user 用户
     * @return 用户信息
     */
    UserVO getUserVO(User user);

    /**
     * 获取脱敏后的用户列表
     *
     * @param userList 用户列表
     * @return 用户列表
     */
    List<UserVO> getUserVOList(List<User> userList);

    /**
     * 获取查询条件
     *
     * @param userQueryRequest 查询条件
     * @return 查询条件
     */
    QueryWrapper<User> getQueryWrapper(UserQueryRequest userQueryRequest);

    /**
     * 获取加密后的密码
     */
    String getEncryptPassword(String userPassword);

    /**
     * 是否为管理员
     *
     * @param user 用户
     * @return 是否为管理员
     */
    boolean isAdmin(User user);
}
