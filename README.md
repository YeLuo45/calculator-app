# Calculator App

## 访问地址

https://yeluo45.github.io/calculator-app/

Web 版已部署至 GitHub Pages，APK 构建因 Windows NDK 环境损坏暂时搁置。

## 项目说明

基于 React Native (Expo) 的计算器应用，支持基础运算、科学计算和历史记录。

- 源码项目: `.`（当前目录）
- 部署分支: `gh-pages`
- 技术栈: React Native (Expo SDK 52) + React Native Paper + mathjs

## 功能特性

- 基础四则运算（加减乘除）
- 科学计算（三角函数、对数、指数等）
- 历史记录（基于 AsyncStorage 持久化）
- 响应式界面（支持 Web 和移动端）

## 目录结构

```
./                      # 项目根目录
├── App.tsx             # Expo 入口组件
├── app.json            # Expo 配置
├── src/                # 源代码
├── assets/             # 静态资源（字体、图片）
├── dist/               # Web 构建产物
├── android/            # Android 原生项目（expo prebuild 生成）
├── node_modules/       # 依赖包
├── package.json        # 项目配置
└── README.md           # 本文件
```

## 部署说明

### Web 版本

Web 构建产物位于 `dist/` 目录，已推送至 `gh-pages` 分支。

推送触发 GitHub Pages 自动部署，访问地址即上方链接。

### Android APK

APK 构建需要修复 Windows NDK 环境（当前 NDK 安装损坏）。

在 NDK 修复后，执行：

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

## 本地运行

```bash
# Web 版
npm run web

# Android 版（需要物理设备或模拟器）
npx expo run:android

# 纯静态 Web 预览
npx serve dist
```

然后访问 http://localhost:3000
