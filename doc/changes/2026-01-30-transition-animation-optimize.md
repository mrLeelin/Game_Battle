# 2026-01-30 界面切换动画优化

## 概述
全面优化界面切换动画，增强赛博朋克科幻风格，添加多种新动画效果，支持子元素独立入场动画。

## 新增文件

### 1. client/ui/TransitionManager.js
统一的过渡动画管理器，提供以下功能：

| 方法 | 说明 |
|------|------|
| `transition(enter, exit, type)` | 执行屏幕切换动画 |
| `clearAnimations(element)` | 清理元素上的所有动画类 |
| `flash(element, duration)` | 播放闪光效果 |
| `addPulseBorder(element)` | 添加脉冲边框效果 |
| `addNeonBreathe(element)` | 添加霓虹呼吸效果 |
| `staggerFadeIn(container, selector, stagger)` | 子元素渐入效果 |
| `animateChildren(configs, container)` | 为多个子元素配置不同动画 |
| `staggerChildren(container, selector, animation, stagger)` | 批量交错动画 |

**支持的屏幕动画类型：**
- `zoom` - 缩放模糊（登录↔大厅）
- `slideRight` - 右滑进入（进入房间）
- `slideLeft` - 左滑进入（离开房间）
- `glitch` - 故障效果（特殊切换）
- `warp` - 扭曲效果（空间跳跃）
- `scan` - 扫描线效果（启动感）

**支持的子元素动画类型：**
- `slideUp` - 从下方滑入
- `slideDown` - 从上方滑入
- `slideFromLeft` - 从左侧滑入
- `slideFromRight` - 从右侧滑入
- `scaleIn` - 缩放弹入（从小到大）
- `scaleDown` - 缩放弹入（从大到小）
- `rotateIn` - 旋转弹入
- `fadeUp` - 渐入上升

## 修改文件

### 1. client/style.css
新增/优化的动画：

| 动画类 | 效果 | 优化内容 |
|--------|------|----------|
| `anim-zoom-in/out` | 缩放模糊 | 增加亮度变化、多阶段动画 |
| `anim-slide-in/out` | 滑动 | 添加回弹效果、模糊、缩放 |
| `anim-flash` | 闪光 | 渐变色闪光、缩放脉冲 |
| `anim-glitch-in/out` | 故障 | clip-path 切割动画 |
| `anim-warp-in/out` | 扭曲 | 3D 透视旋转 |
| `anim-scan-in` | 扫描线 | 从上到下扫描进入 |
| `anim-pulse-border` | 脉冲边框 | 渐变发光边框 |
| `anim-fade-up` | 渐入上升 | 子元素入场动画 |
| `anim-neon-breathe` | 霓虹呼吸 | 文字发光呼吸 |

**新增 CSS 变量：**
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### 2. client/lobby/LobbyUI.js
- 引入 `TransitionManager`
- 使用 `transitionManager.transition()` 替代手动动画
- 使用 `transitionManager.flash()` 替代手动闪光
- 登录界面初次显示使用扫描效果

### 3. client/lobby/RoomUI.js
- 引入 `TransitionManager`
- 使用 `transitionManager.clearAnimations()` 清理动画类

## 动画效果对比

### Zoom 动画（登录→大厅）
| 项目 | 优化前 | 优化后 |
|------|--------|--------|
| 持续时间 | 0.5s | 0.6s |
| 缩放范围 | 0.8→1 | 0.7→1.01→1 |
| 模糊 | 10px→0 | 15px→5px→0 |
| 亮度 | 无 | 2→1.3→1 |
| 位移 | 无 | 20px→0 |

### Slide 动画（大厅↔房间）
| 项目 | 优化前 | 优化后 |
|------|--------|--------|
| 持续时间 | 0.4s | 0.5s |
| 倾斜角度 | 10deg | 8deg |
| 回弹效果 | 无 | 有（-3%→0） |
| 缩放 | 无 | 0.95→1.01→1 |
| 模糊 | 无 | 5px→0 |

## 使用示例

```javascript
import { transitionManager } from '../ui/TransitionManager.js';

// 屏幕切换
await transitionManager.transition(roomScreen, lobbyScreen, 'slideRight');

// 闪光效果
transitionManager.flash(document.body, 400);

// 子元素渐入
transitionManager.staggerFadeIn(container, '.item', 100);

// 添加脉冲边框
transitionManager.addPulseBorder(button);
```

## 新增动画预览

### Glitch 故障效果
```
┌─────────────────────┐
│ ████████████████████│ ← 随机水平切割
│     ████████████    │
│ ████████████████████│
│          ███████████│
│ ████████████████████│
└─────────────────────┘
```

### Warp 扭曲效果
```
     ╱‾‾‾‾‾‾‾‾‾‾‾‾╲
    ╱              ╲  ← 3D 透视旋转
   │   [CONTENT]    │
    ╲              ╱
     ╲____________╱
```

### Scan 扫描线效果
```
═══════════════════════ ← 扫描线从上往下
│                     │
│      [CONTENT]      │
│                     │
└─────────────────────┘
```

## 子元素入场动画配置

### 登录界面 (LobbyUI.showLogin)
| 元素 | 动画类型 | 延迟 |
|------|----------|------|
| 标题 h1 | slideDown | 200ms |
| 面板 .panel | scaleIn | 400ms |

### 大厅界面 (LobbyUI.showLobby)
| 元素 | 动画类型 | 延迟 |
|------|----------|------|
| 标题 h1 | slideDown | 100ms |
| 控制区 #room-controls | slideFromRight | 200ms |
| 副标题 h3 | fadeUp | 300ms |
| 房间列表 #room-list | slideFromLeft | 400ms |

### 房间界面 (RoomUI.show)
| 元素 | 动画类型 | 延迟 |
|------|----------|------|
| 标题 #room-title | slideDown | 100ms |
| 游戏选择 .game-selector | scaleIn | 200ms |
| 玩家列表 #player-list | slideFromLeft | 300ms |
| 操作按钮 #room-actions | slideUp | 400ms |
| 状态文字 #room-status | fadeUp | 500ms |
| 弹幕区域 #danmaku-input-area | slideUp | 600ms |

## 更新日志

### v2 更新 (2026-01-30)
- 移除进入房间时的闪光效果
- 新增 8 种子元素动画类型
- 为登录、大厅、房间界面添加子元素独立入场动画
- 新增 `animateChildren()` 和 `staggerChildren()` API
