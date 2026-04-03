package com.sdfkl.zhepicturebackend.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpUtil;
import cn.hutool.http.Method;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.sdfkl.zhepicturebackend.api.aliyunai.AliYunAIApi;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskRequest;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.common.DeleteRequest;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import com.sdfkl.zhepicturebackend.manager.CosManager;
import com.sdfkl.zhepicturebackend.manager.FileManager;
import com.sdfkl.zhepicturebackend.manager.upload.FilePictureUpload;
import com.sdfkl.zhepicturebackend.manager.upload.PictureUploadTemplate;
import com.sdfkl.zhepicturebackend.manager.upload.UrlPictureUpload;
import com.sdfkl.zhepicturebackend.model.dto.file.UploadPictureResult;
import com.sdfkl.zhepicturebackend.model.dto.picture.*;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.Space;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.enums.PictureReviewStatusEnum;
import com.sdfkl.zhepicturebackend.model.vo.PictureVO;
import com.sdfkl.zhepicturebackend.model.vo.UserVO;
import com.sdfkl.zhepicturebackend.service.PictureService;
import com.sdfkl.zhepicturebackend.mapper.PictureMapper;
import com.sdfkl.zhepicturebackend.service.SpaceService;
import com.sdfkl.zhepicturebackend.service.UserService;
import com.sdfkl.zhepicturebackend.utils.ColorSimilarUtils;
import com.sdfkl.zhepicturebackend.utils.ColorTransformUtils;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.awt.*;
import java.io.IOException;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author user
 * @description 针对表【picture(图片)】的数据库操作Service实现
 * @createDate 2026-03-19 19:11:30
 */
