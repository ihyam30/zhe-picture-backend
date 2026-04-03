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
    width="760px"
    destroy-on-close
    @close="close"
  >
    <el-tabs v-model="form.sourceType">
      <el-tab-pane label="本地上传" name="local" />
      <el-tab-pane label="URL 上传" name="url" />
    </el-tabs>

    <el-form label-width="96px">
      <el-form-item v-if="form.sourceType === 'local'" label="图片文件" required>
        <el-upload
          :auto-upload="false"
          :limit="1"
          :file-list="fileList"
          list-type="picture-card"
          accept="image/*"
          @change="handleFileChange"
        >
          <span>选择图片</span>
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

      <el-form-item>
        <div class="upload-space-tip">不选择空间时，前端会按“公共图库”方式提交，也就是不传 `spaceId`。</div>
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

      <el-form-item label="分类">
        <el-select v-model="form.category" clearable filterable style="width: 100%" placeholder="请选择分类">
          <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>

      <el-form-item label="标签">
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

      <el-alert
        title="上传接口主要接收文件、名称与空间。分类、标签和简介会在上传成功后自动补发编辑请求写入。"
        type="info"
        :closable="false"
        show-icon
      />
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ submitting ? '上传中...' : '开始创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.upload-space-tip {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

:deep(.el-select__tags) {
  max-width: calc(100% - 36px);
}

:deep(.el-select__tags-text) {
  max-width: 100%;
}
</style>
