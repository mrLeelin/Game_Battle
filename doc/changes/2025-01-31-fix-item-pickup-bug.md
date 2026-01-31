# 修复道具无法拾取的Bug

**日期**: 2025-01-31

## 问题描述
1. 道具（回血、磁铁）无法被拾取
2. 道具可能生成在场地边界外

## 问题原因

### Bug 1: Y坐标边界变量错误
在 `server/games/gunbean/GunBeanHandler.js` 第 1083 行，道具的 Y 坐标边界限制使用了错误的变量：

```javascript
// 修复前（错误）
item.y = Math.max(-halfH, Math.min(halfW, item.y));  // halfW 应该是 halfH

// 修复后（正确）
item.y = Math.max(-halfH, Math.min(halfH, item.y));
```

### Bug 2: 道具边界不够严格
道具生成时边界检测只考虑了道具半径，没有额外的安全边距，导致道具可能出现在视觉边界边缘。

## 修改内容

### 1. 修复Y坐标边界变量
- 位置：第1083行
- 修改：`halfW` -> `halfH`

### 2. 增加道具边界安全边距
- 位置：`spawnItem` 方法（第643-649行）和道具更新逻辑（第1078-1083行）
- 修改：道具边界从 `20` 增加到 `30`（20像素半径 + 10像素安全边距）

```javascript
// 修复前
const itemRadius = 20;

// 修复后
const itemRadius = 30;  // 20 + 10安全边距
```

## 代码对比

| 位置 | 修复前 | 修复后 |
|------|--------|--------|
| spawnItem 边界 | `itemRadius = 20` | `itemRadius = 30` |
| 道具更新边界 | `itemRadius = 20` | `itemRadius = 30` |
| Y坐标限制 | `Math.min(halfW, item.y)` | `Math.min(halfH, item.y)` |

## 功能对比

| 功能 | 修复前 | 修复后 |
|------|--------|--------|
| 道具 X 边界 | [-580, 580] | [-570, 570] |
| 道具 Y 边界 | [-380, 580] 错误 | [-370, 370] |
| 道具拾取 | 可能失效 | 正常工作 |
| 道具位置 | 可能在边缘 | 安全在场地内 |

### 3. killEnemy 中添加敌人位置边界限制
- 位置：`killEnemy` 方法开头（第1920行之后）
- 原因：敌人死亡时位置可能超出边界（被击退、技能效果等），导致道具和经验球生成在边界外
- 修改：在生成道具和经验球之前，先将敌人位置限制在安全边界内

```javascript
// 新增代码
const halfW = CONFIG.ARENA_WIDTH / 2 - 30;  // 留出安全边距
const halfH = CONFIG.ARENA_HEIGHT / 2 - 30;
enemy.x = Math.max(-halfW, Math.min(halfW, enemy.x));
enemy.y = Math.max(-halfH, Math.min(halfH, enemy.y));
```

## 完整修改列表

| 位置 | 修改内容 |
|------|----------|
| spawnItem (第643行) | itemRadius 20 → 30 |
| 道具更新 (第1078行) | itemRadius 20 → 30 |
| 道具更新 (第1083行) | halfW → halfH (bug修复) |
| killEnemy (第1920行) | 新增敌人位置边界限制 |
