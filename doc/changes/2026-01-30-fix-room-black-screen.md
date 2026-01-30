# 2026-01-30 修复房间界面黑屏问题

## 问题描述
进入房间界面时出现黑屏，界面无法正常显示。

## 问题原因
当元素从 `display: none` 切换到 `display: flex` 后立即添加 CSS 动画类，浏览器可能来不及完成布局重排，导致动画不会正确触发。

动画的起始状态是 `opacity: 0`（来自 `@keyframes slideInRight`），如果动画没有正确触发，元素会保持在 `opacity: 0` 状态，造成黑屏。

## 修复方案
在设置 `display: flex` 后、添加动画类之前，强制触发浏览器重排：

```javascript
// 强制浏览器重排，确保动画能正确触发
void element.offsetHeight;
```

## 修改文件

### 1. client/lobby/RoomUI.js - show() 方法

```javascript
// 修复前
show() {
    if (this.elements.roomScreen) {
        this.elements.roomScreen.style.display = 'flex';
        this.elements.roomScreen.classList.remove('anim-slide-out-right', 'fade-out');
        this.elements.roomScreen.classList.add('anim-slide-in-right');
        this.isVisible = true;
    }
}

// 修复后
show() {
    if (this.elements.roomScreen) {
        this.elements.roomScreen.style.display = 'flex';
        this.elements.roomScreen.classList.remove('anim-slide-out-right', 'anim-slide-in-right', 'fade-out');

        // 强制浏览器重排
        void this.elements.roomScreen.offsetHeight;

        this.elements.roomScreen.classList.add('anim-slide-in-right');
        this.isVisible = true;
    }
}
```

### 2. client/lobby/LobbyUI.js - transition() 方法

同样添加了强制重排逻辑，确保所有屏幕切换动画都能正确触发。

## 技术说明

- `void element.offsetHeight` 读取元素的 `offsetHeight` 属性
- 这会强制浏览器立即计算元素的布局（触发重排/reflow）
- 重排后，元素处于正确的初始状态，动画才能正常从 `opacity: 0` 过渡到 `opacity: 1`
- `void` 操作符用于忽略返回值，表明这是一个副作用操作
