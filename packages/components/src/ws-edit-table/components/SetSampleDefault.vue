<template>
  <uvModal v-model="modal" title="默认值设置" @handleOk="handleOk">
    <template #content>
      <a-form :model="formState" ref="formRef" autocomplete="off">
        <div class="!mb-[25px] text-[16px]">样品编号</div>
        <div class="flex gap-6">
          <a-form-item
              label="名称"
              :name="['sampleNumConfig', 'preName']"
              :rules="[{ required: true, message: '请输入名称!' }]"
          >
            <a-input v-model:value="formState.sampleNumConfig.preName" />
          </a-form-item>
          <div class="relative top-[4px] left-[6px]">+</div>
          <a-form-item
              label="开始号"
              :name="['sampleNumConfig', 'startNum']"
              :rules="[{ required: true, message: '请输入开始号!' }]"
          >
            <a-input-number
                v-model:value="formState.sampleNumConfig.startNum"
                :min="0"
                :step="1"
                :precision="0"
            />
          </a-form-item>
          <a-form-item
              label="递增量"
              :name="['sampleNumConfig', 'step']"
              :rules="[{ required: true, message: '请输入递增量!' }]"
          >
            <a-input-number
                v-model:value="formState.sampleNumConfig.step"
                :min="0"
                :step="1"
                :precision="0"
            />
          </a-form-item>
        </div>
        <div class="!mt-[20px] !mb-[25px] text-[16px]">样品名称</div>
        <div class="flex gap-6">
          <a-form-item
              label="名称"
              :name="['sampleNameConfig', 'preName']"
              :rules="[{ required: true, message: '请输入名称!' }]"
          >
            <a-input v-model:value="formState.sampleNameConfig.preName" />
          </a-form-item>
          <div class="relative top-[4px] left-[6px]">+</div>
          <a-form-item
              label="开始号"
              :name="['sampleNameConfig', 'startNum']"
              :rules="[{ required: true, message: '请输入开始号!' }]"
          >
            <a-input-number
                v-model:value="formState.sampleNameConfig.startNum"
                :min="0"
                :step="1"
                :precision="0"
            />
          </a-form-item>
          <a-form-item
              label="递增量"
              :name="['sampleNameConfig', 'step']"
              :rules="[{ required: true, message: '请输入递增量!' }]"
          >
            <a-input-number
                v-model:value="formState.sampleNameConfig.step"
                :min="0"
                :step="1"
                :precision="0"
            />
          </a-form-item>
        </div>
      </a-form>
    </template>
  </uvModal>
</template>

<script lang="ts" setup>
// 弹窗
import {ref,reactive} from "vue";
import {
  Input as AInput,
  InputNumber as AInputNumber,
} from 'ant-design-vue'

const modal = ref(false)
const showModal = () => {
  const sampleDefault = localStorage.getItem('sampleDefault')
  if (sampleDefault) formState = Object.assign(formState, JSON.parse(sampleDefault))
  modal.value = true
}
const emit = defineEmits(['change:data'])
const handleOk = () => {
  formRef.value.validate().then(() => {
    localStorage.setItem('sampleDefault', JSON.stringify(formState))
    emit('change:data')
    modal.value = false
  })
}

// 表单
interface FormState {
  sampleNumConfig: {
    preName: string
    startNum: number
    step: number
  }
  sampleNameConfig: {
    preName: string
    startNum: number
    step: number
  }
}
let formState = reactive<FormState>({
  sampleNumConfig: {
    preName: 'default-',
    startNum: 1,
    step: 1,
  },
  sampleNameConfig: {
    preName: '样品',
    startNum: 1,
    step: 1,
  },
})
const formRef = ref()

defineExpose({
  showModal,
})
</script>
