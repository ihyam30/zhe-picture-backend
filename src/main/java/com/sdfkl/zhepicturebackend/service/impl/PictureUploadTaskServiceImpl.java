package com.sdfkl.zhepicturebackend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sdfkl.zhepicturebackend.mapper.PictureUploadTaskMapper;
import com.sdfkl.zhepicturebackend.model.entity.PictureUploadTask;
import com.sdfkl.zhepicturebackend.service.PictureUploadTaskService;
import org.springframework.stereotype.Service;

@Service
public class PictureUploadTaskServiceImpl extends ServiceImpl<PictureUploadTaskMapper, PictureUploadTask>
        implements PictureUploadTaskService {
}
