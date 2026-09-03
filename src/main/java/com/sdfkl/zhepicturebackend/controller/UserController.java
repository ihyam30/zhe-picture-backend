package com.sdfkl.zhepicturebackend.controller;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sdfkl.zhepicturebackend.annotation.AuthCheck;
import com.sdfkl.zhepicturebackend.common.BaseResponse;
import com.sdfkl.zhepicturebackend.common.DeleteRequest;
import com.sdfkl.zhepicturebackend.common.ResultUtils;
import com.sdfkl.zhepicturebackend.constant.UserConstant;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import com.sdfkl.zhepicturebackend.manager.auth.CurrentUserService;
import com.sdfkl.zhepicturebackend.model.dto.user.*;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.vo.UserLoginVO;
import com.sdfkl.zhepicturebackend.model.vo.UserVO;
import com.sdfkl.zhepicturebackend.service.UserService;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;

@RestController
@RequestMapping("/user")
public class UserController {
    @Resource
    private UserService userService;

    @Resource
    private CurrentUserService currentUserService;

    /**
     * 用户注册
     *
     * @param userRegisterRequest 用户注册请求
     * @return 用户ID
     */
    @PostMapping("/register")
    @AuthCheck(mustRole = "admin")
    public BaseResponse<Long> userRegister(@RequestBody UserRegisterRequest userRegisterRequest) {
        ThrowUtils.throwIf(userRegisterRequest == null, ErrorCode.PARAMS_ERROR);
        Long result = userService.userRegister(userRegisterRequest);
        return ResultUtils.success(result);
    }

    /**
     * 用户登录
     *
     * @param userLoginRequest 用户登录请求
     * @return 用户登录信息
     */
    @PostMapping("/login")
    public BaseResponse<UserLoginVO> userLogin(@RequestBody UserLoginRequest userLoginRequest) {
        ThrowUtils.throwIf(userLoginRequest == null, ErrorCode.PARAMS_ERROR);
        UserLoginVO userLoginVO = userService.userLogin(userLoginRequest);
        return ResultUtils.success(userLoginVO);
    }

    /**
     * 获取当前登录用户
     *
     * @param request 请求
     * @return 用户
     */
    @GetMapping("/get/login")
    public BaseResponse<UserLoginVO> getLoginUser() {
        User loginUser = currentUserService.getRequiredUser();
        return ResultUtils.success(BeanUtil.copyProperties(loginUser, UserLoginVO.class));
    }

    /**
     * 用户登出
     *
     * @param request 登出请求
     * @return 是否登出成功
     */
    @PostMapping("/logout")
    public BaseResponse<Boolean> userLogout() {
        currentUserService.logout();
        return ResultUtils.success(true);
    }

    /**
     * 添加用户
     *
     * @param userAddRequest 添加用户请求
     * @return 用户ID
     */
    @PostMapping("/add")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Long> addUser(@RequestBody UserAddRequest userAddRequest) {
        ThrowUtils.throwIf(userAddRequest == null, ErrorCode.PARAMS_ERROR);
        User user = BeanUtil.copyProperties(userAddRequest, User.class);
        // 默认密码
        final String DEFAULT_PASSWORD = "19880314";
        String encryptPassword = userService.getEncryptPassword(DEFAULT_PASSWORD);
        user.setUserPassword(encryptPassword);
        // 插入数据库
        boolean result = userService.save(user);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(user.getId());
    }

    /**
     * 根据 id 获取用户
     *
     * @param id 用户ID
     * @return 用户
     */
    @GetMapping("/get")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<User> getUserById(long id) {
        ThrowUtils.throwIf(id <= 0, ErrorCode.PARAMS_ERROR);
        User user = userService.getById(id);
        ThrowUtils.throwIf(user == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(user);
    }

    /**
     * 根据 id 获取脱敏后的用户
     *
     * @param id 用户ID
     * @return 用户
     */
    @GetMapping("/get/vo")
    public BaseResponse<UserVO> getUserVOById(long id) {
        BaseResponse<User> response = getUserById(id);
        User user = response.getData();
        return ResultUtils.success(userService.getUserVO(user));
    }

    /**
     * 删除用户
     *
     * @param deleteRequest 删除用户请求
     * @return 是否删除成功
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteUser(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || deleteRequest.getId() <= 0){
            return ResultUtils.error(ErrorCode.PARAMS_ERROR);
        }
        boolean result = userService.removeById(deleteRequest.getId());
        return ResultUtils.success(result);
    }

    /**
     * 更新用户
     *
     * @param userUpdateRequest 更新用户请求
     * @return 是否更新成功
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateUser(@RequestBody UserUpdateRequest userUpdateRequest) {
        ThrowUtils.throwIf(userUpdateRequest == null || userUpdateRequest.getId() == null, ErrorCode.PARAMS_ERROR);
        User user = BeanUtil.copyProperties(userUpdateRequest, User.class);
        boolean result = userService.updateById(user);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 获取用户列表
     * @param userQueryRequest 查询条件
     * @return 用户列表
     */
    @PostMapping("/list/page/vo")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Page<UserVO>> listUserVOByPage(@RequestBody UserQueryRequest userQueryRequest) {
        ThrowUtils.throwIf(userQueryRequest == null, ErrorCode.PARAMS_ERROR);
        long current = userQueryRequest.getCurrent();
        long pageSize = userQueryRequest.getPageSize();
        Page<User> userPage = userService.page(new Page<>(current, pageSize),
                userService.getQueryWrapper(userQueryRequest));
        Page<UserVO> userVOPage = new Page<>(current, pageSize, userPage.getTotal());
        userVOPage.setRecords(userService.getUserVOList(userPage.getRecords()));
        return ResultUtils.success(userVOPage);
    }
}
