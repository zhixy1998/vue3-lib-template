<!--
  - Module name:  ws_ui_inexus
  - Copyright (C) 2025 北京普析通用仪器有限责任公司 All Rights Reserved.
  - 此源代码仅限在公司内部使用。未经公司事先书面许可，任何单位和个人不得以任何方式复制、传播本代码的任何部分。
  - Description:
  -->

<template>
  <a-modal
      v-model:open="model"
      v-bind="$attrs"
      :title="title"
      :width="`${props.width ? props.width : props.size === 'big' ? '70%' : '30%'}`"
      @ok="handleOk"
      :bodyStyle="bodyStyle"
      :maskClosable="false"
      :footer="footer === null ? null : undefined"
      @cancel="handleCancel"
  >
    <template #footer>
      <a-button key="back" @click="handleCancel">取消</a-button>
      <a-button key="submit" type="primary" :loading="isLoading" @click="handleOk"
      >{{ okTitle }}
      </a-button>
    </template>
        <a-spin :spinning="isLoading" class="!h-full !z-10000">
          <slot name="content"></slot>
        </a-spin>
  </a-modal>
</template>
<script lang="ts" setup>
import { Modal as AModal , Button as AButton,Spin as ASpin } from 'ant-design-vue'
import type { PropType } from 'vue'
import { computed } from 'vue'
const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: 'Title',
  },
  size: {
    type: String,
    default: 'big',
  },
  width: {
    type: String,
    default: '',
  },
  okTitle: {
    type: String,
    default: '确定',
  },
  bodyStyle: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({
      padding: '20px 10% 0px 9%',
    }),
  },
  footer: {
    type: [Boolean, null] as PropType<boolean | null>,
    default: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})
// const modelWidth = computed(() => (props.size === 'big' ? '70%' : '30%'))
const emit = defineEmits(['update:modelValue', 'handleOk', 'handleCancel'])
const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
// const bodyStyle = reactive({
//   padding: '20px 10% 0px 9%',
// })
const handleOk = () => {
  emit('handleOk')
}

const handleCancel = () => {
  model.value = false
  emit('handleCancel')
}
</script>
<style lang="less" scoped>
.ant-modal .ant-modal-close-x {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  background: #113371;
  border-radius: 50%;
  color: #fff;
}

.ant-modal .ant-modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #113371;
}

.ant-modal {
  padding: 0;
  background: #ffffff;
  box-shadow: 7px 4px 8px 2px rgba(121, 121, 121, 0.34);
  border-radius: 20px;
}

.ant-modal .ant-modal-content {
  padding: 20px 0;
}

.ant-modal .ant-modal-body {
  max-height: 647px;
  overflow: auto;
  padding: 20px 28px 0 26px !important;
}

.ant-modal .ant-modal-header {
  border-bottom: 1px solid #113371;
  padding: 0 24px 12px 24px;
}

.ant-modal .ant-modal-footer {
  padding: 0 24px;
}
</style>
<!--<template>-->
<!--  <Button>智杏宇</Button>-->
<!--</template>-->
<!--<script lang="ts" setup>-->
<!--import { Button } from 'ant-design-vue'-->
<!--</script>-->