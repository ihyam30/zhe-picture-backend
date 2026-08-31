<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadFile, UploadFiles } from 'element-plus';
import { editPicture, uploadPicture, uploadPictureByUrl } from '@/api/picture';
import SpaceSelect from '@/components/space/SpaceSelect.vue';
import type { Id } from '@/types/common';
import type { PictureVO } from '@/types/picture';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    categoryOptions?: string[];
    tagOptions?: string[];
  }>(),
  {
    categoryOptions: () => [],
    tagOptions: () => [],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [picture?: PictureVO];
}>();

const submitting = ref(false);
const fileList = ref<UploadFile[]>([]);
const selectedFile = ref<File | null>(null);

const form = reactive({
  sourceType: 'local',
  fileUrl: '',
  picName: '',
  spaceId: '' as Id | '',
  introduction: '',
  category: '',
  tags: [] as string[],
});

function resetForm() {
  form.sourceType = 'local';
  form.fileUrl = '';
  form.picName = '';
  form.spaceId = '';
  form.introduction = '';
  form.category = '';
  form.tags = [];
  fileList.value = [];
  selectedFile.value = null;
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      resetForm();
    }
  },
);

function close() {
  emit('update:modelValue', false);
}

function handleFileChange(uploadFile: UploadFile, uploadFiles: UploadFiles) {
  fileList.value = uploadFiles.slice(-1);
  selectedFile.value = uploadFile.raw || null;
}

async function handleSubmit() {
  const spaceId = form.spaceId || undefined;
  if (form.sourceType === 'local' && !selectedFile.value) {
    ElMessage.warning('请先选择本地图片');
    return;
  }
  if (form.sourceType === 'url' && !form.fileUrl.trim()) {
    ElMessage.warning('请输入图片 URL');
    return;
  }

  submitting.value = true;
  try {
    let picture: PictureVO;
    if (form.sourceType === 'local' && selectedFile.value) {
      picture = await uploadPicture(selectedFile.value, {
        picName: form.picName || undefined,
        spaceId,
      });
    } else {
      picture = await uploadPictureByUrl({
        fileUrl: form.fileUrl.trim(),
        picName: form.picName || undefined,
        spaceId,
      });
    }

    const hasMoreMetadata =
      !!form.picName ||
      !!form.introduction ||
      !!form.category ||
      form.tags.length > 0;

    if (hasMoreMetadata && picture.id) {
      await editPicture({
        id: picture.id,
        name: form.picName || undefined,
        introduction: form.introduction || undefined,
        category: form.category || undefined,
        tags: form.tags.length ? [...form.tags] : undefined,
      });
    }

    ElMessage.success('图片上传成功');
    emit('success', picture);
    close();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="创建图片"
    width="820px"
    destroy-on-close
    class="picture-upload-dialog"
    @close="close"
  >
    <div class="dialog-intro">
      <div class="dialog-intro-title">选择上传方式并补充图片信息</div>
      <div class="dialog-intro-text">支持本地文件上传和通过 URL 创建图片，空间、分类与标签可一次补齐。</div>
    </div>

    <el-tabs v-model="form.sourceType" class="upload-tabs">
      <el-tab-pane label="本地上传" name="local" />
      <el-tab-pane label="URL 上传" name="url" />
    </el-tabs>

    <el-form label-width="92px" class="upload-form">
      <el-form-item v-if="form.sourceType === 'local'" label="图片文件" required>
        <el-upload
          :auto-upload="false"
          :limit="1"
          :file-list="fileList"
          list-type="picture-card"
          accept="image/*"
          class="upload-picker"
          @change="handleFileChange"
        >
          <div class="upload-picker-text">选择图片</div>
        </el-upload>
      </el-form-item>

      <el-form-item v-else label="图片 URL" required>
        <el-input v-model="form.fileUrl" placeholder="请输入可访问的图片链接" />
      </el-form-item>

      <el-form-item label="图片名称">
        <el-input v-model="form.picName" maxlength="40" show-word-limit placeholder="给图片起一个名称" />
      </el-form-item>

      <el-form-item label="所属空间">
        <SpaceSelect v-model="form.spaceId" :include-public="true" placeholder="不选则上传到公共图库" />
      </el-form-item>

      <el-form-item label="图片简介">
        <el-input
          v-model="form.introduction"
          type="textarea"
          :rows="3"
          maxlength="240"
          show-word-limit
          placeholder="可以补充来源、用途或备注信息"
        />
      </el-form-item>

      <div class="upload-form-grid">
        <el-form-item label="分类" class="upload-form-grid-item">
          <el-select v-model="form.category" clearable filterable style="width: 100%" placeholder="请选择分类">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="标签" class="upload-form-grid-item">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="选择或输入标签"
          >
            <el-option v-for="item in tagOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '上传中...' : '开始创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-intro {
  margin-bottom: 14px;
}

.dialog-intro-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.dialog-intro-text {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.upload-tabs {
  margin-bottom: 10px;
}

.upload-form {
  padding-top: 2px;
}

.upload-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
}

.upload-form-grid-item {
  margin-bottom: 0;
}

.upload-picker :deep(.el-upload--picture-card),
.upload-picker :deep(.el-upload-list__item) {
  width: 144px;
  height: 144px;
  border-radius: 18px;
}

.upload-picker-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.picture-upload-dialog .el-dialog) {
  border-radius: 26px;
  overflow: hidden;
}

:deep(.picture-upload-dialog .el-dialog__header) {
  padding: 24px 28px 10px;
}

:deep(.picture-upload-dialog .el-dialog__title) {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

:deep(.picture-upload-dialog .el-dialog__body) {
  padding: 0 28px 16px;
}

:deep(.picture-upload-dialog .el-dialog__footer) {
  padding: 8px 28px 24px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-weight: 700;
  color: var(--text-primary);
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  border-radius: 16px;
}

:deep(.el-textarea__inner) {
  min-height: 92px;
}

:deep(.el-select__tags) {
  max-width: calc(100% - 36px);
}

:deep(.el-select__tags-text) {
  max-width: 100%;
}

@media (max-width: 900px) {
  .upload-form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
