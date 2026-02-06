import type {App, Plugin} from "vue";

type SFCWithInstall<T> = T & { install: Exclude<Plugin['install'], undefined> };

export const withInstall = <T>(comp: T) => {
  const component = comp as unknown as SFCWithInstall<typeof comp>;
  component.install = (Vue: App) => {
    Vue.component("AlertButton", component);
  };
  return component;
};

// 生成唯一随机标识方法
export const generateUniqueId = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  // 取当前时间戳后4位（10进制）
  const timePart = Date.now().toString().slice(-4)
  // 再随机生成3位字符
  let randomPart = ''
  for (let i = 0; i < 3; i++) {
    randomPart += chars[Math.floor(Math.random() * chars.length)]
  }
  // 组合成7位字符串
  return timePart + randomPart
}