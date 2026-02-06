<!--
  - Module name:  ws_ui_inexus
  - Copyright (C) 2025 北京普析通用仪器有限责任公司 All Rights Reserved.
  - 此源代码仅限在公司内部使用。未经公司事先书面许可，任何单位和个人不得以任何方式复制、传播本代码的任何部分。
  - Description:
  -->

<template>
  <div class="uv-edit-cell-table">
    <div v-if="showEdit" class="toolbar">
      <a-space>
        <a-button @click="addColumn" type="primary" size="small" v-if="showAddColumn"
        >添加列
        </a-button>
        <a-button @click="settingColumn" type="primary" size="small" v-if="showColumnConfig"
        >列配置
        </a-button>
        <a-button
            @click="settingDefaultSample"
            type="primary"
            size="small"
            class="!ml-5"
            v-if="showSetDefaultSample"
        >默认值设置
        </a-button>
        <!-- <span class="!ml-5">默认名称</span>
        <a-input
          size="small"
          v-model:value="defaultName"
          placeholder="请输入默认名称"
          class="!w-[100px]"
        ></a-input> -->
        <a-button class="!ml-5" @click="addRow" type="primary" size="small">添加行</a-button>
        <a-input-number size="small" :min="1" :max="50" v-model:value="rowNum" class="!w-[100px]"/>
        <!-- <a-button @click="copySelection" type="primary" size="small">复制</a-button> -->
        <a-button class="!ml-5 !mr-5" @click="pasteData" type="primary" size="small">粘贴</a-button>
        <a-button type="primary" size="small" @click="setParallelSamples" v-if="isParallelSamples"
        >设置平行样
        </a-button>
        <a-button
            @click="cancelParallelSamples"
            type="primary"
            size="small"
            v-if="isParallelSamples"
        >
          取消平行样
        </a-button>
        <a-button type="primary" size="small" class="!text-[#f5222d]" @click="deleteAll">
          批量删除
        </a-button>

        <!-- <a-button @click="clearSelection" type="default" size="small">清除选择</a-button> -->
      </a-space>
    </div>

    <div
        class="table-container"
        ref="tableContainer"
        @mousedown="startSelection"
        @mousemove="updateSelection"
        @mouseup="endSelection"
        @mouseleave="endSelection"
        @keydown="handleKeyDown"
        tabindex="0"
    >
      <a-table
          :columns="displayColumns"
          :data-source="dataSource"
          :row-selection="showRowSelection ? rowSelection : undefined"
          :pagination="false"
          size="small"
          bordered
          ref="tableRef"
          :scroll="{ y: 500 }"
      >
        <template #headerCell="{ column }">
          <div
              class="header-cell"
              :class="{ selected: selectedColumns.includes(column.key) }"
              @dblclick="editHeader(column.key)"
          >
            <template
                v-if="editingHeader === column.key && thIsEdit && column.canDel && !showColumnConfig"
            >
              <a-input
                  v-model:value="editingHeaderValue"
                  @blur="saveHeader"
                  @keyup.enter="saveHeader"
                  size="small"
                  autofocus
              />
            </template>
            <template v-else>
              <a-checkbox
                  v-if="column.key !== 'action' && showColumnsCheck"
                  :checked="selectedColumns.includes(column.key)"
                  @change="(e: MouseEvent) => handleColumnCheckboxChange(column.key, e)"
              />
              {{ column.title }}
              <CloseOutlined @click="deleteColumn(column.key)" v-if="column.canDel"/>
            </template>
          </div>
        </template>

        <template #bodyCell="{ text, record, column }">
          <div v-if="column.key === 'action'" class="cell">
            <slot name="operation" :record="record"></slot>
          </div>
          <div
              v-else
              class="cell"
              :class="{
              'selected-cell': isCellSelected(record.key, column.key),
              'editing-cell':
                editingCell.rowKey === record.key && editingCell.colKey === column.key,
            }"
              @dblclick="
              column.type !== 'select' &&
              !column.noEdit &&
              startEditCell(record.key, column.key, text)
            "
          >
            <template v-if="column.type === 'select'">
              <a-select v-model:value="record[column.key]" class="!w-full">
                <a-select-option v-for="option in column.options" :key="option.value">
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </template>
            <template v-else>
              <template
                  v-if="editingCell.rowKey === record.key && editingCell.colKey === column.key"
              >
                <a-input
                    v-model:value="editingCell.value"
                    @blur="saveCell(column)"
                    @keyup.enter="saveCell(column)"
                    size="small"
                />
              </template>
              <template v-else>
                <div>{{ text }}</div>
              </template>
            </template>
          </div>
        </template>
      </a-table>
    </div>
    <columnConfig
        v-model="columnVisual"
        v-if="columnVisual"
        size="smail"
        :columnConfigHeaders="colInfoValue"
        @update:configHeaders="updateConfigHeaders"
    />
    <setSampleDefault ref="setSampleDefaultRef"/>
  </div>
