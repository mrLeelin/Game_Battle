# GunBean 游戏同步 Bug 记录

## 日期
2025-01-31

## Bug 描述

### Bug 1: 玩家转向不同步
- **现象**: 玩家 A 射击时，玩家 B 看到的转向是跳变的，不是平滑的
- **原因**: 客户端只在本地更新瞄准角度，没有发送给服务端同步
- **影响文件**:
  - `client/games/gunbean/GunBeanGame.js`
  - `server/games/gunbean/GunBeanHandler.js`

### Bug 2: 子弹从船中间发射
- **现象**: 子弹从船的中心发射，而不是从玩家座位位置
- **原因**: 服务端创建子弹时使用 `boat.x/boat.y` 作为起点，没有考虑玩家座位偏移
- **影响文件**: `server/games/gunbean/GunBeanHandler.js`

## 根本原因分析

1. **转向同步缺失**: `updateAim()` 方法只调用 `scene.updatePlayerAim()` 更新本地显示，没有通过网络发送 `PLAYER_ROTATE` 事件

2. **子弹发射位置错误**:
   - 船上有两个座位（左座 seatIndex=0，右座 seatIndex=1）
   - 座位偏移量为 ±18 像素
   - 子弹应该从玩家座位向瞄准方向偏移发射

## 修复方案

详见 `doc/changes/2025-01-31-gunbean-sync-fix.md`

## 预防措施

1. 任何影响其他玩家可见状态的操作都需要网络同步
2. 涉及位置计算时要考虑所有偏移量（座位、瞄准方向等）
3. 多人游戏功能需要在多客户端环境下测试
