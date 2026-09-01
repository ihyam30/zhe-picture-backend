package com.sdfkl.zhepicturebackend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.sdfkl.zhepicturebackend.api.aliyunai.model.CreateOutPaintingTaskResponse;
import com.sdfkl.zhepicturebackend.common.DeleteRequest;
import com.sdfkl.zhepicturebackend.model.dto.picture.*;
import com.sdfkl.zhepicturebackend.model.entity.Picture;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sdfkl.zhepicturebackend.model.entity.User;
import com.sdfkl.zhepicturebackend.model.vo.PictureVO;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * @author user
 * @description 针对表【picture(图片)】的数据库操作Service
 * @createDate 2026-03-19 19:11:30
 */
public interface PictureService extends IService<Picture> {
    /**
     * 上传图片
     *
     * @param inputResource        输入资源
     * @param pictureUploadRequest 图片信息
     * @param loginUser            登录用户
     * @return 图片信息
     */
    PictureVO uploadPicture(Object inputResource, PictureUploadRequest pictureUploadRequest, User loginUser);

    PictureVO uploadPicture(Object inputResource, PictureUploadRequest pictureUploadRequest,
                            User loginUser, String idempotencyKey);

    /**
     * 获取查询条件
     *
     * @param pictureQueryRequest 图片查询条件
     * @return 查询条件
     */
    QueryWrapper<Picture> getQueryWrapper(PictureQueryRequest pictureQueryRequest);

    /**
     * 获取图片信息
     *
     * @param picture 图片
     * @param request 请求
     * @return 图片信息
     */
    PictureVO getPictureVO(Picture picture, HttpServletRequest request);

    /**
     * 获取图片分页信息
     *
     * @param picturePage 图片分页
     * @param request     请求
     * @return 图片分页信息
     */
    Page<PictureVO> getPictureVOPage(Page<Picture> picturePage, HttpServletRequest request);

    /**
     * 校验图片信息
     *
     * @param picture 图片信息
     */
    void validPicture(Picture picture);

    /**
     * 图片审核
     *
     * @param pictureReviewRequest 图片审核信息
     * @param loginUser            登录用户
     */
    void doPictureReview(PictureReviewRequest pictureReviewRequest, User loginUser);

    /**
     * 填充审核参数
     *
     * @param picture   图片信息
     * @param loginUser 登录用户
     */
    void fillReviewParams(Picture picture, User loginUser);

    /**
     * 批量上传图片
     *
     * @param pictureUploadByBatchRequest 图片请求
     * @param loginUser                   登录用户
     * @return 图片数量
     */
    Integer uploadPictureByBatch(PictureUploadByBatchRequest pictureUploadByBatchRequest, User loginUser);

    /**
     * 清除图片文件
     * @param oldPicture 图片信息
     */
    void clearPictureFile(Picture oldPicture);

    /**
     * 检查图片权限
     * @param picture 图片信息
     * @param loginUser 登录用户
     */
    void checkPictureAuth(Picture picture, User loginUser);

    /**
     * 删除图片
     * @param deleteRequest 删除请求
     * @param loginUser 登录用户
     */
    void deletePicture(DeleteRequest deleteRequest, User loginUser);

    /**
     * 编辑图片
     * @param pictureEditRequest 图片编辑
     * @param loginUser 登录用户
     */
    void editPicture(PictureEditRequest pictureEditRequest, User loginUser);

    /**
     * 根据颜色搜索图片
     *
     * @param spaceId   空间id
     * @param picColor  颜色
     * @param loginUser 登录用户
     * @return 图片视图列表
     */
    List<PictureVO> searchPictureByColor(Long spaceId, String picColor, User loginUser);

    /**
     * 批量修改图片
     *
     * @param pictureEditByBatchRequest 图片批量修改请求
     * @param loginUser                 登录用户
     */
    void editPictureByBatch(PictureEditByBatchRequest pictureEditByBatchRequest, User loginUser);

    /**
     * 创建图片外绘任务
     *
     * @param createPictureOutPaintingTaskRequest 图片外绘任务创建请求
     * @param loginUser                           登录用户
     * @return 图片外绘任务响应
     */
    CreateOutPaintingTaskResponse createOutPaintingTask(CreatePictureOutPaintingTaskRequest createPictureOutPaintingTaskRequest, User loginUser) throws JsonProcessingException;
}