</template>

<script setup lang="ts">
import {CloseOutlined} from '@ant-design/icons-vue'
import type {TableColumnType} from 'ant-design-vue'
import {
  Button as AButton,
  Space as ASpace,
  Input as AInput,
  InputNumber as AInputNumber,
  Table as ATable,
  Checkbox as ACheckbox,
  Select as ASelect,
  SelectOption as ASelectOption,
  message
} from 'ant-design-vue';
import {generateUniqueId} from '../utils/index.ts'
import {computed, onMounted, type PropType, reactive, ref, watch} from 'vue'
import columnConfig from './components/ColumnConfigTable.vue'
import setSampleDefault from './components/SetSampleDefault.vue'
import {Column, DataItem, SelectionPoint, EditingCell} from './type.ts'
import { nextTick } from 'vue'

const rowNum = ref(1)
// const defaultName = ref('样品')
const props = defineProps({
  showEdit: {
    type: Boolean,
    default: true,
  },
  initialColumns: {
    type: Array as PropType<Column[]>,
    default: () => [
      {title: '姓名', dataIndex: 'name', key: 'name', width: 200},
      {title: '年龄', dataIndex: 'age', key: 'age', width: 200},
      {title: '地址', dataIndex: 'address', key: 'address'},
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        width: 120,
      },
    ],
  },
  initialData: {
    type: Array as PropType<DataItem[]>,
    default: () => [],
  },
  showColumnsCheck: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  thIsEdit: {
    type: Boolean,
    default: false,
  },
  showRowSelection: {
    type: Boolean,
    default: false,
  },
  showAddColumn: {
    type: Boolean,
    default: false,
  },
  // 列配置
  showColumnConfig: {
    type: Boolean,
    default: false,
  },
  // 样品默认值
  showSetDefaultSample: {
    type: Boolean,
    default: false,
  },
  columnConfigHeaders: {
    type: Array as PropType<Record<string, any>[]>,
    default: () => [],
  },
  // 样品类型默认值
  defaultSampleType: {
    type: String,
    default: '',
  },
  //是否显示设置平行样
  isParallelSamples: {
    type: Boolean,
    default: false,
  },
  // 测量类型
  measureType: {
    type: String,
    default: '',
  },
})
const emit = defineEmits(['update:initialData', 'colInfo', 'deleteAll'])
// 表格数据
const columns = ref<Column[]>([...(props.initialColumns as Column[])])
const dataSource = ref<DataItem[]>([...props.initialData])
const tableRef = ref(null)
const tableContainer = ref<HTMLElement | null>(null)
const colInfoValue = computed(() => {
  return columns.value
      .filter((item) => Object.prototype.hasOwnProperty.call(item, 'canDel'))
      .map((item) => {
        return {
          name: item.title,
          identity: item.dataIndex,
          printTitle: item.printTitle || item.title,
          locate: item.locate,
        }
      })
})
watch(
    () => props.initialData,
    (newValue) => {
      dataSource.value = newValue
    },
    {
      deep: true,
    },
)
// 监听 colInfoValue 的变化并触发 colInfo 事件
watch(
    () => colInfoValue.value,
    (newValue) => {
      emit('colInfo', newValue)
    },
    {deep: true},
)
watch(
    () => props.initialColumns,
    (newValue) => {
      columns.value = newValue
    },
    {
      deep: true,
    },
)
watch(
    () => dataSource.value,
    (newValue) => {
      emit('update:initialData', newValue)
    },
    {
      deep: true,
    },
)
// 选择相关状态
const selection = reactive({
  start: {rowKey: null, colKey: null} as SelectionPoint,
  end: {rowKey: null, colKey: null} as SelectionPoint,
  selecting: false,
})

