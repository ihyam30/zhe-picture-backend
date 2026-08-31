package com.sdfkl.zhepicturebackend.controller;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.server.HttpServerRequest;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.COSObjectInputStream;
import com.qcloud.cos.utils.IOUtils;
import com.sdfkl.zhepicturebackend.annotation.AuthCheck;
import com.sdfkl.zhepicturebackend.api.aliyunai.AliYunAIApi;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.GetOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.common.BaseResponse;
import com.sdfkl.zhepicturebackend.common.DeleteRequest;
import com.sdfkl.zhepicturebackend.common.ResultUtils;
import com.sdfkl.zhepicturebackend.constant.UserConstant;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import com.sdfkl.zhepicturebackend.manager.CosManager;
import com.sdfkl.zhepicturebackend.manager.auth.CurrentUserService;
import com.sdfkl.zhepicturebackend.manager.auth.SpaceUserAuthManager;
import com.sdfkl.zhepicturebackend.manager.auth.StpKit;
import com.sdfkl.zhepicturebackend.manager.auth.annotation.SaSpaceCheckPermission;
import com.sdfkl.zhepicturebackend.manager.auth.model.SpaceUserPermissionConstant;
import com.sdfkl.zhepicturebackend.model.dto.picture.*;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.enums.PictureReviewStatusEnum;
import com.sdfkl.zhepicturebackend.model.vo.PictureTagCategory;
import com.sdfkl.zhepicturebackend.model.vo.PictureVO;
import com.sdfkl.zhepicturebackend.service.PictureService;
import com.sdfkl.zhepicturebackend.service.SpaceService;
import com.sdfkl.zhepicturebackend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.AutoConfigurationPackage;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/picture")
@Slf4j
public class PictureController {
    @Resource
    private UserService userService;

    @Resource
    private CurrentUserService currentUserService;

    @Resource
    private PictureService pictureService;

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Resource
    private SpaceUserAuthManager spaceUserAuthManager;

    /**
     * 本地缓存
     */
    private final Cache<String, String> LOCAL_CACHE = Caffeine.newBuilder()
            .initialCapacity(1024)
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(5))
            .build();
    @Resource
    private SpaceService spaceService;

    @Resource
    private AliYunAIApi aliYunAIApi;

    /**
     * 图片上传
     *
     * @param multipartFile        图片
     * @param pictureUploadRequest 图片上传请求
     * @param request              请求
     * @return 图片信息
     */
    @PostMapping("/upload")
    @SaSpaceCheckPermission(value = SpaceUserPermissionConstant.PICTURE_UPLOAD)
//    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<PictureVO> uploadPicture(@RequestPart("file") MultipartFile multipartFile,
                                                 PictureUploadRequest pictureUploadRequest,
                                                 HttpServletRequest request) {
        User loginUser = currentUserService.getRequiredUser();
        PictureVO pictureVO = pictureService.uploadPicture(multipartFile, pictureUploadRequest, loginUser);
        return ResultUtils.success(pictureVO);
    }

    /**
     * 图片上传
     *
     * @param pictureUploadRequest 图片上传请求
     * @param request              请求
     * @return 图片信息
     */
    @PostMapping("/upload/url")
    @SaSpaceCheckPermission(value = SpaceUserPermissionConstant.PICTURE_UPLOAD)
