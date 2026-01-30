# 2026-01-30 自定义弹窗系统

## 概述
替换系统原生弹窗（alert/confirm/prompt），实现与游戏 UI 风格一致的自定义弹窗组件。

## 新增文件

### 1. client/core/Modal.js
弹窗核心类，提供以下 API：

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `modal.alert(message, title)` | 单按钮提示弹窗 | `Promise<void>` |
| `modal.confirm(message, title)` | 双按钮确认弹窗 | `Promise<boolean>` |
| `modal.prompt(message, defaultValue)` | 输入弹窗 | `Promise<string\|null>` |
| `modal.loading(message)` | 加载中弹窗 | - |
| `modal.hideLoading()` | 隐藏加载弹窗 | - |
| `modal.success(message)` | 成功提示 | `Promise<void>` |
| `modal.error(message)` | 错误提示 | `Promise<void>` |
| `modal.warning(message)` | 警告提示 | `Promise<void>` |
| `modal.show(options)` | 自定义弹窗 | `Promise` |

### 2. client/core/Toast.js
轻提示组件，自动消失，提供以下 API：

| 方法 | 说明 |
|------|------|
| `toast.info(message, duration)` | 信息提示 |
| `toast.success(message, duration)` | 成功提示 |
| `toast.error(message, duration)` | 错误提示 |
| `toast.warning(message, duration)` | 警告提示 |

## 修改文件

### client/style.css
新增样式：
- `.modal-overlay` - 弹窗遮罩层
- `.modal-content` - 弹窗内容容器
- `.modal-header` - 弹窗头部
- `.modal-body` - 弹窗主体
- `.modal-footer` - 弹窗底部
- `.modal-btn` - 弹窗按钮（primary/secondary/default）
- `.toast-container` - Toast 容器
- `.toast` - Toast 样式（info/success/error/warning）

## 使用示例

```javascript
import { modal } from './core/Modal.js';
import { toast } from './core/Toast.js';

// 单按钮提示（替代 alert）
await modal.alert('操作成功！', '提示');

// 双按钮确认（替代 confirm）
const confirmed = await modal.confirm('确定要退出房间吗？', '确认');
if (confirmed) {
    // 用户点击了确定
}

// 输入弹窗（替代 prompt）
const roomName = await modal.prompt('请输入房间名称', '', '创建房间');
if (roomName !== null) {
    // 用户输入了内容
}

// 加载提示
modal.loading('正在连接服务器...');
// ... 异步操作
modal.hideLoading();

// 轻提示
toast.success('加入房间成功');
toast.error('连接失败，请重试');
toast.warning('房间已满');
toast.info('新玩家加入');
```

## 弹窗类型

### 1. Alert（单按钮）
```
┌─────────────────────────────────────┐
│  ▌ 提示                              │
├─────────────────────────────────────┤
│                                     │
│         操作成功！                   │
│                                     │
├─────────────────────────────────────┤
│              [ 确定 ]                │
└─────────────────────────────────────┘
```

### 2. Confirm（双按钮）
```
┌─────────────────────────────────────┐
│  ▌ 确认                              │
├─────────────────────────────────────┤
│                                     │
│      确定要离开房间吗？              │
│                                     │
├─────────────────────────────────────┤
│      [ 取消 ]        [ 确定 ]        │
└─────────────────────────────────────┘
```

### 3. Prompt（输入框）
```
┌─────────────────────────────────────┐
│  ▌ 输入                              │
├─────────────────────────────────────┤
│                                     │
│        请输入房间名称                │
│     ┌─────────────────────┐         │
│     │                     │         │
│     └─────────────────────┘         │
│                                     │
├─────────────────────────────────────┤
│      [ 取消 ]        [ 确定 ]        │
└─────────────────────────────────────┘
```

## 设计特点

1. **科幻风格** - 使用游戏的赛博朋克主题颜色和字体
2. **切角设计** - 采用 clip-path 实现科幻风格的切角边框
3. **动画效果** - 弹窗弹入动画、按钮悬停效果
4. **Promise API** - 支持 async/await 语法
5. **响应式** - 适配移动端屏幕
6. **键盘支持** - 输入框支持回车确认