// 行选择和列选择
const selectedRowKeys = ref<string[]>([])
const selectedColumns = ref<string[]>([])
const handleColumnCheckboxChange = (key: string, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  if (checked) {
    selectedColumns.value = [...selectedColumns.value, key]
  } else {
    selectedColumns.value = selectedColumns.value.filter((k) => k !== key)
  }
} // 编辑相关状态
const editingHeader = ref<string | null>(null)
const editingHeaderValue = ref('')
const editingCell = reactive<EditingCell>({
  rowKey: null,
  colKey: null,
  value: '',
})

// 复制粘贴缓冲区
const clipboard = ref<(string | number | boolean)[][]>([])

// 显示列（添加选择状态）
// 在 columns 计算属性或相关位置添加
const displayColumns = computed(() => {
  const cols = columns.value.map((col) => ({
    ...col,
    customHeaderCell: () => ({
      class: selectedColumns.value.includes(col.key) ? 'ant-table-column-selected' : '',
    }),
  }))

  // 如果启用平行样功能，添加平行样列
  if (props.isParallelSamples) {
    cols.splice(-1, 0, {
      title: '是否平行样',
      key: 'isParallelSample',
      dataIndex: 'isParallelSample',
      width: 100,
      noEdit: true,
      customCell: (record: any, index: number) => {
        return mergeCell(record, index)
      },
      customHeaderCell: () => ({
        class: selectedColumns.value.includes('isParallelSample')
            ? 'ant-table-column-selected'
            : '',
      }),
    })
  }

  return cols as TableColumnType[]
})

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (selectedKeys: string[]) => {
    selectedRowKeys.value = selectedKeys
  },
  columnWidth: 40,
}))

// 计算选择的矩形区域
const selectionRect = computed(() => {
  if (
      !selection.start.rowKey ||
      !selection.start.colKey ||
      !selection.end.rowKey ||
      !selection.end.colKey
  ) {
    return null
  }

  const rowKeys = dataSource.value.map((row) => row.key)
  const colKeys = columns.value.map((col) => col.key)

  const startRowIdx = rowKeys.indexOf(selection.start.rowKey)
  const endRowIdx = rowKeys.indexOf(selection.end.rowKey)
  const startColIdx = colKeys.indexOf(selection.start.colKey)
  const endColIdx = colKeys.indexOf(selection.end.colKey)

  // 确保索引有效
  if (startRowIdx === -1 || endRowIdx === -1 || startColIdx === -1 || endColIdx === -1) {
    return null
  }

  const startRow = Math.min(startRowIdx, endRowIdx)
  const endRow = Math.max(startRowIdx, endRowIdx)
  const startCol = Math.min(startColIdx, endColIdx)
  const endCol = Math.max(startColIdx, endColIdx)

  return {startRow, endRow, startCol, endCol}
})

// 检查单元格是否被选中
const isCellSelected = (rowKey: string, colKey: string) => {
  if (!selectionRect.value) return false

  const rowKeys = dataSource.value.map((row) => row.key)
  const colKeys = columns.value.map((col) => col.key)

  const rowIdx = rowKeys.indexOf(rowKey)
  const colIdx = colKeys.indexOf(colKey)
  return (
      rowIdx >= selectionRect.value.startRow &&
      rowIdx <= selectionRect.value.endRow &&
      colIdx >= selectionRect.value.startCol &&
      colIdx <= selectionRect.value.endCol
  )
}

// 开始选择
const startSelection = (e: MouseEvent) => {
  if (e.button !== 0) return
  const target = e.target as HTMLElement

  if (target.closest('.ant-input')) return

  const cell = getCellFromEvent(e)
  if (!cell) return

  selection.selecting = true
  selection.start.rowKey = cell.rowKey
  selection.start.colKey = cell.colKey
  selection.end.rowKey = cell.rowKey
  selection.end.colKey = cell.colKey

  // 清除行选择和列选择
  selectedRowKeys.value = []
  selectedColumns.value = []
}

