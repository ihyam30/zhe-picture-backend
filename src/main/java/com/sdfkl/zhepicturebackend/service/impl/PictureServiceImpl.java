package com.sdfkl.zhepicturebackend.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import com.sdfkl.zhepicturebackend.exception.ThrowUtils;
import com.sdfkl.zhepicturebackend.manager.FileManager;
import com.sdfkl.zhepicturebackend.model.dto.file.UploadPictureResult;
import com.sdfkl.zhepicturebackend.model.dto.picture.PictureQueryRequest;
import com.sdfkl.zhepicturebackend.model.dto.picture.PictureUploadRequest;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.vo.PictureVO;
import com.sdfkl.zhepicturebackend.model.vo.UserVO;
import com.sdfkl.zhepicturebackend.service.PictureService;
import com.sdfkl.zhepicturebackend.mapper.PictureMapper;
import com.sdfkl.zhepicturebackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * @author user
 * @description 针对表【picture(图片)】的数据库操作Service实现
 * @createDate 2026-03-19 19:11:30
 */
@Service
public class PictureServiceImpl extends ServiceImpl<PictureMapper, Picture>
        implements PictureService {
    @Resource
    private FileManager fileManager;
    @Autowired
    private UserService userService;

    /**
     * 上传图片
     * @param multipartFile        图片
     * @param pictureUploadRequest 图片信息
     * @param loginUser            登录用户
     * @return 图片信息
     */
    @Override
    public PictureVO uploadPicture(MultipartFile multipartFile, PictureUploadRequest pictureUploadRequest, User loginUser) {
        // 校验参数
        ThrowUtils.throwIf(loginUser == null, ErrorCode.NO_AUTH_ERROR);
        // 判断是新增还是删除
        Long pictureId = null;
        if (pictureUploadRequest != null) {
            pictureId = pictureUploadRequest.getId();
        }
        // 如果是更新，判断图片是否存在
        if (pictureId != null) {
            boolean exists = this.lambdaQuery()
                    .eq(Picture::getId, pictureId)
                    .exists();
            ThrowUtils.throwIf(!exists, ErrorCode.NOT_FOUND_ERROR, "图片不存在");
        }
        // 上传图片，得到图片信息
        // 按照用户 id 划分目录
        String uploadPathPrefix = String.format("public/%s", loginUser.getId());
        UploadPictureResult uploadPictureResult = fileManager.uploadPicture(multipartFile, uploadPathPrefix);
        // 构造要入库的图片信息
        Picture picture = new Picture();
        picture.setUrl(uploadPictureResult.getUrl());
        picture.setName(uploadPictureResult.getPicName());
        picture.setPicSize(uploadPictureResult.getPicSize());
        picture.setPicWidth(uploadPictureResult.getPicWidth());
        picture.setPicHeight(uploadPictureResult.getPicHeight());
        picture.setPicScale(uploadPictureResult.getPicScale());
        picture.setPicFormat(uploadPictureResult.getPicFormat());
        picture.setUserId(loginUser.getId());
        // 操作数据库
        // 如果 pictureId 不为空，需要补充 id 和 编辑时间
        if (pictureId != null) {
            picture.setId(pictureId);
            picture.setEditTime(new Date());
        }
        boolean result = this.saveOrUpdate(picture);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR, "图片上传失败，数据库操作错误");
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
        String sortField = pictureQueryRequest.getSortField();
        String sortOrder = pictureQueryRequest.getSortOrder();

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
}




