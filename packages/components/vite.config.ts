import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'path';
import eslint from "vite-plugin-eslint";
import dts from "vite-plugin-dts";
import packageConfig from './package.json';
import camelCase from 'camelcase';

const projectName = packageConfig.name.split("/").at(-1);
import { lazyImport, VxeResolver } from 'vite-plugin-lazy-import'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    eslint({
      include: ['src/**/*.js', 'src/**/*.vue', 'src/*.js', 'src/*.vue'],
      overrideConfig:{
        rules: {
          "@typescript-eslint/no-explicit-any": "off"
        }
      }
    }),
    dts({
      tsconfigPath: "../../tsconfig.components.json",
      outDir: "lib"
    }),
    lazyImport({
      resolvers: [
        VxeResolver({
          libraryName: 'vxe-pc-ui'
        }),
        VxeResolver({
          libraryName: 'vxe-table'
        })
      ]
    }),
  ],
  build: {
    minify: true,
    emptyOutDir: true,
    lib: {
      formats: ["es", "umd", "cjs"],
      entry: "./index.ts",
      // umd 情况下全局变量名
      name: camelCase(projectName ?? "Components"),
      // 打包后文件名称
      fileName: projectName,
    },
    rollupOptions: {
      external: ['vue'],
      output:
        {
          globals: {
            vue: 'Vue',
          }
        }
    },
    outDir: resolve(__dirname, 'lib'),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
});