// 更新选择
const updateSelection = (e: MouseEvent) => {
  if (!selection.selecting) return
  const cell = getCellFromEvent(e)
  if (!cell) return

  selection.end.rowKey = cell.rowKey
  selection.end.colKey = cell.colKey
}

// 结束选择
const endSelection = () => {
  selection.selecting = false
}

// 从事件获取单元格信息
const getCellFromEvent = (e: MouseEvent) => {
  let target = e.target as HTMLElement | null
  while (target && !target.classList.contains('ant-table-cell')) {
    target = target.parentElement
    if (target === tableContainer.value) return null
  }
  if (!target) return null

  const rowElement = target.closest('tr')
  if (!rowElement) return null

  const rowKey = rowElement.dataset.rowKey
  if (!rowKey) return null

  const colIndex = Array.from(rowElement.children).indexOf(target.closest('td, th') as Element)
  if (colIndex === -1) return null

  // 调整列索引计算，考虑是否有行选择列
  const columnOffset = props.showRowSelection ? 1 : 0
  const adjustedColIndex =
      colIndex - (rowElement.classList.contains('ant-table-row') ? columnOffset : 0)

  const colKey = columns.value[adjustedColIndex]?.key
  if (!colKey) return null

  return {rowKey, colKey}
}

// 编辑表头
const editHeader = (colKey: string) => {
  const column = columns.value.find((col) => col.key === colKey)
  if (!column) return

  editingHeader.value = colKey
  editingHeaderValue.value = column.title
  nextTick(() => {
    const input: HTMLElement | null = document.querySelector('.editing-cell input')
    if (input) {
      input.focus()
    }
  })
}

// 保存表头
const saveHeader = () => {
  if (editingHeader.value) {
    const column = columns.value.find((col) => col.key === editingHeader.value)
    if (column) {
      column.title = editingHeaderValue.value
    }
    editingHeader.value = null
  }
}
// 开始编辑单元格
const startEditCell = (rowKey: string, colKey: string, value: string) => {
  editingCell.rowKey = rowKey
  editingCell.colKey = colKey
  editingCell.value = value
  nextTick(() => {
    const input: HTMLElement | null = document.querySelector('.editing-cell input')
    if (input) {
      input.focus()
    }
  })
}
// 检验规则
const validateField = async (value: any, rules: any[]): Promise<boolean> => {
  if (!rules || rules.length === 0) return true
  try {
    for (const rule of rules) {
      if (rule.validator) {
        // 处理异步验证器
        if (rule.validator instanceof Promise) {
          await rule.validator
        } else if (typeof rule.validator === 'function') {
          const result = rule.validator(rule, value)
          if (result instanceof Promise) {
            await result
          }
        }
      } else if (rule.required && (!value || value.toString().trim() === '')) {
        throw new Error(rule.message || '该字段为必填项')
      }
    }
    return true
  } catch (error: any) {
    message.error(error || '验证失败')
    return false
  }
}
// 保存单元格
const saveCell = async (column: any) => {
  if (editingCell.rowKey && editingCell.colKey) {
    if (column && column.rules) {
      const isValid = await validateField(editingCell.value, column.rules)
      if (!isValid) {
        return // 验证失败，不保存
      }
    }
    const row = dataSource.value.find((row) => row.key === editingCell.rowKey)
    if (row) {
      row[editingCell.colKey] = editingCell.value
    }
    editingCell.rowKey = null
    editingCell.colKey = null
  }
}

