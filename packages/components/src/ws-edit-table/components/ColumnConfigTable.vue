<!--
  - Module name:  ws_ui_inexus
  - Copyright (C) 2025 北京普析通用仪器有限责任公司 All Rights Reserved.
  - 此源代码仅限在公司内部使用。未经公司事先书面许可，任何单位和个人不得以任何方式复制、传播本代码的任何部分。
  - Description:
  -->

<template>
  <ws-modal v-model="model" title="列配置" @handleOk="saveInputParamMapTableHeadFun">
    <template #content>
      <PlusCircleOutlined class="!text-xl cursor-pointer" @click="addRow" />
      <a-table :columns="columns" :data-source="tableData" size="small" :pagination="false">
        <template #name="{ record }">
          <a-input v-model:value="record.name" placeholder="请输入列名" />
        </template>
        <template #printTitle="{ record }">
          <a-input v-model:value="record.printTitle" placeholder="请输入打印列名" />
        </template>
        <template #operation="{ record, index }">
          <DeleteOutlined
              class="cursor-pointer"
              v-if="record.locate && record.locate !== 'system'"
              @click="deleteFun(record, index)"
          />
        </template>
      </a-table>
    </template>
  </ws-modal>
</template>
<script lang="ts" setup>
import {
  Input as AInput,
  Table as ATable
} from 'ant-design-vue'
import { DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons-vue'
import { cloneDeep } from 'lodash-es'
import { computed, type PropType, ref, watch } from 'vue'

import { generateUniqueId } from '../../utils/index.ts'

const props = defineProps({
  modelValue: Boolean,
  columnConfigHeaders: {
    type: Array as PropType<Record<string, any>[]>,
    default: () => [],
  },
})

const tableData = ref()
watch(
    () => props.columnConfigHeaders,
    (newValue) => {
      tableData.value = cloneDeep(newValue)
    },
    { deep: true, immediate: true },
)

const columns = [
  { title: '列名', dataIndex: 'name', slots: { customRender: 'name' }, width: 150 },
  {
    title: '打印列名',
    dataIndex: 'printTitle',
    slots: { customRender: 'printTitle' },
  },
  {
    title: '操作',
    width: 100,
    key: 'operation',
    slots: { customRender: 'operation' },
  },
]
const emit = defineEmits(['update:modelValue', 'update:configHeaders'])
const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const saveInputParamMapTableHeadFun = async () => {
  tableData.value = tableData.value
      .filter((item: any) => item.name)
      .map((item: any) => ({
        ...item,
        printTitle: item.printTitle || item.name,
        identity: item.identity || item.name,
        locate: item.locate || 'sample',
        canDel: false,
      }))
  emit('update:configHeaders', tableData.value)
  model.value = false
}
const addRow = () => {
  const newRow = { identity: generateUniqueId(), locate: 'sample' }
  tableData.value.push(newRow)
}
const deleteFun = (record: any, index: number) => {
  tableData.value = tableData.value.filter((item: any, i: number) => i !== index)
  // tableData.value = tableData.value.filter((item: any) => item.identity !== record.identity)
}
</script>
