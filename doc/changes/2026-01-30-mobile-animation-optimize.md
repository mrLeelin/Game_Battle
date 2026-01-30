# 移动端动画性能优化

## 变更日期
2026-01-30

## 变更类型
perf: 性能优化

## 变更描述
移除移动端 CSS 动画中的 blur（模糊）滤镜效果，提升 UI 切换流畅度。

## 修改文件

### client/style.css
在文件末尾添加移动端媒体查询 `@media (max-width: 768px)`：

1. **强制移除动画元素的 filter**
   - `.anim-zoom-in`, `.anim-zoom-out`
   - `.anim-slide-in-right`, `.anim-slide-out-left`
   - `.anim-slide-in-left`, `.anim-slide-out-right`
   - `.anim-warp-in`, `.anim-warp-out`
   - `.anim-scale-down`
   - 使用 `filter: none !important` 覆盖

2. **重写动画关键帧（移除 blur）**
   - `zoomIn` / `zoomOut`：保留 scale、translateY、opacity
   - `slideInRight` / `slideOutLeft`：保留 translateX、skewX、scale、opacity
   - `slideInLeft` / `slideOutRight`：保留 translateX、skewX、scale、opacity
   - `warpIn` / `warpOut`：保留 perspective、rotateY、translateZ、scale、opacity
   - `scaleDown`：保留 scale、opacity

3. **移除弹窗背景模糊**
   - `.modal-overlay`, `.avatar-picker-overlay`
   - 设置 `backdrop-filter: none`

## 优化原理
- `filter: blur()` 是 GPU 密集型操作
- 移动端 GPU 性能有限，blur 动画容易掉帧
- 移除 blur 后仅保留 transform 和 opacity 动画，这些由 GPU 硬件加速，性能更好

## 影响范围
- 仅影响屏幕宽度 ≤ 768px 的设备（手机、小平板）
- PC 端动画效果保持不变
- 动画仍保留科幻风格（skew、perspective 等变换）

## 测试验证
- 在手机浏览器测试登录→大厅→房间的 UI 切换
- 确认动画流畅无卡顿
- 确认视觉效果仍然可接受