// 添加列
const addColumn = () => {
  const newColIndex = columns.value.length + 1
  // columns.value.push({
  //   title: `列${newColIndex}`,
  //   dataIndex: newColKey,
  //   key: newColKey,
  //   width: 120,
  // })
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  // 取当前时间戳后4位（10进制）
  const timePart = Date.now().toString().slice(-4)
  // 再随机生成3位字符
  let randomPart = ''
  for (let i = 0; i < 3; i++) {
    randomPart += chars[Math.floor(Math.random() * chars.length)]
  }
  // 组合成7位字符串
  const newColKey = timePart + randomPart
  columns.value.splice(newColIndex - 2, 0, {
    title: `列${newColIndex - 1}`,
    dataIndex: newColKey,
    key: newColKey,
    width: 180,
    canDel: true,
  })
  dataSource.value.forEach((row) => {
    row[newColKey] = ''
  })
}
// 列配置
const columnVisual = ref(false)
const settingColumn = () => {
  columnVisual.value = true
}
const updateConfigHeaders = (configHeaders: Column[]) => {
  columns.value = [
    ...configHeaders.map((item: any) => ({
      title: item.name,
      dataIndex: item.identity || item.name,
      printTitle: item.printTitle,
      key: item.identity,
      width: 180,
      locate: item.locate,
      canDel: false,
    })),
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
  ]
  columns.value.forEach((item: any) => {
    if (item.dataIndex === 'sampleType') {
      item.type = 'select'
      item.options =
          props.initialColumns && props.initialColumns.length
              ? props.initialColumns.find((item) => item.dataIndex === 'sampleType')?.options
              : []
      //   [
      //   {
      //     label: '空白样品',
      //     value: 'empty',
      //   },
      //   {
      //     label: '标准样品',
      //     value: 'stand',
      //   },
      //   {
      //     label: '空白样品',
      //     value: 'empty',
      //   },
      //   {
      //     label: '未知样品',
      //     value: 'unknown',
      //   },
      // ]
    } else if (item.dataIndex === 'sampleLocation') {
      item.type = 'select'
      item.options = [
        {
          label: '样品池1',
          value: '1',
        },
        {
          label: '样品池2',
          value: '2',
        },
        {
          label: '样品池3',
          value: '3',
        },
        {
          label: '样品池4',
          value: '4',
        },
        {
          label: '样品池5',
          value: '5',
        },
      ]
    }
  })
  // emit('colInfo', colInfoValue.value)
}
// 样品默认值
const setSampleDefaultRef = ref()
const settingDefaultSample = () => {
  setSampleDefaultRef.value.showModal()
}
// 删除列
const deleteColumn = (key: string) => {
  columns.value = columns.value.filter((col) => col.key !== key)
}
// 批量删除
const deleteAll = () => {
  const delArr = dataSource.value.filter((col) => selectedRowKeys.value.includes(col.key))
  dataSource.value = dataSource.value.filter((col) => !selectedRowKeys.value.includes(col.key))
  emit('deleteAll', delArr)
}
// 找到数组里面最后一个纯数字 如果没有的话就是0
const getLastNumericSampleNumber = (defaultSampleList: any, key: string, value: string) => {
  const numericSamples = defaultSampleList
      .map((item: any) => ({
        ...item,
        [key]: item[key].replace(value, ''),
      }))
      .filter(
          (item: any) =>
              item[key] !== undefined && item[key] !== null && /^\d+$/.test(String(item[key])),
      )
  if (numericSamples.length > 0) {
    return Number(numericSamples[numericSamples.length - 1][key])
  }
  return 0
}
// 添加行
const addRow = () => {
  if (!rowNum.value) {
    message.warning('请输入行数')
    return
  }

  // 默认样品编号带default-  其他测量都是纯数字
  let defaultSampleNumber = 'default-'
  let defaultName = '样品'
  // 默认值
  const sampleDefault = localStorage.getItem('sampleDefault')
      ? JSON.parse(localStorage.getItem('sampleDefault') as string)
      : null
  if (sampleDefault) {
    defaultSampleNumber = sampleDefault.sampleNumConfig.preName
    defaultName = sampleDefault.sampleNameConfig.preName
  }

  for (let i = 0; i < rowNum.value; i++) {
    // 获取可用的样品编号数字
    const defaultNumSampleList = dataSource.value.filter((item) =>
        item.sampleNumber.startsWith(defaultSampleNumber),
    )
    let startNumIndex = defaultNumSampleList?.length
        ? Number(
            defaultNumSampleList[defaultNumSampleList.length - 1].sampleNumber.replace(
                defaultSampleNumber,
                '',
            ),
        )
        : sampleDefault
            ? sampleDefault.sampleNumConfig.startNum - sampleDefault.sampleNumConfig.step
            : 0
    if (startNumIndex && String(startNumIndex).includes('-')) {
      startNumIndex = sampleDefault.sampleNumConfig.startNum - sampleDefault.sampleNumConfig.step
    }
    if (!startNumIndex && Number(startNumIndex) !== 0) {
      startNumIndex = getLastNumericSampleNumber(
          defaultNumSampleList,
          'sampleNumber',
          defaultSampleNumber,
      )
    }

    // 获取可用的样品名称数字
    const defaultNameSampleList = dataSource.value.filter((item) =>
        item.sampleName.startsWith(defaultName),
    )
    let startNameIndex = defaultNameSampleList?.length
        ? Number(
            defaultNameSampleList[defaultNameSampleList.length - 1].sampleName.replace(
                defaultName,
                '',
            ),
        )
        : sampleDefault
            ? sampleDefault.sampleNameConfig.startNum - sampleDefault.sampleNameConfig.step
            : 0
    if (startNameIndex && String(startNameIndex).includes('-')) {
      startNameIndex = sampleDefault.sampleNameConfig.startNum - sampleDefault.sampleNameConfig.step
    }
    if (!startNameIndex && Number(startNameIndex) !== 0) {
      startNameIndex = getLastNumericSampleNumber(defaultNameSampleList, 'sampleName', defaultName)
    }

    // 创建新row
    const newRow: { key: string; [key: string]: any } = {key: `${dataSource.value.length + 1}`}
    columns.value.forEach((col: Column) => {
      if (col.key !== 'action') newRow[col.key] = ''
    })

    // 创建新row的sampleNumber
    const hasSampleNumber = columns.value.some((col) => col.dataIndex === 'sampleNumber')
    if (hasSampleNumber) {
      // newRow['sampleNumber'] = `${defaultSampleNumber}${startNumIndex + i + 1}`
      if (sampleDefault) {
        if (
            dataSource.value.findIndex((item) =>
                item.sampleNumber.startsWith(defaultSampleNumber),
            ) === -1
        ) {
          newRow['sampleNumber'] =
              `${defaultSampleNumber}${sampleDefault.sampleNumConfig.startNum || '1'}`
        } else {
          newRow['sampleNumber'] =
              `${defaultSampleNumber}${startNumIndex + (sampleDefault.sampleNumConfig.step || 1)}`
        }
      } else {
        newRow['sampleNumber'] = `${defaultSampleNumber}${startNumIndex + i + 1}`
      }
    }

    // 创建新row的sampleName
    const hasSampleName = columns.value.some((col) => col.dataIndex === 'sampleName')
    if (hasSampleName) {
      // newRow['sampleName'] = defaultName
      //   ? `${defaultName}${dataSource.value.length + 1}`
      //   : ''
      if (sampleDefault) {
        if (dataSource.value.findIndex((item) => item.sampleName.startsWith(defaultName)) === -1) {
          newRow['sampleName'] = `${defaultName}${sampleDefault.sampleNameConfig.startNum || '1'}`
        } else {
          newRow['sampleName'] =
              `${defaultName}${startNameIndex + (sampleDefault.sampleNameConfig.step || 1)}`
        }
      } else {
        newRow['sampleName'] = `${defaultName}${dataSource.value.length + 1}`
      }
    }

    if (props.defaultSampleType) newRow['sampleType'] = props.defaultSampleType

    dataSource.value.push(newRow)
  }
}

