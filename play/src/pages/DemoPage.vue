<template>
  <div style="display: flex; flex-direction: row; gap: 2em">
    <LessButton @click="modalShow=!modalShow" message="点击打开弹窗"/>
    <WsModal v-model="modalShow"/>
    <EditTable/>
    <!--    <TailwindButton message="tailwind"/>-->
  </div>
</template>

<script setup lang="ts">
import { WsModal,LessButton } from "@zhixingyu/ws-inexus-components";
import "@zhixingyu/ws-inexus-components/style.css";
import EditTable from "@/pages/components/EditTable.vue";
import { ref } from 'vue'
const modalShow = ref(false);
</script>

<style scoped>

</style>
