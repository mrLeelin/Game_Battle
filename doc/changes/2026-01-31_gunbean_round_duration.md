# 枪豆人轮次时间线性增长

## 日期
2026-01-31

## 修改文件
- `server/games/gunbean/GunBeanHandler.js`

## 修改内容

### 需求
- 轮次时间从 30秒 涨到 90秒
- 在第 1-15 关线性增长
- 第 15 关及以后达到最大值 90秒

### CONFIG 常量修改
```javascript
// 修改前
DURATION: 90,           // 每轮时长（秒）

// 修改后
MIN_DURATION: 30,       // 每轮最小时长（秒）- 第1轮
MAX_DURATION: 90,       // 每轮最大时长（秒）- 第15轮及以后
DURATION_MAX_ROUND: 15, // 达到最大时长的轮次
```

### 新增函数
```javascript
/**
 * 计算指定轮次的时长（秒）
 * 第1-15轮线性增长：30秒 -> 90秒
 * 第15轮及以后固定90秒
 */
function getRoundDuration(round) {
    const progress = Math.min(round - 1, CONFIG.DURATION_MAX_ROUND - 1) / (CONFIG.DURATION_MAX_ROUND - 1);
    return Math.round(CONFIG.MIN_DURATION + (CONFIG.MAX_DURATION - CONFIG.MIN_DURATION) * progress);
}
```

### 调用点修改
1. `initGame` 方法：`countdown: getRoundDuration(1)`
2. `startGame` 方法：`countdown: getRoundDuration(game.currentRound)`
3. `startNextRound` 方法：`game.countdown = getRoundDuration(game.currentRound)`

## 时间对照表
| 轮次 | 时间(秒) |
|-----|---------|
| 1   | 30      |
| 2   | 34      |
| 3   | 39      |
| 4   | 43      |
| 5   | 47      |
| 6   | 51      |
| 7   | 56      |
| 8   | 60      |
| 9   | 64      |
| 10  | 69      |
| 11  | 73      |
| 12  | 77      |
| 13  | 81      |
| 14  | 86      |
| 15+ | 90      |