// 复制选中内容
const copySelection = () => {
  if (selectedColumns.value.length > 0 && selectedRowKeys.value.length === 0) {
    // 只选择了列的情况
    copySelectedColumns()
    return
  }

  if (!selectionRect.value) {
    message.warning('请先选择要复制的内容')
    return
  }

  const {startRow, endRow, startCol, endCol} = selectionRect.value
  const colKeys = columns.value.map((col) => col.key).slice(startCol, endCol + 1)
  const rowKeys = dataSource.value.map((row) => row.key).slice(startRow, endRow + 1)

  clipboard.value = rowKeys.map((rowKey) => {
    const row = dataSource.value.find((r) => r.key === rowKey)
    return colKeys.map((colKey) => String(row?.[colKey] || ''))
  })

  // 复制到系统剪贴板
  copyToSystemClipboard(clipboard.value)

  message.success('已复制选中内容')
}

// 复制选中的列
const copySelectedColumns = () => {
  const colKeys = selectedColumns.value
  if (colKeys.length === 0) {
    message.warning('请先选择要复制的列')
    return
  }

  clipboard.value = dataSource.value.map((row) => {
    return colKeys.map((colKey) => String(row[colKey] || ''))
  })

  // 复制到系统剪贴板
  copyToSystemClipboard(clipboard.value)

  message.success(`已复制${colKeys.length}列数据`)
}