@Slf4j
@Service
public class PictureServiceImpl extends ServiceImpl<PictureMapper, Picture>
        implements PictureService {
    @Resource
    private FileManager fileManager;
    @Resource
    private UserService userService;
    @Resource
    private FilePictureUpload filePictureUpload;
    @Resource
    private UrlPictureUpload urlPictureUpload;
    @Resource
    private CosManager cosManager;
    @Resource
    private SpaceService spaceService;
    @Resource
    private TransactionTemplate transactionTemplate;
    @Resource
    private AliYunAIApi aliYunAIApi;

    /**
     * 上传图片
     * @param inputResource        输入资源
     * @param pictureUploadRequest 图片信息
     * @param loginUser            登录用户
     * @return 图片信息
     */
    @Override
    public PictureVO uploadPicture(Object inputResource, PictureUploadRequest pictureUploadRequest, User loginUser) {
        // 校验参数
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        // 校验空间是否存在
        Long spaceId = pictureUploadRequest.getSpaceId();
        if(spaceId != null){
            Space space = spaceService.getById(spaceId);
            ThrowUtils.throwIf(space == null,ErrorCode.NOT_FOUND_ERROR,"空间不存在");
            // 校验是否有空间权限，仅空间管理员才能上传
            if(!loginUser.getId().equals(space.getUserId())){
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR,"没有空间权限");
            }
            // 校验额度
            if(space.getTotalCount() >= space.getMaxCount()){
                throw new BusinessException(ErrorCode.OPERATION_ERROR,"空间已满");
            }
            if(space.getTotalSize() >= space.getMaxSize()){
                throw new BusinessException(ErrorCode.OPERATION_ERROR,"空间已满");
            }
        }
        // 判断是新增还是删除
        Long pictureId = null;
        if (pictureUploadRequest != null) {
            pictureId = pictureUploadRequest.getId();
        }
        // 如果是更新，判断图片是否存在
        if (pictureId != null) {
            Picture oldPicture = this.getById(pictureId);
            ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
            // 仅本人或管理员可编辑图片
            if (!oldPicture.getUserId().equals(loginUser.getId()) && !userService.isAdmin(loginUser)) {
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
            // 校验空间是否一致
            // 没传 spaceId，则服用原有图片的 spaceId
            if(spaceId == null){
                if(oldPicture.getSpaceId() != null){
                    spaceId = oldPicture.getSpaceId();
                }
            }else {
                // 传了 spaceId，必须和原图片的空间 id 一致
                if(ObjectUtil.notEqual(spaceId,oldPicture.getSpaceId())){
                    throw new BusinessException(ErrorCode.PARAMS_ERROR,"空间不一致");
                }
            }
        }
        // 上传图片，得到图片信息
        // 按照用户 id 划分目录 => 按照空间划分目录
        String uploadPathPrefix;
        if(spaceId == null){
            // 公共图库
            uploadPathPrefix = String.format("public/%s", loginUser.getId());
        }else {
            // 空间
            uploadPathPrefix = String.format("space/%s", spaceId);
        }
        PictureUploadTemplate pictureUploadTemplate = filePictureUpload;
        if (inputResource instanceof String) {
            pictureUploadTemplate = urlPictureUpload;
        }
        UploadPictureResult uploadPictureResult = pictureUploadTemplate.uploadPicture(inputResource, uploadPathPrefix);
        // 构造要入库的图片信息
        Picture picture = new Picture();
        picture.setSpaceId(spaceId);
        picture.setUrl(uploadPictureResult.getUrl());
        picture.setThumbnailUrl(uploadPictureResult.getThumbnailUrl());
        // 支持外层传递图片名称
        String picName = uploadPictureResult.getPicName();
        if(pictureUploadRequest != null && StrUtil.isNotBlank(pictureUploadRequest.getPicName())){
            picName = pictureUploadRequest.getPicName();
        }
        picture.setName(picName);
        picture.setPicSize(uploadPictureResult.getPicSize());
        picture.setPicWidth(uploadPictureResult.getPicWidth());
        picture.setPicHeight(uploadPictureResult.getPicHeight());
        picture.setPicScale(uploadPictureResult.getPicScale());
        picture.setPicFormat(uploadPictureResult.getPicFormat());
//        picture.setPicColor(uploadPictureResult.getPicColor());
        picture.setPicColor(ColorTransformUtils.getStandardColor(uploadPictureResult.getPicColor()));
        picture.setUserId(loginUser.getId());
        // 填充审核参数
        this.fillReviewParams(picture, loginUser);
        // 操作数据库
        // 如果 pictureId 不为空，需要补充 id 和 编辑时间
        if (pictureId != null) {
            picture.setId(pictureId);
            picture.setEditTime(new Date());
        }
        // 开启事务
        Long finalSpaceId = spaceId;
        transactionTemplate.execute(status -> {
            boolean result = this.saveOrUpdate(picture);
            ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR, "图片上传失败，数据库操作错误");
            if (finalSpaceId != null) {
                boolean update = spaceService.lambdaUpdate()
                        .eq(Space::getId, finalSpaceId)
                        .setSql("totalSize = totalSize + " + picture.getPicSize())
                        .setSql("totalCount = totalCount + 1")
                        .update();
                ThrowUtils.throwIf(!update, ErrorCode.OPERATION_ERROR, "额度更新失败");
            }
            return true;
        });
        return PictureVO.objectToVO(picture);
    }

    /**
     * 获取查询条件
     *
     * @param pictureQueryRequest 图片查询条件
     * @return 获取查询条件
     */
    @Override
    public QueryWrapper<Picture> getQueryWrapper(PictureQueryRequest pictureQueryRequest) {
        if (pictureQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请求参数为空");
        }
        // 从对象中取值
        Long id = pictureQueryRequest.getId();
        String name = pictureQueryRequest.getName();
        String introduction = pictureQueryRequest.getIntroduction();
        String category = pictureQueryRequest.getCategory();
        List<String> tags = pictureQueryRequest.getTags();
        Long picSize = pictureQueryRequest.getPicSize();
        Integer picWidth = pictureQueryRequest.getPicWidth();
        Integer picHeight = pictureQueryRequest.getPicHeight();
        Double picScale = pictureQueryRequest.getPicScale();
        String picFormat = pictureQueryRequest.getPicFormat();
        String searchText = pictureQueryRequest.getSearchText();
        Long userId = pictureQueryRequest.getUserId();
        Long spaceId = pictureQueryRequest.getSpaceId();
        Boolean nullSpaceId = pictureQueryRequest.getNullSpaceId();
        Integer reviewStatus = pictureQueryRequest.getReviewStatus();
        String reviewMessage = pictureQueryRequest.getReviewMessage();
        Long reviewerId = pictureQueryRequest.getReviewerId();
        String sortField = pictureQueryRequest.getSortField();
        String sortOrder = pictureQueryRequest.getSortOrder();
        Date startEditTime = pictureQueryRequest.getStartEditTime();
        Date endEditTime = pictureQueryRequest.getEndEditTime();


        QueryWrapper<Picture> queryWrapper = new QueryWrapper<>();

        // 从多字段中搜索
        if(StrUtil.isNotBlank(searchText)){
            queryWrapper.and(qw -> qw.like("name", searchText)
                    .or()
                    .like("introduction", searchText)
            );
        }
        queryWrapper.eq(ObjectUtil.isNotEmpty(id), "id", id);
        queryWrapper.like(StrUtil.isNotBlank(name), "name", name);
        queryWrapper.like(StrUtil.isNotBlank(introduction), "introduction", introduction);
        queryWrapper.eq(StrUtil.isNotBlank(category), "category", category);
        queryWrapper.eq(ObjectUtil.isNotEmpty(picSize), "picSize", picSize);
        queryWrapper.eq(ObjectUtil.isNotEmpty(picWidth), "picWidth", picWidth);
        queryWrapper.eq(ObjectUtil.isNotEmpty(picHeight), "picHeight", picHeight);
        queryWrapper.eq(ObjectUtil.isNotEmpty(picScale), "picScale", picScale);
        queryWrapper.eq(StrUtil.isNotBlank(picFormat), "picFormat", picFormat);
        queryWrapper.eq(ObjectUtil.isNotEmpty(userId), "userId", userId);
        queryWrapper.eq(ObjectUtil.isNotEmpty(spaceId), "spaceId", spaceId);
        queryWrapper.isNull(Boolean.TRUE.equals(nullSpaceId), "spaceId");
        queryWrapper.eq(ObjectUtil.isNotEmpty(reviewStatus), "reviewStatus", reviewStatus);
        queryWrapper.like(StrUtil.isNotBlank(reviewMessage), "reviewMessage", reviewMessage);
        queryWrapper.eq(ObjectUtil.isNotEmpty(reviewerId), "reviewerId", reviewerId);
        queryWrapper.ge(ObjectUtil.isNotEmpty(startEditTime), "editTime", startEditTime);
        queryWrapper.lt(ObjectUtil.isNotEmpty(endEditTime), "editTime", endEditTime);
        // JSON 数组查询
        if(CollUtil.isNotEmpty(tags)){
            for (String tag : tags) {
                queryWrapper.like("tags", "\"" + tag + "\"");
            }
        }
        queryWrapper.orderBy(StrUtil.isNotEmpty(sortField), sortOrder.equals("ascend"), sortField);
        return queryWrapper;
    }

    /**
     * 获取图片信息
     *
     * @param picture     图片
     * @param request     请求
     * @return 图片信息
     */
    @Override
    public PictureVO getPictureVO(Picture picture, HttpServletRequest request){
        // 对象转封装类
        PictureVO pictureVO = PictureVO.objectToVO(picture);
        // 关联查询用户信息
        Long userId = picture.getUserId();
        if(userId != null && userId > 0){
            User user = userService.getById(userId);
            UserVO userVO = userService.getUserVO(user);
            pictureVO.setUserVO(userVO);
        }
        return pictureVO;
    }

    /**
     * 获取图片信息
     *
     * @param picturePage 图片分页
     * @param request     请求
     * @return 图片信息
     */
    @Override
    public Page<PictureVO> getPictureVOPage(Page<Picture> picturePage, HttpServletRequest request) {
        List<Picture> pictureList = picturePage.getRecords();
        Page<PictureVO> pictureVOPage = new Page<>(picturePage.getCurrent(), picturePage.getSize(), picturePage.getTotal());
        if(CollUtil.isEmpty(pictureList)){
            return pictureVOPage;
        }
        // 对象列表 => 封装对象列表
        List<PictureVO> pictureVOList = pictureList.stream().map(PictureVO::objectToVO).collect(Collectors.toList());
        // 1. 关联查询用户信息
        Set<Long> userIdSet = pictureList.stream().map(Picture::getUserId).collect(Collectors.toSet());
        Map<Long, List<User>> userIdUserListMap = userService.listByIds(userIdSet).stream()
                .collect(Collectors.groupingBy(User::getId));
        // 2. 填充信息
        pictureVOList.forEach(pictureVO -> {
            Long userId = pictureVO.getUserId();
            User user = null;
            if(userIdUserListMap.containsKey(userId)){
                user = userIdUserListMap.get(userId).get(0);
            }
            pictureVO.setUserVO(userService.getUserVO(user));
        });
        pictureVOPage.setRecords(pictureVOList);
        return pictureVOPage;
    }

    /**
     * 验证图片信息
     *
     * @param picture 图片信息
     */
    @Override
    public void validPicture(Picture picture){
        ThrowUtils.throwIf(picture == null, ErrorCode.PARAMS_ERROR, "图片不存在");
        // 从对象中取值
        Long id = picture.getId();
        String url = picture.getUrl();
        String introduction = picture.getIntroduction();
        // 修改数据时，id 不能为空，有参数则校验
        ThrowUtils.throwIf(ObjectUtil.isNull(id),ErrorCode.PARAMS_ERROR,"id 不能为空");
        if(StrUtil.isNotBlank(url)){
            ThrowUtils.throwIf(url.length() > 1024, ErrorCode.PARAMS_ERROR, "url 过长");
        }
        if(StrUtil.isNotBlank(introduction)){
            ThrowUtils.throwIf(introduction.length() > 800, ErrorCode.PARAMS_ERROR, "简介过长");
        }
    }

    /**
     * 图片审核
     *
     * @param pictureReviewRequest 图片审核请求
     * @param loginUser            登录用户
     */
    @Override
    public void doPictureReview(PictureReviewRequest pictureReviewRequest, User loginUser) {
        //1. 参数校验
        ThrowUtils.throwIf(pictureReviewRequest == null, ErrorCode.PARAMS_ERROR);
        Long id = pictureReviewRequest.getId();
        Integer reviewStatus = pictureReviewRequest.getReviewStatus();
        String reviewMessage = pictureReviewRequest.getReviewMessage();
        PictureReviewStatusEnum pictureReviewStatusEnum = PictureReviewStatusEnum.getEnumByValue(reviewStatus);
        if (id == null || pictureReviewStatusEnum == null || pictureReviewStatusEnum.equals(PictureReviewStatusEnum.REVIEWING)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        // 2. 判断图片是否存在
        Picture oldPicture = this.getById(id);
        ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR);
        // 3. 校验审核状态是否重复
        if (oldPicture.getReviewStatus().equals(reviewStatus)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请勿重复审核");
        }
        //4. 操作数据库
        Picture picture = BeanUtil.copyProperties(pictureReviewRequest, Picture.class);
        picture.setReviewerId(loginUser.getId());
        picture.setReviewTime(new Date());
        boolean result = this.updateById(picture);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
    }

    /**
     * 填充审核参数
     *
     * @param picture   图片
     * @param loginUser 登录用户
     */
    @Override
    public void fillReviewParams(Picture picture, User loginUser) {
        if (userService.isAdmin(loginUser)) {
            // 管理员自动过审
            picture.setReviewerId(loginUser.getId());
            picture.setReviewTime(new Date());
            picture.setReviewStatus(PictureReviewStatusEnum.PASS.getValue());
            picture.setReviewMessage("管理员审核通过");
        } else {
            // 非管理员，无论是编辑还是创建默认都是待审核
            picture.setReviewStatus(PictureReviewStatusEnum.REVIEWING.getValue());
        }
    }

    /**
     * 批量上传图片
     *
     * @param pictureUploadByBatchRequest 图片上传请求
     * @param loginUser                   登录用户
     * @return 图片数量
     */
    @Override
    public Integer uploadPictureByBatch(PictureUploadByBatchRequest pictureUploadByBatchRequest, User loginUser) {
        // 校验参数
        String searchText = pictureUploadByBatchRequest.getSearchText();
        Integer count = pictureUploadByBatchRequest.getCount();
        String namePrefix = pictureUploadByBatchRequest.getNamePrefix();

        if (StrUtil.isBlank(namePrefix)) {
            namePrefix = searchText;
        }

        ThrowUtils.throwIf(count > 30, ErrorCode.PARAMS_ERROR, "最多上传30张图片");

        // ✅ 使用 async 接口（更稳定）
        String fetchUrl = String.format(
                "https://cn.bing.com/images/async?q=%s&first=0&mmasync=1",
                searchText
        );

        Document document;
        try {
            document = Jsoup.connect(fetchUrl)
                    .userAgent("Mozilla/5.0")
                    .timeout(10000)
                    .get();
        } catch (IOException e) {
            log.error("获取页面失败", e);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "获取页面失败");
        }

        // ✅ 改这里：解析 a.iusc
        Elements elements = document.select("a.iusc");

        if (ObjectUtil.isEmpty(elements)) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "获取图片失败");
        }

        int uploadCount = 0;

        for (Element element : elements) {
            try {
                String json = element.attr("m");

                if (StrUtil.isBlank(json)) {
                    continue;
                }

                // ✅ 解析 JSON
                JSONObject obj = JSONUtil.parseObj(json);

                // 原图地址
                String fileUrl = obj.getStr("murl");

                if (StrUtil.isBlank(fileUrl)) {
                    continue;
                }

                // 去掉参数（可选）
                int questionMarkIndex = fileUrl.indexOf("?");
                if (questionMarkIndex > -1) {
                    fileUrl = fileUrl.substring(0, questionMarkIndex);
                }

                // 上传图片
                PictureUploadRequest pictureUploadRequest = new PictureUploadRequest();
                pictureUploadRequest.setFileUrl(fileUrl);
                String suffix = getSuffixByContentType(fileUrl);
                String fileName = namePrefix + "_" + (uploadCount + 1) + "." + suffix;

                pictureUploadRequest.setPicName(fileName);

                PictureVO pictureVO = this.uploadPicture(fileUrl, pictureUploadRequest, loginUser);

                log.info("图片上传成功,id:{}", pictureVO.getId());

                uploadCount++;

            } catch (Exception e) {
                log.error("图片处理失败", e);
                continue;
            }

            if (uploadCount >= count) {
                break;
            }
        }

        return uploadCount;
    }
    private String getSuffixByContentType(String fileUrl) {
        try {
            HttpResponse response = HttpUtil.createRequest(Method.HEAD, fileUrl).execute();
            String contentType = response.header("Content-Type");

            if (contentType == null) return "jpg";

            if (contentType.contains("jpeg")) return "jpg";
            if (contentType.contains("png")) return "png";
            if (contentType.contains("webp")) return "webp";
            if (contentType.contains("gif")) return "gif";

        } catch (Exception e) {
            e.printStackTrace();
        }
        return "jpg";
    }

    /**
     * 清理图片文件
     * @param oldPicture 图片信息
     */
    @Async
    @Override
    public void clearPictureFile(Picture oldPicture){
        // 判断图片是否被多条记录使用
        String pictureUrl = oldPicture.getUrl();
        Long count = this.lambdaQuery()
                .eq(Picture::getUrl, pictureUrl)
                .count();
        // 不止一条记录，不清理
        if(count > 1) return;
        // 删除图片
        cosManager.deleteObject(pictureUrl);
        // 删除缩略图
        String thumbnailUrl = oldPicture.getThumbnailUrl();
        if(StrUtil.isNotBlank(thumbnailUrl)){
            cosManager.deleteObject(thumbnailUrl);
        }
    }

    /**
     * 检查图片权限
     * @param picture 图片信息
     * @param loginUser 登录用户
     */
    @Override
    public void checkPictureAuth(Picture picture, User loginUser){
        Long loginUserId = loginUser.getId();
        Long spaceId = picture.getSpaceId();
        if(spaceId == null){
            // 公共图库，仅本人或管理员可操作
            if(!picture.getUserId().equals(loginUserId) && !userService.isAdmin(loginUser)){
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
        }else {
            // 私有空间，仅空间管理员可操作
            if(!picture.getUserId().equals(loginUserId)){
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
        }
    }

    /**
     * 删除图片
     * @param deleteRequest 删除请求
     * @param loginUser 登录用户
     */
    @Override
    public void deletePicture(DeleteRequest deleteRequest,User loginUser) {
        Long id = deleteRequest.getId();
        Picture oldPicture = this.getById(id);
        ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
        //this.checkPictureAuth(oldPicture, loginUser);
        boolean result = this.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        this.clearPictureFile(oldPicture);
    }

    /**
     * 编辑图片
     * @param pictureEditRequest 图片编辑
     * @param loginUser 登录用户
     */
    @Override
    public void editPicture(PictureEditRequest pictureEditRequest, User loginUser) {
        // 在此处将实体类和 DTO 进行转换
        Picture picture = BeanUtil.copyProperties(pictureEditRequest, Picture.class);
        // 注意将 list 转为 string
        picture.setTags(JSONUtil.toJsonStr(pictureEditRequest.getTags()));
        // 设置编辑时间
        picture.setEditTime(new Date());
        // 数据校验
        this.validPicture(picture);
        // 判断是否存在
        Long id = pictureEditRequest.getId();
        Picture oldPicture = this.getById(id);
        ThrowUtils.throwIf(oldPicture == null, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
        //this.checkPictureAuth(oldPicture, loginUser);
        // 填充审核参数
        this.fillReviewParams(picture, loginUser);
        // 操作数据库
        boolean result = this.updateById(picture);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR, "图片更新失败");
    }

    /**
     * 根据颜色搜索图片
     *
     * @param spaceId   空间id
     * @param picColor  颜色
     * @param loginUser 登录用户
     * @return 图片视图列表
     */
    @Override
    public List<PictureVO> searchPictureByColor(Long spaceId, String picColor, User loginUser) {
        //1. 校验参数
        ThrowUtils.throwIf(spaceId == null || StrUtil.isBlank(picColor), ErrorCode.PARAMS_ERROR);
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        //2. 校验空间权限
        Space space = spaceService.getById(spaceId);
        ThrowUtils.throwIf(space == null, ErrorCode.NOT_FOUND_ERROR, "空间不存在");
        if (!space.getUserId().equals(loginUser.getId())) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR, "没用空间访问权限");
        }
        //3. 查询该空间下的所有图片
        List<Picture> pictureList = this.lambdaQuery()
                .eq(Picture::getSpaceId, spaceId)
                .isNotNull(Picture::getPicColor)
                .list();
        // 如果没有图片，返回空列表
        if (CollUtil.isEmpty(pictureList)) {
            return new ArrayList<>();
        }
        // 将颜色字符串转换成主色调
        Color targetColor = Color.decode(picColor);
        //4. 计算图片颜色相似度并排序
        List<Picture> sortedPictureList = pictureList.stream()
                .sorted(Comparator.comparingDouble(picture -> {
                    String hexColor = picture.getPicColor();
                    // 没有主色调的图片会默认排序到最后
                    if (StrUtil.isBlank(hexColor)) {
                        return Double.MAX_VALUE;
                    }
                    Color pictureColor = Color.decode(hexColor);
                    return -ColorSimilarUtils.calculateSimilarity(targetColor, pictureColor);
                }))
                .limit(12)
                .collect(Collectors.toList());
        //5. 返回结果
        return sortedPictureList.stream()
                .map(PictureVO::objectToVO)
                .collect(Collectors.toList());
    }

    /**
     * 图片批量修改
     * @param pictureEditByBatchRequest 图片批量修改请求
     * @param loginUser                 登录用户
     */
    @Override
    public void editPictureByBatch(PictureEditByBatchRequest pictureEditByBatchRequest, User loginUser) {
        //1. 校验参数
        List<Long> pictureIdList = pictureEditByBatchRequest.getPictureIdList();
        Long spaceId = pictureEditByBatchRequest.getSpaceId();
        String category = pictureEditByBatchRequest.getCategory();
        List<String> tags = pictureEditByBatchRequest.getTags();
        ThrowUtils.throwIf(CollUtil.isEmpty(pictureIdList), ErrorCode.PARAMS_ERROR);
        ThrowUtils.throwIf(spaceId == null || spaceId <= 0, ErrorCode.PARAMS_ERROR);
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        //2. 校验空间权限
        Space space = spaceService.getById(spaceId);
        ThrowUtils.throwIf(space == null,ErrorCode.NOT_FOUND_ERROR,"空间不存在");
        if(!space.getUserId().equals(loginUser.getId())){
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR,"没有空间访问权限");
        }
        //3. 查询指定图片
        List<Picture> pictureList = this.lambdaQuery()
                .select(Picture::getId, Picture::getSpaceId)
                .eq(Picture::getSpaceId, spaceId)
                .in(Picture::getId, pictureIdList)
                .list();
        if(pictureList.isEmpty()){
            return;
        }
        //4. 更新
        pictureList.forEach(picture -> {
            if(StrUtil.isNotBlank(category)){
                picture.setCategory(category);
            }
            if(CollUtil.isNotEmpty(tags)){
                picture.setTags(JSONUtil.toJsonStr(tags));
            }
        });
        String nameRule = pictureEditByBatchRequest.getNameRule();
        fillPictureWithNameRule(pictureList, nameRule);
        //5. 操作数据库
        boolean result = this.updateBatchById(pictureList);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR,"批量编辑失败");
    }

    /**
     * nameRule 格式：图片{序号}
     * @param pictureList 图片列表
     * @param nameRule 命名规则
     */
    private void fillPictureWithNameRule(List<Picture> pictureList, String nameRule) {
        if(StrUtil.isBlank(nameRule) || CollUtil.isEmpty(pictureList)){
            return;
        }
        long count = 1;
        try {
            for (Picture picture : pictureList) {
                String pictureName = nameRule.replaceAll("\\{序号}", String.valueOf(count++));
                picture.setName(pictureName);
            }
        } catch (Exception e){
            log.error("名称解析错误",e);
            throw new BusinessException(ErrorCode.OPERATION_ERROR,"名称解析错误");
        }
    }

    /**
     * 创建 AI 扩图任务
     *
     * @param createPictureOutPaintingTaskRequest 图片外绘任务创建请求
     * @param loginUser                           登录用户
     * @return 创建的图片外绘任务响应
     */
    @Override
    public CreateOutPaintingTaskResponse createOutPaintingTask(
            CreatePictureOutPaintingTaskRequest createPictureOutPaintingTaskRequest,
            User loginUser
    ) throws JsonProcessingException {
        // 获取图片信息
        Long pictureId = createPictureOutPaintingTaskRequest.getPictureId();
        Picture picture = Optional.ofNullable(this.getById(pictureId))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_ERROR, "图片不存在"));

        // 校验权限
        // checkPictureAuth(picture, loginUser);

        // 参数校验
        PictureOutPaintingParams dtoParams = createPictureOutPaintingTaskRequest.getParameters();
        if (dtoParams == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "扩图参数不能为空");
        }

        if(picture.getPicWidth() < 512 || picture.getPicHeight() < 512){
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片宽高不能小于512");
        }

        int leftOffset = dtoParams.getLeftOffset() == null ? 0 : dtoParams.getLeftOffset();
        int rightOffset = dtoParams.getRightOffset() == null ? 0 : dtoParams.getRightOffset();
        int topOffset = dtoParams.getTopOffset() == null ? 0 : dtoParams.getTopOffset();
        int bottomOffset = dtoParams.getBottomOffset() == null ? 0 : dtoParams.getBottomOffset();

        Double xScale = dtoParams.getXScale();
        Double yScale = dtoParams.getYScale();

        Boolean addWatermark = dtoParams.getAddWatermark();
        Integer angle = dtoParams.getAngle();
        String outputRatio = dtoParams.getOutputRatio();
        Boolean limitImageSize = dtoParams.getLimitImageSize();
        Boolean bestQuality = dtoParams.getBestQuality();

        boolean useOffsetMode =
                (leftOffset > 0 || rightOffset > 0 || topOffset > 0 || bottomOffset > 0)
                        && xScale == null
                        && yScale == null;

        boolean useScaleMode =
                xScale != null
                        && yScale != null
                        && leftOffset == 0
                        && rightOffset == 0
                        && topOffset == 0
                        && bottomOffset == 0;

        if (!useOffsetMode && !useScaleMode) {
            throw new BusinessException(
                    ErrorCode.PARAMS_ERROR,
                    String.format(
                            "扩图参数不合法: left=%s,right=%s,top=%s,bottom=%s,xScale=%s,yScale=%s",
                            leftOffset, rightOffset, topOffset, bottomOffset, xScale, yScale
                    )
            );
        }

        // 创建扩图任务
        CreateOutPaintingTaskRequest createOutPaintingTaskRequest = new CreateOutPaintingTaskRequest();

        CreateOutPaintingTaskRequest.Input input = new CreateOutPaintingTaskRequest.Input();
        input.setImageUrl(picture.getUrl());
        createOutPaintingTaskRequest.setInput(input);

        CreateOutPaintingTaskRequest.Parameters params = new CreateOutPaintingTaskRequest.Parameters();

        if (useOffsetMode) {
            params.setLeftOffset(leftOffset);
            params.setRightOffset(rightOffset);
            params.setTopOffset(topOffset);
            params.setBottomOffset(bottomOffset);
        }

        if (useScaleMode) {
            params.setXScale(xScale == null ? null : xScale.floatValue());
            params.setYScale(yScale == null ? null : yScale.floatValue());
        }

        params.setAddWatermark(addWatermark);
        params.setAngle(angle);
        params.setOutputRatio(outputRatio);
        params.setLimitImageSize(limitImageSize);
        params.setBestQuality(bestQuality);

        createOutPaintingTaskRequest.setParameters(params);

        // 创建任务
        return aliYunAIApi.createOutPaintingTask(createOutPaintingTaskRequest, loginUser);
    }
}




