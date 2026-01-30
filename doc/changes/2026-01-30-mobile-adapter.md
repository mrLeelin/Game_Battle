# 2026-01-30 移动端适配方案

## 概述
为游戏添加完整的移动端适配支持，包括屏幕适配、虚拟摇杆控制、触摸手势等功能。

## 新增依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| nipplejs | latest | 虚拟摇杆库 |
| postcss-px-to-viewport | latest | px 自动转 vw |

## 新增文件

### 1. client/core/DeviceDetector.js
设备检测工具类，提供以下功能：
- `isMobile()` - 检测是否手机
- `isTablet()` - 检测是否平板
- `isTouchDevice()` - 检测是否支持触摸
- `isIOS()` / `isAndroid()` - 系统检测
- `hasNotch()` - 刘海屏检测
- `isLandscape()` / `isPortrait()` - 屏幕方向
- `needsVirtualController()` - 是否需要虚拟控制器
- `getScreenInfo()` - 获取完整屏幕信息

### 2. client/core/MobileAdapter.js
移动端适配器，提供以下功能：
- 动态 rem 基准设置
- 安全区域 CSS 变量
- 禁止双指/双击缩放
- 横屏锁定和提示
- 虚拟键盘检测
- 设备类型 CSS 类名自动添加

### 3. client/core/VirtualController.js
虚拟控制器，提供以下功能：
- 左侧移动摇杆（基于 nipplejs）
- 右侧视角滑动区域
- 动作按钮（射击、跳跃、换弹、互动）
- 输入状态管理
- 按钮显示/隐藏控制

### 4. postcss.config.js
PostCSS 配置文件，配置 px 到 vw 的自动转换。

### 5. vite.config.js (修改)
添加 PostCSS 配置引用。

## 修改文件

### 1. client/index.html
- 优化 viewport meta 标签
- 添加 iOS/Android 全屏支持 meta
- 禁用电话号码自动检测

### 2. client/style.css
新增样式：
- 虚拟控制器样式（摇杆区域、按钮等）
- 横屏提示样式
- 移动端响应式适配（768px、480px 断点）
- 安全区域适配（刘海屏）
- 横屏模式优化
- 触摸设备特殊样式
- 键盘弹出时隐藏虚拟控制器

## 使用方式

```javascript
import { deviceDetector } from './core/DeviceDetector.js';
import { mobileAdapter } from './core/MobileAdapter.js';
import { virtualController } from './core/VirtualController.js';

// 初始化移动端适配
mobileAdapter.init();

// 初始化虚拟控制器（仅在需要时）
if (deviceDetector.needsVirtualController()) {
    virtualController.init({
        onMove: (x, y) => {
            // 处理移动输入
        },
        onLook: (deltaX, deltaY) => {
            // 处理视角输入
        },
        onButtonDown: (buttonId) => {
            // 处理按钮按下
        },
        onButtonUp: (buttonId) => {
            // 处理按钮释放
        }
    });
}

// 游戏开始时锁定横屏
mobileAdapter.lockLandscape(true);
```

## 虚拟控制器布局

```
┌─────────────────────────────────────────┐
│              游戏画面                    │
│                                         │
│                          ┌───┐          │
│                          │ 🔫 │ 射击    │
│  ┌───────┐              └───┘          │
│  │   ○   │ 移动摇杆    ┌───┐          │
│  │ ○ ● ○ │             │ ⬆️ │ 跳跃    │
│  │   ○   │              └───┘          │
│  └───────┘           🔄 换弹  ✋ 互动   │
└─────────────────────────────────────────┘
```

## 断点说明

| 断点 | 说明 |
|------|------|
| 768px | 平板/小屏幕适配 |
| 480px | 超小屏幕适配 |
| landscape + max-height: 500px | 横屏小高度适配 |

## 自动添加的 CSS 类

设备检测后会在 `<html>` 标签上添加以下类：
- `.is-mobile` - 移动设备
- `.is-tablet` - 平板设备
- `.is-touch` - 触摸设备
- `.is-ios` - iOS 设备
- `.is-android` - Android 设备
- `.has-notch` - 刘海屏设备
- `.needs-virtual-controller` - 需要虚拟控制器
- `.keyboard-visible` - 虚拟键盘可见