// 复制数据到系统剪贴板
const copyToSystemClipboard = (data: (string | number | boolean)[][]) => {
  const text = data.map((row) => row.join('\t')).join('\n')
  navigator.clipboard.writeText(text)
}

// 粘贴数据
const pasteData = async () => {
  try {
    // 尝试从系统剪贴板读取数据
    const clipboardText = await navigator.clipboard.readText()
    if (clipboardText) {
      const parsedData = parseClipboardData(clipboardText)
      if (parsedData.length > 0 && parsedData[0].length > 0) {
        clipboard.value = parsedData
      }
    }
  } catch (err) {
  }

  if (!clipboard.value || clipboard.value.length === 0) {
    message.warning('没有可粘贴的内容')
    return
  }

  if (selectedColumns.value.length > 0 && selectedRowKeys.value.length === 0) {
    // 只选择了列的情况
    pasteToSelectedColumns()
    return
  }

  if (!selectionRect.value) {
    message.warning('请先选择要粘贴的位置')
    return
  }

  const {startRow, startCol} = selectionRect.value

  // 如果需要扩展行数
  const requiredRows = startRow + clipboard.value.length
  while (dataSource.value.length < requiredRows) {
    addRow()
  }
  // const colKeys = columns.value.map((col) => col.key)
  const colKeys = columns.value.map((col) => ({
    key: col.key,
    type: col.type,
    options: col.type === 'select' ? col.options : [],
    defaultValue: col.defaultValue ?? '',
  }))
  const rowKeys = dataSource.value.map((row) => row.key)
  for (let i = 0; i < clipboard.value.length && startRow + i < rowKeys.length; i++) {
    const rowKey = rowKeys[startRow + i]
    const row = dataSource.value.find((r) => r.key === rowKey)
    for (let j = 0; j < clipboard.value[i].length && startCol + j < colKeys.length; j++) {
      const colKey = colKeys[startCol + j]
      if (row) {
        // row[colKey] = clipboard.value[i][j]
        if (colKey.type !== 'select') row[colKey.key] = clipboard.value[i][j]
        else {
          const option = colKey.options.find(
              (option: { label: string; value: string }) => option.label === clipboard.value[i][j],
          )
          row[colKey.key] =
              option && option.value ? option.value : colKey.defaultValue ? colKey.defaultValue : ''
        }
      }
    }
  }
  message.success('粘贴成功')
}

// 粘贴到选中的列
const pasteToSelectedColumns = () => {
  const colKeys = selectedColumns.value
  if (colKeys.length === 0) {
    message.warning('请先选择要粘贴的列')
    return
  }

  // 如果需要扩展行数
  const requiredRows = clipboard.value.length
  while (dataSource.value.length < requiredRows) {
    addRow()
  }
  const rowKeys = dataSource.value.map((row) => row.key)

  for (let i = 0; i < clipboard.value.length && i < rowKeys.length; i++) {
    const rowKey = rowKeys[i]
    const row = dataSource.value.find((r) => r.key === rowKey)

    for (let j = 0; j < Math.min(clipboard.value[i].length, colKeys.length); j++) {
      const colKey = colKeys[j]
      if (row) {
        row[colKey] = clipboard.value[i][j]
      }
    }
  }

  message.success('粘贴成功')
}

// 解析剪贴板数据（支持Excel复制的内容）
const parseClipboardData = (text: string) => {
  return text
      .split('\n')
      .map((row) => row.split('\t').map((cell) => cell.trim()))
      .filter((row) => row.some((cell) => cell !== '')) // 过滤掉全是空字符串的行
}