//    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<PictureVO> uploadPictureByUrl(@RequestBody PictureUploadRequest pictureUploadRequest,
                                                      HttpServletRequest request) {
        User loginUser = currentUserService.getRequiredUser();
        PictureVO pictureVO = pictureService.uploadPicture(pictureUploadRequest.getFileUrl(), pictureUploadRequest, loginUser);
        return ResultUtils.success(pictureVO);
    }

    /**
     * 图片删除
     *
     * @param deleteRequest 删除请求
     * @param request       请求
     * @return 删除结果
     */
    @PostMapping("/delete")
    @SaSpaceCheckPermission(value = SpaceUserPermissionConstant.PICTURE_DELETE)
    public BaseResponse<Boolean> deletePicture(@RequestBody DeleteRequest deleteRequest,HttpServletRequest request) {
        if(deleteRequest == null || deleteRequest.getId() <= 0){
            return ResultUtils.error(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = currentUserService.getRequiredUser();
        pictureService.deletePicture(deleteRequest, loginUser);
        return ResultUtils.success(true);
    }

    /**
     * 图片更新
     *
     * @param pictureUpdateRequest 图片更新请求
     * @return 更新结果
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updatePicture(@RequestBody PictureUpdateRequest pictureUpdateRequest, HttpServletRequest request) {
        if(pictureUpdateRequest == null || pictureUpdateRequest.getId() <= 0){
            return ResultUtils.error(ErrorCode.PARAMS_ERROR);
        }
        // 将实体类和 DTO 进行转换
        Picture picture = BeanUtil.copyProperties(pictureUpdateRequest, Picture.class);
        // 注意将 list 转为 string
        picture.setTags(JSONUtil.toJsonStr(pictureUpdateRequest.getTags()));
        // 数据校验
        pictureService.validPicture(picture);
        // 判断是否存在
        Long id = pictureUpdateRequest.getId();
        Picture oldPicture = pictureService.getById(id);
        ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
        // 填充审核参数
        User loginUser = currentUserService.getRequiredUser();
        pictureService.fillReviewParams(picture, loginUser);
        // 操作数据库
        boolean result = pictureService.updateById(picture);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR, "图片更新失败");
        return ResultUtils.success(true);
    }

    /**
     * 图片查询
     *
     * @param id 图片id
     * @return 图片信息
     */
    @GetMapping("/get")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Picture> getPictureById(long id, HttpServerRequest request){
        ThrowUtils.throwIf(id <= 0, ErrorCode.PARAMS_ERROR);
        // 查询数据库
        Picture picture = pictureService.getById(id);
        ThrowUtils.throwIf(picture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
        return ResultUtils.success(picture);
    }

    /**
     * 图片查询
     *
     * @param id 图片id
     * @return 图片信息
     */
    @GetMapping("/get/vo")
    public BaseResponse<PictureVO> getPictureVOById(long id, HttpServletRequest request){
        ThrowUtils.throwIf(id <= 0, ErrorCode.PARAMS_ERROR);
        // 获取图片
        Picture picture = pictureService.getById(id);
        ThrowUtils.throwIf(picture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
        // 空间权限校验
        Long spaceId = picture.getSpaceId();
        Space space = null;
        if(spaceId != null){
            boolean b = StpKit.USER.hasPermission(SpaceUserPermissionConstant.PICTURE_VIEW);
            ThrowUtils.throwIf(!b, ErrorCode.NO_AUTH_ERROR);
            //pictureService.checkPictureAuth(picture, loginUser);
            space = spaceService.getById(spaceId);
            ThrowUtils.throwIf(space == null, ErrorCode.NOT_FOUND_ERROR, "空间不存在");
        }
        User loginUser = currentUserService.getRequiredUser();
        List<String> permissionList = spaceUserAuthManager.getPermissionList(space, loginUser);
        PictureVO pictureVO = pictureService.getPictureVO(picture, request);
        pictureVO.setPermissionList(permissionList);
        // 获取图片信息
        return ResultUtils.success(pictureVO);
    }

    /**
     * 图片查询
     *
     * @param pictureQueryRequest 图片查询请求
     * @return 图片信息
     */
    @PostMapping("/list/page")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Page<Picture>> listPictureByPage(@RequestBody PictureQueryRequest pictureQueryRequest){
        long current = pictureQueryRequest.getCurrent();
        long pageSize = pictureQueryRequest.getPageSize();
        // 查数据库
        Page<Picture> picturePage = pictureService.page(new Page<>(current, pageSize), pictureService.getQueryWrapper(pictureQueryRequest));
        return ResultUtils.success(picturePage);
    }

    /**
     * 图片查询
     *
     * @param pictureQueryRequest 图片查询请求
     * @return 图片信息
     */
    @PostMapping("/list/page/vo")
    public BaseResponse<Page<PictureVO>> listPictureVOByPage(@RequestBody PictureQueryRequest pictureQueryRequest, HttpServletRequest request){
        long current = pictureQueryRequest.getCurrent();
        long pageSize = pictureQueryRequest.getPageSize();
        // 限制爬虫
        ThrowUtils.throwIf(pageSize > 20, ErrorCode.PARAMS_ERROR);
        // 空间权限校验
        Long spaceId = pictureQueryRequest.getSpaceId();

        User loginUser = currentUserService.getRequiredUser();

        if(spaceId == null){
            // 公开图库
            // 普通用户默认只能看到审核通过的数据
            if (!userService.isAdmin(loginUser)) {
                pictureQueryRequest.setReviewStatus(PictureReviewStatusEnum.PASS.getValue());
            }
            pictureQueryRequest.setNullSpaceId(true);
        }else {
            boolean b = StpKit.USER.hasPermission(SpaceUserPermissionConstant.PICTURE_VIEW);
            ThrowUtils.throwIf(!b, ErrorCode.NO_AUTH_ERROR);
//            // 私有空间
//            Space space = spaceService.getById(spaceId);
//            ThrowUtils.throwIf(space == null,ErrorCode.NOT_FOUND_ERROR,"空间不存在");
//            if(!loginUser.getId().equals(space.getUserId())){
//                throw new BusinessException(ErrorCode.NO_AUTH_ERROR,"没有空间权限");
//            }
        }
        // 查询数据库
        Page<Picture> picturePage = pictureService.page(new Page<>(current, pageSize), pictureService.getQueryWrapper(pictureQueryRequest));
        return ResultUtils.success(pictureService.getPictureVOPage(picturePage,request));
    }

    /**
     * 图片查询
     *
     * @param pictureQueryRequest 图片查询请求
     * @return 图片信息
     */
    @PostMapping("/list/page/vo/cache")
    @Deprecated
    public BaseResponse<Page<PictureVO>> listPictureVOByPageWithCache(@RequestBody PictureQueryRequest pictureQueryRequest, HttpServletRequest request){
        long current = pictureQueryRequest.getCurrent();
        long pageSize = pictureQueryRequest.getPageSize();
        // 限制爬虫
        ThrowUtils.throwIf(pageSize > 20, ErrorCode.PARAMS_ERROR);
        // 普通用户默认只能看到审核通过的数据
        pictureQueryRequest.setReviewStatus(PictureReviewStatusEnum.PASS.getValue());
        // 查询构造，缓存中没有，在查询数据库
        // 构造缓存的 key
        String queryCondition = JSONUtil.toJsonStr(pictureQueryRequest);
        String hashKey = DigestUtils.md5DigestAsHex(queryCondition.getBytes());
        String redisKey = String.format("zhepicture:listPictureVOByPage:%s", hashKey);
        // 先从本地缓存中查询数据
        String cacheValue = LOCAL_CACHE.getIfPresent(redisKey);
        if (cacheValue != null) {
            // 如果缓存命中，缓存结果
            Page<PictureVO> cachePage = JSONUtil.toBean(cacheValue, Page.class);
            return ResultUtils.success(cachePage);
        }
        // 再从 redis 分布式缓存中查询数据
        ValueOperations<String, String> stringStringValueOperations = stringRedisTemplate.opsForValue();
        cacheValue = stringStringValueOperations.get(redisKey);
        if (cacheValue != null) {
            // 如果缓存命中，缓存结果
            Page<PictureVO> cachePage = JSONUtil.toBean(cacheValue, Page.class);
            // 将查询到的数据保存到本地缓存中
            LOCAL_CACHE.put(redisKey,cacheValue);
            return ResultUtils.success(cachePage);
        }
        // 查询数据库
        Page<Picture> picturePage = pictureService.page(new Page<>(current, pageSize), pictureService.getQueryWrapper(pictureQueryRequest));
        Page<PictureVO> pictureVOPage = pictureService.getPictureVOPage(picturePage, request);
        // 将数据库中的数据缓存到 redis 中
        String redisValue = JSONUtil.toJsonStr(pictureVOPage);
        // 设置缓存过期时间
        long timeout = 300 + RandomUtil.randomInt(0, 300);
        stringStringValueOperations.set(redisKey,redisValue,timeout, TimeUnit.SECONDS);
        // 将数据库查询到的数据保存到本地缓存中
        LOCAL_CACHE.put(redisKey,redisValue);
        return ResultUtils.success(pictureVOPage);
    }

    /**
     * 图片编辑
     * @param pictureEditRequest 图片编辑请求
     * @param request 请求
     * @return 编辑结果
     */
    @PostMapping("/edit")
    @SaSpaceCheckPermission(value = SpaceUserPermissionConstant.PICTURE_EDIT)
    public BaseResponse<Boolean> editPicture(@RequestBody PictureEditRequest pictureEditRequest, HttpServletRequest request) {
        if(pictureEditRequest == null || pictureEditRequest.getId() <= 0){
            return ResultUtils.error(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = currentUserService.getRequiredUser();
        pictureService.editPicture(pictureEditRequest,loginUser);
        return ResultUtils.success(true);
    }

    /**
     * 获取图片标签和分类
     * @return 图片标签和分类
     */
    @GetMapping("/tag_category")
    public BaseResponse<PictureTagCategory> getPictureTagCategory(){
        PictureTagCategory pictureTagCategory = new PictureTagCategory();
        List<String> tagList = Arrays.asList("热门","搞笑","生活","高清","艺术","校园","背景","简历","创意");
        List<String> categoryList = Arrays.asList("模板","电商","表情包","素材","海报");
        pictureTagCategory.setTagList(tagList);
        pictureTagCategory.setCategoryList(categoryList);
        return ResultUtils.success(pictureTagCategory);
    }

    /**
     * 图片审核
     *
     * @param pictureReviewRequest 图片审核请求
     * @param request              请求
     * @return 审核结果
     */
    @PostMapping("/review")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> doPictureReview(@RequestBody PictureReviewRequest pictureReviewRequest, HttpServletRequest request) {
        ThrowUtils.throwIf(pictureReviewRequest == null, ErrorCode.PARAMS_ERROR);
        User loginUser = currentUserService.getRequiredUser();
        pictureService.doPictureReview(pictureReviewRequest, loginUser);
        return ResultUtils.success(true);
    }

    /**
     * 图片批量上传
     *
     * @param pictureUploadByBatchRequest 图片批量上传请求
     * @param request                     请求
     * @return 上传结果
     */
    @PostMapping("/upload/batch")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Integer> uploadPictureBatch(@RequestBody PictureUploadByBatchRequest pictureUploadByBatchRequest, HttpServletRequest request) {
        ThrowUtils.throwIf(pictureUploadByBatchRequest == null, ErrorCode.PARAMS_ERROR);
        User loginUser = currentUserService.getRequiredUser();
        int uploadCount = pictureService.uploadPictureByBatch(pictureUploadByBatchRequest, loginUser);
        return ResultUtils.success(uploadCount);
    }

    /**
     * 根据颜色搜索图片
     *
     * @param searchPictureByColorRequest 根据颜色搜索图片的请求体
     * @param request                     请求
     * @return 图片视图列表
     */
    @PostMapping("/search/color")
    @SaSpaceCheckPermission(value = SpaceUserPermissionConstant.PICTURE_VIEW)
    public BaseResponse<List<PictureVO>> searchPictureByColor(@RequestBody SearchPictureByColorRequest searchPictureByColorRequest, HttpServletRequest request) {
        ThrowUtils.throwIf(searchPictureByColorRequest == null, ErrorCode.PARAMS_ERROR);
        String picColor = searchPictureByColorRequest.getPicColor();
        Long spaceId = searchPictureByColorRequest.getSpaceId();
        User loginUser = currentUserService.getRequiredUser();
        List<PictureVO> pictureVOS = pictureService.searchPictureByColor(spaceId, picColor, loginUser);
        return ResultUtils.success(pictureVOS);
    }

    @PostMapping("/edit/batch")
    @SaSpaceCheckPermission(value = SpaceUserPermissionConstant.PICTURE_EDIT)
    public BaseResponse<Boolean> editPictureByBatch(@RequestBody PictureEditByBatchRequest pictureEditByBatchRequest, HttpServletRequest request){
        ThrowUtils.throwIf(pictureEditByBatchRequest == null, ErrorCode.PARAMS_ERROR);
        User loginUser = currentUserService.getRequiredUser();
        pictureService.editPictureByBatch(pictureEditByBatchRequest, loginUser);
        return ResultUtils.success(true);
    }

    /**
     * 创建 AI 扩图任务
     * @param createPictureOutPaintingTaskRequest 创建 AI 扩图任务请求
     * @param request 请求
     * @return 创建的图片外绘任务响应
     */
    @PostMapping("out_painting/create_task")
    @SaSpaceCheckPermission(value = SpaceUserPermissionConstant.PICTURE_EDIT)
    public BaseResponse<CreateOutPaintingTaskResponse> createOutPaintingTask(@RequestBody CreatePictureOutPaintingTaskRequest createPictureOutPaintingTaskRequest
                                                                            , HttpServletRequest request) throws JsonProcessingException {
        if(createPictureOutPaintingTaskRequest == null || createPictureOutPaintingTaskRequest.getPictureId() == null){
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User loginUser = currentUserService.getRequiredUser();
        log.info("request = {}", JSONUtil.toJsonStr(createPictureOutPaintingTaskRequest));
        log.info("params = {}", JSONUtil.toJsonStr(createPictureOutPaintingTaskRequest.getParameters()));
        CreateOutPaintingTaskResponse response = pictureService.createOutPaintingTask(createPictureOutPaintingTaskRequest, loginUser);
        return ResultUtils.success(response);
    }

    /**
     * 查询 AI 扩图任务
     * @param taskId 任务 id
     * @return 查询 AI 扩图任务响应
     */
    @GetMapping("/out_painting/get_task")
    public BaseResponse<GetOutPaintingTaskResponse> getOutPaintingTask(String taskId) {
        ThrowUtils.throwIf(StrUtil.isBlank(taskId), ErrorCode.PARAMS_ERROR);
        GetOutPaintingTaskResponse task = aliYunAIApi.getOutPaintingTask(taskId);
        return ResultUtils.success(task);
    }
}
