<template>
  <button class="alert-button" @click="handleButtonClick">{{ message }}</button>
</template>

<script lang="ts" setup>
import {toRefs} from "vue";
import "./style/index.less";

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
defineOptions({
  name: "LessButton"
});

const props = defineProps<{ message: string }>();

const {message} = toRefs(props);

const handleButtonClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>
