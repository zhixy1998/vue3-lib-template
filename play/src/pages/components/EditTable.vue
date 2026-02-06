<template>
  <div>
    <h2>高级配置示例</h2>
    <!-- 带有默认值设置的表格 -->
    <WsEditTable
        :initial-columns="advancedColumns"
        :initial-data="advancedData"
        :show-edit="true"
        :show-add-column="true"
        :show-column-config="true"
        :show-set-default-sample="true"
        :show-row-selection="true"
        :is-parallel-samples="true"
        :default-sample-type="'stand'"
        @update:initialData="handleAdvancedDataUpdate"
    />

    <!-- 简化版表格 -->
    <WsEditTable
        :initial-columns="simpleColumns"
        :initial-data="simpleData"
        :show-edit="false"
        :th-is-edit="true"
    />
  </div>
</template>

<script setup lang="ts">
import { WsEditTable } from "@zhixingyu/ws-inexus-components"
import { ref } from 'vue'

// 高级配置列
const advancedColumns = ref([
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80, canDel: false },
  { title: '姓名', dataIndex: 'name', key: 'name', width: 120, canDel: true },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 80, canDel: true },
  { title: '部门', dataIndex: 'department', key: 'department', width: 120, canDel: true },
  { title: '入职日期', dataIndex: 'hireDate', key: 'hireDate', width: 120, canDel: true },
  { title: '薪资', dataIndex: 'salary', key: 'salary', width: 100, canDel: true },
  { title: '操作', dataIndex: 'action', key: 'action', width: 150, canDel: false }
])

// 高级配置数据
const advancedData = ref([
  { key: '1', id: 'EMP001', name: '张三', age: 28, department: '技术部', hireDate: '2023-01-15', salary: 12000 },
  { key: '2', id: 'EMP002', name: '李四', age: 32, department: '销售部', hireDate: '2022-11-20', salary: 10000 }
])

// 简化列配置
const simpleColumns = ref([
  { title: '产品', dataIndex: 'product', key: 'product', width: 150 },
  { title: '价格', dataIndex: 'price', key: 'price', width: 100 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 120 }
])

// 简化数据
const simpleData = ref([
  { key: '1', product: '笔记本电脑', price: 5999, quantity: 10 },
  { key: '2', product: '鼠标', price: 99, quantity: 50 }
])

const handleAdvancedDataUpdate = (data: any[]) => {
  console.log('高级表格数据更新:', data)
  advancedData.value = data
}
</script>