// 清除选择
const clearSelection = () => {
  selection.start.rowKey = null
  selection.start.colKey = null
  selection.end.rowKey = null
  selection.end.colKey = null
  selectedRowKeys.value = []
  selectedColumns.value = []
}
// 单元格合并的方法
const mergeCell = (row: any, index: number) => {
  // 找出具有相同parallelGroupId的行
  const currentGroupId = row.parallelGroupId
  if (!currentGroupId) {
    // 如果没有分组ID，不合并
    row.isParallelSample = ''
    return {
      // children: '',
      // props: {
      //   rowSpan: 1,
      // },
      rowSpan: 1,
    }
  }
  // 找出具有相同dataGroupId的连续行
  let startIndex = -1
  let rowCount = 0
  // 找出当前组中当前字段的第一次出现位置
  // 找到当前组的起始位置和行数
  for (let i = 0; i < dataSource.value.length; i++) {
    const item = dataSource.value[i]
    if (item.parallelGroupId === currentGroupId) {
      if (startIndex === -1) {
        startIndex = i // 记录组的起始位置
      }
      rowCount++ // 统计组内行数
    } else if (startIndex !== -1) {
      // 已经找到组且当前行不属于该组，结束统计
      break
    }
  }

  // 如果当前行是组的第一行，设置rowSpan
  if (index === startIndex) {
    if (rowCount > 1) row.isParallelSample = '是'
    return {
      rowSpan: rowCount,
    }
  } else {
    // 如果不是第一行，rowSpan设为0（不显示）
    row.isParallelSample = '是'
    return {
      rowSpan: 0,
    }
  }
}
// 设置平行样
const setParallelSamples = () => {
  if (!selectionRect.value) {
    message.warning('请先框选要设置平行样的样品！')
    return
  }
  const {startRow, endRow} = selectionRect.value
  if (endRow - startRow < 1) {
    message.warning('至少要框选两个样品去设置平行样！')
    return
  }
  const dataGroupIds = dataSource.value
      .map((row) => row.parallelGroupId)
      .slice(startRow, endRow + 1)
  dataSource.value.forEach((row: DataItem) => {
    if (dataGroupIds.includes(row.parallelGroupId)) {
      row.parallelGroupId = ''
    }
  })
  // 生成唯一的dataGroupId
  const dataGroupId = `group_${generateUniqueId()}`
  // 为选中的行设置相同的dataGroupId
  for (let i = startRow; i <= endRow; i++) {
    const rowKey = dataSource.value[i].key
    const row = dataSource.value.find((r: DataItem) => r.key === rowKey)
    if (row) {
      row.parallelGroupId = dataGroupId
    }
  }
}
// 取消平行样
const cancelParallelSamples = () => {
  if (!selectionRect.value) {
    message.warning('请先框选要取消平行样的样品！')
    return
  }
  const {startRow, endRow} = selectionRect.value
  if (endRow - startRow < 1) {
    message.warning('至少要框选两个样品去取消平行样！')
    return
  }
  const dataGroupIds = dataSource.value
      .map((row) => row.parallelGroupId)
      .slice(startRow, endRow + 1)
  dataSource.value.forEach((row: DataItem) => {
    if (dataGroupIds.includes(row.parallelGroupId)) {
      row.parallelGroupId = ''
    }
  })
}
// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl+C 复制
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    e.preventDefault()
    copySelection()
  }

  // Ctrl+V 粘贴
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault()
    pasteData()
  }

  // ESC 清除选择
  if (e.key === 'Escape') {
    clearSelection()
  }
}

// 初始化时让容器可聚焦
onMounted(() => {
  if (tableContainer.value) {
    tableContainer.value.focus()
  }
})

defineExpose({
  dataSource,
  clearSelection,
})
</script>

<style scoped>
.uv-edit-cell-table {
  display: flex;
  flex-direction: column;
  /* height: 100%; */
  user-select: none;
}

.toolbar {
  padding: 8px;
}

.table-container {
  position: relative;
  flex: 1;
  overflow: auto;
  outline: none;
}

.cell {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.header-cell {
  cursor: pointer;
  user-select: none;
}

.header-cell.selected {
  background-color: #e6f7ff;
}

.selected-cell {
  background-color: #e6f7ff;
}

.editing-cell {
  padding: 0;
}

.editing-cell :deep(.ant-input) {
  border: none;
  padding: 4px 11px;
  height: 100%;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  user-select: text;
}

:deep(.ant-table-column-selected) {
  background-color: #e6f7ff;
}

:deep(.ant-table-thead th) {
  user-select: none;
}

:deep(.ant-table-cell) {
  user-select: none;
  height: 47px;
}

:deep(.ant-input) {
  user-select: text;
}
</style>
